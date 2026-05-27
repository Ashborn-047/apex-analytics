import { db } from '../db';
import { races, results } from '@apex/db/src/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../config';

async function main() {
  logger.info('🏎️ Checking Silverstone race data in the database:');
  try {
    const list = await db
      .select()
      .from(races)
      .where(and(eq(races.circuitId, 'silverstone')));

    if (list.length === 0) {
      logger.info('No Silverstone races found in the database.');
    }

    for (const r of list) {
      const resultsCount = await db
        .select()
        .from(results)
        .where(eq(results.raceId, r.id));
      logger.info(`- Season ${r.season}, Round ${r.round} (${r.name}): ${resultsCount.length} results seeded.`);
    }
  } catch (err) {
    logger.error('❌ Failed to check Silverstone data:', err);
  }
  process.exit(0);
}

main();
