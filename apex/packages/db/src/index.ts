import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export * from './schema';
export { schema };

export type ApexDb = ReturnType<typeof createDb>;

export function createDb(connectionString: string) {
  const pool = new Pool({
    connectionString,
  });
  return drizzle(pool, { schema });
}
