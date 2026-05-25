import { Hono } from 'hono';
import { ConstructorRepository } from '../repositories/constructor.repository';

export const constructorsRouter = new Hono();
const constructorRepo = new ConstructorRepository();

constructorsRouter.get('/', async (c) => {
  const items = await constructorRepo.findAll();
  return c.json({ data: items });
});
