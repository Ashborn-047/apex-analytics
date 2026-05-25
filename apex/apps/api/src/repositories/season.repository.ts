import { seasons } from '@apex/db';
import { db, Db } from '../db';

export class SeasonRepository {
  private db: Db;

  constructor(database: Db = db) {
    this.db = database;
  }

  async findAll() {
    return this.db.select().from(seasons).orderBy(seasons.year);
  }

  async upsert(data: typeof seasons.$inferInsert) {
    return this.db
      .insert(seasons)
      .values(data)
      .onConflictDoUpdate({
        target: seasons.year,
        set: {
          rounds: data.rounds,
        },
      })
      .returning();
  }
}
