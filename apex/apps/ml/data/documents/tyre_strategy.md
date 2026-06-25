# F1 Tyre Strategy — RAG Knowledge Document
# Coverage: 2005–2025 | Compounds, Degradation Models, Pit Stop Windows
# Format: Narrative (md) + Stat Blocks (json)
# Purpose: APEX RAG retrieval — Pirelli compounds C1-C5, undercut/overcut mechanics, wet weather tyres

---

## SECTION 1: THE PIRELLI TYRE RANGE

Pirelli has been the sole tyre supplier for Formula 1 since 2011. The current philosophy mandates tyres that degrade deliberately to force multi-stop strategies and mix up the racing.

There are five dry-weather slick compounds in the Pirelli range, numbered C1 to C5. For every Grand Prix, Pirelli selects three of these compounds to bring to the track.
They are branded by colour for the weekend:
*   **Soft (Red):** The softest of the three nominated compounds. Highest grip, fastest lap time, shortest lifespan.
*   **Medium (Yellow):** The middle compound. A balance of grip and durability.
*   **Hard (White):** The hardest of the three nominated compounds. Lowest grip, slowest lap time, longest lifespan.

### The Compounds

*   **C1:** The hardest compound in the entire range. Used only at tracks with extreme energy demands (e.g., Silverstone, Suzuka, Lusail). Very difficult to warm up, but highly durable against thermal degradation.
*   **C2:** A hard-leaning compound. Often used as the Hard tyre at medium-high severity tracks, or the Medium tyre at extreme tracks.
*   **C3:** The most versatile compound. Used at almost every race. Can act as the Hard at street circuits (Monaco), the Medium at standard circuits, or the Soft at extreme circuits.
*   **C4:** A soft-leaning compound. Requires careful thermal management to prevent overheating. Highly prone to "graining".
*   **C5:** The softest compound in the range. Used only at low-severity tracks with smooth asphalt (Monaco, Baku, Las Vegas). Offers massive single-lap qualifying grip but degrades very rapidly in race conditions.

```json
{
  "pirelli_dry_range": {
    "C1": {"hardness": "Hardest", "grip": "Lowest", "durability": "Maximum", "typical_tracks": ["Silverstone", "Suzuka"]},
    "C2": {"hardness": "Hard", "grip": "Low", "durability": "High", "typical_tracks": ["Barcelona", "Zandvoort"]},
    "C3": {"hardness": "Medium", "grip": "Medium", "durability": "Medium", "typical_tracks": ["Almost all (Highly versatile)"]},
    "C4": {"hardness": "Soft", "grip": "High", "durability": "Low", "typical_tracks": ["Imola", "Montreal"]},
    "C5": {"hardness": "Softest", "grip": "Maximum", "durability": "Minimum", "typical_tracks": ["Monaco", "Baku", "Las Vegas"]}
  },
  "weekend_allocation": {
    "total_dry_sets_per_driver": 13,
    "breakdown": {"soft": 8, "medium": 3, "hard": 2},
    "mandatory_race_rule": "Drivers must use at least two different slick compounds during a dry race."
  }
}
```

---

## SECTION 2: WET WEATHER TYRES

Pirelli provides two types of grooved tyres for rain conditions. The "two different compounds" rule is waived if a wet tyre is used during the race.

*   **Intermediate (Green):** For damp or drying tracks, or light rain. The tread pattern clears up to 30 litres of water per second at 300 km/h. They are prone to rapid overheating and degradation if the track dries out too much.
*   **Full Wet (Blue):** For heavy standing water. The deep tread clears up to 85 litres of water per second at 300 km/h. While they prevent aquaplaning better than Intermediates, they offer significantly less grip and are much slower. Drivers avoid them unless absolutely necessary for safety.

```json
{
  "wet_tyres": {
    "intermediate": {
      "colour": "Green",
      "conditions": "Damp, drying, light rain",
      "water_clearance_capacity": "30 L/s at 300km/h",
      "risk": "Overheats rapidly on dry lines"
    },
    "full_wet": {
      "colour": "Blue",
      "conditions": "Heavy standing water",
      "water_clearance_capacity": "85 L/s at 300km/h",
      "risk": "Slow lap times, low mechanical grip"
    }
  }
}
```

---

## SECTION 3: TYRE DEGRADATION MECHANICS

There are two primary ways F1 tyres lose performance:

1.  **Thermal Degradation (Overheating):**
    *   **Cause:** The core temperature of the tyre exceeds its optimal operating window (usually >120°C for Softs). Caused by heavy traction events, sliding, or running in the dirty air immediately behind another car.
    *   **Effect:** The rubber becomes too soft and loses structural integrity. The car begins to slide more, creating a negative feedback loop that generates even more heat.
    *   **Solution:** The driver must "manage" the tyre by lifting and coasting into braking zones and applying throttle smoothly to lower the bulk temperature.

2.  **Wear (Abrasion & Graining):**
    *   **Abrasion:** The physical wearing away of the rubber against rough track surfaces (like sandpaper). The tyre simply runs out of tread.
    *   **Graining:** Occurs when a tyre is cold and slides laterally across the asphalt. The rubber tears and sticks back onto the surface of the tyre, creating an uneven, bumpy texture. It drastically reduces grip.
    *   **Blistering:** Occurs when the core of the tyre is too hot, but the surface is cool. The rubber literally boils inside the tyre and erupts through the surface, leaving chunks missing.

```json
{
  "degradation_mechanisms": {
    "thermal": {
      "cause": "Excessive core temperature from sliding or high-speed cornering loads",
      "effect": "Loss of structural grip, negative feedback loop of sliding",
      "mitigation": "Lift and coast, smooth traction"
    },
    "graining": {
      "cause": "Cold tyre sliding laterally across track surface",
      "effect": "Torn rubber clumping on surface, severe loss of grip",
      "mitigation": "Wait for track to 'rubber in', improve tyre warm-up phase"
    },
    "blistering": {
      "cause": "Internal temperature too high relative to surface temperature",
      "effect": "Rubber boils and chunks erupt from surface",
      "mitigation": "Avoid excessive kerb riding or extreme thermal loads while tyre surface is cool"
    }
  }
}
```

---

## SECTION 4: STRATEGY MECHANICS (UNDERCUT VS OVERCUT)

Pit stop strategy defines modern Formula 1. The timing of a pit stop relative to a rival is the primary method of overtaking outside of on-track DRS passes.

### The Undercut

The most common and powerful strategic tool.
*   **The Concept:** The chasing car pits *first* for fresh tyres.
*   **The Execution:** The chasing car exits the pits on much faster fresh rubber. While the lead car completes its lap on old, worn tyres, the chasing car sets a massive "out-lap" time. When the lead car pits on the next lap, the time they lost on their in-lap against the chasing car's out-lap means they emerge behind the chasing car.
*   **When it works best:** High degradation tracks (where the pace delta between old and new tyres is large), and tracks where it is easy to warm up the new tyre immediately.

### The Overcut

The opposite of the undercut. Rare, but highly effective in specific scenarios.
*   **The Concept:** The chasing car stays out *longer* while the lead car pits first.
*   **The Execution:** The lead car pits but gets stuck in traffic, or struggles to get their new hard tyres up to temperature. The chasing car, running in clean air on worn but hot tyres, sets fast laps. When the chasing car eventually pits, they emerge ahead.
*   **When it works best:** Tracks with very low degradation (Monaco), tracks where tyre warm-up is exceptionally difficult, or when the pitting car will emerge into heavy traffic.

```json
{
  "strategic_mechanisms": {
    "undercut": {
      "action": "Chasing car pits FIRST",
      "mechanism": "Use fresh tyre pace advantage on out-lap to jump lead car in the pits",
      "ideal_conditions": ["High tyre degradation", "Easy tyre warm-up", "Clear air to emerge into"]
    },
    "overcut": {
      "action": "Chasing car pits LAST (stays out)",
      "mechanism": "Exploit lead car's slow warm-up or traffic to jump them while running long",
      "ideal_conditions": ["Low tyre degradation", "Difficult tyre warm-up", "Lead car drops into traffic"]
    }
  }
}
```

---

*Document End — tyre_strategy.md*
*RAG Library v1.0 | APEX F1 Analytical Platform*
*Coverage: 2005–2025 | Last Updated: 2025*
