import { config } from './config';
import { createClient, RedisClientType } from 'redis';

// 1. Export the client instance (unconnected) for libraries like connect-redis
export const unconnectedRedisClient: RedisClientType = createClient({
  url: config.env.REDIS_URL,
});

unconnectedRedisClient.on('connect', () =>
  console.log('Redis client connected (session/cache)')
);
unconnectedRedisClient.on('error', (err) => console.error('Redis error:', err));


// 2. Export a Promise that resolves to the connected client instance
export const connectedRedisClient = (async () => {
    try {
        await unconnectedRedisClient.connect();
        return unconnectedRedisClient;
    } catch (error) {
        console.error("Failed to connect Redis client:", error);
        throw error;
    }
})();