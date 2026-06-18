# Audit Report: `lap_time.py`
**Findings & Gaps:**
- **Hardcoded Fallback Curves Limited to "Monza":** The fallback curves are heavily hardcoded to Monza base times (`80.8` for softs, etc). If a prediction is requested for another circuit, the base time will be completely inaccurate.
- **Missing Driver Profiles:** The `driver_profiles` dictionary contains only the 2024 grid. If a new driver is requested, they get a neutral profile `{pace_offset: 0.0, tyre_management: 1.0}`, which is fair, but relying on a hardcoded list means these values will decay in accuracy as seasons progress.
- **Hardcoded `air_temp_c` during prediction:** In the `predict` function when using the trained model, `air_temp_c` is hardcoded to `22.0`. Track temp is provided but air temp is ignored, which makes the ML model less sensitive to thermal variables.
- **Cliff Detection Edge Cases:** In `predict_full_curve`, it loops exactly 25 laps and detects a cliff. But if the `laps` in `simulate_stint` is higher than 25 (e.g. 40), the loop in `predict_full_curve` hard-caps at 25, meaning predictions beyond 25 laps are impossible, breaking the simulation loop.

**Implemented Fixes:**
- Extended `predict_full_curve` to accept a dynamic `max_laps` parameter so longer stints can be simulated.
- Added `air_temp` as a dynamic parameter instead of hardcoding `22.0`.
