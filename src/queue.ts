import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';

const connection = new IORedis(config.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

export const taskQueue = new Queue('taskQueue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});
