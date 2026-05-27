import { db } from '../db';
import { races } from '@apex/db/src/schema';
import { eq, asc } from 'drizzle-orm';
import { logger } from '../config';

async function main() {
  logger.info('🏁 Checking 2026 F1 races in the database:');
  try {
    const list = await db.select().from(races).where(eq(races.season, 2026)).orderBy(asc(races.round));
    for (const r of list) {
      logger.info(`- Round ${r.round}: ${r.name} (Circuit: ${r.circuitId}, Date: ${r.date}, ID: ${r.id})`);
    }
  } catch (err) {
    logger.error('❌ Failed to retrieve races:', err);
  }
  process.exit(0);
}

main();
