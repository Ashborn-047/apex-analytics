import { eq, and } from 'drizzle-orm';
import { races } from '@apex/db';
import { db, Db } from '../db';

export class RaceRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async findAllBySeason(season: number) {
    return this.db.select().from(races).where(eq(races.season, season)).orderBy(races.round);
  }

  async findById(id: number) {
    const results = await this.db.select().from(races).where(eq(races.id, id));
    return results[0] || null;
  }

  async upsert(data: typeof races.$inferInsert) {
    return this.db
      .insert(races)
      .values(data)
      .onConflictDoUpdate({
        target: [races.season, races.round],
        set: {
          id: data.id,
          circuitId: data.circuitId,
          date: data.date,
          name: data.name,
        },
      })
      .returning();
  }
}
