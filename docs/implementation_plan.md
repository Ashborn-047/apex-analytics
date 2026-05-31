# Implementation Plan - Cards Redesign, Comparisons, and Telemetry Value-Ups

We will redesign all 4 telemetry dashboards to use interactive card-based grids, integrate actual vs. simulated comparison metrics, and implement advanced telemetry indicators.

## Risk Mitigation & Edge Cases

1. **Dedicated Caching Endpoints**: Avoid mixing training and caching. We will create clean, dedicated endpoints in the Python ML service to store actual lap times and pit stops:
   * `POST /api/predict/lap-time/actuals`
   * `POST /api/predict/strategy/actuals`
2. **Stint-Mapping Match**: Lap time and strategy comparisons will be mapped by **Driver ID**, **Compound**, and **Stint Number** to ensure stint-to-stint comparisons are accurate.
3. **Driver ID Resilience**: Guard prior-season Elo checks. If a driver has no record in the previous season, display `NEW ENTRY` rather than throwing an error.
4. **Null-State Safety**: Every comparison chart and stats card will have fallback skeleton states and clean "No Data Available" messages (e.g., for the active 2026 season which has no final actuals).

---

## Tab-by-Tab Redesign & Features

### 1. Driver Elo rankings (`EloDashboard.tsx`)
* **Grid Card**: Displays Rank, Driver Name, Team (accent color bar), Elo rating, and 5-round Trend.
  * *Tooltip*: Hovering over a card shows `Season Rating Change` (e.g. `+45 Elo` since round 1).
* **Detail Panel (Sidebar)**:
  * Teammate H2H comparisons, H2H Dominance bar, and rolling uncertainty bounds.
  * **Driver Elo Sparkline [VALUE-UP]**: A mini line chart showing the driver's Elo progression round-by-round through the selected season (extracted from `self.history`).

### 2. Tyre Degradation curves (`TyreLapPredictor.tsx`)
* **Grid Card**: Dedicated cards for **SOFT**, **MEDIUM**, and **HARD** compounds showing compound color, predicted base pace, and cliff lap.
* **Detail Panel (Sidebar)**:
  * **Confidence Bands [VALUE-UP]**: Shaded area representing the model's confidence interval ($\pm 1\sigma$, or $\pm 0.25$s) around the predicted degradation line using a Recharts `<Area>`.
  * **Actual Lap Times Scatter Overlay**: Displays actual stint lap times (retrieved from `/api/predict/lap-time/actuals`) plotted as individual scatter points on the chart to visually highlight outlier laps (e.g. traffic, errors).

### 3. Pit Wall Strategy Planner (`PitWallPlanner.tsx`)
* **Grid Card**: Cards for strategy recommendations (e.g. `Primary 1-Stop: M ➔ H`).
* **Detail Panel (Sidebar)**:
  * Interactive strategy timeline slider showing safety car probabilities and traffic checks.
  * **Recommended vs. Actual Executed Box Lap**: Shows recommended window (e.g. Laps 16-21) vs. the actual executed pit stop lap (retrieved from `/api/predict/strategy/actuals`).
  * **Strategy Delta Explanation [VALUE-UP]**: Alongside the delta (e.g., `Pitted 2 Laps Late`), displays a calculated impact estimation (e.g., `Est. 0.8s lost due to overcut`) based on stint pace difference.

### 4. Monte Carlo Championship Simulator (`MonteCarlo.tsx`)
* **Grid Card**: Responsive grid of driver cards showing WDC/WCC probability dials.
* **Detail Panel (Sidebar)**:
  * Points scenario percentiles, max possible points, and mathematical elimination.
  * **Simulated vs. Actual Final Comparison**: Compare simulated rank/points with actual final season rank/points.

---

## Technical Approach & UI Polish
* **Transitions**: Use smooth CSS transitions and Framer Motion style spring effects (`transform: scale(1.02)`, soft glows) on hover.
* **Design Theme**: Maintain the AMG Telemetry styling (carbon void background, glowing cyan readout accents, HSL tailored team colors).
* **Robustness**: Maintain safe null-guards so selecting seasons or loading endpoints does not cause rendering crashes.

---

## Backend Changes (ML Service & Ingestion Pipeline)

### 1. Python ML Service (`apps/ml`)
#### [MODIFY] [prediction.py](file:///e:/My%20Projects/Apex-F1/apex/apps/ml/src/routes/prediction.py)
* Extend endpoints to cache and serve actuals:
  * `POST /api/predict/lap-time/actuals`: Caches actual lap times per season/circuit/driver/compound/stint.
  * `GET /api/predict/lap-time/actuals`: Retrieves cached actual lap times.
  * `POST /api/predict/strategy/actuals`: Caches actual executed pit stops per season/round/driver.
  * `GET /api/predict/strategy/actuals`: Retrieves cached actual pit stops.
* Update `/api/predict/simulation/championship` to map `actual_wdc` and `actual_wcc` into WDC/WCC results lists.

### 2. Ingestion Pipeline Worker (`apps/api`)
#### [MODIFY] [ml_sync.ts](file:///e:/My%20Projects/Apex-F1/apex/apps/api/src/pipeline/ml_sync.ts)
* Query actual lap times (grouped by stint) and actual pit stops from Postgres and push them to the new endpoints during synchronization.
* Query actual final WDC/WCC standings and push them as `actual_wdc`/`actual_wcc` to the simulation endpoint.

---

## Verification Plan

### Automated Verification
* Verify build success: `bun run build` inside `apps/web`.
* Run the sync script to populate all caches: `docker exec apex-api bun run --cwd apps/api sync:ml`.
* Verify that python unit tests pass.

### Manual Verification
* Click cards on all 4 tabs and check that detail panels slide in/out correctly.
* Verify season dropdown updates the data in cards dynamically.
* Confirm that simulated vs. actual comparison data and sparklines display correctly.
