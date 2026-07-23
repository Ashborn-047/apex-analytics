1. **Analyze O(N^2) array search inside mapping/render loops.**
   - In `apex/apps/ml/src/models/strategy.py`, there is an O(N^2) operation because we are generating `old_times`, `new_times`, and `baseline_times` by calling `self.lap_predictor.predict` in nested list comprehensions inside a `for p in range(min_search_lap, max_search_lap + 1):` loop.
   - Wait, `old_times` adds the first `laps_on_old` laps on the current compound, starting from `stint_laps`. For the *next* candidate lap `p+1`, `old_times` is just the previous `old_times` plus one additional lap.
   - We are currently re-calculating `old_times` from scratch for *every* candidate `p`, which leads to an O(N^2) behavior.
   - Instead, we can pre-compute the predicted lap times up to the maximum `laps_on_old` outside the loop, or keep a running sum.
   - Same goes for `baseline_times`.

2. **Refactor the code to improve performance by using O(N) linear time.**
   - Before the loop over `p`, we can precompute the predicted lap times for the current compound up to the maximum possible laps we might stay out.
   - We can precompute the `old_times` and `baseline_times` arrays once, up to the maximum `laps_on_old` plus `max(len(new_times))`.
   - Wait, `new_times` is dependent on the `new_compound`, which depends on `p`. But `new_times` calculation is restricted to `min(laps_on_new + 1, 15)`.

3. **Check performance impact:**
   - Instead of calling `self.lap_predictor.predict` `O(N^2)` times, we can call it `O(N)` times for the current compound, and `O(N * 15)` for the new compound.
   - Or, we can just keep a running sum for `total_old` because it's just appending one lap.
   - Wait, let's look at how `baseline_times` is calculated:
     ```python
     baseline_times = [
         self.lap_predictor.predict(stint_laps + i, track_temp, max(0.0, fuel_load - (i * 1.55)), current_compound)
         for i in range(laps_on_old + len(new_times))
     ]
     ```
     This recalculates the first `laps_on_old` elements for every candidate.

   - Let's pre-compute a list of baseline predictions outside the loop:
     ```python
     max_laps_to_simulate = (max_search_lap - current_lap) + 15
     precomputed_baseline = [
         self.lap_predictor.predict(stint_laps + i, track_temp, max(0.0, fuel_load - (i * 1.55)), current_compound)
         for i in range(max_laps_to_simulate)
     ]
     ```
     Then, inside the loop:
     ```python
     total_old = sum(precomputed_baseline[:laps_on_old])
     # len_new_times = len(new_times) = min(laps_on_new, 14) + 1 maybe? (Actually it's range(1, min(laps_on_new + 1, 15)), so len is min(laps_on_new, 14))
     total_baseline = sum(precomputed_baseline[:laps_on_old + len(new_times)])
     ```
     This replaces O(N^2) model predictions with O(N) pre-computations and array slices, a massive speedup!

4. **Verify correctness of pre-computation.**
   - Let's check `old_times`:
     ```python
     old_times = [
         self.lap_predictor.predict(stint_laps + i, track_temp, max(0.0, fuel_load - (i * 1.55)), current_compound)
         for i in range(laps_on_old)
     ]
     ```
     This matches exactly `precomputed_baseline[:laps_on_old]`.

   - Let's check `baseline_times`:
     ```python
     baseline_times = [
         self.lap_predictor.predict(stint_laps + i, track_temp, max(0.0, fuel_load - (i * 1.55)), current_compound)
         for i in range(laps_on_old + len(new_times))
     ]
     ```
     This matches exactly `precomputed_baseline[:laps_on_old + len(new_times)]`.

   - Let's look at `new_times`:
     ```python
     new_compound = self.recommend_compound(p, total_laps, position, current_compound)
     laps_on_new = total_laps - p

     new_times = [
         self.lap_predictor.predict(i, track_temp, max(0.0, fuel_load - ((laps_on_old + i) * 1.55)), new_compound)
         for i in range(1, min(laps_on_new + 1, 15))
     ]
     ```
     This calculation depends on `new_compound` and `laps_on_old`. We can still compute it inside the loop, as it's limited to 15 laps (O(1) with respect to N).

5. **Let's propose this as the plan.**
