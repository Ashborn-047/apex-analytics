import { Context, Next } from 'hono';
import { redis } from '../redis';
import { config, logger } from '../config';

export async function authMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header('x-api-key');

  if (!apiKey) {
    logger.warn('⚠️ Request rejected: Missing API key');
    return c.json(
      { error: 'Unauthorized: Missing API key in x-api-key header', code: 'UNAUTHORIZED', status: 401 },
      401
    );
  }

  // Check if the API key is registered in Redis
  const exists = await redis.exists(`api_key:${apiKey}`);
  
  if (exists === 1) {
    c.set('apiKey', apiKey);
    return next();
  }

  // Self-healing check: if key matches DEFAULT_API_KEY, seed it in Redis
  if (apiKey === config.DEFAULT_API_KEY) {
    await redis.set(`api_key:${apiKey}`, 'active');
    logger.info('🔑 Seeded default API key in Redis');
    c.set('apiKey', apiKey);
    return next();
  }

  logger.warn('⚠️ Request rejected: Invalid API key');
  return c.json(
    { error: 'Unauthorized: Invalid API key', code: 'UNAUTHORIZED', status: 401 },
    401
  );
}
