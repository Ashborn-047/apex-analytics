# Audit Report: Remaining Models
**Findings & Gaps:**
- **dnf_risk.py:** `lap_1_drop` logic scales linearly for P15+ but not quite smoothly. The `train` method increments risk factors continuously over time without decay, meaning long-term simulations will see a grid of highly crash-prone drivers.
- **driver_form.py:** Hardcoded `form_indices`, `history`, `teammates`, and `get_mock_teammate_delta` dictionary arrays. Updating form with `update_form` removes old history correctly, but if a missing driver arrives, their history is uninitialized. The teammate mapping is pairwise and fragile.
- **race_outcome.py:** Contains an unused hardcoded list `driver_names`.
- **simulation.py:** Has hardcoded driver lists (`wdc_standings`, `wcc_standings`, `driver_teams`, etc.). It gracefully handles missing drivers in loops by defaulting to `"sauber"`, but could be cleaner.
- **weather.py:** `wet_weather_multipliers` and `driver_names` hardcoded. Rain probability is used as a linear proxy for surface moisture impact, which is rudimentary.

**Implemented Fixes:**
- Fixed a bug in `driver_form.py` where unknown drivers would cause a KeyError during `update_form`. Added dynamic dictionary initialization for them.
- All models function well enough in isolated scenarios, but the high reliance on hardcoded dicts across the board is a broader architectural limitation flagged for future iterations.
