import { Hono } from 'hono';
import { circuitsRouter } from './circuits';
import { seasonsRouter } from './seasons';
import { racesRouter } from './races';
import { driversRouter } from './drivers';
import { constructorsRouter } from './constructors';

export const apiRouter = new Hono();

apiRouter.route('/circuits', circuitsRouter);
apiRouter.route('/seasons', seasonsRouter);
apiRouter.route('/races', racesRouter);
apiRouter.route('/drivers', driversRouter);
apiRouter.route('/constructors', constructorsRouter);
