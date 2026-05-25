CREATE TABLE IF NOT EXISTS "circuits" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"country" text,
	"first_gp" integer,
	"length_km" double precision,
	"corners" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "constructors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nationality" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drivers" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"dob" text,
	"nationality" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lap_times" (
	"race_id" integer NOT NULL,
	"driver_id" text NOT NULL,
	"lap" integer NOT NULL,
	"time_ms" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "lap_times_race_id_driver_id_lap_pk" PRIMARY KEY("race_id","driver_id","lap")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pit_stops" (
	"race_id" integer NOT NULL,
	"driver_id" text NOT NULL,
	"lap" integer NOT NULL,
	"stop_number" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	CONSTRAINT "pit_stops_race_id_driver_id_stop_number_pk" PRIMARY KEY("race_id","driver_id","stop_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qualifying" (
	"race_id" integer NOT NULL,
	"driver_id" text NOT NULL,
	"constructor_id" text NOT NULL,
	"q1_ms" integer,
	"q2_ms" integer,
	"q3_ms" integer,
	"position" integer NOT NULL,
	CONSTRAINT "qualifying_race_id_driver_id_pk" PRIMARY KEY("race_id","driver_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "races" (
	"id" integer NOT NULL,
	"season" integer NOT NULL,
	"round" integer NOT NULL,
	"circuit_id" text NOT NULL,
	"date" text,
	"name" text NOT NULL,
	CONSTRAINT "races_season_round_pk" PRIMARY KEY("season","round"),
	CONSTRAINT "races_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "results" (
	"race_id" integer NOT NULL,
	"driver_id" text NOT NULL,
	"constructor_id" text NOT NULL,
	"grid" integer NOT NULL,
	"position" integer,
	"points" real NOT NULL,
	"status" text NOT NULL,
	"fastest_lap" integer,
	CONSTRAINT "results_race_id_driver_id_pk" PRIMARY KEY("race_id","driver_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seasons" (
	"year" integer PRIMARY KEY NOT NULL,
	"rounds" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lap_times" ADD CONSTRAINT "lap_times_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lap_times" ADD CONSTRAINT "lap_times_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pit_stops" ADD CONSTRAINT "pit_stops_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pit_stops" ADD CONSTRAINT "pit_stops_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifying" ADD CONSTRAINT "qualifying_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifying" ADD CONSTRAINT "qualifying_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifying" ADD CONSTRAINT "qualifying_constructor_id_constructors_id_fk" FOREIGN KEY ("constructor_id") REFERENCES "public"."constructors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "races" ADD CONSTRAINT "races_season_seasons_year_fk" FOREIGN KEY ("season") REFERENCES "public"."seasons"("year") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "races" ADD CONSTRAINT "races_circuit_id_circuits_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuits"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "results" ADD CONSTRAINT "results_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "results" ADD CONSTRAINT "results_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "results" ADD CONSTRAINT "results_constructor_id_constructors_id_fk" FOREIGN KEY ("constructor_id") REFERENCES "public"."constructors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
--> statement-breakpoint
SELECT create_hypertable('lap_times', 'race_id', chunk_time_interval => 1, if_not_exists => true);

