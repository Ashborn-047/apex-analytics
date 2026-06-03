import { db } from '../db';
import { races, results, qualifying, pitStops, lapTimes } from '@apex/db/src/schema';
import { sql, eq } from 'drizzle-orm';
import { logger } from '../config';

async function main() {
  logger.info('📊 Checking 2026 Season Records in DB:');

  // Count races for 2026
  const races2026 = await db.select().from(races).where(eq(races.season, 2026));
  logger.info(`- 2026 Races found: ${races2026.length}`);

  for (const r of races2026) {
    const raceId = r.id;
    
    const resultsCount = await db.select({ count: sql<number>`count(*)` }).from(results).where(eq(results.raceId, raceId));
    const qualCount = await db.select({ count: sql<number>`count(*)` }).from(qualifying).where(eq(qualifying.raceId, raceId));
    const stopsCount = await db.select({ count: sql<number>`count(*)` }).from(pitStops).where(eq(pitStops.raceId, raceId));
    const lapsCount = await db.select({ count: sql<number>`count(*)` }).from(lapTimes).where(eq(lapTimes.raceId, raceId));

    logger.info(`Round ${r.round} (${r.name}):`);
    logger.info(`  * Results: ${resultsCount[0]?.count ?? 0} rows`);
    logger.info(`  * Qualifying: ${qualCount[0]?.count ?? 0} rows`);
    logger.info(`  * Pit Stops: ${stopsCount[0]?.count ?? 0} rows`);
    logger.info(`  * Lap Times: ${lapsCount[0]?.count ?? 0} rows`);
  }

  process.exit(0);
}

main().catch((err) => {
  logger.error('Failed to run check-2026-results:', err);
  process.exit(1);
});
