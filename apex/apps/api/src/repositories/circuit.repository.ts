import { eq } from 'drizzle-orm';
import { circuits } from '@apex/db';
import { db, Db } from '../db';

export class CircuitRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async findAll() {
    return this.db.select().from(circuits);
  }

  async findById(id: string) {
    const results = await this.db.select().from(circuits).where(eq(circuits.id, id));
    return results[0] || null;
  }

  async upsert(data: typeof circuits.$inferInsert) {
    return this.db
      .insert(circuits)
      .values(data)
      .onConflictDoUpdate({
        target: circuits.id,
        set: {
          name: data.name,
          location: data.location,
          country: data.country,
          firstGp: data.firstGp,
          lengthKm: data.lengthKm,
          corners: data.corners,
        },
      })
      .returning();
  }
}
