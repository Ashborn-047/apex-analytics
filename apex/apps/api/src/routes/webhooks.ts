import { Hono } from 'hono';
import { db } from '../db';
import { results, drivers, constructors } from '@apex/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '../config';

export const webhooksRouter = new Hono();

webhooksRouter.post('/silverwall', async (c) => {
  const apiKey = c.req.header('x-api-key');
  const secret = process.env.SILVERWALL_WEBHOOK_SECRET;

  if (secret && apiKey !== secret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await c.req.json();
    logger.info(`Received webhook from Silverwall: ${payload.event}`);

    if (payload.event === 'race_result_updated') {
      const { season_year, race_key, results: raceResults } = payload;
      
      for (const res of raceResults) {
         // Create a simple slug for driverId and constructorId
         const driverId = res.driver_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
         const constructorId = res.team.toLowerCase().replace(/[^a-z0-9]/g, '_');

         // 1. Ensure driver exists
         const existingDriver = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
         if (existingDriver.length === 0) {
            await db.insert(drivers).values({ id: driverId, name: res.driver_name });
         }

         // 2. Ensure constructor exists
         const existingConst = await db.select().from(constructors).where(eq(constructors.id, constructorId)).limit(1);
         if (existingConst.length === 0) {
            await db.insert(constructors).values({ id: constructorId, name: res.team });
         }

         // 3. Upsert result
         const existingResult = await db.select().from(results).where(and(eq(results.raceId, race_key), eq(results.driverId, driverId))).limit(1);
         
         const record = {
             position: res.position,
             points: res.points,
             status: res.dnf ? 'DNF' : 'Finished',
             fastestLap: res.fastest_lap ? 1 : null
         };

         if (existingResult.length > 0) {
             await db.update(results).set(record).where(and(eq(results.raceId, race_key), eq(results.driverId, driverId)));
         } else {
             await db.insert(results).values({ 
                 raceId: race_key, 
                 driverId, 
                 constructorId, 
                 grid: 0, 
                 ...record 
             });
         }
      }

      // Background Fetch: Trigger ML to generate a dynamic race report and update the RAG KB
      // We don't await this so it doesn't block the Silverwall webhook response
      fetch('http://localhost:8000/api/analysis/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telemetry: payload
        })
      }).catch(err => {
        logger.error('Failed to trigger background ML race report generation', err);
      });

      // Background Fetch: Trigger ML to update Elo Ratings dynamically
      const eloPayload = {
        results: raceResults.map((res: any, index: number) => ({
          driver_id: res.driver_name.substring(0, 3).toUpperCase(),
          driver_name: res.driver_name,
          constructor_name: res.team,
          position: res.position || (index + 1),
          status: res.dnf ? 'DNF' : 'CLASSIFIED',
          lap_time: 0.0,
          is_rookie: false
        })),
        session_type: 'RACE',
        round_id: `${season_year}_${race_key}`,
        rounds_completed: 12 // Using a placeholder for now
      };

      fetch('http://localhost:8000/api/predict/elo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eloPayload)
      }).catch(err => {
        logger.error('Failed to trigger background ML Elo update', err);
      });

      return c.json({ status: 'success' });
    }
    
    return c.json({ status: 'ignored' });
  } catch (err: any) {
    logger.error('Webhook processing failed', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});
