import { type Redis } from 'ioredis';
import { connection } from '../queue';
import { config } from '../../config';

type Listener<T = any> = (payload: T, id: string) => Promise<void> | void;

interface EventMap {
  'user:registered': { userId: number; email: string; name: string };
  'user:activated': { userId: number };
  'report:generated': { userId: number; reportUrl: string; email: string };
  'password:reset-requested': {
    userId: number;
    email: string;
    resetUrl: string;
  };
}

type StreamEntry = [string, [string, string[]][]];

class StreamBus {
  private redis!: Redis;
  private consumerName = `consumer-${process.pid}`;
  private groupName = 'event-group';
  private processing = new Set<string>();
  private initPromise: Promise<void>;
  private STREAM_CACHE_KEY = `${config.cacheKey}stream`;

  constructor() {
    this.redis = connection.duplicate({
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });

    this.redis.on('error', (err) => console.error('StreamBus error:', err));

    this.initPromise = new Promise((resolve) => {
      this.redis.on('ready', () => {
        console.log('StreamBus client connected and ready.');
        resolve();
      });
    });
  }

  /** Publish event to stream */
  async publish<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    await this.initPromise;

    const stream = `${this.STREAM_CACHE_KEY}:${event}`;
    const id = await this.redis.xadd(
      stream,
      '*', // auto ID
      'data',
      JSON.stringify(payload)
    );
    console.log(`Streamed ${event} → ${id}`);
    return id;
  }

  /** Subscribe to one event type */
  async on<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>
  ) {
    await this.initPromise;
    const stream = `${this.STREAM_CACHE_KEY}:${event}`;
    await this.ensureGroup(stream);

    const processMessages = async (startId: string) => {
      while (true) {
        // 1. Start with the mandatory arguments
        const args: (string | number)[] = [
          'GROUP',
          this.groupName,
          this.consumerName,
          'COUNT',
          10, // Changed '10' to 10 for cleaner types
        ];

        // 2. Conditionally add the BLOCK keyword and timeout
        const isBlocking = startId === '>';
        if (isBlocking) {
          args.push('BLOCK', 5000); // 5000ms timeout
        }

        // 3. Add the streams arguments
        args.push('STREAMS', stream, startId);

        // Call xreadgroup with dynamic args; cast redis to any so spread is allowed
        const rawEntries = (await (this.redis as any).xreadgroup(...args)) as
          | StreamEntry[]
          | null;

        if (!rawEntries || rawEntries.length === 0) {
          // If checking PEL ('0') returns nothing, break and start blocking loop
          if (startId === '0' && !isBlocking) break;
          continue;
        }

        for (const [_, messages] of rawEntries) {
          for (const [msgId, fields] of messages) {
            // Processing set is useful for concurrent handling, but for single-threaded
            // reading inside this while loop, it's less critical. Keeping it for safety.
            if (this.processing.has(msgId)) continue;
            this.processing.add(msgId);

            // Find 'data' field robustly (since fields is [key, value, key, value, ...])
            const index = fields.findIndex(
              (f, i) => i % 2 === 0 && f === 'data'
            );
            if (index === -1) {
              this.processing.delete(msgId);
              continue;
            }

            const raw = fields[index + 1];
            try {
              const payload = JSON.parse(raw) as EventMap[K];
              await listener(payload, msgId);

              await this.redis.xack(stream, this.groupName, msgId);
              console.log(`Ack ${event} ${msgId}`);
            } catch (err: any) {
              console.error(`Listener error ${event} ${msgId}:`, err.message);
              // Don't ack, message remains in PEL for retry or manual intervention
            } finally {
              this.processing.delete(msgId);
            }
          }
        }

        // If checking PEL ('0') finishes, ensure the loop terminates
        // to move to the blocking loop.
        if (startId === '0') break;
      }
    };
    // 1. Check the Pending Entries List (PEL) for old, unacknowledged messages
    processMessages('0').catch(console.error);

    // 2. Start blocking and reading new messages
    // The '>' ID tells Redis to read new messages only
    processMessages('>').catch(console.error);
  }

  /** Ensure consumer group exists */
  private async ensureGroup(stream: string) {
    try {
      await this.redis.xgroup(
        'CREATE',
        stream,
        this.groupName,
        '$',
        'MKSTREAM'
      );
    } catch (err: any) {
      if (!err.message.includes('BUSYGROUP')) throw err;
    }
  }

  /** Replay events from timestamp */
  async replay<K extends keyof EventMap>(
    event: K,
    fromTimestamp: number,
    listener: Listener<EventMap[K]>
  ) {
    const stream = `${this.STREAM_CACHE_KEY}:${event}`;
    const fromId = `${fromTimestamp}-0`;

    const entries = await this.redis.xrange(stream, fromId, '+');

    for (const [msgId, fields] of entries) {
      const dataIndex = fields.indexOf('data');
      if (dataIndex === -1) continue;
      const payload = JSON.parse(fields[dataIndex + 1]) as EventMap[K];
      await listener(payload, msgId);
    }

    console.log(`Replayed ${entries.length} ${event} events`);
  }

  /** Get pending messages (for monitoring) */
  async pending<K extends keyof EventMap>(event: K) {
    const stream = `${this.STREAM_CACHE_KEY}:${event}`;
    return await this.redis.xpending(stream, this.groupName);
  }

  async close() {
    await this.redis.quit();
  }
}

export const streamBus = new StreamBus();
