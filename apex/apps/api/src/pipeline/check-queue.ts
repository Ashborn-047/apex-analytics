import { Queue } from 'bullmq';
import { redis } from '../redis';

const queue = new Queue('f1-ingest', { connection: redis });
const counts = await queue.getJobCounts();
console.log('Queue Counts:', JSON.stringify(counts));
await queue.close();
process.exit(0);
