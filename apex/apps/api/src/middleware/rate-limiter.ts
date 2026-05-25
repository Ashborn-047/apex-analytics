import { Context, Next } from 'hono';
import { redis } from '../redis';
import { logger } from '../config';

export async function rateLimitMiddleware(c: Context, next: Next) {
  const apiKey = c.get('apiKey');
  if (!apiKey) {
    return next();
  }

  const windowMinute = Math.floor(Date.now() / 60000);
  const redisKey = `rate_limit:${apiKey}:${windowMinute}`;

  const pipeline = redis.pipeline();
  pipeline.incr(redisKey);
  pipeline.expire(redisKey, 60);
  const results = await pipeline.exec();

  if (!results) {
    return c.json(
      { error: 'Internal Server Error: Rate limit failure', code: 'RATE_LIMIT_ERROR', status: 500 },
      500
    );
  }

  const [incrErr, count] = results[0];

  if (incrErr) {
    logger.error('❌ Rate limit increment error:', incrErr);
    return c.json(
      { error: 'Internal Server Error', code: 'RATE_LIMIT_ERROR', status: 500 },
      500
    );
  }

  const currentCount = Number(count);
  c.header('X-RateLimit-Limit', '100');
  c.header('X-RateLimit-Remaining', Math.max(0, 100 - currentCount).toString());

  if (currentCount > 100) {
    logger.warn(`🚫 Rate limit exceeded (Count: ${currentCount})`);
    return c.json(
      {
        error: 'Too Many Requests: Rate limit exceeded. Maximum 100 requests per minute.',
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429,
      },
      429
    );
  }

  return next();
}
