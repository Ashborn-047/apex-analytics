import Redis from 'ioredis';
import { config, logger } from './config';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ compatibility
});

redis.on('connect', () => {
  logger.info('🔌 Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});
