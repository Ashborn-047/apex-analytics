# F1 Constructor Profiles — RAG Knowledge Document
# Coverage: 2005–2025 | All Current Teams + Historical Constructors
# Format: Narrative (md) + Stat Blocks (json)
# Purpose: APEX RAG retrieval — team identity, championship history, aero/PU profiles, season performance

---

## SECTION 1: CURRENT GRID CONSTRUCTORS (2025 Season)

---

### ORACLE RED BULL RACING

**Full Name:** Oracle Red Bull Racing
**Base:** Milton Keynes, United Kingdom
**Team Principal:** Christian Horner
**Technical Director:** Pierre Waché (post-Newey era)
**Power Unit (2025):** Honda RBPT (Red Bull Powertrains)
**First F1 Season:** 2005 (as Red Bull Racing, formerly Jaguar Racing)
**Constructors' Championships:** 6 (2010, 2011, 2012, 2013, 2022, 2023)
**Drivers' Championships:** 8 (Vettel 2010–2013, Verstappen 2021–2024)

Red Bull Racing entered Formula 1 in 2005 after Dietrich Mateschitz purchased the struggling Jaguar Racing team. Under the design genius of Adrian Newey — who joined in 2006 — Red Bull evolved from a midfield team to the most dominant force of the early 2010s. The RB7 (2011) and RB9 (2013) are considered among the finest F1 cars ever built.

After a competitive decline during the early V6 Hybrid era (2014–2018) when Mercedes dominated, Red Bull's partnership with Honda from 2019 onwards rekindled their championship aspirations. The RB16B won Verstappen his controversial first title in 2021, and the RB18 (2022) and RB19 (2023) delivered back-to-back dominant constructor and driver championships. The RB19 is widely regarded as the most dominant F1 car ever built — winning 21 of 22 races in 2023.

Adrian Newey's departure in 2024 raised questions about long-term aerodynamic direction, though the team retained their engineering depth under Pierre Waché. In 2025, the team runs Verstappen and Tsunoda.

Red Bull's aerodynamic philosophy centres on maximising downforce through underfloor aerodynamics while maintaining low drag on straights — a philosophy perfected by Newey's exhaust-blown diffuser concepts (2010–2013) and ground effect optimisation (2022+).

```json
{
  "constructor": "Red Bull Racing",
  "base": "Milton Keynes, UK",
  "team_principal": "Christian Horner",
  "power_unit_2025": "Honda RBPT",
  "first_season": 2005,
  "constructors_championships": [2010, 2011, 2012, 2013, 2022, 2023],
  "constructors_championship_count": 6,
  "drivers_championships_supported": [
    {"driver": "Sebastian Vettel", "years": [2010, 2011, 2012, 2013]},
    {"driver": "Max Verstappen", "years": [2021, 2022, 2023, 2024]}
  ],
  "career_wins_to_2025": 120,
  "career_poles_to_2025": 103,
  "season_results": {
    "2005": {"position": 7, "points": 34, "wins": 0},
    "2006": {"position": 7, "points": 16, "wins": 0},
    "2007": {"position": 5, "points": 24, "wins": 0},
    "2008": {"position": 7, "points": 29, "wins": 0},
    "2009": {"position": 2, "points": 153, "wins": 6},
    "2010": {"position": 1, "points": 498, "wins": 9},
    "2011": {"position": 1, "points": 650, "wins": 12},
    "2012": {"position": 1, "points": 460, "wins": 7},
    "2013": {"position": 1, "points": 596, "wins": 13},
    "2014": {"position": 2, "points": 405, "wins": 3},
    "2015": {"position": 4, "points": 187, "wins": 0},
    "2016": {"position": 2, "points": 468, "wins": 2},
    "2017": {"position": 3, "points": 368, "wins": 3},
    "2018": {"position": 3, "points": 419, "wins": 4},
    "2019": {"position": 3, "points": 417, "wins": 3},
    "2020": {"position": 2, "points": 319, "wins": 2},
    "2021": {"position": 2, "points": 585, "wins": 11},
    "2022": {"position": 1, "points": 759, "wins": 17},
    "2023": {"position": 1, "points": 860, "wins": 21},
    "2024": {"position": 3, "points": 581, "wins": 9}
  },
  "aerodynamic_profile": {
    "philosophy": "Maximum underfloor downforce, low-drag rear wing philosophy",
    "signature_innovations": ["Exhaust-blown diffuser (2010-2013)", "Coanda exhaust (2012)", "Ground effect floor optimisation (2022+)"],
    "circuit_affinity": {
      "high_speed_low_downforce": "Strong — Monza, Spa historically competitive",
      "street_circuits": "Moderate — improved 2022 onwards",
      "high_downforce": "Elite — Monaco, Hungary, Singapore"
    }
  }
}
```

---

### SCUDERIA FERRARI

**Full Name:** Scuderia Ferrari HP
**Base:** Maranello, Italy
**Team Principal:** Frédéric Vasseur (from 2023)
**Power Unit:** Ferrari
**First F1 Season:** 1950 (founding member of the World Championship)
**Constructors' Championships:** 16 (1961, 1964, 1975, 1976, 1977, 1979, 1982, 1983, 1999, 2000, 2001, 2002, 2003, 2004, 2007, 2008)
**Drivers' Championships:** 15

Ferrari is the most iconic and storied team in Formula 1 history. They are the only constructor to have competed in every single season since the World Championship began in 1950. The Prancing Horse is synonymous with passion, Italian engineering, and a relentless pursuit of the championship — even when results have not always matched ambition.

The Michael Schumacher era (2000–2004) represents Ferrari's golden age — five consecutive constructors' titles and five drivers' titles. The partnership between Schumacher, technical director Ross Brawn, designer Rory Byrne, and team principal Jean Todt created the most dominant team in F1 history up to that point.

Post-Schumacher, Ferrari won the 2007 constructors' title with Räikkönen and the 2008 constructors' title, but have not won a constructors' championship since. The 2017 and 2018 seasons under Vettel came closest, but critical strategic and reliability failures cost them both years. The 2022 season with Leclerc saw Ferrari have the fastest car early in the year before reliability catastrophes and strategic errors handed the championship to Red Bull.

In 2025, Ferrari fields the blockbuster pairing of Lewis Hamilton and Charles Leclerc — the most scrutinised driver lineup in modern F1.

```json
{
  "constructor": "Scuderia Ferrari",
  "base": "Maranello, Italy",
  "team_principal": "Frederic Vasseur",
  "power_unit_2025": "Ferrari",
  "first_season": 1950,
  "constructors_championships": [1961, 1964, 1975, 1976, 1977, 1979, 1982, 1983, 1999, 2000, 2001, 2002, 2003, 2004, 2007, 2008],
  "constructors_championship_count": 16,
  "drivers_championships_supported": [
    {"driver": "Alberto Ascari", "years": [1952, 1953]},
    {"driver": "Juan Manuel Fangio", "years": [1956]},
    {"driver": "Mike Hawthorn", "years": [1958]},
    {"driver": "Phil Hill", "years": [1961]},
    {"driver": "John Surtees", "years": [1964]},
    {"driver": "Niki Lauda", "years": [1975, 1977]},
    {"driver": "Jody Scheckter", "years": [1979]},
    {"driver": "Michael Schumacher", "years": [2000, 2001, 2002, 2003, 2004]},
    {"driver": "Kimi Raikkonen", "years": [2007]}
  ],
  "career_race_wins_to_2025": 245,
  "career_poles_to_2025": 248,
  "season_results": {
    "2005": {"position": 3, "points": 100, "wins": 1},
    "2006": {"position": 2, "points": 201, "wins": 9},
    "2007": {"position": 1, "points": 204, "wins": 9},
    "2008": {"position": 1, "points": 172, "wins": 8},
    "2009": {"position": 4, "points": 70, "wins": 0},
    "2010": {"position": 3, "points": 396, "wins": 5},
    "2011": {"position": 3, "points": 375, "wins": 1},
    "2012": {"position": 2, "points": 400, "wins": 3},
    "2013": {"position": 3, "points": 354, "wins": 2},
    "2014": {"position": 4, "points": 216, "wins": 0},
    "2015": {"position": 2, "points": 428, "wins": 3},
    "2016": {"position": 3, "points": 398, "wins": 0},
    "2017": {"position": 2, "points": 522, "wins": 5},
    "2018": {"position": 2, "points": 571, "wins": 6},
    "2019": {"position": 2, "points": 504, "wins": 3},
    "2020": {"position": 6, "points": 131, "wins": 0},
    "2021": {"position": 3, "points": 323, "wins": 0},
    "2022": {"position": 2, "points": 554, "wins": 4},
    "2023": {"position": 4, "points": 406, "wins": 1},
    "2024": {"position": 2, "points": 652, "wins": 5}
  },
  "aerodynamic_profile": {
    "philosophy": "High downforce bias, aggressive sidepod design, integrated PU cooling",
    "circuit_affinity": {
      "high_speed": "Strong — power unit advantage at Monza, Spa",
      "street_circuits": "Strong — traditionally competitive Monaco, Singapore, Baku",
      "high_downforce": "Elite historically, variable 2019-2023"
    }
  },
  "power_unit_profile": {
    "architecture": "Ferrari V6 Turbo-Hybrid",
    "notable_eras": {
      "V10_2000_2005": "Most powerful naturally aspirated engines — dominant with Schumacher",
      "V8_2006_2013": "Competitive but not dominant — Renault and Mercedes often ahead",
      "V6_hybrid_2014_present": "Initially weak, improved 2017+. 2019 performance questioned after FIA settlement. 2022+ competitive again"
    }
  }
}
```

---

### McLAREN FORMULA 1 TEAM

**Full Name:** McLaren Formula 1 Team
**Base:** Woking, Surrey, United Kingdom (McLaren Technology Centre)
**Team Principal:** Andrea Stella (from 2023)
**Power Unit (2025):** Mercedes
**First F1 Season:** 1966
**Constructors' Championships:** 8 (1974, 1984, 1985, 1988, 1989, 1990, 1991, 1998)
**Drivers' Championships:** 12

McLaren is the second-most successful constructor in F1 history by race wins. Founded by New Zealander Bruce McLaren in 1966, the team has produced some of the sport's most iconic cars — the MP4/4 (1988, winning 15 of 16 races with Senna and Prost), the MP4-13 (1998 title-winning Häkkinen car), and the MCL38 (2024, the fastest car on the grid by the second half of the season).

McLaren's 2015–2018 Honda partnership was catastrophic — producing three consecutive seasons at the back of the grid with an unreliable and underpowered power unit. The switch to Renault (2018) and then Mercedes (2021+) power units stabilised the team. Under Zak Brown's leadership and Andrea Stella's technical direction, McLaren executed one of the most impressive rebuilds in modern F1 — going from last in 2018 to genuine championship contenders by 2024.

In 2024, McLaren had the fastest car from mid-season onwards. Norris won 4 races and Piastri won 3, but the constructor championship was lost to Red Bull due to the early-season gap. In 2025, McLaren enter as genuine championship favourites.

```json
{
  "constructor": "McLaren",
  "base": "Woking, UK",
  "team_principal": "Andrea Stella",
  "power_unit_2025": "Mercedes",
  "first_season": 1966,
  "constructors_championships": [1974, 1984, 1985, 1988, 1989, 1990, 1991, 1998],
  "constructors_championship_count": 8,
  "drivers_championships_supported": [
    {"driver": "Emerson Fittipaldi", "years": [1974]},
    {"driver": "James Hunt", "years": [1976]},
    {"driver": "Niki Lauda", "years": [1984]},
    {"driver": "Alain Prost", "years": [1985, 1989]},
    {"driver": "Ayrton Senna", "years": [1988, 1990, 1991]},
    {"driver": "Mika Hakkinen", "years": [1998, 1999]},
    {"driver": "Lewis Hamilton", "years": [2008]}
  ],
  "career_race_wins_to_2025": 188,
  "season_results": {
    "2005": {"position": 2, "points": 182, "wins": 10},
    "2006": {"position": 3, "points": 110, "wins": 0},
    "2007": {"position": 2, "points": 203, "wins": 8, "note": "Stripped of constructor points due to spy scandal"},
    "2008": {"position": 2, "points": 151, "wins": 6},
    "2009": {"position": 3, "points": 71, "wins": 2},
    "2010": {"position": 2, "points": 454, "wins": 5},
    "2011": {"position": 2, "points": 497, "wins": 6},
    "2012": {"position": 3, "points": 378, "wins": 7},
    "2013": {"position": 5, "points": 122, "wins": 0},
    "2014": {"position": 5, "points": 181, "wins": 0},
    "2015": {"position": 9, "points": 27, "wins": 0, "note": "Honda partnership — worst McLaren era"},
    "2016": {"position": 6, "points": 76, "wins": 0},
    "2017": {"position": 9, "points": 30, "wins": 0},
    "2018": {"position": 6, "points": 62, "wins": 0},
    "2019": {"position": 4, "points": 145, "wins": 0},
    "2020": {"position": 3, "points": 202, "wins": 0},
    "2021": {"position": 4, "points": 275, "wins": 1},
    "2022": {"position": 5, "points": 159, "wins": 0},
    "2023": {"position": 4, "points": 302, "wins": 1},
    "2024": {"position": 1, "points": 666, "wins": 7}
  },
  "aerodynamic_profile": {
    "philosophy": "Balanced downforce/drag ratio, efficient cooling, medium-speed corner optimisation",
    "signature_innovations": ["Carbon fibre monocoque pioneer (MP4/1, 1981)", "Zero-sidepod concept exploration (2023)", "Underfloor sealing optimisation (2024)"]
  }
}
```

---

### MERCEDES-AMG PETRONAS FORMULA ONE TEAM

**Full Name:** Mercedes-AMG Petronas Formula One Team
**Base:** Brackley (chassis), Brixworth (engine), United Kingdom
**Team Principal:** Toto Wolff
**Power Unit:** Mercedes
**First F1 Season as Works Team:** 2010 (purchased Brawn GP)
**Constructors' Championships:** 8 (2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021)
**Drivers' Championships:** 7 (Hamilton 2014–2020, plus 1 denied by Abu Dhabi 2021 controversy)

Mercedes' modern F1 era began in 2010 when Daimler purchased the Brawn GP team that had won the 2009 championships. After three seasons of development (2010–2013), the team exploited the 2014 V6 Turbo-Hybrid regulation change to devastating effect — winning eight consecutive constructors' championships from 2014 to 2021, the longest winning streak in F1 history.

The Mercedes W11 (2020) is widely considered the greatest F1 car ever built — winning 13 of 17 races in a COVID-shortened season with Hamilton and Bottas. The team's dominance during the V6 era was built on three pillars: the most powerful and efficient power unit on the grid, James Allison's aerodynamic leadership, and Hamilton's extraordinary driving.

The 2022 ground-effect regulations hurt Mercedes significantly — the W13 suffered from extreme porpoising and bouncing issues that made it uncompetitive for the first half of the season. Recovery in 2023 and 2024 was steady but incomplete. In 2025, with Hamilton departed to Ferrari, Mercedes runs George Russell as team leader alongside Kimi Antonelli.

```json
{
  "constructor": "Mercedes-AMG Petronas",
  "base": "Brackley (chassis), Brixworth (PU), UK",
  "team_principal": "Toto Wolff",
  "power_unit_2025": "Mercedes",
  "first_season_works": 2010,
  "constructors_championships": [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
  "constructors_championship_count": 8,
  "drivers_championships_supported": [
    {"driver": "Lewis Hamilton", "years": [2014, 2015, 2017, 2018, 2019, 2020]},
    {"driver": "Nico Rosberg", "years": [2016]}
  ],
  "season_results": {
    "2010": {"position": 4, "points": 214, "wins": 0},
    "2011": {"position": 4, "points": 165, "wins": 0},
    "2012": {"position": 5, "points": 142, "wins": 1},
    "2013": {"position": 2, "points": 360, "wins": 3},
    "2014": {"position": 1, "points": 701, "wins": 16},
    "2015": {"position": 1, "points": 703, "wins": 16},
    "2016": {"position": 1, "points": 765, "wins": 19},
    "2017": {"position": 1, "points": 668, "wins": 12},
    "2018": {"position": 1, "points": 655, "wins": 11},
    "2019": {"position": 1, "points": 739, "wins": 15},
    "2020": {"position": 1, "points": 573, "wins": 13},
    "2021": {"position": 1, "points": 613, "wins": 9},
    "2022": {"position": 3, "points": 515, "wins": 1},
    "2023": {"position": 2, "points": 409, "wins": 1},
    "2024": {"position": 4, "points": 468, "wins": 3}
  },
  "power_unit_profile": {
    "V6_hybrid_dominance": "2014-2021 — most powerful and thermally efficient PU on the grid",
    "split_turbo_innovation": "Separated compressor and turbine to opposite ends of the V6 — reduced turbo lag, improved packaging",
    "customer_teams_2025": ["McLaren", "Williams", "Aston Martin"]
  },
  "aerodynamic_profile": {
    "philosophy": "Low-drag efficiency, narrow sidepod packaging, aggressive rear end solutions",
    "2022_issue": "Porpoising — ground effect floor bouncing caused severe performance loss",
    "recovery": "2023-2024 progressive improvement, floor stiffness redesign"
  }
}
```

---

### ASTON MARTIN ARAMCO FORMULA ONE TEAM

**Full Name:** Aston Martin Aramco Formula One Team
**Base:** Silverstone, United Kingdom
**Team Principal / Owner:** Lawrence Stroll
**Technical Director:** Adrian Newey (from 2025)
**Power Unit (2025):** Mercedes (transitioning to Honda from 2026)
**Constructors' Championships:** 0
**Previous Identities:** Jordan (1991–2004), Midland (2006), Spyker (2007), Force India (2008–2018), Racing Point (2019–2020)

Aston Martin represents one of F1's most ambitious investment projects. Lawrence Stroll purchased the Force India team out of administration in 2018, rebranded it as Racing Point, then as Aston Martin from 2021. The team has invested over £200 million in a brand-new factory at Silverstone and hired Adrian Newey — the most successful aerodynamicist in F1 history — for 2025.

In 2023, the AMR23 was the third-fastest car early in the season, with Alonso scoring 8 podiums. Performance fell away in the second half as Red Bull, McLaren, and Ferrari developed faster. 2024 was a rebuilding year. 2025 and beyond is positioned as the team's breakout era with Newey's influence expected to reshape their aerodynamic philosophy.

```json
{
  "constructor": "Aston Martin",
  "base": "Silverstone, UK",
  "owner": "Lawrence Stroll",
  "power_unit_2025": "Mercedes",
  "power_unit_2026": "Honda",
  "previous_identities": ["Jordan (1991-2004)", "Midland (2006)", "Spyker (2007)", "Force India (2008-2018)", "Racing Point (2019-2020)"],
  "constructors_championships": 0,
  "notable_results": {
    "2009_Force_India": "Fisichella P2 at Spa — first Force India podium",
    "2020_Racing_Point": "Stroll pole position Turkey GP, Perez victory Sakhir GP",
    "2023_Aston_Martin": "Alonso 8 podiums, 4th in constructors"
  },
  "season_results": {
    "2021": {"position": 7, "points": 77, "wins": 0},
    "2022": {"position": 7, "points": 55, "wins": 0},
    "2023": {"position": 5, "points": 280, "wins": 0},
    "2024": {"position": 5, "points": 94, "wins": 0}
  },
  "key_signing": "Adrian Newey — joined 2025, expected full design influence from 2026 regulations"
}
```

---

### ALPINE F1 TEAM

**Full Name:** Alpine F1 Team (BWT Alpine F1 Team)
**Base:** Enstone (chassis), Viry-Châtillon (engine), United Kingdom / France
**Power Unit (2025):** Renault
**Previous Identities:** Toleman (1981–1985), Benetton (1986–2001), Renault (2002–2011), Lotus F1 (2012–2015), Renault (2016–2020), Alpine (2021+)
**Constructors' Championships:** 2 as Renault (2005, 2006)

The Enstone factory has one of the richest histories in F1 — producing championship-winning cars under both the Benetton and Renault banners. Schumacher won his first two titles here (1994, 1995) and Alonso won both of his (2005, 2006). The team rebranded to Alpine in 2021 as part of Renault's broader sportscar strategy.

Recent performance has been inconsistent. The team scored a surprise victory at the 2021 Hungarian GP with Ocon but has generally been a lower-midfield team since. For 2025, there are ongoing discussions about potentially switching to a customer Mercedes power unit from 2026, which would end the Renault-Enstone PU partnership.

```json
{
  "constructor": "Alpine",
  "base": "Enstone, UK (chassis) / Viry-Chatillon, France (PU)",
  "power_unit_2025": "Renault",
  "previous_identities": ["Toleman", "Benetton", "Renault", "Lotus F1", "Alpine"],
  "constructors_championships_as_renault": [2005, 2006],
  "drivers_championships_enstone": [
    {"driver": "Michael Schumacher", "years": [1994, 1995], "as": "Benetton"},
    {"driver": "Fernando Alonso", "years": [2005, 2006], "as": "Renault"}
  ],
  "season_results": {
    "2005": {"position": 1, "points": 191, "wins": 8, "as": "Renault"},
    "2006": {"position": 1, "points": 206, "wins": 8, "as": "Renault"},
    "2021": {"position": 5, "points": 155, "wins": 1},
    "2022": {"position": 4, "points": 173, "wins": 0},
    "2023": {"position": 6, "points": 120, "wins": 0},
    "2024": {"position": 6, "points": 65, "wins": 0}
  }
}
```

---

### WILLIAMS RACING

**Full Name:** Williams Racing
**Base:** Grove, Oxfordshire, United Kingdom
**Team Principal:** James Vowles (from 2023, ex-Mercedes chief strategist)
**Power Unit (2025):** Mercedes
**Constructors' Championships:** 9 (1980, 1981, 1986, 1987, 1992, 1993, 1994, 1996, 1997)
**Drivers' Championships:** 7

Williams is one of the most legendary constructors in F1 history. Founded by Sir Frank Williams and Patrick Head in 1977, the team won 9 constructors' championships — the third-highest in history. The FW14B (1992, Mansell) and FW15C (1993, Prost) are among the most technologically advanced F1 cars ever produced, featuring active suspension, traction control, and ABS before they were banned.

Williams' decline from the mid-2000s onwards was painful — the team went from regular championship contenders to backmarkers. The Dorilton Capital purchase in 2020 and the hiring of James Vowles from Mercedes in 2023 have initiated a multi-year rebuild. Carlos Sainz joining in 2025 represents a significant statement of intent.

```json
{
  "constructor": "Williams Racing",
  "base": "Grove, UK",
  "team_principal": "James Vowles",
  "power_unit_2025": "Mercedes",
  "constructors_championships": [1980, 1981, 1986, 1987, 1992, 1993, 1994, 1996, 1997],
  "constructors_championship_count": 9,
  "drivers_championships_supported": [
    {"driver": "Alan Jones", "years": [1980]},
    {"driver": "Keke Rosberg", "years": [1982]},
    {"driver": "Nelson Piquet", "years": [1987]},
    {"driver": "Nigel Mansell", "years": [1992]},
    {"driver": "Alain Prost", "years": [1993]},
    {"driver": "Damon Hill", "years": [1996]},
    {"driver": "Jacques Villeneuve", "years": [1997]}
  ],
  "career_race_wins_to_2025": 114,
  "recent_performance": {
    "2020": {"position": 10, "points": 0},
    "2021": {"position": 8, "points": 23},
    "2022": {"position": 10, "points": 8},
    "2023": {"position": 7, "points": 28},
    "2024": {"position": 9, "points": 17}
  }
}
```

---

### VISA CASH APP RACING BULLS (VCARB / RB)

**Full Name:** Visa Cash App Racing Bulls
**Base:** Faenza, Italy
**Power Unit (2025):** Honda RBPT
**Previous Identities:** Minardi (1985–2005), Toro Rosso (2006–2019), AlphaTauri (2020–2023), VCARB/RB (2024+)
**Role:** Red Bull junior driver development team

The Faenza-based team has served as Red Bull's junior driver incubator since 2006. Vettel, Ricciardo, Verstappen, Gasly, and Tsunoda all graduated through this team. The 2008 Italian GP victory by Vettel at Monza — making him the youngest GP winner at the time — remains the team's greatest result.

```json
{
  "constructor": "VCARB / Racing Bulls",
  "base": "Faenza, Italy",
  "power_unit_2025": "Honda RBPT",
  "previous_identities": ["Minardi (1985-2005)", "Toro Rosso (2006-2019)", "AlphaTauri (2020-2023)"],
  "role": "Red Bull junior driver development team",
  "notable_graduates": ["Sebastian Vettel", "Daniel Ricciardo", "Max Verstappen", "Pierre Gasly", "Yuki Tsunoda"],
  "notable_results": {
    "2008_Monza": "Vettel won Italian GP from pole — youngest ever GP winner at the time",
    "2020_Monza": "Gasly won Italian GP — shock result after Hamilton penalty"
  }
}
```

---

### HAAS F1 TEAM

**Full Name:** MoneyGram Haas F1 Team
**Base:** Kannapolis, North Carolina, USA (chassis manufactured by Dallara, Italy)
**Team Principal:** Ayao Komatsu (from 2024)
**Power Unit (2025):** Ferrari
**First F1 Season:** 2016

Haas is the newest American F1 team, founded by Gene Haas. The team operates a unique business model — outsourcing chassis manufacturing to Dallara in Italy and purchasing as many Ferrari components as regulations allow. This "listed parts" model allows Haas to compete with a significantly smaller budget than rivals.

The team's best season was 2018, finishing 5th in the constructors' championship. Performance has been highly variable — competitive in some seasons and last in others. In 2025, the team runs Esteban Ocon and Oliver Bearman.

```json
{
  "constructor": "Haas F1 Team",
  "base": "Kannapolis, USA / Dallara, Italy",
  "team_principal": "Ayao Komatsu",
  "power_unit_2025": "Ferrari",
  "first_season": 2016,
  "business_model": "Customer chassis via Dallara, maximum Ferrari listed parts",
  "best_season": {"year": 2018, "position": 5, "points": 93},
  "recent_performance": {
    "2022": {"position": 8, "points": 37},
    "2023": {"position": 10, "points": 12},
    "2024": {"position": 7, "points": 58}
  }
}
```

---

### KICK SAUBER / AUDI F1 TEAM

**Full Name:** Stake F1 Team Kick Sauber (transitioning to Audi F1 from 2026)
**Base:** Hinwil, Switzerland
**Power Unit (2025):** Ferrari
**Previous Identities:** Sauber (1993–2005), BMW Sauber (2006–2009), Sauber (2010–2018), Alfa Romeo (2019–2023), Kick Sauber (2024+)
**Constructors' Championships:** 0

The Hinwil team has been a perennial midfield or backmarker team for most of its existence, but has served as a stepping stone for many world-class drivers — Räikkönen, Massa, Vettel (briefly), and Leclerc all raced here early in their careers. The BMW Sauber era (2006–2009) was the team's strongest period, including Robert Kubica's victory at the 2008 Canadian GP.

The team is transitioning to full Audi works status from 2026 — making it the first new manufacturer works team to enter F1 in the modern era. Mattia Binotto (ex-Ferrari team principal) was hired to lead the Audi F1 project.

```json
{
  "constructor": "Kick Sauber / Audi",
  "base": "Hinwil, Switzerland",
  "power_unit_2025": "Ferrari",
  "power_unit_2026": "Audi (in-house)",
  "previous_identities": ["Sauber (1993-2005)", "BMW Sauber (2006-2009)", "Sauber (2010-2018)", "Alfa Romeo (2019-2023)"],
  "notable_graduates": ["Kimi Raikkonen", "Felipe Massa", "Charles Leclerc", "Robert Kubica"],
  "notable_results": {
    "2008_Canada": "Robert Kubica won Canadian GP — team's only victory",
    "2007": "BMW Sauber P2 in constructors"
  },
  "audi_transition": {
    "year": 2026,
    "project_lead": "Mattia Binotto",
    "significance": "First new manufacturer works F1 team in modern era"
  }
}
```

---

## SECTION 2: CONSTRUCTORS' CHAMPIONSHIP RESULTS 2005–2025

```json
{
  "constructors_championship_winners": [
    {"year": 2005, "winner": "Renault", "points": 191, "runner_up": "McLaren", "runner_up_points": 182},
    {"year": 2006, "winner": "Renault", "points": 206, "runner_up": "Ferrari", "runner_up_points": 201},
    {"year": 2007, "winner": "Ferrari", "points": 204, "runner_up": "BMW Sauber", "runner_up_points": 101, "note": "McLaren stripped of all points due to spy scandal"},
    {"year": 2008, "winner": "Ferrari", "points": 172, "runner_up": "McLaren", "runner_up_points": 151},
    {"year": 2009, "winner": "Brawn GP", "points": 172, "runner_up": "Red Bull", "runner_up_points": 153},
    {"year": 2010, "winner": "Red Bull", "points": 498, "runner_up": "McLaren", "runner_up_points": 454},
    {"year": 2011, "winner": "Red Bull", "points": 650, "runner_up": "McLaren", "runner_up_points": 497},
    {"year": 2012, "winner": "Red Bull", "points": 460, "runner_up": "Ferrari", "runner_up_points": 400},
    {"year": 2013, "winner": "Red Bull", "points": 596, "runner_up": "Mercedes", "runner_up_points": 360},
    {"year": 2014, "winner": "Mercedes", "points": 701, "runner_up": "Red Bull", "runner_up_points": 405},
    {"year": 2015, "winner": "Mercedes", "points": 703, "runner_up": "Ferrari", "runner_up_points": 428},
    {"year": 2016, "winner": "Mercedes", "points": 765, "runner_up": "Red Bull", "runner_up_points": 468},
    {"year": 2017, "winner": "Mercedes", "points": 668, "runner_up": "Ferrari", "runner_up_points": 522},
    {"year": 2018, "winner": "Mercedes", "points": 655, "runner_up": "Ferrari", "runner_up_points": 571},
    {"year": 2019, "winner": "Mercedes", "points": 739, "runner_up": "Ferrari", "runner_up_points": 504},
    {"year": 2020, "winner": "Mercedes", "points": 573, "runner_up": "Red Bull", "runner_up_points": 319},
    {"year": 2021, "winner": "Mercedes", "points": 613, "runner_up": "Red Bull", "runner_up_points": 585},
    {"year": 2022, "winner": "Red Bull", "points": 759, "runner_up": "Ferrari", "runner_up_points": 554},
    {"year": 2023, "winner": "Red Bull", "points": 860, "runner_up": "Mercedes", "runner_up_points": 409},
    {"year": 2024, "winner": "McLaren", "points": 666, "runner_up": "Ferrari", "runner_up_points": 652}
  ]
}
```

---

## SECTION 3: POWER UNIT MANUFACTURER STANDINGS

```json
{
  "power_unit_manufacturers_2025": [
    {
      "manufacturer": "Mercedes",
      "teams_supplied": ["Mercedes", "McLaren", "Williams", "Aston Martin"],
      "total_teams": 4,
      "era_dominance": "2014-2021 — 8 consecutive constructors titles",
      "architecture": "V6 1.6L Turbo-Hybrid, split turbo-compressor design"
    },
    {
      "manufacturer": "Ferrari",
      "teams_supplied": ["Ferrari", "Haas", "Kick Sauber"],
      "total_teams": 3,
      "era_dominance": "2000-2004 V10 era, 2007-2008 V8 era",
      "architecture": "V6 1.6L Turbo-Hybrid, integrated exhaust/turbo packaging"
    },
    {
      "manufacturer": "Honda RBPT",
      "teams_supplied": ["Red Bull Racing", "VCARB/RB"],
      "total_teams": 2,
      "era_dominance": "2021-2023 with Red Bull",
      "architecture": "V6 1.6L Turbo-Hybrid, compact packaging optimised for Red Bull chassis",
      "note": "Honda officially withdrew end-2021 but continued supplying under RBPT branding"
    },
    {
      "manufacturer": "Renault",
      "teams_supplied": ["Alpine"],
      "total_teams": 1,
      "era_dominance": "2005-2006 as constructor, V8 era with Red Bull 2010-2013",
      "architecture": "V6 1.6L Turbo-Hybrid",
      "note": "Least powerful PU in 2025 field — potential Mercedes switch 2026"
    }
  ]
}
```

---

*Document End — constructor_profiles.md*
*RAG Library v1.0 | APEX F1 Analytical Platform*
*Coverage: 2005–2025 | Last Updated: 2025*
