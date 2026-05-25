import { sql } from 'drizzle-orm';
import { results } from '@apex/db';
import { db, Db } from '../db';

export class ResultRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async bulkUpsert(data: (typeof results.$inferInsert)[]) {
    if (data.length === 0) return;

    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.db
        .insert(results)
        .values(chunk)
        .onConflictDoUpdate({
          target: [results.raceId, results.driverId],
          set: {
            constructorId: sql`EXCLUDED.constructor_id`,
            grid: sql`EXCLUDED.grid`,
            position: sql`EXCLUDED.position`,
            points: sql`EXCLUDED.points`,
            status: sql`EXCLUDED.status`,
            fastestLap: sql`EXCLUDED.fastest_lap`,
          },
        });
    }
  }
}
