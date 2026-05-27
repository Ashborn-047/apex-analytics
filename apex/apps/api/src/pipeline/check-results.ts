import { db } from '../db';
import { results, qualifying, lapTimes, pitStops, races } from '@apex/db/src/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../config';

async function main() {
  logger.info('📊 Checking F1 2026 data counts per race:');
  try {
    const list = await db.select().from(races).where(eq(races.season, 2026));
    for (const r of list) {
      const resultsCount = await db.select({ count: sql<number>`count(*)` }).from(results).where(eq(results.raceId, r.id));
      const qualyCount = await db.select({ count: sql<number>`count(*)` }).from(qualifying).where(eq(qualifying.raceId, r.id));
      const pitCount = await db.select({ count: sql<number>`count(*)` }).from(pitStops).where(eq(pitStops.raceId, r.id));
      const lapsCount = await db.select({ count: sql<number>`count(*)` }).from(lapTimes).where(eq(lapTimes.raceId, r.id));

      if (resultsCount[0].count > 0 || qualyCount[0].count > 0 || pitCount[0].count > 0 || lapsCount[0].count > 0) {
        logger.info(`- Round ${r.round} (${r.name}):`);
        logger.info(`  • Results: ${resultsCount[0].count}`);
        logger.info(`  • Qualifying: ${qualyCount[0].count}`);
        logger.info(`  • Pit Stops: ${pitCount[0].count}`);
        logger.info(`  • Lap Times: ${lapsCount[0].count}`);
      }
    }
  } catch (err) {
    logger.error('❌ Failed to check results:', err);
  }
  process.exit(0);
}

main();
