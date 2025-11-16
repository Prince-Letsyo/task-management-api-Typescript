// src/rate-limiter.ts
import { config } from '../config';
import { connectedRedisClient } from './redis';

const getRedisClient = async () => {
  return await connectedRedisClient;
};

export class RateLimiter {
  /**
   * Limit requests per identifier (IP, userId, etc.)
   * @param key Unique identifier (e.g., ip:1.2.3.4)
   * @param limit Max requests
   * @param windowSeconds Time window in seconds
   */
  static async consume(
    key: string,
    limit: number = 60,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const redisKey = `${config.cacheKey}rate:${key}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const client = await getRedisClient();
    const multi = client.multi();
    multi.zRemRangeByScore(redisKey, '-inf', String(now - windowMs)); // clean old
    multi.zCard(redisKey); // current count
    multi.zAdd(redisKey, { score: now, value: `${now}:${Math.random()}` }); // add current
    multi.pExpire(redisKey, windowMs);

    const results = (await multi.exec()) as any[];
    const count = Number(results[1]);

    const allowed = count <= limit;
    const remaining = allowed ? limit - count : 0;
    const reset = Math.floor((now + windowMs) / 1000);

    return { allowed, remaining, reset };
  }
}
