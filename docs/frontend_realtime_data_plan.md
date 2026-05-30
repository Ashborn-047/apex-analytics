# Frontend Real-Time Data Integration Plan

Connect all 4 dashboard pages to the Python FastAPI ML microservice (`apex-ml`, port 8000) so they fetch real, live data dynamically — replacing static mock fallbacks with proper loading states, error boundaries, and refetch controls.

---

## Current State (What Already Works)

The pages are already **structurally wired** correctly:

| Page | Current Fetch | Fallback |
|---|---|---|
| `EloDashboard.tsx` | `GET /api/predict/elo/rankings?season=2025&as_of_round=12` | `MOCK_ELO_RANKINGS` |
| `MonteCarlo.tsx` | `GET /api/predict/simulation/championship` | `MOCK_SIMULATION` |
| `PitWallPlanner.tsx` | `GET /api/predict/strategy/pit-window/2025_R12/LEC` | `MOCK_PIT_RECOMMENDATIONS` |
| `TyreLapPredictor.tsx` | `POST /api/predict/lap-time` × 3 compounds | `MOCK_DEGRADATION` etc. |

The **Vite proxy** (`vite.config.ts`) already forwards `/api/*` → `http://localhost:8000` ✅

**The problem:** The pages silently fall back to mock data when the fetch fails — there's no loading state, no "live vs mock" indicator, and no way to refetch on demand.

---

## Proposed Changes

### Component 1: Shared Data Fetching Hook

#### [NEW] `src/hooks/useMLFetch.ts`
A single reusable hook to handle all ML endpoint calls with:
- `status`: `"loading" | "live" | "mock" | "error"`
- `refetch()`: trigger a manual reload
- Auto-retry on first mount
- Graceful mock fallback on network failure

```ts
// Returns { data, status, refetch }
// status = "live" means data came from the ML service
// status = "mock" means the API was unreachable, fallback used
```

---

### Component 2: Live Data Status Banner

#### [NEW] `src/components/DataSourceBadge.tsx`
A small badge shown in every page header:
- 🟢 `LIVE · ML SERVICE` — when data is fresh from the API
- 🟡 `MOCK DATA · API OFFLINE` — when falling back
- 🔵 `LOADING...` — during fetch

With a **↻ Refresh** button to manually trigger refetch.

---

### Component 3: Page Updates (all 4 pages)

#### [MODIFY] `EloDashboard.tsx`
- Replace manual `useState` + `useEffect` fetch with `useMLFetch`
- Add `DataSourceBadge` to the header (already has a `LIVE` pulse dot — make it real)
- Add `season` and `round` query param controls (dropdowns) so user can query any round dynamically
- Show skeleton rows while loading

#### [MODIFY] `MonteCarlo.tsx`
- Replace fetch with `useMLFetch`
- Add `DataSourceBadge` + `simulations` count control (slider: 10k → 500k → 1M)
- Add `refetch` button labeled **"Re-run Simulation"** — triggers a fresh Monte Carlo run
- Show loading spinner while the 50k-sim run completes (~1-2s)

#### [MODIFY] `TyreLapPredictor.tsx`
- Replace manual `Promise.all` fetch with `useMLFetch` per compound
- Add inputs for **track temp** (slider), **fuel load** (slider), **driver** (dropdown)
- On input change → re-fetch all 3 compounds with new params
- Debounce input changes (300ms) so it doesn't hammer the API on every slider tick

#### [MODIFY] `PitWallPlanner.tsx`
- Replace manual fetch with `useMLFetch`
- Make **driver selector** interactive — changing the driver ID triggers a new fetch
- Add **current lap** and **tyre age** sliders that refetch on change
- Show "Fetching pit strategy..." skeleton while loading

---

### Component 4: Vite Proxy — No Changes Needed ✅

`vite.config.ts` already proxies `/api → http://localhost:8000` correctly.

For **production** (Silverwall integration later), the proxy target becomes the deployed ML service URL via an env variable: `VITE_ML_SERVICE_URL`.

---

### Component 5: Environment Config

#### [NEW] `apps/web/.env.local` (gitignored)
```
VITE_ML_SERVICE_URL=http://localhost:8000
```

#### [MODIFY] `vite.config.ts`
```ts
target: process.env.VITE_ML_SERVICE_URL || "http://localhost:8000"
```

So switching to a deployed ML service later requires only a `.env` change — zero code changes.

---

## Data Flow Diagram

```
Browser (Vite :5173)
    │
    │  fetch("/api/predict/...")
    ▼
Vite Dev Proxy
    │
    │  forwards to http://localhost:8000
    ▼
apex-ml (FastAPI :8000)
    │
    │  runs ML model
    ▼
JSON response
    │
    │  parsed by useMLFetch hook
    ▼
React state → renders live data
    (if error → falls back to mock, shows MOCK badge)
```

---

## What Changes Per Page — Summary

| Page | New Controls | New UX |
|---|---|---|
| `EloDashboard` | Season + Round dropdowns | Skeleton rows, LIVE badge wired |
| `MonteCarlo` | Simulations slider, Re-run button | Spinner during run, LIVE badge |
| `TyreLapPredictor` | Track temp + fuel sliders, driver picker | Debounced refetch on param change |
| `PitWallPlanner` | Driver + lap + tyre age inputs | Skeleton cards, live refetch |

---

## Verification Plan

1. Boot Docker: `docker compose up -d` (after rebuild)
2. Start frontend: `bun run dev` in `apps/web`
3. Each page should show **🟢 LIVE · ML SERVICE** badge
4. Change a control (e.g. switch driver in PitWallPlanner) → verify network tab shows a fresh `/api/predict/...` call
5. Kill the ML container → verify pages gracefully show **🟡 MOCK DATA · API OFFLINE** without crashing
6. Restart container → click ↻ Refresh → data returns live

> **Note:** The mock data stays in `mockData.ts` permanently as the offline fallback — it is never deleted. This ensures the UI is always usable even without Docker running.
