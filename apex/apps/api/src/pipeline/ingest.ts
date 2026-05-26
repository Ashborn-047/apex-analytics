import { Queue, Worker } from 'bullmq';
import { redis } from '../redis';
import { db } from '../db';
import { eq, sql } from 'drizzle-orm';
import { results, qualifying, lapTimes, pitStops } from '@apex/db';
import { logger } from '../config';
import { JolpicaFetcher } from './fetcher';
import {
  CircuitRepository,
  SeasonRepository,
  RaceRepository,
  DriverRepository,
  ConstructorRepository,
  ResultRepository,
  QualifyingRepository,
  PitStopRepository,
  LapTimeRepository
} from '../repositories';

const QUEUE_NAME = 'f1-ingest';
const ingestQueue = new Queue(QUEUE_NAME, { connection: redis });
const fetcher = new JolpicaFetcher();

// Repository Instantiations
const circuitRepo = new CircuitRepository();
const seasonRepo = new SeasonRepository();
const raceRepo = new RaceRepository();
const driverRepo = new DriverRepository();
const constructorRepo = new ConstructorRepository();
const resultRepo = new ResultRepository();
const qualifyingRepo = new QualifyingRepository();
const pitStopRepo = new PitStopRepository();
const lapTimeRepo = new LapTimeRepository();

// Helper to convert F1 duration/lap strings to milliseconds
function parseTimeToMs(timeStr: string | undefined | null): number | null {
  if (!timeStr) return null;
  try {
    const parts = timeStr.split(':');
    if (parts.length === 1) {
      // e.g. "21.842" or "21"
      return Math.round(parseFloat(parts[0]) * 1000);
    } else if (parts.length === 2) {
      // e.g. "1:32.415"
      const mins = parseInt(parts[0], 10);
      const secs = parseFloat(parts[1]);
      return Math.round((mins * 60 + secs) * 1000);
    } else if (parts.length === 3) {
      // e.g. "1:32:04.221"
      const hrs = parseInt(parts[0], 10);
      const mins = parseInt(parts[1], 10);
      const secs = parseFloat(parts[2]);
      return Math.round((hrs * 3600 + mins * 60 + secs) * 1000);
    }
  } catch (err) {
    logger.error(`Failed to parse time string: ${timeStr}`, err);
  }
  return null;
}

const jobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 seconds initial delay
  },
  removeOnComplete: true,
  removeOnFail: false,
};

// Define job processing router
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { name, data } = job;
    logger.info(`📦 Processing job "${name}" [ID: ${job.id}]`);

    switch (name) {
      case 'ingest-all': {
        const res = await fetcher.fetchSeasons(100, 0);
        const seasonsList = res.MRData.SeasonTable.Seasons;

        logger.info(`Found ${seasonsList.length} seasons.`);

        // Sort seasons descending to ingest most recent seasons first
        seasonsList.sort((a: any, b: any) => parseInt(b.season) - parseInt(a.season));

        // Respect testing limits
        const limitStr = process.env.INGEST_SEASONS_LIMIT;
        const limit = limitStr ? parseInt(limitStr, 10) : seasonsList.length;
        const targetSeasons = seasonsList.slice(0, limit);

        logger.info(`Ingesting ${targetSeasons.length} seasons (Limit: ${limit}).`);

        for (const s of targetSeasons) {
          const year = parseInt(s.season, 10);
          // Insert season record (initial round count set to 0, updated after fetching schedule)
          await seasonRepo.upsert({ year, rounds: 0 });
          // Add job to ingest season schedule
          await ingestQueue.add('ingest-season', { season: year }, jobOptions);
        }
        break;
      }

      case 'ingest-season': {
        const { season } = data;
        const res = await fetcher.fetchRaces(season);
        const racesList = res.MRData.RaceTable.Races || [];

        logger.info(`Season ${season} has ${racesList.length} rounds.`);

        // Update season's total round count
        await seasonRepo.upsert({ year: season, rounds: racesList.length });

        for (const race of racesList) {
          const round = parseInt(race.round, 10);
          const raceId = season * 100 + round; // Unique integer ID

          // 1. Upsert Circuit
          const circuitData = race.Circuit;
          await circuitRepo.upsert({
            id: circuitData.circuitId,
            name: circuitData.circuitName,
            location: circuitData.Location.locality,
            country: circuitData.Location.country,
            firstGp: null,
            lengthKm: null,
            corners: null,
          });

          // 2. Upsert Race
          await raceRepo.upsert({
            id: raceId,
            season,
            round,
            circuitId: circuitData.circuitId,
            date: race.date,
            name: race.raceName,
          });

          // 3. Queue sub-tasks
          await ingestQueue.add('ingest-race-results', { season, round, raceId }, jobOptions);
          await ingestQueue.add('ingest-race-qualifying', { season, round, raceId }, jobOptions);
          await ingestQueue.add('ingest-race-laps', { season, round, raceId }, jobOptions);
          await ingestQueue.add('ingest-race-pitstops', { season, round, raceId }, jobOptions);
        }
        break;
      }

      case 'ingest-race-results': {
        const { season, round, raceId } = data;

        // Skip if already ingested
        const existing = await db.select({ count: sql<number>`count(*)` }).from(results).where(eq(results.raceId, raceId));
        if (existing[0]?.count > 0) {
          logger.info(`Race results already exist for Race ${raceId}. Skipping API fetch.`);
          break;
        }

        const res = await fetcher.fetchResults(season, round);
        const races = res.MRData.RaceTable.Races || [];
        if (races.length === 0) return;

        const resultsList = races[0].Results || [];
        const resultsToInsert: any[] = [];

        for (const resItem of resultsList) {
          const driver = resItem.Driver;
          const constructor = resItem.Constructor;

          // 1. Upsert Driver
          await driverRepo.upsert({
            id: driver.driverId,
            code: driver.code || null,
            name: `${driver.givenName} ${driver.familyName}`,
            dob: driver.dateOfBirth || null,
            nationality: driver.nationality || null,
          });

          // 2. Upsert Constructor
          await constructorRepo.upsert({
            id: constructor.constructorId,
            name: constructor.name,
            nationality: constructor.nationality || null,
          });

          // 3. Prepare result data
          resultsToInsert.push({
            raceId,
            driverId: driver.driverId,
            constructorId: constructor.constructorId,
            grid: parseInt(resItem.grid, 10),
            position: resItem.position ? parseInt(resItem.position, 10) : null,
            points: parseFloat(resItem.points),
            status: resItem.status,
            fastestLap: resItem.FastestLap?.lap ? parseInt(resItem.FastestLap.lap, 10) : null,
          });
        }

        // Bulk insert results
        await resultRepo.bulkUpsert(resultsToInsert);
        logger.info(`Seeded ${resultsToInsert.length} results for Race ${raceId}`);
        break;
      }

      case 'ingest-race-qualifying': {
        const { season, round, raceId } = data;

        // Skip if already ingested
        const existing = await db.select({ count: sql<number>`count(*)` }).from(qualifying).where(eq(qualifying.raceId, raceId));
        if (existing[0]?.count > 0) {
          logger.info(`Race qualifying already exist for Race ${raceId}. Skipping API fetch.`);
          break;
        }

        const res = await fetcher.fetchQualifying(season, round);
        const races = res.MRData.RaceTable.Races || [];
        if (races.length === 0) return;

        const qualifyingList = races[0].QualifyingResults || [];
        const qualifyingToInsert: any[] = [];

        for (const qItem of qualifyingList) {
          const driver = qItem.Driver;
          const constructor = qItem.Constructor;

          // Ensure driver & constructor exist
          await driverRepo.upsert({
            id: driver.driverId,
            code: driver.code || null,
            name: `${driver.givenName} ${driver.familyName}`,
            dob: driver.dateOfBirth || null,
            nationality: driver.nationality || null,
          });
          await constructorRepo.upsert({
            id: constructor.constructorId,
            name: constructor.name,
            nationality: constructor.nationality || null,
          });

          qualifyingToInsert.push({
            raceId,
            driverId: driver.driverId,
            constructorId: constructor.constructorId,
            q1Ms: parseTimeToMs(qItem.Q1),
            q2Ms: parseTimeToMs(qItem.Q2),
            q3Ms: parseTimeToMs(qItem.Q3),
            position: parseInt(qItem.position, 10),
          });
        }

        await qualifyingRepo.bulkUpsert(qualifyingToInsert);
        logger.info(`Seeded ${qualifyingToInsert.length} qualifying results for Race ${raceId}`);
        break;
      }

      case 'ingest-race-laps': {
        const { season, round, raceId } = data;

        // Skip if already ingested
        const existing = await db.select({ count: sql<number>`count(*)` }).from(lapTimes).where(eq(lapTimes.raceId, raceId));
        if (existing[0]?.count > 0) {
          logger.info(`Race lap times already exist for Race ${raceId}. Skipping API fetch.`);
          break;
        }
        
        let offset = 0;
        const limit = 100;
        let total = 0;
        let fetchedCount = 0;

        do {
          const res = await fetcher.fetchLapTimes(season, round, limit, offset);
          const races = res.MRData.RaceTable.Races || [];
          if (races.length === 0) break;

          total = parseInt(res.MRData.total, 10);
          const lapsList = races[0].Laps || [];
          if (lapsList.length === 0) break;

          const lapTimesToInsert: any[] = [];

          for (const lapItem of lapsList) {
            const lapNumber = parseInt(lapItem.number, 10);
            const timings = lapItem.Timings || [];

            for (const t of timings) {
              lapTimesToInsert.push({
                raceId,
                driverId: t.driverId,
                lap: lapNumber,
                timeMs: parseTimeToMs(t.time) || 0,
                position: parseInt(t.position, 10),
              });
            }
          }

          await lapTimeRepo.bulkUpsert(lapTimesToInsert);
          fetchedCount += lapsList.length;
          offset += limit;

          logger.info(`Seeded ${lapTimesToInsert.length} lap time ticks for Race ${raceId} (Progress: ${offset}/${total})`);
        } while (offset < total);

        break;
      }

      case 'ingest-race-pitstops': {
        const { season, round, raceId } = data;

        // Skip if already ingested
        const existing = await db.select({ count: sql<number>`count(*)` }).from(pitStops).where(eq(pitStops.raceId, raceId));
        if (existing[0]?.count > 0) {
          logger.info(`Race pit stops already exist for Race ${raceId}. Skipping API fetch.`);
          break;
        }

        const res = await fetcher.fetchPitStops(season, round);
        const races = res.MRData.RaceTable.Races || [];
        if (races.length === 0) return;

        const pitstopsList = races[0].PitStops || [];
        const pitstopsToInsert: any[] = [];

        for (const pItem of pitstopsList) {
          pitstopsToInsert.push({
            raceId,
            driverId: pItem.driverId,
            lap: parseInt(pItem.lap, 10),
            stopNumber: parseInt(pItem.stop, 10),
            durationMs: parseTimeToMs(pItem.duration) || 0,
          });
        }

        await pitStopRepo.bulkUpsert(pitstopsToInsert);
        logger.info(`Seeded ${pitstopsToInsert.length} pit stops for Race ${raceId}`);
        break;
      }

      default:
        logger.warn(`Unknown job name: "${name}"`);
    }
  },
  {
    connection: redis,
    concurrency: 1, // Keep concurrency at 1 to respect rate-limiting
  }
);

worker.on('completed', (job) => {
  logger.info(`✅ Job "${job.name}" [ID: ${job.id}] completed!`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ Job "${job?.name}" [ID: ${job?.id}] failed:`, err);
});

// Trigger seeding function
export async function runIngestion() {
  logger.info('🏁 Triggering Jolpica ingestion pipeline...');
  const currentJobs = await ingestQueue.getJobs(['waiting', 'active', 'delayed']);
  if (currentJobs.length === 0) {
    await ingestQueue.add('ingest-all', {}, jobOptions);
    logger.info('🚀 Added ingest-all job to the queue.');
  } else {
    logger.info(`⏳ Queue is not empty (${currentJobs.length} jobs present). Worker will process them.`);
  }
}

// Standalone execution trigger
if (import.meta.main) {
  logger.info('🚀 Starting standalone ingest worker pipeline...');
  runIngestion().catch((err) => {
    logger.error('Failed to run ingestion:', err);
  });
}
