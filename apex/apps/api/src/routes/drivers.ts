import { Hono } from 'hono';
import { DriverRepository } from '../repositories/driver.repository';

export const driversRouter = new Hono();
const driverRepo = new DriverRepository();

driversRouter.get('/', async (c) => {
  const limitQuery = c.req.query('limit');
  const offsetQuery = c.req.query('offset');

  let limit = limitQuery ? parseInt(limitQuery, 10) : 20;
  let offset = offsetQuery ? parseInt(offsetQuery, 10) : 0;

  if (isNaN(limit) || limit < 1) {
    limit = 20;
  }
  if (limit > 100) {
    limit = 100;
  }
  if (isNaN(offset) || offset < 0) {
    offset = 0;
  }

  const result = await driverRepo.findAllPaginated(limit, offset);
  return c.json({
    data: result.items,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    },
  });
});
