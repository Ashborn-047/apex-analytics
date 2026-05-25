import { sql } from 'drizzle-orm';
import { lapTimes } from '@apex/db';
import { db, Db } from '../db';

export class LapTimeRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async bulkUpsert(data: (typeof lapTimes.$inferInsert)[]) {
    if (data.length === 0) return;

    const chunkSize = 200; // slightly larger chunk size for high volume lap times
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.db
        .insert(lapTimes)
        .values(chunk)
        .onConflictDoUpdate({
          target: [lapTimes.raceId, lapTimes.driverId, lapTimes.lap],
          set: {
            timeMs: sql`EXCLUDED.time_ms`,
            position: sql`EXCLUDED.position`,
          },
        });
    }
  }
}
