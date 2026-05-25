import { Context, Next } from 'hono';
import { logger } from '../config';

export async function loggerMiddleware(c: Context, next: Next) {
  const { method, url } = c.req;
  const start = Date.now();

  logger.info(`--> ${method} ${url}`);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  if (status >= 500) {
    logger.error(`<-- ${method} ${url} ${status} - ${duration}ms`);
  } else if (status >= 400) {
    logger.warn(`<-- ${method} ${url} ${status} - ${duration}ms`);
  } else {
    logger.info(`<-- ${method} ${url} ${status} - ${duration}ms`);
  }
}
