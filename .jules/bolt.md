## 2025-02-12 - Avoid multi-pass iterations in render for aggregate metrics
**Learning:** Found a common pattern where `Math.min(...arr.map(x => x.prop))` and `.reduce` were used directly in the JSX render function. This causes multiple full-array iterations and creates intermediate arrays on every single render cycle, which can severely degrade performance on large arrays (or long lists of drivers/laps).
**Action:** Always compute list aggregates (min, max, average, etc.) in a single O(N) loop and wrap it in `useMemo` with proper dependencies, avoiding `.map()` followed by `.reduce()` or spread `Math.min/max`.
## 2025-10-24 - Avoid micro-optimizations that harm readability and add unnecessary useMemo overhead
**Learning:** Found an attempt to over-optimize a very small array (e.g. `sparklineData` with only 5 elements) using `useMemo` and complex string concatenations instead of simple `.map().join()`. This harmed readability and added more overhead than it saved, violating the principle of avoiding premature micro-optimization.
**Action:** Always evaluate if the data structure is large enough to warrant complex loop optimizations. For very small, fixed-size arrays, standard map/reduce pipelines are perfectly fine and often faster than the React hook overhead of `useMemo`. Focus optimizations on `O(N)` loop reduction for large datasets or functions with heavy calculations (like `getTyreDegCurve`).
## 2026-06-21 - Array find inside loop inside render
**Learning:** Found a case where `Array.find` was repeatedly called inside a map/loop that generated data for a chart component on every single render. This created an O(N^2) search overhead that was running constantly during a live simulation.
**Action:** Extract expensive lookups that don't depend on the loop index outside of the array generation map, and wrap the data generation block in `useMemo` to prevent recalculation when unrelated state changes.

## 2025-02-12 - Unmemoized randomized mock data causes UI jumps and unnecessary layout recalculations
**Learning:** Generating arrays of random mock data directly within component render bodies (e.g. `generateEloComparisonHistory`) without `useMemo` triggers expensive re-evaluations and causes charts to redraw/jump on completely unrelated state updates (like hovering or toggling sub-tabs).
**Action:** When working with mock data generation that uses `Math.random` or involves looping, always wrap the generated data array in `useMemo` to ensure visual stability and prevent wasted computational cycles during normal UI interactions.

## 2025-06-28 - Unmemoized randomized mock data causes UI jumps and unnecessary layout recalculations
**Learning:** Found an unmemoized mock data generation `generateEloProgression` in `DriverDetailModal.tsx` that uses `Math.random()`. Without memoization, any re-render triggers recalculation, resulting in unnecessary layout shifts and wasted CPU cycles. Also learned to be mindful of early returns in React components when adding hooks.
**Action:** When working with mock data generation that uses `Math.random` or involves looping, always wrap the generated data array in `useMemo`. When applying `useMemo`, remember to place it before early returns (like `if (!driver) return null;`) to avoid violating the Rules of Hooks. Add safe fallbacks inside the `useMemo` block if needed.

## 2024-03-24 - [Avoid React Micro-Optimizations]
**Learning:** In the React frontend, avoid O(N^2) rendering bottlenecks by pre-computing O(1) Object/Map lookups to replace O(N) `Array.find` calls inside render loops. However, avoid micro-optimizations: do not create Map/Object lookups for very small arrays (e.g., <25 items) as the memory allocation overhead outweighs using `find()`, and do not wrap simple O(1) property lookups in `useMemo` due to hook overhead.
**Action:** Always check the size of the array before optimizing `Array.find` calls. If the array is small, leave it as is.

## 2024-03-24 - [Replace inner loop predictions with pre-computed slices]
**Learning:** In backend predictive loops (`PitStopStrategy.recommend_pit_window` searching across laps), recalculating lap times from zero creates O(N^2) inference bottleneck. The `lap_predictor.predict` calls can be extremely slow if connected to an ML model or doing deep regression. We replaced O(N^2) inside the loop with an O(N) pre-computed array of baseline predictions, generating huge performance gains when iterating over lap strategies.
**Action:** Whenever iterating over laps where values are just cumulative sums of single-lap predictions, always hoist the prediction loop outside to precompute the maximum range, and use array slicing inside the loop.
