import { config } from '../config';
import { createClient, RedisClientType } from 'redis';

export const unconnectedRedisClient: RedisClientType = createClient({
  url: config.env.REDIS_URL,
});

unconnectedRedisClient.on('connect', () =>
  console.log('Redis client connected (session/cache)')
);
unconnectedRedisClient.on('error', (err) => console.error('Redis error:', err));

export const connectedRedisClient = (async () => {
  try {
    await unconnectedRedisClient.connect();
    return unconnectedRedisClient;
  } catch (error) {
    console.error('Failed to connect Redis client:', error);
    throw error;
  }
})();
