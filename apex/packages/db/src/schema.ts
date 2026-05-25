import { pgTable, text, integer, doublePrecision, real, primaryKey } from 'drizzle-orm/pg-core';

// 1. Circuits
export const circuits = pgTable('circuits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  country: text('country'),
  firstGp: integer('first_gp'),
  lengthKm: doublePrecision('length_km'),
  corners: integer('corners'),
});

// 2. Seasons
export const seasons = pgTable('seasons', {
  year: integer('year').primaryKey(),
  rounds: integer('rounds').notNull(),
});

// 3. Races
export const races = pgTable('races', {
  id: integer('id').unique().notNull(),
  season: integer('season').notNull().references(() => seasons.year),
  round: integer('round').notNull(),
  circuitId: text('circuit_id').notNull().references(() => circuits.id),
  date: text('date'),
  name: text('name').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.season, table.round] }),
}));

// 4. Drivers
export const drivers = pgTable('drivers', {
  id: text('id').primaryKey(),
  code: text('code'),
  name: text('name').notNull(),
  dob: text('dob'),
  nationality: text('nationality'),
});

// 5. Constructors
export const constructors = pgTable('constructors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nationality: text('nationality'),
});

// 6. Results
export const results = pgTable('results', {
  raceId: integer('race_id').notNull().references(() => races.id),
  driverId: text('driver_id').notNull().references(() => drivers.id),
  constructorId: text('constructor_id').notNull().references(() => constructors.id),
  grid: integer('grid').notNull(),
  position: integer('position'),
  points: real('points').notNull(),
  status: text('status').notNull(),
  fastestLap: integer('fastest_lap'), // Lap number
}, (table) => ({
  pk: primaryKey({ columns: [table.raceId, table.driverId] }),
}));

// 7. Lap Times (Partitions by race_id as a TimescaleDB hypertable)
export const lapTimes = pgTable('lap_times', {
  raceId: integer('race_id').notNull().references(() => races.id),
  driverId: text('driver_id').notNull().references(() => drivers.id),
  lap: integer('lap').notNull(),
  timeMs: integer('time_ms').notNull(),
  position: integer('position').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.raceId, table.driverId, table.lap] }),
}));

// 8. Qualifying
export const qualifying = pgTable('qualifying', {
  raceId: integer('race_id').notNull().references(() => races.id),
  driverId: text('driver_id').notNull().references(() => drivers.id),
  constructorId: text('constructor_id').notNull().references(() => constructors.id),
  q1Ms: integer('q1_ms'),
  q2Ms: integer('q2_ms'),
  q3Ms: integer('q3_ms'),
  position: integer('position').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.raceId, table.driverId] }),
}));

// 9. Pit Stops
export const pitStops = pgTable('pit_stops', {
  raceId: integer('race_id').notNull().references(() => races.id),
  driverId: text('driver_id').notNull().references(() => drivers.id),
  lap: integer('lap').notNull(),
  stopNumber: integer('stop_number').notNull(),
  durationMs: integer('duration_ms').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.raceId, table.driverId, table.stopNumber] }),
}));
