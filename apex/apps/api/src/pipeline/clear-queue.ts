import { Queue } from 'bullmq';
import { redis } from '../redis';
import { logger } from '../config';

const queue = new Queue('f1-ingest', { connection: redis });

async function clear() {
  logger.info('🗑️ Draining and cleaning BullMQ queue in Redis...');
  await queue.drain(true);
  await queue.clean(0, 10000, 'failed');
  await queue.clean(0, 10000, 'completed');
  await queue.clean(0, 10000, 'active');
  await queue.clean(0, 10000, 'delayed');
  logger.info('✅ Queue cleaned.');

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
  logger.info('🚀 Queued fresh ingest-all job.');

  await queue.close();
  process.exit(0);
}

clear().catch((err) => {
  logger.error('Failed to clear queue:', err);
  process.exit(1);
});
