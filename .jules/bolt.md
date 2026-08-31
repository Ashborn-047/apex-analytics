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
## 2024-05-18 - [Optimizing O(N^2) render loop in TyreLapPredictor]
**Learning:** React component simulated lap simulation had O(N^2) complexity due to 4 array find calls within the 25 iterations of array generation logic during the rendering. Creating dictionary map variables before the loops provides O(1) object property lookup speeds.
**Action:** Always precalculate map lookups directly in the render/useMemo when executing arrays processing inside.
