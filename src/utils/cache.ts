import { RedisArgument, SetOptions } from 'redis';
import { connectedRedisClient } from './redis'; // Rename the import
import { config } from '../config';

const getRedisClient = async () => {
  return await connectedRedisClient;
};

export class Cache {
  private static defaultTTL: {
    type: 'EX' | 'PX' | 'EXAT' | 'PXAT';
    value: number;
  } = { type: 'EX', value: 60 * 5 }; // 5 minutes

  static async get<T>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    const data = await client.get(`${config.cacheKey}${key}`);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  static async set<T>(
    key: string,
    value: T,
    options?: SetOptions,
    tags?: string[]
  ): Promise<void> {
    key = `${config.cacheKey}${key}`;
    const ttl = options?.expiration ?? this.defaultTTL;
    const client = await getRedisClient();
    await client.set(key, JSON.stringify(value), {
      expiration: ttl,
    });
    if (tags?.length) {
      await CacheTag.tag(key, ...tags);
    }
  }

  static async del(key: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(`${config.cacheKey}${key}`);
  }

  static async clearPattern(pattern: string): Promise<void> {
    const client = await getRedisClient();
    let cursor: RedisArgument = '0';
    const batchSize = 100;

    do {
      const result = await client.scan(cursor, {
        MATCH: `${config.cacheKey}${pattern}`,
        COUNT: batchSize,
      });

      cursor = result.cursor;
      const keys = result.keys;

      if (keys.length > 0) {
        await client.del(keys);
      }
    } while (cursor !== '0');

    console.log(`Cleared keys matching: ${pattern}`);
  }
}

export class CacheTag {
  private static TAG_PREFIX = `${config.cacheKey}tag:`;

  static async tag(key: string, ...tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `${this.TAG_PREFIX}${tag}` as string; // ← safe
      const client = await getRedisClient();
      await client.sAdd(tagKey, key);
      await client.expire(tagKey, 60 * 60 * 24 * 30);
    }
  }

  static async invalidate(...tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    for (const tag of tags) {
      const tagKey = `${this.TAG_PREFIX}${tag}` as string; // ← safe
      const client = await getRedisClient();
      const keys = await client.sMembers(tagKey);
      if (Array.isArray(keys)) {
        keysToDelete.push(
          ...keys.filter((k): k is string => typeof k === 'string')
        );
      }

      await client.del(tagKey);
    }

    if (keysToDelete.length > 0) {
      const client = await getRedisClient();
      await client.del(keysToDelete);
    }
  }
}
