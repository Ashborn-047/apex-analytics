# APEX — F1 Analytical Platform & Prediction Engine

APEX is the analytical and historical brain that sits alongside Silverwall (the live F1 pitwall application). While Silverwall handles live telemetry and active race-weekend state, APEX drives historical statistics, strategy simulations, 3D track renderers, and machine learning outcomes.

## Monorepo Architecture

The project is structured as a **Turborepo** monorepo:

```
apex/
├── apps/
│   ├── api/          → Bun + Hono (Main REST API)
│   ├── ml/           → Python FastAPI (Machine Learning microservice)
│   ├── web/          → React + Vite (Dashboard app)
│   └── embed/        → Vanilla Three.js (Embeddable 3D track widget)
├── packages/
│   ├── db/           → Drizzle schema & TimescaleDB migrations
│   ├── types/        → Shared TypeScript type definitions
│   └── track-utils/  → Geometry processing & elevation loading
```

---

## Tech Stack

*   **Monorepo Tooling:** Turborepo
*   **Main REST API:** Bun + Hono
*   **Database ORM:** Drizzle
*   **Database:** Neon Serverless PostgreSQL (ap-south-1 Mumbai region) + TimescaleDB Extension
*   **Cache & Queue:** Upstash Redis + BullMQ
*   **ML Microservice:** Python 3.12 + FastAPI + scikit-learn + XGBoost + pandas
*   **3D Geometry Renderer:** Three.js (vanilla ES module embed)
*   **Dashboard Web App:** React + Vite + Tailwind CSS + Recharts + D3 + Zustand
*   **Hosting:** Fly.io (blr Bangalore region) for API/ML, Vercel for Dashboard, Upstash / Neon for databases.

---

## Phase 1 Foundation

### 1. Database Schema
Defined in `packages/db/src/schema.ts` and managed via Drizzle Kit:
*   `circuits`: Details on all F1 tracks.
*   `seasons`: Years and totals of race rounds.
*   `races`: Compounded primary key (`season` + `round`) with a unique serial index `id`.
*   `drivers` & `constructors`: Bio and team entries.
*   `results`: Driver placements, points, and final status.
*   `lap_times`: partitioned as a TimescaleDB hypertable by `race_id`.
*   `qualifying` & `pit_stops`: Quali timings and pit lane stops.

### 2. Ingestion Pipeline
Standalone ingestion pipeline located in `apps/api/src/pipeline/ingest.ts` (triggered with `bun run ingest` inside `apps/api`):
*   Pulls historical datasets from the **Jolpica Ergast API**.
*   Leverages **BullMQ** for job processing and rate-limit queuing.
*   Includes built-in exponential backoffs to handle API rate limits gracefully.
*   Supports an optional `INGEST_SEASONS_LIMIT` environment variable for faster database seeding during local testing.

### 3. REST API Core Endpoints
Exposes structured endpoints validated via Hono and documented interactively via **Scalar OpenAPI**:
*   `GET /api/circuits` — Fetch all circuits.
*   `GET /api/circuits/:id/geometry` — Get preprocessed 2D track points + elevation array.
*   `GET /api/seasons` — Fetch all historical seasons.
*   `GET /api/races/:season` — Fetch all races in a particular year.
*   `GET /api/drivers` — Paginated driver lists.
*   `GET /api/constructors` — Fetch all constructors.

---

## Local Development & Setup

### Prerequisites
*   [Bun](https://bun.sh/) (v1.x+)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Environment Configuration
Copy the environment variables template and configure the values:
```bash
cp apex/.env.example apex/.env
```

### 2. Start Services (Local Postgres + Redis)
Start the Docker Compose containers:
```bash
docker compose -f apex/docker-compose.yml up -d
```

### 3. Database Migrations
Generate and execute migrations to initialize database tables and create the TimescaleDB hypertable partition:
```bash
# Inside apex/packages/db
bun run db:generate
bun run db:migrate
```

### 4. Running the API Dev Server
```bash
# Inside apex/apps/api
bun run dev
```
The Hono API will start on `http://localhost:3000`. You can access the interactive documentation at `http://localhost:3000/docs`.

### 5. Seed Historical Data
Run the data ingestion pipeline to seed the local database:
```bash
# Inside apex/apps/api
bun run ingest
```
This will queue jobs to populate circuits, seasons, races, qualifying results, pit stops, and lap times from Jolpica.

---

## SpacetimeDB Real-time Bridge

In Phase 3, a shared SpacetimeDB instance establishes real-time telemetry streaming from Silverwall to APEX:
*   **Silverwall writes to:** `live_positions`, `live_gaps`, `session_state`, `live_timing`.
*   **APEX ML writes to:** `strategy_recommendation`, `championship_probability`, `predicted_laptime`.
*   Interfaces are pre-configured in `packages/types/src/spacetime.ts` to ensure compatibility.
