import { eq, sql } from 'drizzle-orm';
import { drivers } from '@apex/db';
import { db, Db } from '../db';

export class DriverRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async findAllPaginated(limit: number, offset: number) {
    const items = await this.db
      .select()
      .from(drivers)
      .orderBy(drivers.name)
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(drivers);

    const total = countResult[0]?.count || 0;

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async findById(id: string) {
    const results = await this.db.select().from(drivers).where(eq(drivers.id, id));
    return results[0] || null;
  }

  async upsert(data: typeof drivers.$inferInsert) {
    return this.db
      .insert(drivers)
      .values(data)
      .onConflictDoUpdate({
        target: drivers.id,
        set: {
          code: data.code,
          name: data.name,
          dob: data.dob,
          nationality: data.nationality,
        },
      })
      .returning();
  }
}
