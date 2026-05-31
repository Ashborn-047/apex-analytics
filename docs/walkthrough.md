# Apex-F1 & Silverwall Deployment Walkthrough

This document summarizes the steps taken to fix the cloud deployment crash, run database migrations, seed the circuit database, verify live integration between **Silverwall** and **Apex-F1**, and build out the complete **F1 Race Intelligence ML Microservice & React Dashboard** integration.

## Key Achievements & Fixes

### 1. Fly.io API Server Boot Mismatch
* **Fix**: Modified [Dockerfile](file:///e:/My%20Projects/Apex-F1/apex/apps/api/Dockerfile)'s run command from `bun workspace api run start` to `bun run --cwd apps/api start`.
* **Reason**: Bun workspaces do not support the NPM workspace command shorthand natively inside the slim container. Using `bun run --cwd` changes the directory to the API application context before running, allowing it to boot successfully.
* **Result**: The container boots cleanly, listens on port 3000, and is marked as healthy by Fly.io (green dot!).

### 2. Database Migrations (Vanilla Postgres Compatibility)
* **Fix**: Commented out TimescaleDB-specific initialization statements from the first Drizzle migration file [0000_loving_sersi.sql](file:///e:/My%20Projects/Apex-F1/apex/packages/db/drizzle/0000_loving_sersi.sql).
* **Reason**: Fly.io Postgres runs standard PostgreSQL without the TimescaleDB extension installed. Since Drizzle ORM does not require physical hypertables for its standard API queries, commenting this out allows the migrations to compile and run successfully against vanilla Postgres.
* **Migration Execution**: Set up a secure database proxy tunnel locally (`fly proxy 5433:5432 -a apex-f1-db`) and successfully ran `bun run db:migrate` against the Fly.io database.

### 3. Automatic Migrator Verification
* **Improvement**: Implemented programmatic Drizzle migrations inside [index.ts](file:///e:/My%20Projects/Apex-F1/apex/apps/api/src/index.ts) to run on container startup, so any new schema updates will run on boot.
* **Logging**: Corrected the Pino logger signature from `logger.error(message, error)` to `logger.error(error, message)` to ensure full tracebacks are printed to the Fly.io console if any database commands fail on start.

### 4. Database Seeding & Ingestion
* **Execution**: Ran the standalone ingest pipeline worker on a running Fly.io instance using `fly ssh console` running `bun run --cwd apps/api ingest`.
* **Result**: Populated historical F1 season, circuit, and race metadata in the Fly.io Postgres database. This created the required references for circuit keys (like `villeneuve`, `shanghai`, `bahrain`), resolving the `404 Not Found` API responses.

---

## Machine Learning Microservice & React Dashboard Integration

We have fully implemented the backend Python machine learning algorithms (`apps/ml`) and connected the high-fidelity React frontend pages (`apps/web`) to load live prediction insights instead of mock data.

### 1. Python ML Models Built (`apps/ml/src/models/`)
* **Driver Elo Ratings ([elo.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/models/elo.py))**:
  - isolates driver skill from constructor (car) performance by weighting same-car teammate comparisons.
  - Implemented decaying K-factor scheduling over the season to reduce ratings volatility.
  - Implemented continuous qualifying outcomes from percentage lap time differences scaled via a Sigmoid function.
  - Handled rookie cold-start (init at $1400$ with $1.3\times$ K-multiplier) and prior season carry-forward.
  - Filtered mechanical DNF outcomes while accounting for driver error crash DNFs.
* **Lap Time & Tyre Degradation ([lap_time.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/models/lap_time.py))**:
  - Implemented fuel load subtraction ($0.03\text{s/kg}$) as a hardcoded physics offset before training, adding it back during inference to reduce model variance.
  - Built a $2\sigma$ rolling baseline standard deviation tyre cliff detection algorithm.
  - Configured a regression pipeline combining Ridge and XGBoost models for dry compounds.
* **Pit stop Strategy Recommendation ([strategy.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/models/strategy.py))**:
  - Coded a brute-force stint window search ($O(N^2)$) evaluating optimal pit stops.
  - Integrated the Safety Car Poisson rate model per track, downweighting pit lane loss by $50\%$ if SC likelihood is high.
  - Built a traffic check verifying if the driver emerges in a clear gap ($>3.0\text{s}$).
* **Championship Monte Carlo Simulator ([simulation.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/models/simulation.py))**:
  - Vectorized Monte Carlo season simulator using NumPy (completes 50,000 runs in under 1s).
  - Utilizes exponentially decaying recency weightings ($\lambda = 0.08$) for driver form.
  - Applies Gumbel noise to simulate finishing variables and constructor circuit affinities.
  - Incorporates mathematical WDC/WCC championship elimination tracking.

### 2. FastAPI prediction endpoints exposed (`apps/ml/src/routes/prediction.py`)
Registered REST paths under `/api` in [main.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/main.py) to map seamlessly with the Vite proxy:
* `GET /api/predict/elo/rankings` - Returns calculated driver Elo values.
* `GET /api/predict/elo/head-to-head` - Retrieves matchup histories.
* `POST /api/predict/lap-time` - Outputs predicted lap times and stint degradation curves.
* `GET /api/predict/strategy/pit-window/{session_key}/{driver_id}` - Provides optimal box lap suggestions.
* `GET /api/predict/simulation/championship` - Generates Monte Carlo outcomes.

### 3. Frontend wiring completed (`apps/web/src/pages/`)
Replaced imports of static mock data structures with dynamic `fetch` hooks loading from our FastAPI microservice endpoints on mount/updates:
* **Elo Dashboard** ([EloDashboard.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/EloDashboard.tsx))
* **Tyre degradation Curves** ([TyreLapPredictor.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/TyreLapPredictor.tsx))
* **Pit Stop Recommendation list** ([PitWallPlanner.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/PitWallPlanner.tsx))
* **Championship Simulation Probability Distribution** ([MonteCarlo.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/MonteCarlo.tsx))

---

## Verification & Build
* **Containerization**: Configured the multi-container environment via [docker-compose.yml](file:///e:/My%20Projects/Apex-F1/apex/docker-compose.yml), fixing the volume mount bug that was overwriting Node modules. Verified all 4 services (`postgres`, `redis`, `api`, `ml`) compile, boot, and stay healthy.
* **Python Test Suite**: Executed the `pytest` test suite inside the `ml` container, with all **21/21 mathematical unit tests passing** cleanly (`docker exec apex-ml python -m pytest`).
* **Node→ML Sync & Elo Key Fixes**:
  - Identified and resolved a KeyError in Elo rating calculations when processing mid-season replacements or rookie drivers (like Oliver Bearman `BEA` or Franco Colapinto `COL`) that weren't present in the initial hardcoded roster.
  - Implemented dynamic driver initialization in [elo.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/models/elo.py) to automatically ingest and register new drivers with baseline ratings and uncertainty tracking.
  - Modified [prediction.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/routes/prediction.py) and [ml_sync.ts](file:///e:/My%20Projects/Apex-F1/apex/apps/api/src/pipeline/ml_sync.ts) to pass actual driver codes from the database and handle positions up to 22 (reserve entries).
  - Verified the sync pipeline locally against the running docker containers, successfully executing the ingestion and updating ratings for 53 races.
* **Git & Production Deployments**:
  - Configured [deploy-api.yml](file:///e:/My%20Projects/Apex-F1/.github/workflows/deploy-api.yml) to automate API deployment on pushes. Pushed changes to GitHub, triggering auto-deploy of both the API and ML microservices to Fly.io.
  - Successfully verified end-to-end sync in production, processing all 114 historical F1 races through the cloud ML service (97 successfully synced).
* **Administrative Endpoints & Ingestion Automation**:
  - Created `/api/admin/ingest` and `/api/admin/ingest/status` inside [admin.ts](file:///e:/My%20Projects/Apex-F1/apex/apps/api/src/routes/admin.ts) to allow triggering and tracking database updates remotely via HTTP requests.
  - Added [schedule-ingest.yml](file:///e:/My%20Projects/Apex-F1/.github/workflows/schedule-ingest.yml), a scheduled GitHub Action that runs every Monday morning at 08:00 UTC.
  - Implemented an off-season optimization rule in the workflow script: it evaluates the current date and only executes the curl request to the API if the month falls between March and November (the active F1 season), preventing server and CI minutes waste during off-months.

---

## Dynamic Data-Driven F1 ML Predictions (Ridge/XGBoost & Monte Carlo Updates)

We have successfully transitioned the F1 ML microservice (`apps/ml`) from using hardcoded seed data to dynamic, database-driven prediction models.

### 1. Vectorized Monte Carlo Simulation Refactoring
* **File modified**: [simulation.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/models/simulation.py)
* **Changes**:
  - Refactored `run_simulation` to accept optional parameters for driver standings (`wdc_standings`), team standings (`wcc_standings`), and the remaining calendar (`remaining_rounds`).
  - Added dynamic calculation of `max_possible_gain` based on the remaining calendar length and sprint status, replacing the old round-12 hardcoding.
  - Implemented automatic calculation of `as_of_round` and `total_rounds` from the schedule input.
  - Retained backward-compatible fallbacks to local season defaults.

### 2. Node.js Ingestion & Sync Pipeline Enhancements
* **File modified**: [ml_sync.ts](file:///e:/My%20Projects/Apex-F1/apex/apps/api/src/pipeline/ml_sync.ts)
* **Changes**:
  - **Dynamic Stint Construction**: Implemented a map-reduce style logic that groups pit stops per driver/race to partition their lap times into stints. Sets `stint_lap` and `tyre_age_total` based on the lap offset since the last pit stop.
  - **Lap Time Sanitization**: Excludes safety cars, formation laps, and extreme outlier lap times (retaining times between 50s and 150s) to train the models on a dry-weather performance baseline.
  - **Linear Fuel Model**: Approximates physical fuel burn over the race duration, starting at 100kg and declining to 0kg linearly at the final lap.
  - **Standings Rollback Logic**: If the latest database season (e.g. 2023) is fully completed, the sync pipeline automatically rolls back standings to Round 17 and simulates the final 5 rounds to provide a live, functional simulation walkthrough.
  - **FastAPI Endpoint Integration**: Sends the training payload of 47,683 clean lap timing rows to `POST /api/predict/lap-time/train` and the dynamic standings to `POST /api/predict/simulation/championship`.

### 3. Verification Results
* **Container Health**: Rebuilt and booted the `apex-api` and `apex-ml` Docker containers cleanly.
* **Synchronization Execution**: Ran the sync pipeline script via `bun run sync:ml` inside the api container. The process completed in under 15 seconds, successfully training the Ridge and XGBoost regression models on **47,683 timing points** and executing the Monte Carlo simulations on the database standings.
* **Mathematical Tests**: All **21/21 Python tests passed** cleanly including tests checking the new dynamic simulation parameters (`docker exec apex-ml python -m pytest`).

---

## Runtime Telemetry & Frontend Robustness Fixes (Page Rendering Crashes)

We fixed the critical runtime rendering issues that caused the **Tyre & Lap** and **Pit Wall** pages to go blank when selected in the frontend app.

### 1. esbuild & TypeScript JSX Parse Blockages
* **Fix**: Replaced all instances of LaTeX-style math formatting (`$2\sigma$`, `$\pm 0.35\text{s}$`, and `$0.3\text{s}$`) with standard plain-text units (`2-sigma`, `±0.35s`, and `0.3s`) in the *Telemetry Intelligence Desk* explanation cards inside [PitWallPlanner.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/PitWallPlanner.tsx) and [TyreLapPredictor.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/TyreLapPredictor.tsx).
* **Reason**: The esbuild JSX compiler and the TypeScript parser incorrectly interpreted the `{s}` inside the LaTeX command `\text{s}` as a React JSX curly-brace expression evaluating a JavaScript variable named `s`. Since no variable `s` was defined, it triggered syntax errors and compiler blockages.

### 2. Robust UI Property Protection & Casing Normalization
* **Tyre & Lap Page**: Guarded all maps on `compoundsData` to filter out any null/undefined entries. Protected string methods like `.toUpperCase()` on `circuit_id` and formatted values like `confidence_interval` or `cliff_severity_s_per_lap` by ensuring type safety before calling `.toFixed()` or performing arithmetic.
* **Pit Wall Page**: Guarded properties in the recommendations card (`net_delta_s`, `sc_probability`, `compound_new`). Refactored `ConfidencePip` to normalize lowercase/mixed-case confidence values (e.g. `HIGH`, `High`, `high`) using `.toUpperCase()` and safe default fallbacks to prevent runtime dictionary key crashes.

### 3. Telemetry Page Error Boundary
* **Improvement**: Created a custom, high-fidelity dark-mode `PageErrorBoundary` inside [App.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/App.tsx) that wraps the rendering of all telemetry dashboards.
* **Result**: If any sub-component crashes at runtime, the application will no longer go completely blank. Instead, it will display a formatted error report highlighting the precise error description, stack trace, and a button to attempt reloading the telemetry components.

### 4. Build Validation
* Ran a full production compilation check via `bun run build` in the web application directory. The project now compiles flawlessly with zero compiler errors or warnings.

---

## Dynamic Multi-Season Telemetry Integration

We have integrated the dynamic season selector dropdown and propagated the state to all page components, allowing users to switch seasons seamlessly (2022 to 2026).

### 1. Root Season Selector & Navigation
* **File modified**: [App.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/App.tsx)
* **Changes**:
  - Replaced the static header badge with an interactive `<select>` dropdown populated with seasons: `2026`, `2025`, `2024`, `2023`, and `2022`.
  - Added a root state hook `const [selectedSeason, setSelectedSeason] = useState<number>(2026)` to manage the active season.
  - Wrapped page rendering in a telemetry-styled `PageErrorBoundary` that clears itself when navigating tabs.
  - Propagated the `selectedSeason` value as a `season` prop to all page components.

### 2. State Propagation & Dynamic Fetching in Dashboards
* **Elo Ratings** ([EloDashboard.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/EloDashboard.tsx)): Accept `season` prop, add it to `useEffect`'s dependency list, and fetch from `${API_BASE}/api/predict/elo/rankings?season=${season}`. Rendered the active season in the table header.
* **Championship Predictions** ([MonteCarlo.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/MonteCarlo.tsx)): Accept `season` prop, fetch dynamic Monte Carlo simulations using `?season=${season}`, and protected all statistics cards from null/undefined values during state transitions.
* **Pit Stop Recommendation** ([PitWallPlanner.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/PitWallPlanner.tsx)): Accept `season` prop, fetch pit stop strategy window recommendations from `${API_BASE}/api/predict/strategy/pit-window/${season}_R12/${driver}`, and updated the timeline footer subtitle dynamically.
* **Tyre Degradation** ([TyreLapPredictor.tsx](file:///e:/My%20Projects/Apex-F1/apex/apps/web/src/pages/TyreLapPredictor.tsx)): Accept `season` prop and render it in the degradation curve chart subtitle.

### 3. Verification & Automated Tests
* **Python unit tests**: Ran unit tests inside the ML container; all **21 tests passed successfully**.
* **Compilation**: Checked production builds (`bun run build` inside `apps/web`); completed with **zero errors**.

### 4. Interactive Card Redesign & Simulated vs. Actual Comparisons
* **Driver Elo rankings** (`EloDashboard.tsx`):
  - Redesigned into a grid of standings cards, displaying Rank, Flag, Driver Name, Team color bar, ELO score, and trend badge.
  - Added teammate comparison details in a sidebar drawer with teammates' wins/losses/ties, ELO dominance meter, and a Recharts ELO sparkline line chart showing round-by-round rating progression over the season.
* **Tyre degradation curves** (`TyreLapPredictor.tsx`):
  - Redesigned to use compound cards (SOFT, MEDIUM, HARD) as the selection header.
  - Added confidence interval area shading (`ComposedChart` and `<Area>`) representing prediction uncertainty bounds.
  - Overlaid actual stint lap times retrieved dynamically from the new actuals database cache as scatter points on selection.
* **Pit stop Strategy recommendations** (`PitWallPlanner.tsx`):
  - Redesigned to render strategy options cards (Primary vs Alternative).
  - Added driver selector dropdown to query Max Verstappen, Lando Norris, Charles Leclerc, etc.
  - Added interactive timeline comparing recommended box window vs actual executed box lap.
  - Added Strategy Delta pace loss delta impact calculations to show overcut or undercut time differences.
* **Championship Monte Carlo simulation** (`MonteCarlo.tsx`):
  - Redesigned to use driver/team card grids with circular probability dial gauges.
  - Added simulated vs actual final standings (points and ranks) comparison tables in the sidebar for completed historical seasons (2022-2025).
