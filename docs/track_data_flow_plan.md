# Apex-F1 to Silverwall Track Data Integration Plan

This document details the architectural plan to centralize F1 track geometry data inside the **Apex-F1** backend service, serving as the single source of truth for both the React frontend cards and the SpacetimeDB ingestor.

## Architecture Flowchart

```mermaid
graph TD
    subgraph Apex API [Apex Monorepo (Fly.io)]
        A[tracks.json / track-utils] -->|Serves 2*7| B[GET /api/circuits/:id/geometry]
    end

    subgraph Silverwall Ingestor [Ingestor Service]
        C[Seeding Routine] -->|1. Request once on session load| B
        C -->|2. Seed coordinates| D[(SpacetimeDB)]
    end

    subgraph Silverwall Frontend [React Client]
        E[Live Pitwall Telemetry] -->|Subscribe| D
        F[Race Result Cards] -->|Fetch / Cache| B
    end
```

## Integration Details

### 1. Centralized Track Geometry (Apex-F1)
* **Status**: Compiled and registered.
* **Details**: All 24 circuit geometries (including Montreal / `gilles_villeneuve`) are parsed, scaled to a standard 2D/3D coordinate space, and packaged in `@apex/track-utils` under `packages/track-utils/src/data/`.
* **API Endpoint**: Served via Hono router at `/api/circuits/:id/geometry`.

### 2. Ingestor Integration (SpacetimeDB Seeding)
* **Before**: The ingestor fetched raw location points from the OpenF1 `/location` API (which needs heavy downsampling, is subject to strict rate limits, and causes empty telemetry grids during GPS drops).
* **After**: The ingestor queries the deployed `apex-api` geometry endpoint once on session load, receiving pre-smoothed, high-fidelity track coordinates, and seeds them directly into SpacetimeDB's `track_point` table.
* **Benefit**: Guarantees a valid, high-fidelity map on the live telemetry screen 24/7 with zero dependency on the OpenF1 `/location` API.

### 3. Frontend Integration (Static Map Cards)
* **Before**: The React UI bundled 24 separate `.ts` coordinate files locally, increasing bundle size and requiring local code changes to update track details.
* **After**: The UI components (e.g., `TrackMap` card) will fetch the track metadata and coordinates dynamically from `https://apex-api.fly.dev/api/circuits/:id/geometry` and cache them in client-side state.
