// src/utils/events/event-bus.ts
import { config } from '../../config';
import { connection } from '../queue';
import IORedis, { type Redis } from 'ioredis';

type Listener<T = any> = (payload: T) => Promise<void> | void;

interface EventMap {
    'user:registered': { userId: number; email: string; name: string };
    'user:activated': { userId: number };
    'report:generated': { userId: number; reportUrl: string; email: string };
    'password:reset-requested': { userId: number; email: string; resetUrl: string };
}

class EventBus {
    private publisher!: Redis;
    private subscriber!: Redis;
    private subscribed = new Set<string>();

    constructor() {
        this.init();
    }

    private async init() {

        this.publisher = connection.duplicate();
        this.subscriber = new IORedis(config.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableOfflineQueue: true,
            enableReadyCheck: true

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
    }

    async publish<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
        if (!this.publisher) await this.init();
        const channel = `event:${event}`;
        await this.publisher.publish(channel, JSON.stringify(payload));
        console.log(`Published event: ${event}`);
    }

    on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>) {
        const channel = `event:${event}`;
        this.subscribed.add(channel);

        // Subscribe (will queue if not connected)
        this.subscriber.subscribe(channel).catch((err) => {
            console.error(`Failed to subscribe to ${channel}:`, err);
        });

        this.subscriber.on('message', async (ch, msg) => {
            if (ch !== channel) return;
            try {
                const data = JSON.parse(msg) as EventMap[K];
                await listener(data);
            } catch (e: any) {
                console.error(`Listener error ${event}:`, e.message);
            }
        });
    }

    once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>) {
        const channel = `event:${event}`;
        const wrapper: Listener<EventMap[K]> = async (payload) => {
            await listener(payload);
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
        await Promise.allSettled([
            this.subscriber.quit(),
            this.publisher.quit(),
        ]);
    }
}

export const eventBus = new EventBus();