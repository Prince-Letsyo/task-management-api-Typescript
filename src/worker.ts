import { Worker } from 'bullmq';
import './jobs/email.job';
import { JOB_CACHE_KEY, taskQueue } from './utils/queue';

const worker = new Worker(
  'taskQueue',
  async (job) => {
    const handler = (global as any).taskHandlers?.get(job.name);
    if (!handler) throw new Error(`No handler for job: ${job.name}`);
    return handler(job.data);
  },
  {
    connection: taskQueue.opts.connection,
    concurrency: 5,
    prefix: JOB_CACHE_KEY,
  }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) =>
  console.log(`Job ${job?.id} failed:`, err.message)
);

console.log('BullMQ Worker v5+ running...');
