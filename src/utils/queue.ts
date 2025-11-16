import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from '../config';

export const JOB_CACHE_KEY = `${config.cacheKey}bull`;
export const connection = new IORedis(config.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

export const taskQueue = new Queue('taskQueue', {
  connection,
  prefix: JOB_CACHE_KEY,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});
