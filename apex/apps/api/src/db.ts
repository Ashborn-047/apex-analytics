import { createDb } from '@apex/db';
import { config } from './config';

export const db = createDb(config.DATABASE_URL);
export type Db = typeof db;
