import { Hono } from 'hono';
import { CircuitRepository } from '../repositories/circuit.repository';
import { getCircuitGeometry } from '@apex/track-utils';

export const circuitsRouter = new Hono();
const circuitRepo = new CircuitRepository();

circuitsRouter.get('/', async (c) => {
  const items = await circuitRepo.findAll();
  return c.json({ data: items });
});

circuitsRouter.get('/:id/geometry', async (c) => {
  let id = c.req.param('id');
  if (id === 'gilles_villeneuve') {
    id = 'villeneuve';
  }
  const circuit = await circuitRepo.findById(id);

  if (!circuit) {
    return c.json(
      { error: `Circuit with ID "${id}" not found`, code: 'NOT_FOUND', status: 404 },
      404
    );
  }

  const geometry = getCircuitGeometry(id) || [];
  return c.json({
    circuitId: id,
    circuitName: circuit.name,
    geometry,
  });
});
