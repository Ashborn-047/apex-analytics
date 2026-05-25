import { sql } from 'drizzle-orm';
import { qualifying } from '@apex/db';
import { db, Db } from '../db';

export class QualifyingRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async bulkUpsert(data: (typeof qualifying.$inferInsert)[]) {
    if (data.length === 0) return;

    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.db
        .insert(qualifying)
        .values(chunk)
        .onConflictDoUpdate({
          target: [qualifying.raceId, qualifying.driverId],
          set: {
            constructorId: sql`EXCLUDED.constructor_id`,
            q1Ms: sql`EXCLUDED.q1_ms`,
            q2Ms: sql`EXCLUDED.q2_ms`,
            q3Ms: sql`EXCLUDED.q3_ms`,
            position: sql`EXCLUDED.position`,
          },
        });
    }
  }
}
