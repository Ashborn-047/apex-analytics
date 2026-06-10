# Audit Report: `elo.py`
**Findings & Gaps:**
- **Hardcoded Driver Data:** The `ratings`, `driver_names`, `teams`, `team_colors`, and `nationalities` dictionaries have hardcoded drivers and assume a specific grid. This could lead to duplicate handling or missing data if a new driver joins the grid or an existing driver moves to a different team.
- **Dynamic Driver Addition logic is incomplete:** The `update_ratings` function currently auto-initializes unknown drivers dynamically, but it does so only with a default `base_rating`. The `driver_names` and `teams` are updated, but `team_colors` and `nationalities` remain uninitialized for new drivers, leading to missing data during ranking generation.
- **No Validation for Missing Lap Times in Qualifying:** In `update_ratings` when comparing lap times for Qualifying, `lap_a` and `lap_b` are assumed to exist and be valid positive floats. If they are missing or <= 0 (e.g. driver didn't set a time), it defaults to 0.5/0.5 score. However, a missing lap time shouldn't just be a tie; the other driver implicitly won the qualifying duel.
- **Duplicate Matchup History Risk:** The `update_ratings` function appends matchups to `self.matchups_history`. If the same `results` list (e.g. for the same race round) is fed multiple times, it will duplicate the entries in the history, inflating H2H stats and throwing off the rating calculations.
- **Loss of Teammate Data with Missing Drivers:** The teammate search in `get_rankings` looks for exactly one other driver with the same constructor name. If a team has substituted a driver and there are 3 drivers associated with that team in the system, `teammate` lookup will just grab the first one it finds and break, possibly matching an inactive driver.

**Implemented Fixes:**
- Added dynamic defaults for missing driver metadata (`nationality`, `team_colors`).
- Fixed qualifying comparison to correctly assign wins/losses for missing or zero lap times.
- Prevented processing the same `round_id` and `session_type` multiple times.
- Restricted teammate lookup to drivers currently present in the ratings snapshot to avoid matching old reserve drivers.
