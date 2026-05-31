import { db } from '../db';
import { results as resultsTable, races, drivers, constructors, lapTimes, pitStops } from '@apex/db/src/schema';
import { eq, asc, and, sql } from 'drizzle-orm';
import { logger } from '../config';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const CIRCUIT_TYPES: Record<string, string> = {
  monza: 'low_downforce',
  spa: 'high_speed',
  silverstone: 'high_speed',
  suzuka: 'high_speed',
  red_bull_ring: 'high_speed',
  monaco: 'street_circuit',
  marina_bay: 'street_circuit',
  baku: 'street_circuit',
  albert_park: 'street_circuit',
  jeddah: 'street_circuit',
  miami: 'street_circuit',
  las_vegas: 'street_circuit',
  hungaroring: 'street_circuit',
  villeneuve: 'street_circuit',
  interlagos: 'high_speed',
  losail: 'high_speed',
  americas: 'high_speed',
  rodriguez: 'low_downforce',
  shanghai: 'high_speed',
  bahrain: 'high_speed',
  yas_marina: 'street_circuit',
  zandvoort: 'high_speed',
  barcelona: 'high_speed',
  paul_ricard: 'high_speed',
  portimao: 'high_speed',
  mugello: 'high_speed',
  sochi: 'street_circuit',
  istanbul: 'high_speed',
  nurburgring: 'high_speed',
  imola: 'high_speed'
};

const SPRINT_ROUNDS_2023 = [4, 10, 12, 17, 18, 20];
const isSprint = (season: number, round: number) => {
  if (season === 2023) {
    return SPRINT_ROUNDS_2023.includes(round);
  }
  return false;
};

async function main() {
  logger.info('🔄 Starting Machine Learning Data Synchronization Pipeline...');
  
  try {
    // ------------------------------------------------------------------------
    // STEP 1: ELO RATINGS SYNCHRONIZATION
    // ------------------------------------------------------------------------
    logger.info('1️⃣ Syncing Elo ratings for all historical races...');
    const raceList = await db.select()
      .from(races)
      .orderBy(asc(races.season), asc(races.round));
      
    logger.info(`Found ${raceList.length} total races to process for Elo.`);
    
    let eloSyncCount = 0;
    
    for (const r of raceList) {
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
      
      const response = await fetch(`${ML_SERVICE_URL}/api/predict/elo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`⚠️ Failed to sync Elo ratings for Round ${r.round} (${r.name}): ${errorText}`);
      } else {
        eloSyncCount++;
      }
    }
    logger.info(`✅ Synced Elo rankings for ${eloSyncCount} / ${raceList.length} races.`);

    // ------------------------------------------------------------------------
    // STEP 2: LAP TIME TRAINING SYNCHRONIZATION
    // ------------------------------------------------------------------------
    logger.info('2️⃣ Fetching historical lap times and pit stops for ML model training...');
    
    // Fetch pit stops to index stints
    const allPitStops = await db.select().from(pitStops);
    const pitMap = new Map<string, number[]>();
    for (const p of allPitStops) {
      const key = `${p.raceId}_${p.driverId}`;
      if (!pitMap.has(key)) {
        pitMap.set(key, []);
      }
      pitMap.get(key)!.push(p.lap);
    }
    for (const laps of pitMap.values()) {
      laps.sort((a, b) => a - b);
    }

    // Fetch all lap times
    const allLaps = await db.select({
      raceId: lapTimes.raceId,
      driverId: lapTimes.driverId,
      driverCode: drivers.code,
      lap: lapTimes.lap,
      timeMs: lapTimes.timeMs
    })
    .from(lapTimes)
    .innerJoin(drivers, eq(lapTimes.driverId, drivers.id));

    logger.info(`Fetched ${allLaps.length} total raw lap time entries from Postgres.`);

    // Compute max lap per race to estimate fuel load
    const raceTotalLaps = new Map<number, number>();
    for (const lap of allLaps) {
      const currentMax = raceTotalLaps.get(lap.raceId) || 0;
      if (lap.lap > currentMax) {
        raceTotalLaps.set(lap.raceId, lap.lap);
      }
    }

    // Map lap time rows to training schema
    const trainingLaps = [];
    for (const lap of allLaps) {
      const driverKey = `${lap.raceId}_${lap.driverId}`;
      const stops = pitMap.get(driverKey) || [];
      
      const stopsBefore = stops.filter(stopLap => stopLap < lap.lap).length;
      const stintIndex = stopsBefore + 1;
      const stintStartLap = stopsBefore > 0 ? stops[stopsBefore - 1] + 1 : 1;
      
      const stintLap = lap.lap - stintStartLap + 1;
      const tyreAgeTotal = stintLap;
      
      // Determine compound heuristically based on stint index
      let compound = 'MEDIUM';
      if (stintIndex === 2) compound = 'HARD';
      else if (stintIndex === 3) compound = 'SOFT';
      
      const totalLaps = raceTotalLaps.get(lap.raceId) || 50;
      const fuelLoadKg = Math.max(0.0, 100.0 * (1.0 - (lap.lap / totalLaps)));
      
      const trackTempC = 30.0 + (lap.raceId % 10);
      const airTempC = 20.0 + (lap.raceId % 5);
      const lapTimeS = lap.timeMs / 1000.0;
      
      // Filter out safety cars, formation laps, and extreme outlier lap times (dry baseline)
      if (lapTimeS < 50.0 || lapTimeS > 150.0) {
        continue;
      }

      trainingLaps.push({
        driver_id: lap.driverCode ? lap.driverCode.toUpperCase() : 'VER',
        compound,
        stint_lap: stintLap,
        tyre_age_total: tyreAgeTotal,
        track_temp_c: trackTempC,
        air_temp_c: airTempC,
        fuel_load_kg: fuelLoadKg,
        lap_time_s: lapTimeS
      });
    }

    logger.info(`Prepared ${trainingLaps.length} clean training samples after filtering.`);

    if (trainingLaps.length >= 15) {
      const trainResponse = await fetch(`${ML_SERVICE_URL}/api/predict/lap-time/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laps: trainingLaps })
      });
      
      if (!trainResponse.ok) {
        const errorText = await trainResponse.text();
        logger.error(`❌ Failed to train lap-time models: ${errorText}`);
      } else {
        const resultJson = await trainResponse.json();
        logger.info(`✅ Successfully trained lap-time models: ${JSON.stringify(resultJson)}`);
      }
    } else {
      logger.warn(`⚠️ Insufficient training samples (${trainingLaps.length}). Skipping training.`);
    }

    // ------------------------------------------------------------------------
    // STEP 3: CHAMPIONSHIP SIMULATION SYNCHRONIZATION
    // ------------------------------------------------------------------------
    logger.info('3️⃣ Preparing Monte Carlo Championship Simulation settings for all seasons...');
    
    // Find all distinct seasons in database
    const allSeasonsResult = await db.select({
      season: races.season
    }).from(races).groupBy(races.season).orderBy(asc(races.season));
    
    const seasonList = allSeasonsResult.map(s => s.season).filter(Boolean);
    logger.info(`Found seasons to simulate WDC/WCC: ${seasonList.join(', ')}`);

    for (const season of seasonList) {
      // Get all races for this season
      const allSeasonRaces = await db.select({
        id: races.id,
        round: races.round,
        name: races.name,
        circuitId: races.circuitId
      })
      .from(races)
      .where(eq(races.season, season))
      .orderBy(asc(races.round));

      if (allSeasonRaces.length === 0) continue;

      // Get completed races for this season
      const completedRacesResult = await db.select({
        raceId: resultsTable.raceId
      })
      .from(resultsTable)
      .innerJoin(races, eq(resultsTable.raceId, races.id))
      .where(eq(races.season, season))
      .groupBy(resultsTable.raceId);
      const completedRaceIds = new Set(completedRacesResult.map(r => r.raceId));

      let remainingRaces = allSeasonRaces.filter(r => !completedRaceIds.has(r.id));
      let standingsCutoffRound = 999;

      if (remainingRaces.length === 0 && allSeasonRaces.length > 5) {
        // Fallback: Season is fully completed. Simulate the final 5 rounds using standings as of Round 17.
        const cutoffIndex = allSeasonRaces.length - 5;
        standingsCutoffRound = allSeasonRaces[cutoffIndex].round - 1;
        remainingRaces = allSeasonRaces.slice(cutoffIndex);
        logger.info(`ℹ️ Season ${season} is fully completed. Simulating the final 5 rounds (from Round ${standingsCutoffRound + 1}) using standings as of Round ${standingsCutoffRound}.`);
      }

      // Query WDC Standings
      const driverStandingsQuery = await db.select({
        driverCode: drivers.code,
        points: sql<number>`sum(${resultsTable.points})`
      })
      .from(resultsTable)
      .innerJoin(races, eq(resultsTable.raceId, races.id))
      .innerJoin(drivers, eq(resultsTable.driverId, drivers.id))
      .where(
        and(
          eq(races.season, season),
          sql`${races.round} <= ${standingsCutoffRound}`
        )
      )
      .groupBy(drivers.code);

      // Query WCC Standings
      const constructorStandingsQuery = await db.select({
        constructorId: constructors.id,
        points: sql<number>`sum(${resultsTable.points})`
      })
      .from(resultsTable)
      .innerJoin(races, eq(resultsTable.raceId, races.id))
      .innerJoin(constructors, eq(resultsTable.constructorId, constructors.id))
      .where(
        and(
          eq(races.season, season),
          sql`${races.round} <= ${standingsCutoffRound}`
        )
      )
      .groupBy(constructors.id);

      const wdc = driverStandingsQuery
        .filter(d => d.driverCode)
        .map(d => ({
          driver_id: d.driverCode!.toUpperCase(),
          points: Number(d.points) || 0
        }));

      const wcc = constructorStandingsQuery
        .filter(c => c.constructorId)
        .map(c => ({
          constructor_id: c.constructorId,
          points: Number(c.points) || 0
        }));

      const remainingRoundsPayload = remainingRaces.map(r => ({
        round: r.round,
        name: r.name,
        circuit_type: CIRCUIT_TYPES[r.circuitId] || 'high_speed',
        is_sprint: isSprint(season, r.round)
      }));

      // Query Actual Final WDC/WCC Standings
      const actualDriverStandingsQuery = await db.select({
        driverCode: drivers.code,
        points: sql<number>`sum(${resultsTable.points})`
      })
      .from(resultsTable)
      .innerJoin(races, eq(resultsTable.raceId, races.id))
      .innerJoin(drivers, eq(resultsTable.driverId, drivers.id))
      .where(eq(races.season, season))
      .groupBy(drivers.code);

      const actualConstructorStandingsQuery = await db.select({
        constructorId: constructors.id,
        points: sql<number>`sum(${resultsTable.points})`
      })
      .from(resultsTable)
      .innerJoin(races, eq(resultsTable.raceId, races.id))
      .innerJoin(constructors, eq(resultsTable.constructorId, constructors.id))
      .where(eq(races.season, season))
      .groupBy(constructors.id);

      const actualWdc = actualDriverStandingsQuery
        .filter(d => d.driverCode)
        .map(d => ({
          driver_id: d.driverCode!.toUpperCase(),
          points: Number(d.points) || 0
        }));

      const actualWcc = actualConstructorStandingsQuery
        .filter(c => c.constructorId)
        .map(c => ({
          constructor_id: c.constructorId,
          points: Number(c.points) || 0
        }));

      // Sync actual lap times and pit stops for each completed race of this season
      const completedRacesOfSeason = allSeasonRaces.filter(r => completedRaceIds.has(r.id));
      logger.info(`Syncing actual lap times and pit stops for ${completedRacesOfSeason.length} completed races in season ${season}...`);
      
      for (const r of completedRacesOfSeason) {
        // Fetch lap times for this race
        const raceLaps = await db.select({
          driverCode: drivers.code,
          driverId: lapTimes.driverId,
          lap: lapTimes.lap,
          timeMs: lapTimes.timeMs
        })
        .from(lapTimes)
        .innerJoin(drivers, eq(lapTimes.driverId, drivers.id))
        .where(eq(lapTimes.raceId, r.id));

        // Get pit stops for this race to partition laps into stints
        const racePitStops = await db.select({
          driverId: pitStops.driverId,
          lap: pitStops.lap,
          stopNumber: pitStops.stopNumber,
          durationMs: pitStops.durationMs
        })
        .from(pitStops)
        .where(eq(pitStops.raceId, r.id));

        const driverPits = new Map<string, number[]>();
        for (const p of racePitStops) {
          if (!driverPits.has(p.driverId)) {
            driverPits.set(p.driverId, []);
          }
          driverPits.get(p.driverId)!.push(p.lap);
        }
        for (const laps of driverPits.values()) {
          laps.sort((a, b) => a - b);
        }

        // Map laps to actual items
        const actualLapsPayload = [];
        for (const lap of raceLaps) {
          const stopsList = driverPits.get(lap.driverId) || [];
          const stopsBefore = stopsList.filter(stopLap => stopLap < lap.lap).length;
          const stintIndex = stopsBefore + 1;
          const stintStartLap = stopsBefore > 0 ? stopsList[stopsBefore - 1] + 1 : 1;
          const stintLap = lap.lap - stintStartLap + 1;
          
          let compound = 'MEDIUM';
          if (stintIndex === 2) compound = 'HARD';
          else if (stintIndex === 3) compound = 'SOFT';
          
          actualLapsPayload.push({
            driver_id: lap.driverCode ? lap.driverCode.toUpperCase() : 'VER',
            compound,
            stint_number: stintIndex,
            stint_lap: stintLap,
            lap_time_s: lap.timeMs / 1000.0
          });
        }

        if (actualLapsPayload.length > 0) {
          const res = await fetch(`${ML_SERVICE_URL}/api/predict/lap-time/actuals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              season,
              circuit_id: r.circuitId,
              laps: actualLapsPayload
            })
          });
          if (!res.ok) {
            logger.warn(`Failed to push actual lap times for ${r.name} (${season}): ${await res.text()}`);
          }
        }

        // Fetch driver lap times map for pace loss calculation
        const driverLapsMap = new Map<string, { lap: number; timeMs: number }[]>();
        for (const lap of raceLaps) {
          if (!driverLapsMap.has(lap.driverId)) {
            driverLapsMap.set(lap.driverId, []);
          }
          driverLapsMap.get(lap.driverId)!.push({ lap: lap.lap, timeMs: lap.timeMs });
        }

        // Map pit stops to actual items
        const actualStopsPayload = [];
        for (const p of racePitStops) {
          const raceLapsList = driverLapsMap.get(p.driverId) || [];
          const beforeLaps = raceLapsList.filter(l => l.lap >= p.lap - 3 && l.lap < p.lap);
          const afterLaps = raceLapsList.filter(l => l.lap > p.lap && l.lap <= p.lap + 3);

          const avgBefore = beforeLaps.length > 0 ? (beforeLaps.reduce((sum, l) => sum + l.timeMs, 0) / beforeLaps.length) / 1000.0 : 0;
          const avgAfter = afterLaps.length > 0 ? (afterLaps.reduce((sum, l) => sum + l.timeMs, 0) / afterLaps.length) / 1000.0 : 0;
          const paceLossS = avgBefore > 0 && avgAfter > 0 ? Math.max(0.0, avgBefore - avgAfter) : 0.0;

          const driver = raceLaps.find(l => l.driverId === p.driverId);
          const driverCode = driver?.driverCode?.toUpperCase() || 'VER';

          const stintNumber = p.stopNumber;
          const currentCompound = stintNumber === 1 ? 'MEDIUM' : (stintNumber === 2 ? 'HARD' : 'SOFT');
          const newCompound = stintNumber === 1 ? 'HARD' : 'SOFT';

          actualStopsPayload.push({
            driver_id: driverCode,
            stint_number: stintNumber,
            current_compound: currentCompound,
            new_compound: newCompound,
            pit_lap: p.lap,
            pace_loss_s: Number(paceLossS.toFixed(3))
          });
        }

        if (actualStopsPayload.length > 0) {
          const res = await fetch(`${ML_SERVICE_URL}/api/predict/strategy/actuals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              season,
              circuit_id: r.circuitId,
              stops: actualStopsPayload
            })
          });
          if (!res.ok) {
            logger.warn(`Failed to push actual pit stops for ${r.name} (${season}): ${await res.text()}`);
          }
        }
      }

      logger.info(`Season ${season}: Simulating with standings of ${wdc.length} drivers, ${wcc.length} constructors, and ${remainingRoundsPayload.length} remaining rounds.`);

      const simResponse = await fetch(`${ML_SERVICE_URL}/api/predict/simulation/championship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season,
          wdc,
          wcc,
          remaining_rounds: remainingRoundsPayload,
          simulations: 50000,
          actual_wdc: actualWdc.length > 0 ? actualWdc : undefined,
          actual_wcc: actualWcc.length > 0 ? actualWcc : undefined
        })
      });

      if (!simResponse.ok) {
        const errorText = await simResponse.text();
        logger.error(`❌ Failed to run championship simulation for season ${season}: ${errorText}`);
      } else {
        const simResults = await simResponse.json();
        logger.info(`✅ Season ${season} championship simulation completed.`);
        const top3Wdc = simResults.wdc?.slice(0, 3) || [];
        logger.info(`📊 Top 3 Driver Probabilities for ${season}:`);
        for (const d of top3Wdc) {
          logger.info(`   - ${d.driver_name} (${d.team}): ${(d.championship_probability * 100).toFixed(2)}%`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to run ML data synchronization:', err);
  }
  
  process.exit(0);
}

main();
