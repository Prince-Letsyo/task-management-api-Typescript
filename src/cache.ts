import { SetOptions } from 'redis';
import { connectedRedisClient } from './redis'; // Rename the import

// Function to get the connected client instance
const getRedisClient = async () => {
  return await connectedRedisClient;
}


export class Cache {
  private static defaultTTL: {
    type: 'EX' | 'PX' | 'EXAT' | 'PXAT';
    value: number;
  } = { type: 'EX', value: 60 * 5 }; // 5 minutes

  static async get<T>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  static async set<T>(
    key: string,
    value: T,
    options?: SetOptions,
    tags?: string[]
  ): Promise<void> {
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
    await client.del(key);
  }

  static async clearPattern(pattern: string): Promise<void> {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  }
}

export class CacheTag {
  private static TAG_PREFIX = ' :';

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
