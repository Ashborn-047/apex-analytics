import { db } from '../db';
import { results as resultsTable, races, drivers } from '@apex/db/src/schema';
import { eq, sql } from 'drizzle-orm';

async function test() {
  const actualDriverStandingsQuery = await db.select({
    driverCode: drivers.code,
    points: sql<number>`sum(${resultsTable.points})`
  })
  .from(resultsTable)
  .innerJoin(races, eq(resultsTable.raceId, races.id))
  .innerJoin(drivers, eq(resultsTable.driverId, drivers.id))
  .where(eq(races.season, 2025))
  .groupBy(drivers.code);
  
  console.log("2025 Driver Standings Count:", actualDriverStandingsQuery.length);
  console.log("2025 Standings Sample:", actualDriverStandingsQuery.slice(0, 5));
  process.exit(0);
}

test();
