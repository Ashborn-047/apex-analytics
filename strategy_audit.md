# Audit Report: `strategy.py`
**Findings & Gaps:**
- **Hardcoded Track Temperature & Fuel Assumption:** Inside the `recommend_pit_window` function, when it calls `self.lap_predictor.predict()`, it passes a hardcoded track temperature of `38.5`°C. Fuel load assumptions were also somewhat arbitrarily tied to `50.0 - (laps_on_old * 1.55)` without accounting for the starting fuel load or race length differences.
- **Missing Input Parameters:** The function signature of `recommend_pit_window` did not accept `track_temp` or `initial_fuel_load`. They should be inputs to correctly reflect race conditions.
- **Compound selection edge cases:** The function `recommend_compound` was very rudimentary, ignoring whether the rules require using at least two different compounds. If `current_compound` was `SOFT` and it recommends `SOFT` again, the car might get disqualified if it doesn't pit again for another compound.
- **Out of bounds loop lap indices:** In `recommend_pit_window`, if `max_search_lap < min_search_lap` (e.g. at the very end of the race), the loop won't execute and it relies on a hardcoded fallback that suggests pitting on `current_lap + 3` which might be greater than `total_laps`.

**Implemented Fixes:**
- Added `track_temp` and `fuel_load` parameters to `recommend_pit_window` and passed them dynamically to the lap predictor.
- Updated `recommend_compound` to accept `current_compound` and avoid recommending the same compound consecutively (basic two-compound rule heuristic).
- Handled edge cases where the fallback pit lap could exceed total race laps.
