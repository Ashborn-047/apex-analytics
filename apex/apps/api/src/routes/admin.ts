import { Hono } from 'hono';
import { runIngestion } from '../pipeline/ingest';
import { Queue } from 'bullmq';
import { redis } from '../redis';

export const adminRouter = new Hono();

const ingestQueue = new Queue('f1-ingest', { connection: redis });

adminRouter.post('/ingest', async (c) => {
  try {
    await runIngestion();
    return c.json({
      status: 'success',
      message: 'Ingestion pipeline triggered successfully in the background.',
    });
  } catch (err: any) {
    return c.json({
      status: 'error',
      message: `Failed to trigger ingestion: ${err.message}`,
    }, 500);
  }
});

adminRouter.get('/ingest/status', async (c) => {
  try {
    const [waiting, active, delayed] = await Promise.all([
      ingestQueue.getWaitingCount(),
      ingestQueue.getActiveCount(),
      ingestQueue.getDelayedCount(),
    ]);

    return c.json({
      status: 'success',
      queue: {
        waiting,
        active,
        delayed,
        total: waiting + active + delayed,
      }
    });
  } catch (err: any) {
    return c.json({
      status: 'error',
      message: `Failed to get queue status: ${err.message}`,
    }, 500);
  }
});
