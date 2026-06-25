# F1 Sporting Regulations — RAG Knowledge Document
# Coverage: 2005–2025 | Current Rules + Historical Changes
# Format: Narrative (md) + Stat Blocks (json)
# Purpose: APEX RAG retrieval — points systems, safety cars, penalties, weekend formats

---

## SECTION 1: WEEKEND FORMATS

### Standard Weekend Format

The standard Formula 1 weekend consists of three days of track action:

*   **Friday:** Free Practice 1 (FP1) and Free Practice 2 (FP2), each lasting 60 minutes. Teams test setups, tyre degradation, and validate aerodynamic upgrades.
*   **Saturday:** Free Practice 3 (FP3) for 60 minutes, followed by Qualifying.
*   **Sunday:** The Grand Prix race.

### Sprint Weekend Format (2025 Rules)

Six weekends per year use the Sprint format, designed to increase competitive action. The schedule was modified in 2024 to its current logical flow:

*   **Friday:** Free Practice 1 (60 mins), followed by Sprint Qualifying (determining the grid for the Sprint race).
*   **Saturday:** The Sprint Race (100km, roughly one-third of a Grand Prix distance), followed by Grand Prix Qualifying (determining the grid for Sunday).
*   **Sunday:** The Grand Prix race.

Parc Fermé conditions (where major setup changes are banned) now open after the Sprint Race, allowing teams to adjust the car before Grand Prix Qualifying.

### Qualifying Format

Qualifying determines the starting grid and is split into three knockout sessions (Q1, Q2, Q3):

*   **Q1 (18 minutes):** All 20 cars participate. The bottom 5 are eliminated (positions 16-20).
*   **Q2 (15 minutes):** The remaining 15 cars participate. The bottom 5 are eliminated (positions 11-15).
*   **Q3 (12 minutes):** The top 10 cars battle for pole position.

```json
{
  "weekend_formats": {
    "standard": ["FP1", "FP2", "FP3", "Qualifying", "Grand Prix"],
    "sprint_2024_onwards": ["FP1", "Sprint Qualifying", "Sprint Race", "Grand Prix Qualifying", "Grand Prix"],
    "sprint_frequency": "6 races per season",
    "qualifying_knockout": {
      "Q1": {"duration_mins": 18, "cars": 20, "eliminated": 5},
      "Q2": {"duration_mins": 15, "cars": 15, "eliminated": 5},
      "Q3": {"duration_mins": 12, "cars": 10, "pole_decided": true}
    }
  }
}
```

---

## SECTION 2: POINTS SYSTEM

### Current Points System (Since 2010)

Points are awarded to the top 10 finishers in a Grand Prix. The system was introduced in 2010 to reward race victories more heavily.

1.  25 points
2.  18 points
3.  15 points
4.  12 points
5.  10 points
6.  8 points
7.  6 points
8.  4 points
9.  2 points
10. 1 point

**Fastest Lap Bonus (2019-2024):** 1 point awarded to the driver with the fastest lap, *provided* they finish in the top 10. *Note: This rule was abolished for 2025.*

### Sprint Race Points

Sprint races award points to the top 8 finishers:
1st (8pts), 2nd (7pts), 3rd (6pts), 4th (5pts), 5th (4pts), 6th (3pts), 7th (2pts), 8th (1pt).

### Historical Points Systems (For Reference)

*   **2003-2009:** Points awarded to top 8 (10, 8, 6, 5, 4, 3, 2, 1). This system heavily penalised DNFs and rewarded consistency over raw wins.
*   **1991-2002:** Points awarded to top 6 (10, 6, 4, 3, 2, 1).
*   **Pre-1991:** Points awarded to top 6 (9, 6, 4, 3, 2, 1), with only a driver's best 11 results counting toward the championship.

```json
{
  "points_systems": {
    "current_grand_prix": [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    "current_sprint": [8, 7, 6, 5, 4, 3, 2, 1],
    "fastest_lap_bonus": "Abolished for 2025 (was 1pt for top 10 finisher 2019-2024)",
    "historical_2003_2009": [10, 8, 6, 5, 4, 3, 2, 1],
    "historical_1991_2002": [10, 6, 4, 3, 2, 1]
  }
}
```

---

## SECTION 3: SAFETY CARS AND RACE NEUTRALISATION

### Full Safety Car (SC)

Deployed when there is a significant hazard on track (stranded car, heavy debris, extreme weather). All cars must gather behind the physical Safety Car at a reduced speed.
*   Overtaking is strictly prohibited.
*   Lapped cars are usually allowed to unlap themselves before the restart (rule clarified heavily after Abu Dhabi 2021).
*   The race restarts with a rolling start when the Safety Car pits.

### Virtual Safety Car (VSC)

Introduced in 2015 following Jules Bianchi's fatal accident. Used for lesser hazards where a full SC isn't required.
*   Drivers are given a "delta time" on their steering wheel display which they must not exceed (effectively reducing speed by ~30%).
*   Gaps between cars are maintained.
*   Pit stops under a VSC cost significantly less relative time than normal racing conditions, making it a crucial strategic element.

### Red Flag

The race is stopped due to extreme danger (huge crash, impassable track, torrential rain).
*   All cars return to the pit lane.
*   **Crucial Rule:** Teams are allowed to change tyres and repair minor damage under a Red Flag. This effectively grants a "free pit stop" and entirely resets strategy.
*   Restarts are usually standing starts from the grid.

```json
{
  "race_neutralisation": {
    "safety_car": {
      "trigger": "Significant track hazard",
      "effect": "Bunches up pack, erases gaps",
      "restart": "Rolling start"
    },
    "virtual_safety_car": {
      "trigger": "Minor hazard, localized debris",
      "effect": "Maintains gaps, speed reduced by delta time",
      "strategic_impact": "Cheap pit stop (loses less relative time)"
    },
    "red_flag": {
      "trigger": "Extreme hazard, impassable track",
      "effect": "Race stopped, cars to pit lane",
      "strategic_impact": "Free tyre changes allowed, standing restart"
    }
  }
}
```

---

## SECTION 4: PENALTIES AND STEWARDING

Race Stewards have a variety of penalties they can apply during or after a race for infractions (causing a collision, track limits, speeding in pit lane).

### In-Race Penalties

*   **5-Second Time Penalty:** The most common penalty. Added to the driver's pit stop (mechanics cannot touch the car for 5s) or added to their final race time if they do not pit again.
*   **10-Second Time Penalty:** For more severe infractions.
*   **Drive-Through Penalty:** The driver must drive through the pit lane at the speed limit without stopping. (Rarely used in the modern era, replaced by time penalties).
*   **Stop-and-Go Penalty (10 Seconds):** The driver must enter the pits, stop for 10 seconds (no work allowed), and rejoin. Severely punishing.

### Post-Race Penalties

*   **Grid Drops:** If an infraction occurs in practice/qualifying, or if a driver causes a collision but retires, they are handed a grid penalty (e.g., 3-place, 5-place) for the next race.
*   **Disqualification (DSQ):** Usually for technical infringements (car underweight, plank wear too high).

### Penalty Points

Drivers accumulate penalty points on their Super Licence for dangerous driving.
*   If a driver accumulates 12 points in a rolling 12-month period, they receive an automatic one-race ban.
*   Kevin Magnussen triggered this ban in 2024.

```json
{
  "penalties": {
    "standard_time_penalties": [5, 10],
    "severe_in_race": ["Drive-through", "10-second Stop-and-Go"],
    "super_licence_points": {
      "ban_threshold": 12,
      "rolling_period_months": 12,
      "recent_bans": ["Kevin Magnussen (2024)"]
    },
    "common_infractions": ["Track limits (4 strikes = 5s penalty)", "Causing a collision", "Speeding in pit lane"]
  }
}
```

---

*Document End — sporting_regulations.md*
*RAG Library v1.0 | APEX F1 Analytical Platform*
*Coverage: 2005–2025 | Last Updated: 2025*
