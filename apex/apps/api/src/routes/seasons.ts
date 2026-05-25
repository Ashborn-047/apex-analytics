import { Hono } from 'hono';
import { SeasonRepository } from '../repositories/season.repository';

export const seasonsRouter = new Hono();
const seasonRepo = new SeasonRepository();

seasonsRouter.get('/', async (c) => {
  const items = await seasonRepo.findAll();
  return c.json({ data: items });
});
