# F1 Historical Pace Stats — RAG Knowledge Document
# Coverage: 2005–2025 | Pit Stop Benchmarks, Lap Records, Speed Traps
# Format: Narrative (md) + Stat Blocks (json)
# Purpose: APEX RAG retrieval — quantitative historical benchmarks for ML training and analytical comparison

---

## SECTION 1: PIT STOP BENCHMARKS

The modern F1 pit stop involves changing all four tyres. Refuelling was banned at the end of the 2009 season. Prior to 2010, pit stops took between 6 and 12 seconds depending on the fuel load required.

Since 2010, the art of the sub-3-second pit stop has been perfected. A crew of around 20 mechanics coordinates to lift the car, remove four wheel nuts, swap four 18kg+ wheel/tyre assemblies, attach four new wheel nuts, and drop the car.

Red Bull Racing and McLaren have historically been the benchmark teams for pit stop speed.

### Milestone Records

*   **1.80 seconds:** McLaren (Lando Norris), Qatar GP 2023. The current world record.
*   **1.82 seconds:** Red Bull Racing (Max Verstappen), Brazilian GP 2019. The previous world record, held for four years.
*   **1.88 seconds:** Red Bull Racing (Max Verstappen), German GP 2019.

### Average Benchmarks (2025 Standard)

*   **Elite Stop:** < 2.2 seconds
*   **Average Stop:** 2.4 - 2.8 seconds
*   **Slow Stop (No errors, just slow):** 3.0 - 3.5 seconds
*   **Error Stop (Wheel nut issue, front jack drop):** 4.5+ seconds

```json
{
  "pit_stop_benchmarks": {
    "world_record": {"time_seconds": 1.80, "team": "McLaren", "driver": "Lando Norris", "year": 2023, "event": "Qatar GP"},
    "historical_world_record": {"time_seconds": 1.82, "team": "Red Bull", "driver": "Max Verstappen", "year": 2019, "event": "Brazil GP"},
    "refuelling_era_average": "6.0 - 12.0 seconds (Pre-2010)",
    "modern_era_benchmarks": {
      "elite": "< 2.2s",
      "average": "2.4s - 2.8s",
      "slow": "> 3.0s"
    }
  }
}
```

---

## SECTION 2: SPEED TRAP RECORDS

Formula 1 cars are designed for downforce, not pure top speed. However, at circuits like Monza and Baku, drag is stripped away, allowing cars to reach extreme velocities.

*   **Official F1 Race Session Record:** 372.5 km/h (231.4 mph) by Valtteri Bottas (Williams-Mercedes) at the 2016 Mexican Grand Prix. The high altitude (thin air) allowed for this extreme top speed despite running high downforce wings.
*   **Official F1 Qualifying Record:** 378.9 km/h (235.4 mph) by Valtteri Bottas (Williams-Mercedes) during qualifying for the 2016 European Grand Prix at Baku. He benefitted from a massive slipstream on the 2.2km main straight.
*   **Highest Average Speed Lap:** 264.362 km/h (164.267 mph) by Lewis Hamilton (Mercedes) during qualifying for the 2020 Italian Grand Prix at Monza. This is the fastest lap in F1 history in terms of average speed.

```json
{
  "speed_trap_records": {
    "highest_race_speed": {
      "speed_kmh": 372.5,
      "driver": "Valtteri Bottas",
      "team": "Williams",
      "event": "2016 Mexican GP",
      "note": "Achieved due to thin air at high altitude"
    },
    "highest_qualifying_speed": {
      "speed_kmh": 378.9,
      "driver": "Valtteri Bottas",
      "team": "Williams",
      "event": "2016 European GP (Baku)",
      "note": "Achieved via massive slipstream on 2.2km straight"
    },
    "highest_average_lap_speed": {
      "speed_kmh": 264.362,
      "driver": "Lewis Hamilton",
      "team": "Mercedes",
      "event": "2020 Italian GP (Monza)",
      "session": "Qualifying (Q3)"
    }
  }
}
```

---

## SECTION 3: FASTEST LAPS AND LAP RECORDS

A lap record in Formula 1 only counts if it is set during the *race itself*. Qualifying laps, which are always faster due to lower fuel weight and softer tyres, are classified separately as "Fastest Laps".

The 2004 season (V10 era) and the 2018–2020 seasons (V6 Hybrid era with high downforce) hold the majority of lap records across the calendar.

*   **Most Career Fastest Laps:** Michael Schumacher (77)
*   **Second Most Career Fastest Laps:** Lewis Hamilton (67 - active)

### Key Circuit Lap Records (Race Condition)

```json
{
  "lap_records": {
    "Monza": {"time": "1:21.046", "driver": "Rubens Barrichello", "team": "Ferrari", "year": 2004},
    "Silverstone": {"time": "1:27.097", "driver": "Max Verstappen", "team": "Red Bull", "year": 2020},
    "Spa_Francorchamps": {"time": "1:46.286", "driver": "Valtteri Bottas", "team": "Mercedes", "year": 2018},
    "Monaco": {"time": "1:12.909", "driver": "Lewis Hamilton", "team": "Mercedes", "year": 2021},
    "Suzuka": {"time": "1:30.983", "driver": "Lewis Hamilton", "team": "Mercedes", "year": 2019},
    "Interlagos": {"time": "1:10.540", "driver": "Valtteri Bottas", "team": "Mercedes", "year": 2018}
  },
  "all_time_fastest_laps_list": {
    "1": {"driver": "Michael Schumacher", "count": 77},
    "2": {"driver": "Lewis Hamilton", "count": 67},
    "3": {"driver": "Kimi Raikkonen", "count": 46},
    "4": {"driver": "Alain Prost", "count": 41},
    "5": {"driver": "Sebastian Vettel", "count": 38}
  }
}
```

---

## SECTION 4: HISTORICAL DOMINANCE METRICS

To train predictive models, it is vital to quantify what "dominance" looks like in a historical context. The win percentage in a single season is the standard metric.

1.  **Max Verstappen (2023):** 86.36% (19 wins from 22 races) — The RB19
2.  **Alberto Ascari (1952):** 75.00% (6 wins from 8 races) — The Ferrari 500
3.  **Michael Schumacher (2004):** 72.22% (13 wins from 18 races) — The Ferrari F2004
4.  **Jim Clark (1963):** 70.00% (7 wins from 10 races) — The Lotus 25
5.  **Sebastian Vettel (2013):** 68.42% (13 wins from 19 races) — The Red Bull RB9
6.  **Max Verstappen (2022):** 68.18% (15 wins from 22 races) — The Red Bull RB18
7.  **Lewis Hamilton (2020):** 64.70% (11 wins from 17 races) — The Mercedes W11

```json
{
  "season_dominance_benchmarks": [
    {"driver": "Max Verstappen", "year": 2023, "win_percentage": 86.36, "wins": 19, "races": 22},
    {"driver": "Alberto Ascari", "year": 1952, "win_percentage": 75.0, "wins": 6, "races": 8},
    {"driver": "Michael Schumacher", "year": 2004, "win_percentage": 72.22, "wins": 13, "races": 18},
    {"driver": "Jim Clark", "year": 1963, "win_percentage": 70.0, "wins": 7, "races": 10},
    {"driver": "Sebastian Vettel", "year": 2013, "win_percentage": 68.42, "wins": 13, "races": 19},
    {"driver": "Max Verstappen", "year": 2022, "win_percentage": 68.18, "wins": 15, "races": 22},
    {"driver": "Lewis Hamilton", "year": 2020, "win_percentage": 64.7, "wins": 11, "races": 17}
  ]
}
```

---

*Document End — historical_pace_stats.md*
*RAG Library v1.0 | APEX F1 Analytical Platform*
*Coverage: 2005–2025 | Last Updated: 2025*
