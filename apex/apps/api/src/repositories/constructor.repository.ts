import { eq } from 'drizzle-orm';
import { constructors } from '@apex/db';
import { db, Db } from '../db';

export class ConstructorRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async findAll() {
    return this.db.select().from(constructors).orderBy(constructors.name);
  }

  async findById(id: string) {
    const results = await this.db.select().from(constructors).where(eq(constructors.id, id));
    return results[0] || null;
  }

  async upsert(data: typeof constructors.$inferInsert) {
    return this.db
      .insert(constructors)
      .values(data)
      .onConflictDoUpdate({
        target: constructors.id,
        set: {
          name: data.name,
          nationality: data.nationality,
        },
      })
      .returning();
  }
}
