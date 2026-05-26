import { db } from '../db';
import { circuits, seasons, races, drivers, constructors, results, lapTimes, qualifying, pitStops } from '@apex/db/src/schema';
import { sql } from 'drizzle-orm';
import { logger } from '../config';

async function main() {
  logger.info('📊 Database Record Count Check:');

  const getCount = async (table: any, tableName: string) => {
    try {
      const res = await db.select({ count: sql<number>`count(*)` }).from(table);
      logger.info(`- ${tableName}: ${res[0]?.count ?? 0} rows`);
    } catch (err) {
      logger.error(`❌ Failed to count rows in ${tableName}:`, err);
    }
  };

  await getCount(circuits, 'Circuits');
  await getCount(seasons, 'Seasons');
  await getCount(races, 'Races');
  await getCount(drivers, 'Drivers');
  await getCount(constructors, 'Constructors');
  await getCount(results, 'Results');
  await getCount(qualifying, 'Qualifying');
  await getCount(pitStops, 'Pit Stops');
  await getCount(lapTimes, 'Lap Times');

  process.exit(0);
}

main().catch((err) => {
  logger.error('Failed to run check-db:', err);
  process.exit(1);
});
