// src/worker.ts
import { Worker } from 'bullmq';
import './jobs/email.job';
import { taskQueue } from './queue';

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
  }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) =>
  console.log(`Job ${job?.id} failed:`, err.message)
);

console.log('BullMQ Worker v5+ running...');
