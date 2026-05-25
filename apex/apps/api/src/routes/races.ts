import { Hono } from 'hono';
import { RaceRepository } from '../repositories/race.repository';

export const racesRouter = new Hono();
const raceRepo = new RaceRepository();

racesRouter.get('/:season', async (c) => {
  const seasonStr = c.req.param('season');
  const season = parseInt(seasonStr, 10);

  if (isNaN(season)) {
    return c.json(
      { error: 'Invalid season parameter. Must be an integer year.', code: 'BAD_REQUEST', status: 400 },
      400
    );
  }

  const items = await raceRepo.findAllBySeason(season);
  return c.json({ data: items });
});
