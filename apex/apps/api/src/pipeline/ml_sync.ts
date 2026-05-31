import { db } from '../db';
import { results as resultsTable, races, drivers, constructors } from '@apex/db/src/schema';
import { eq, asc } from 'drizzle-orm';
import { logger } from '../config';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function main() {
  logger.info('🔄 Starting Machine Learning Data Synchronization Pipeline...');
  
  try {
    // 1. Fetch all races ordered by season and round
    const raceList = await db.select()
      .from(races)
      .orderBy(asc(races.season), asc(races.round));
      
    logger.info(`Found ${raceList.length} total races to process.`);
    
    let syncCount = 0;
    
    for (const r of raceList) {
      // 2. Fetch driver results for this race, joining with driver and constructor info
      const raceResults = await db.select({
        driverName: drivers.name,
        driverCode: drivers.code,
        constructorName: constructors.name,
        position: resultsTable.position,
        status: resultsTable.status,
        points: resultsTable.points
      })
      .from(resultsTable)
      .innerJoin(drivers, eq(resultsTable.driverId, drivers.id))
      .innerJoin(constructors, eq(resultsTable.constructorId, constructors.id))
      .where(eq(resultsTable.raceId, r.id))
      .orderBy(asc(resultsTable.position));
      
      if (raceResults.length < 2) {
        continue;
      }
      
      // 3. Format payload matching the EloUpdateInput model in prediction.py
      // Cap at 20 — exclude reserve/DNQ entries with position > 20
      const top20 = raceResults.filter(res => (res.position ?? 99) <= 20);

      const payload = {
        results: top20.map((res, index) => ({
          driver_id: res.driverCode?.toUpperCase() ?? undefined,
          driver_name: res.driverName,
          constructor_name: res.constructorName,
          position: res.position || (index + 1),
          status: res.status || 'CLASSIFIED',
          lap_time: 0.0,
          is_rookie: false
        })),
        session_type: 'RACE',
        round_id: `${r.season}_R${r.round}`,
        rounds_completed: r.round
      };
      
      // 4. POST payload to the FastAPI Elo microservice
      const response = await fetch(`${ML_SERVICE_URL}/api/predict/elo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`⚠️ Failed to sync Elo ratings for Round ${r.round} (${r.name}): ${errorText}`);
      } else {
        syncCount++;
        logger.info(`✅ Successfully synced Elo rankings for Round ${r.round} (${r.name})`);
      }
    }
    
    logger.info(`🏁 ML sync pipeline complete. Synced ${syncCount} / ${raceList.length} races successfully.`);
  } catch (err) {
    console.error('❌ Failed to run ML data synchronization:', err);
  }
  
  process.exit(0);
}

main();
