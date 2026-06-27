# {season} Round {round}: {race_name} — RAG Knowledge Document
# Coverage: {season} Season | Race Report & Telemetry Stats
# Format: Narrative (md) + Stat Blocks (json)
# Purpose: APEX RAG retrieval — post-race narrative, classification, and significant events

---

## 🏎️ RACE NARRATIVE
[Generate a detailed, journalist-style narrative of the race based on web search news and the provided telemetry data. Discuss who started where, who overtook who, any drama (crashes, safety cars, weather), and how the race was won. Focus on the strategic battle at the front and any notable midfield performances.]

---

## 🏁 FULL RACE CLASSIFICATION
[List the complete finishing order from P1 down to the last car. Include Driver Name, Team, and Status (Finished, +1 Lap, DNF). Format as a numbered list from 1 to 20.]

---

## 📊 SIGNIFICANT EVENTS & ANOMALIES
- **DNF / Retirements:** [List drivers who did not finish and the reason if found in the news. E.g. "Max Verstappen - Engine Failure (Lap 14)"]
- **Strategic Masterclasses:** [Mention any brilliant pit strategies like "Lando Norris undercut Charles Leclerc on Lap 22"]
- **Penalties:** [List any track limit penalties, collisions, etc.]

---

## 📈 CHAMPIONSHIP STANDINGS (TOP 5)
[Provide a quick snapshot of the updated top 5 in the drivers championship, if inferable or known.]

---

## ⚙️ RAW STAT BLOCKS

```json
{
  "race_data": {
    "season": "{season}",
    "round": "{round}",
    "race_name": "{race_name}",
    "winner": "[Winner Name]",
    "fastest_lap": "[Driver Name if known]",
    "total_dnfs": "[Count]"
  },
  "podium": [
    { "position": 1, "driver": "[P1 Name]", "team": "[P1 Team]" },
    { "position": 2, "driver": "[P2 Name]", "team": "[P2 Team]" },
    { "position": 3, "driver": "[P3 Name]", "team": "[P3 Team]" }
  ]
}
```
