import { sql } from 'drizzle-orm';
import { pitStops } from '@apex/db';
import { db, Db } from '../db';

export class PitStopRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async bulkUpsert(data: (typeof pitStops.$inferInsert)[]) {
    if (data.length === 0) return;

    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.db
        .insert(pitStops)
        .values(chunk)
        .onConflictDoUpdate({
          target: [pitStops.raceId, pitStops.driverId, pitStops.stopNumber],
          set: {
            lap: sql`EXCLUDED.lap`,
            durationMs: sql`EXCLUDED.duration_ms`,
          },
        });
    }
  }
}
