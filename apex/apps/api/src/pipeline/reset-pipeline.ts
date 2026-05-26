import { Queue } from 'bullmq';
import { redis } from '../redis';
import { db } from '../db';
import { logger } from '../config';
import { lapTimes, pitStops, qualifying, results, races, drivers, constructors, circuits, seasons } from '@apex/db';

const queue = new Queue('f1-ingest', { connection: redis });

async function reset() {
  logger.info('🗑️ Cleaning BullMQ queue...');
  await queue.drain(true);
  await queue.clean(0, 10000, 'failed');
  await queue.clean(0, 10000, 'completed');
  logger.info('✅ Queue cleaned.');

  logger.info('🗑️ Truncating database tables...');
  // Delete in order to satisfy foreign keys
  await db.delete(lapTimes);
  await db.delete(pitStops);
  await db.delete(qualifying);
  await db.delete(results);
  await db.delete(races);
  await db.delete(drivers);
  await db.delete(constructors);
  await db.delete(circuits);
  await db.delete(seasons);
  logger.info('✅ Database tables truncated.');

  // Queue initial job
  const jobOptions = {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  };
  await queue.add('ingest-all', {}, jobOptions);
  logger.info('🚀 Queued new ingest-all job.');

  await queue.close();
  process.exit(0);
}

reset().catch((err) => {
  logger.error('Failed to reset pipeline:', err);
  process.exit(1);
});
