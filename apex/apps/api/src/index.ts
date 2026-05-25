import { Hono } from 'hono';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { config, logger } from './config';
import { db } from './db';
import { redis } from './redis';
import { loggerMiddleware } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limiter';
import { apiRouter } from './routes';
import { openapiRouter } from './routes/openapi';
import { sql } from 'drizzle-orm';

const app = new Hono();

// Global Middlewares
app.use('*', cors());
app.use('*', loggerMiddleware);

// Public routes (Docs and OpenAPI spec)
app.route('/', openapiRouter);
app.get(
  '/docs',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
    pageTitle: 'APEX F1 API Docs',
  })
);

// Public Health Check Endpoint
app.get('/health', async (c) => {
  let dbStatus = 'healthy';
  let redisStatus = 'healthy';

  try {
    await db.execute(sql`SELECT 1`);
  } catch (err) {
    dbStatus = 'unhealthy';
    logger.error('❌ Health Check: Database is offline', err);
  }

  try {
    const ping = await redis.ping();
    if (ping !== 'PONG') {
      redisStatus = 'unhealthy';
    }
  } catch (err) {
    redisStatus = 'unhealthy';
    logger.error('❌ Health Check: Redis is offline', err);
  }

  const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';
  const status = isHealthy ? 200 : 503;

  return c.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: dbStatus,
      redis: redisStatus,
      version: '1.0.0',
    },
    status
  );
});

// Protected API Routes
const api = new Hono();
api.use('*', authMiddleware);
api.use('*', rateLimitMiddleware);
api.route('/', apiRouter);

// Mount under /api
app.route('/api', api);

logger.info(`🚀 APEX API started on port ${config.PORT} in ${config.ENV} mode`);

export default {
  port: config.PORT,
  fetch: app.fetch,
};
export { app };
