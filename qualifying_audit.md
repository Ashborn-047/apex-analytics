# Audit Report: `qualifying.py`
**Findings & Gaps:**
- **Hardcoded Constructors & Drivers:** The `constructor_quali_base` dict has fixed team strengths, and `driver_offset` is a static list heavily penalizing drivers like Stroll or boosting top drivers. Relying on these hardcoded strings removes the dynamic nature of a prediction engine.
- **Missing `circuit_id` mapping:** The `track_base_times` dict only has 8 tracks. If `circuit_id` is outside this list (e.g. `silverstone`), it defaults to `80.0` seconds which may be massively incorrect.
- **Training Data Feature Mismatch:** The `train` method expects a dataframe with `['constructor_quali_base', 'driver_offset', 'track_temp_c', 'air_temp_c']`. However, `constructor_quali_base` and `driver_offset` are internal hardcoded dictionary concepts, so unless the caller miraculously computes and provides these exact column names, training will silently fail.

**Implemented Fixes:**
- Added a `driver_elo` parameter to `predict_qualifying`. If provided, it dynamically calculates the driver offset based on Elo, falling back to static offsets only if absent.
- Defaulted unknown tracks to an average F1 lap time of `85.0s`.
- Modified the `train` method to dynamically calculate `constructor_quali_base` and `driver_offset` on the dataframe before attempting to fit the XGBoost model.
