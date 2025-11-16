import { type Redis } from 'ioredis';
import { connection } from '../queue';

type Listener<T = any> = (payload: T) => Promise<void> | void;

// Define your events and their payload types
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

class EventBus {
  private publisher!: Redis;
  private subscriber!: Redis;
  private subscribed = new Set<string>();
  private initPromise: Promise<void>; // Use a promise to manage initialization state

  constructor() {
    // Start initialization immediately
    this.initPromise = this.init();
  }

  private async init() {
    // The publisher client can be a duplicate of an existing client
    // as long as that client isn't already a subscriber.
    this.publisher = connection.duplicate();

    // The subscriber client MUST be a new, separate connection.
    this.subscriber = connection.duplicate({
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      enableReadyCheck: false,
    });

    this.subscriber.on('error', (err) =>
      console.error('Redis EventBus subscriber error:', err)
    );
    this.publisher.on('error', (err) =>
      console.error('Redis EventBus publisher error:', err)
    );

    this.subscriber.on('connect', () => {
      console.log('EventBus reconnected – restoring subscriptions...');
      this.restoreSubscriptions();
    });

    // Wait for both clients to connect before resolving the initPromise
    await Promise.allSettled([
      new Promise<void>((resolve) =>
        this.publisher.on('ready', () => resolve())
      ),
      new Promise<void>((resolve) =>
        this.subscriber.on('ready', () => resolve())
      ),
    ]);
  }

  async publish<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    await this.initPromise; // Wait until clients are connected
    const channel = `event:${event}`;
    // Ensure payload is serialized to a string
    await this.publisher.publish(channel, JSON.stringify(payload));
    console.log(`Published event: ${event}`);
  }

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>) {
    const channel = `event:${event}`;
    this.subscribed.add(channel);

    // We don't await initPromise here because the subscription
    // will be queued by ioredis if enableOfflineQueue is true (which it is).
    this.subscriber.subscribe(channel).catch((err) => {
      console.error(`Failed to subscribe to ${channel}:`, err);
    });

    // The 'message' listener handles all subscribed channels
    this.subscriber.on('message', async (ch, msg) => {
      if (ch !== channel) return;
      try {
        // Type casting the parsed JSON using EventMap[K]
        const data = JSON.parse(msg) as EventMap[K];
        await listener(data);
      } catch (e: any) {
        console.error(`Listener error for event ${event}:`, e.message);
      }
    });
  }

  // This method is functionally correct for single execution, but be mindful
  // that the underlying 'message' listener isn't fully removed until disconnect/close.
  once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>) {
    const channel = `event:${event}`;
    const wrapper: Listener<EventMap[K]> = async (payload) => {
      await listener(payload);

      // Clean up the subscription after execution
      await this.subscriber.unsubscribe(channel);
      this.subscribed.delete(channel);
    };
    this.on(event, wrapper);
  }

  private async restoreSubscriptions() {
    if (this.subscribed.size === 0) return;
    const channels = Array.from(this.subscribed);
    try {
      await this.subscriber.subscribe(...channels);
      console.log(`Restored ${channels.length} subscriptions`);
    } catch (err) {
      console.error('Failed to restore:', err);
    }
  }

  async close() {
    // Ensure initialization is complete before closing
    await this.initPromise;

    // Use .quit() to gracefully close the connection
    await Promise.allSettled([this.subscriber.quit(), this.publisher.quit()]);
    console.log('EventBus connections closed.');
  }
}

export const eventBus = new EventBus();
