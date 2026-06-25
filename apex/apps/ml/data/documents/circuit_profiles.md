# F1 Circuit Profiles — RAG Knowledge Document
# Coverage: 2005–2025 | All 24 Current Calendar Circuits + Notable Historical
# Format: Narrative (md) + Stat Blocks (json)
# Purpose: APEX RAG retrieval — track characteristics, DRS zones, tyre degradation, key corners

---

## SECTION 1: THE 24-RACE CALENDAR (2025 SEASON)

---

### BAHRAIN INTERNATIONAL CIRCUIT (Sakhir)

**Location:** Sakhir, Bahrain
**First Grand Prix:** 2004
**Circuit Length:** 5.412 km
**Laps:** 57
**Race Distance:** 308.238 km
**Characteristics:** High degradation, rear-limited, heavy traction zones
**Notable Corners:** Turn 1 (Schumacher Corner), Turn 9/10 (Tricky downhill left-hander), Turn 14/15

Bahrain has become the traditional season opener and testing venue for modern Formula 1. The circuit is defined by its long straights followed by heavy braking zones, making it a classic "stop-and-go" track that places immense stress on the rear tyres for traction. Because it is located in the desert, sand on the track and temperature drops as the sun sets (it is a night race) significantly alter grip levels throughout the race.

The most critical sequence is Turn 9 and 10 — a tricky downhill, off-camber double-left hander where it is exceptionally easy to lock the front left tyre. Bahrain is widely considered one of the best tracks on the calendar for overtaking, particularly at Turn 1 and Turn 4.

```json
{
  "circuit": "Bahrain International Circuit",
  "location": "Sakhir, Bahrain",
  "length_km": 5.412,
  "first_gp": 2004,
  "lap_record": {"time": "1:31.447", "driver": "Pedro de la Rosa", "year": 2005},
  "drs_zones": 3,
  "track_characteristics": {
    "downforce_level": "Medium",
    "tyre_degradation": "High",
    "limiting_axle": "Rear (Traction-limited)",
    "brake_wear": "High",
    "overtaking_difficulty": "Low"
  },
  "key_corners": ["Turn 1 (Heavy braking, prime overtake)", "Turn 4", "Turn 9/10 (High lock-up risk)"],
  "historical_significance": "Traditional season opener. Site of 'Duel in the Desert' 2014 (Hamilton vs Rosberg) and Grosjean's fiery survival 2020."
}
```

---

### JEDDAH CORNICHE CIRCUIT

**Location:** Jeddah, Saudi Arabia
**First Grand Prix:** 2021
**Circuit Length:** 6.174 km
**Laps:** 50
**Race Distance:** 308.450 km
**Characteristics:** Ultra-high speed street circuit, blind corners, high risk
**Notable Corners:** Turn 13 (banking), Turn 22-23 (high-speed chicane)

Jeddah is the fastest street circuit in Formula 1 history, with average speeds exceeding 250 km/h. Designed by Carsten Tilke, the track features 27 corners, most of which are flat-out sweeps bordered immediately by concrete barriers. The circuit requires immense driver confidence and punishes mistakes brutally, often resulting in Safety Cars or Red Flags.

Because the corners are so fast, it is front-limited rather than rear-limited (unlike most street circuits). The track surface is unusually smooth, leading to low tyre degradation, making one-stop strategies the norm unless interrupted by Safety Cars.

```json
{
  "circuit": "Jeddah Corniche Circuit",
  "location": "Jeddah, Saudi Arabia",
  "length_km": 6.174,
  "first_gp": 2021,
  "lap_record": {"time": "1:30.734", "driver": "Lewis Hamilton", "year": 2021},
  "drs_zones": 3,
  "track_characteristics": {
    "downforce_level": "Low-Medium",
    "tyre_degradation": "Low",
    "limiting_axle": "Front",
    "brake_wear": "Low",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Turn 1", "Turn 13 (Banked hairpin)", "Turn 27 (Final corner DRS detection)"],
  "historical_significance": "Site of the chaotic 2021 Hamilton-Verstappen collisions. Fastest street track."
}
```

---

### ALBERT PARK CIRCUIT (Melbourne)

**Location:** Melbourne, Australia
**First Grand Prix:** 1996
**Circuit Length:** 5.278 km
**Laps:** 58
**Race Distance:** 306.124 km
**Characteristics:** Temporary street circuit, smooth surface, medium-high speed (post-2022 alterations)
**Notable Corners:** Turn 9/10 (High-speed sweep, former chicane), Turn 11/12

Albert Park is a temporary circuit set around a lake in a public park. The track was significantly modified in 2022 to increase overtaking — the Turn 9/10 chicane was removed, creating a sweeping high-speed straight, and several other corners were widened. This transformed Melbourne from a relatively slow, hard-to-pass track into a much faster, flowing circuit.

The track surface is surprisingly smooth for a temporary circuit, but it is green and slippery on Friday practice. It is relatively easy on tyres, making strategy typically a one-stop affair, though early Safety Cars can complicate this.

```json
{
  "circuit": "Albert Park Circuit",
  "location": "Melbourne, Australia",
  "length_km": 5.278,
  "first_gp": 1996,
  "lap_record": {"time": "1:19.813", "driver": "Charles Leclerc", "year": 2024},
  "drs_zones": 4,
  "track_characteristics": {
    "downforce_level": "Medium-High",
    "tyre_degradation": "Low-Medium",
    "limiting_axle": "Front",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Medium-High"
  },
  "key_corners": ["Turn 1", "Turn 9/10 (High speed sweep)", "Turn 11 (Heavy braking)"],
  "historical_significance": "Traditional season opener 1996-2019. Brawn GP debut 1-2 in 2009."
}
```

---

### SUZUKA INTERNATIONAL RACING COURSE

**Location:** Suzuka, Japan
**First Grand Prix:** 1987
**Circuit Length:** 5.807 km
**Laps:** 53
**Race Distance:** 307.471 km
**Characteristics:** Figure-eight layout, ultra-high downforce, legendary driver's track
**Notable Corners:** The Esses (T3-T7), Degner 1 & 2, Spoon Curve, 130R

Suzuka is universally revered by drivers as one of the greatest challenges in motorsport. Designed by John Hugenholtz, it is the only figure-eight track on the calendar. Sector 1 consists of the 'S' Curves — a continuous sequence of high-speed changes of direction where missing the apex of the first compromises the entire sequence.

Suzuka is severely front-left tyre limited due to the immense lateral loads generated through the Esses, Spoon Curve, and the legendary 130R (a flat-out, 300+ km/h left-hander). The track requires a car with exceptional aerodynamic stability and high downforce.

```json
{
  "circuit": "Suzuka International Racing Course",
  "location": "Suzuka, Japan",
  "length_km": 5.807,
  "first_gp": 1987,
  "lap_record": {"time": "1:30.983", "driver": "Lewis Hamilton", "year": 2019},
  "drs_zones": 1,
  "track_characteristics": {
    "downforce_level": "High",
    "tyre_degradation": "High",
    "limiting_axle": "Front-Left",
    "brake_wear": "Low",
    "overtaking_difficulty": "High"
  },
  "key_corners": ["The S Curves (T3-T7)", "Degner Curves (T8-T9)", "Spoon Curve (T13-T14)", "130R (T15)"],
  "historical_significance": "Decided 13 World Championships. Site of legendary Senna-Prost collisions (1989, 1990)."
}
```

---

### SHANGHAI INTERNATIONAL CIRCUIT

**Location:** Shanghai, China
**First Grand Prix:** 2004
**Circuit Length:** 5.451 km
**Laps:** 56
**Race Distance:** 305.066 km
**Characteristics:** Very long straights, endless sweeping corners, front-limited
**Notable Corners:** Turns 1-4 (The Snail), Turn 13 (Banked onto back straight)

Shanghai is dominated by its unique Turn 1-4 sequence, known as 'The Snail'. It is an endless, tightening right-hander that feeds immediately into a left-hander, torturing the front-left tyre. The track also features a 1.2km back straight, requiring teams to strike a difficult compromise between the downforce needed for the sweeping corners and the low drag required for the straight.

```json
{
  "circuit": "Shanghai International Circuit",
  "location": "Shanghai, China",
  "length_km": 5.451,
  "first_gp": 2004,
  "lap_record": {"time": "1:32.238", "driver": "Michael Schumacher", "year": 2004},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Medium",
    "tyre_degradation": "High",
    "limiting_axle": "Front-Left",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Turn 1-4 (The Snail)", "Turn 14 (Hairpin post-straight)"],
  "historical_significance": "Schumacher's final F1 victory (2006). Red Bull's first victory (2009)."
}
```

---

### MIAMI INTERNATIONAL AUTODROME

**Location:** Miami Gardens, Florida, USA
**First Grand Prix:** 2022
**Circuit Length:** 5.412 km
**Laps:** 57
**Race Distance:** 308.326 km
**Characteristics:** Temporary circuit around Hard Rock Stadium, mixed speeds
**Notable Corners:** Turn 14-15 (tight chicane), Turn 17 (hairpin)

Miami is a modern American street circuit. It features three long straights combined with a very tight, slow-speed technical section beneath the highway overpasses (Turns 13-16). This creates setup headaches — cars need traction for the slow sections but cannot afford drag on the straights. The track surface has been repaved multiple times to resolve grip issues off the racing line.

```json
{
  "circuit": "Miami International Autodrome",
  "location": "Miami, USA",
  "length_km": 5.412,
  "first_gp": 2022,
  "lap_record": {"time": "1:29.708", "driver": "Max Verstappen", "year": 2023},
  "drs_zones": 3,
  "track_characteristics": {
    "downforce_level": "Medium",
    "tyre_degradation": "Medium",
    "limiting_axle": "Rear",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Turn 11", "Turn 14/15 (Chicane)", "Turn 17 (Hairpin)"],
  "historical_significance": "First of the 'new era' American F1 races. Norris maiden victory 2024."
}
```

---

### AUTODROMO ENZO E DINO FERRARI (Imola)

**Location:** Imola, Italy
**First Grand Prix:** 1980
**Circuit Length:** 4.909 km
**Laps:** 63
**Race Distance:** 309.049 km
**Characteristics:** Old-school, narrow, severe kerbs, anti-clockwise
**Notable Corners:** Tamburello Chicane, Acque Minerali, Rivazza

Imola is an unforgiving, narrow, old-school circuit. The modern layout features chicanes installed after the tragic 1994 weekend, requiring cars to ride the high kerbs aggressively to extract lap time. Overtaking is notoriously difficult due to the narrow track width, placing a premium on qualifying position.

```json
{
  "circuit": "Autodromo Enzo e Dino Ferrari (Imola)",
  "location": "Imola, Italy",
  "length_km": 4.909,
  "first_gp": 1980,
  "lap_record": {"time": "1:15.484", "driver": "Lewis Hamilton", "year": 2020},
  "drs_zones": 1,
  "track_characteristics": {
    "downforce_level": "Medium-High",
    "tyre_degradation": "Medium",
    "limiting_axle": "Rear",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Very High"
  },
  "key_corners": ["Tamburello", "Acque Minerali", "Rivazza"],
  "historical_significance": "Site of the 1994 black weekend (deaths of Roland Ratzenberger and Ayrton Senna). Historic Ferrari home track."
}
```

---

### CIRCUIT DE MONACO

**Location:** Monte Carlo, Monaco
**First Grand Prix:** 1950
**Circuit Length:** 3.337 km
**Laps:** 78
**Race Distance:** 260.286 km (Exception to 305km rule)
**Characteristics:** Slowest track, zero margin for error, highest downforce required
**Notable Corners:** Sainte Devote, Casino Square, Grand Hotel Hairpin, Swimming Pool

Monaco is the crown jewel of the F1 calendar and an anachronism in the modern era. The track is so narrow that modern F1 cars essentially cannot overtake unless the car ahead makes a catastrophic error. Qualifying is the most important session of the year — pole position converts to victory at a very high rate. Teams bring Monaco-specific high-downforce wings and modify steering racks to navigate the hairpin (the slowest corner in F1 at ~45 km/h).

```json
{
  "circuit": "Circuit de Monaco",
  "location": "Monte Carlo, Monaco",
  "length_km": 3.337,
  "first_gp": 1950,
  "lap_record": {"time": "1:12.909", "driver": "Lewis Hamilton", "year": 2021},
  "drs_zones": 1,
  "track_characteristics": {
    "downforce_level": "Maximum",
    "tyre_degradation": "Very Low",
    "limiting_axle": "Rear (Traction)",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Extreme"
  },
  "key_corners": ["Sainte Devote", "Grand Hotel Hairpin", "Swimming Pool Chicane", "La Rascasse"],
  "historical_significance": "The most famous street race in the world. Triple Crown component. Senna record 6 wins."
}
```

---

### CIRCUIT GILLES-VILLENEUVE (Montreal)

**Location:** Montreal, Canada
**First Grand Prix:** 1978
**Circuit Length:** 4.361 km
**Laps:** 70
**Race Distance:** 305.270 km
**Characteristics:** Stop-and-go, heavy braking, chicane hopping, Wall of Champions
**Notable Corners:** Turn 1/2, Turn 10 (L'Epingle Hairpin), Turn 13/14 (Wall of Champions)

Montreal is the ultimate brake-testing circuit. It consists almost entirely of long straights broken up by heavy braking zones into tight chicanes and one hairpin. Cars must have excellent mechanical grip to ride the kerbs and supreme braking stability. The final chicane exits right next to the "Wall of Champions," which earned its name in 1999 when three world champions (Schumacher, Hill, Villeneuve) crashed into it in the same race.

```json
{
  "circuit": "Circuit Gilles-Villeneuve",
  "location": "Montreal, Canada",
  "length_km": 4.361,
  "first_gp": 1978,
  "lap_record": {"time": "1:13.078", "driver": "Valtteri Bottas", "year": 2019},
  "drs_zones": 3,
  "track_characteristics": {
    "downforce_level": "Low-Medium",
    "tyre_degradation": "Low",
    "limiting_axle": "Rear",
    "brake_wear": "Extreme",
    "overtaking_difficulty": "Low-Medium"
  },
  "key_corners": ["Turn 10 (Hairpin)", "Turn 13/14 (Wall of Champions Chicane)"],
  "historical_significance": "Longest race in F1 history (2011, 4 hours due to rain). Jean Alesi's only win (1995)."
}
```

---

### CIRCUIT DE BARCELONA-CATALUNYA

**Location:** Montmeló, Spain
**First Grand Prix:** 1991
**Circuit Length:** 4.657 km
**Laps:** 66
**Race Distance:** 307.236 km
**Characteristics:** High-speed aerodynamic test, highly abrasive surface
**Notable Corners:** Turn 3, Turn 9 (Campsa), Turn 14 (New sweeping final corner)

Barcelona was F1's primary testing venue for decades because it tests every aspect of a car's aerodynamic efficiency. If a car is fast in Barcelona, it will generally be fast everywhere. The track is highly demanding on the front-left tyre due to long, high-speed right-handers like Turn 3. The removal of the final sector chicane in 2023 returned the track to its original, much faster flowing layout.

```json
{
  "circuit": "Circuit de Barcelona-Catalunya",
  "location": "Barcelona, Spain",
  "length_km": 4.657,
  "first_gp": 1991,
  "lap_record": {"time": "1:16.330", "driver": "Max Verstappen", "year": 2023},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "High",
    "tyre_degradation": "High",
    "limiting_axle": "Front-Left",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Medium-High"
  },
  "key_corners": ["Turn 3", "Turn 9", "Turn 14"],
  "historical_significance": "Traditional aerodynamic benchmark. Verstappen's debut victory (2016). Maldonado's shock win (2012)."
}
```

---

### RED BULL RING (Spielberg)

**Location:** Spielberg, Austria
**First Grand Prix:** 1970
**Circuit Length:** 4.318 km
**Laps:** 71
**Race Distance:** 306.452 km
**Characteristics:** Short lap, elevation changes, power-sensitive, track limits issues
**Notable Corners:** Turn 1, Turn 3, Turn 9/10

The Red Bull Ring has the shortest lap time of the year (around 65 seconds). With only 10 distinct corners, the margins in qualifying are incredibly tight. The track is defined by three long straights requiring good traction, followed by a fast, sweeping final sector that drops downhill. Overtaking is generally frequent here. The track is infamous for track-limit penalties at Turns 9 and 10.

```json
{
  "circuit": "Red Bull Ring",
  "location": "Spielberg, Austria",
  "length_km": 4.318,
  "first_gp": 1970,
  "lap_record": {"time": "1:05.619", "driver": "Carlos Sainz", "year": 2020},
  "drs_zones": 3,
  "track_characteristics": {
    "downforce_level": "Medium",
    "tyre_degradation": "Medium",
    "limiting_axle": "Rear",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Low"
  },
  "key_corners": ["Turn 3", "Turn 4", "Turn 9/10"],
  "historical_significance": "Leclerc-Verstappen duel 2019. Austrian GP 'Let Michael pass' team orders (2002)."
}
```

---

### SILVERSTONE CIRCUIT

**Location:** Silverstone, United Kingdom
**First Grand Prix:** 1950 (First ever World Championship race)
**Circuit Length:** 5.891 km
**Laps:** 52
**Race Distance:** 306.198 km
**Characteristics:** Ultra-high speed, flowing, aerodynamic masterpiece
**Notable Corners:** Maggotts-Becketts-Chapel, Copse, Stowe

Silverstone is the spiritual home of British motorsport and one of the fastest tracks on the calendar. The Maggotts-Becketts-Chapel sequence is arguably the greatest sequence of high-speed corners in the world, where cars pull over 5G in lateral loads. The track demands excellent high-speed aerodynamic stability and is punishing on the front-left tyre.

```json
{
  "circuit": "Silverstone Circuit",
  "location": "Silverstone, UK",
  "length_km": 5.891,
  "first_gp": 1950,
  "lap_record": {"time": "1:27.097", "driver": "Max Verstappen", "year": 2020},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Medium-High",
    "tyre_degradation": "High",
    "limiting_axle": "Front-Left",
    "brake_wear": "Low",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Copse", "Maggotts-Becketts", "Stowe"],
  "historical_significance": "Hosted the first F1 race in 1950. Hamilton home race dominance (9 wins). Verstappen-Hamilton 51G crash 2021."
}
```

---

### HUNGARORING

**Location:** Budapest, Hungary
**First Grand Prix:** 1986
**Circuit Length:** 4.381 km
**Laps:** 70
**Race Distance:** 306.630 km
**Characteristics:** "Monaco without the walls", continuous corners, difficult to pass
**Notable Corners:** Turn 1, Turn 4

The Hungaroring is a tight, twisting circuit where the corners link together continuously, giving drivers no time to rest. It requires Monaco-levels of downforce. Because it is often held in the peak of European summer, track temperatures are very high, leading to thermal degradation of the tyres. Overtaking is notoriously difficult, primarily occurring at Turn 1.

```json
{
  "circuit": "Hungaroring",
  "location": "Budapest, Hungary",
  "length_km": 4.381,
  "first_gp": 1986,
  "lap_record": {"time": "1:16.627", "driver": "Lewis Hamilton", "year": 2020},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "High-Maximum",
    "tyre_degradation": "Medium-High (Thermal)",
    "limiting_axle": "Rear",
    "brake_wear": "Medium",
    "overtaking_difficulty": "High"
  },
  "key_corners": ["Turn 1", "Turn 4 (Blind crest)"],
  "historical_significance": "First race behind the Iron Curtain (1986). Button's maiden win (2006). Ocon's maiden win (2021)."
}
```

---

### CIRCUIT DE SPA-FRANCORCHAMPS

**Location:** Stavelot, Belgium
**First Grand Prix:** 1950
**Circuit Length:** 7.004 km
**Laps:** 44
**Race Distance:** 308.052 km
**Characteristics:** Longest track, massive elevation changes, unpredictable weather
**Notable Corners:** Eau Rouge-Raidillon, Pouhon, Blanchimont

Spa is F1's longest and most majestic track, winding through the Ardennes forest. Eau Rouge into Raidillon is the most famous corner sequence in motorsport — a steep downhill sweep into a blind uphill crest taken flat-out. Spa requires a massive setup compromise: high downforce is needed for the sweeping Sector 2, but low drag is essential for the huge straights in Sectors 1 and 3.

```json
{
  "circuit": "Circuit de Spa-Francorchamps",
  "location": "Spa, Belgium",
  "length_km": 7.004,
  "first_gp": 1950,
  "lap_record": {"time": "1:46.286", "driver": "Valtteri Bottas", "year": 2018},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Low-Medium",
    "tyre_degradation": "Medium",
    "limiting_axle": "Front",
    "brake_wear": "Low",
    "overtaking_difficulty": "Low"
  },
  "key_corners": ["La Source", "Eau Rouge/Raidillon", "Les Combes", "Pouhon"],
  "historical_significance": "Schumacher debut (1991) and first win (1992). Häkkinen's double overtake on Schumacher (2000)."
}
```

---

### CIRCUIT ZANDVOORT

**Location:** Zandvoort, Netherlands
**First Grand Prix:** 1952
**Circuit Length:** 4.259 km
**Laps:** 72
**Race Distance:** 306.587 km
**Characteristics:** Steep banking, flowing, coastal wind, narrow
**Notable Corners:** Tarzan (Turn 1), Hugenholtz (Turn 3 banking), Arie Luyendyk (Turn 14 banking)

Reintroduced to the calendar for the Verstappen era, Zandvoort is an old-school coastal track defined by its massive banked corners — Turn 3 and Turn 14 feature 18-degree banking (steeper than Indianapolis). The track is very narrow and flowing, making overtaking difficult. Wind blowing sand onto the track from the nearby beach frequently alters grip levels.

```json
{
  "circuit": "Circuit Zandvoort",
  "location": "Zandvoort, Netherlands",
  "length_km": 4.259,
  "first_gp": 1952,
  "lap_record": {"time": "1:11.097", "driver": "Lewis Hamilton", "year": 2021},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "High",
    "tyre_degradation": "Medium-High",
    "limiting_axle": "Front",
    "brake_wear": "Medium",
    "overtaking_difficulty": "High"
  },
  "key_corners": ["Tarzanbocht (T1)", "Hugenholtzbocht (T3)", "Arie Luyendykbocht (T14)"],
  "historical_significance": "Home of the 'Orange Army'. Modern integration of steep banked corners."
}
```

---

### AUTODROMO NAZIONALE MONZA

**Location:** Monza, Italy
**First Grand Prix:** 1950
**Circuit Length:** 5.793 km
**Laps:** 53
**Race Distance:** 306.720 km
**Characteristics:** The Temple of Speed, lowest downforce, heavy braking
**Notable Corners:** Prima Variante (Turn 1), Ascari Chicane, Parabolica

Monza is the fastest track in F1, where cars reach 350+ km/h and spend 80% of the lap at full throttle. Teams bring unique "Monza-spec" rear wings that are essentially flat to remove all drag. The lap is punctuated by brutal heavy braking zones for the chicanes, where cars are incredibly unstable due to the lack of downforce. The final corner, Parabolica, is a long, accelerating right-hander crucial for speed onto the main straight.

```json
{
  "circuit": "Autodromo Nazionale Monza",
  "location": "Monza, Italy",
  "length_km": 5.793,
  "first_gp": 1950,
  "lap_record": {"time": "1:21.046", "driver": "Rubens Barrichello", "year": 2004},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Minimum",
    "tyre_degradation": "Low-Medium",
    "limiting_axle": "Rear (Traction)",
    "brake_wear": "High",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Prima Variante (T1)", "Variante della Roggia", "Ascari", "Parabolica"],
  "historical_significance": "The Temple of Speed. Ferrari's home race. Fastest ever F1 lap (Hamilton 2020 qualifying, 264.3 km/h avg)."
}
```

---

### BAKU CITY CIRCUIT

**Location:** Baku, Azerbaijan
**First Grand Prix:** 2016
**Circuit Length:** 6.003 km
**Laps:** 51
**Race Distance:** 306.049 km
**Characteristics:** Street circuit, massive straight, extremely tight castle section
**Notable Corners:** Turn 8-10 (Castle Section), Turn 1, Turn 16

Baku is a track of extremes. It features a 2.2km flat-out section (the longest "straight" of the year) where slipstreaming is massive, combined with the narrowest corner in F1 through the medieval castle gates (Turn 8). This requires a setup compromise leaning toward low drag to defend/attack on the straight, leaving cars sliding wildly through the 90-degree street corners. It frequently produces chaotic races.

```json
{
  "circuit": "Baku City Circuit",
  "location": "Baku, Azerbaijan",
  "length_km": 6.003,
  "first_gp": 2016,
  "lap_record": {"time": "1:43.009", "driver": "Charles Leclerc", "year": 2019},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Low-Medium",
    "tyre_degradation": "Low",
    "limiting_axle": "Rear",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Low"
  },
  "key_corners": ["Turn 1", "Turn 8 (Castle Section)"],
  "historical_significance": "Ricciardo's triple overtake (2017). Vettel-Hamilton bumper cars (2017). Verstappen tyre blowout (2021)."
}
```

---

### MARINA BAY STREET CIRCUIT

**Location:** Singapore
**First Grand Prix:** 2008
**Circuit Length:** 4.940 km
**Laps:** 62
**Race Distance:** 306.143 km
**Characteristics:** Night race, extreme heat/humidity, highest physical demand
**Notable Corners:** Turn 1-3, Turn 18 (under grandstand)

Singapore was F1's first night race. It is the most physically demanding race of the year — lasting near the two-hour limit in brutal tropical heat and humidity. The track is a bumpy, wall-lined gauntlet of 90-degree corners requiring maximum downforce. A Safety Car appearance is statistically highly probable, making strategy vital.

```json
{
  "circuit": "Marina Bay Street Circuit",
  "location": "Singapore",
  "length_km": 4.940,
  "first_gp": 2008,
  "lap_record": {"time": "1:35.867", "driver": "Lewis Hamilton", "year": 2023},
  "drs_zones": 4,
  "track_characteristics": {
    "downforce_level": "Maximum",
    "tyre_degradation": "Medium (Rear thermal)",
    "limiting_axle": "Rear",
    "brake_wear": "Extreme",
    "overtaking_difficulty": "High"
  },
  "key_corners": ["Turn 1-3", "Turn 14"],
  "historical_significance": "Crashgate scandal (2008). Vettel-Raikkonen-Verstappen turn 1 crash (2017). Sainz strategic masterpiece (2023)."
}
```

---

### CIRCUIT OF THE AMERICAS (COTA)

**Location:** Austin, Texas, USA
**First Grand Prix:** 2012
**Circuit Length:** 5.513 km
**Laps:** 56
**Race Distance:** 308.405 km
**Characteristics:** Greatest hits layout, bumpy, wide corner entries
**Notable Corners:** Turn 1 (Uphill blind apex), Turn 3-6 (Suzuka-style esses)

COTA is a purpose-built facility designed to combine the best features of other tracks — an uphill Turn 1, a Suzuka-like Esses section in Sector 1, and a multi-apex right hander like Istanbul's Turn 8. The track is famously bumpy due to subsiding soil, requiring cars to run higher ride heights. The wide, multi-line corners make it excellent for wheel-to-wheel racing.

```json
{
  "circuit": "Circuit of the Americas",
  "location": "Austin, USA",
  "length_km": 5.513,
  "first_gp": 2012,
  "lap_record": {"time": "1:36.169", "driver": "Charles Leclerc", "year": 2019},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Medium-High",
    "tyre_degradation": "High",
    "limiting_axle": "Front",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Turn 1", "Turn 3-6", "Turn 12"],
  "historical_significance": "Re-established F1 in America. Hamilton secured 2015 and 2019 titles here. Raikkonen's final win (2018)."
}
```

---

### AUTÓDROMO HERMANOS RODRÍGUEZ

**Location:** Mexico City, Mexico
**First Grand Prix:** 1962
**Circuit Length:** 4.304 km
**Laps:** 71
**Race Distance:** 305.354 km
**Characteristics:** Extreme altitude, low air density, unique aerodynamic anomalies
**Notable Corners:** Turn 1, Foro Sol (Stadium section)

Mexico City is unique due to its altitude (2,285 meters above sea level). The thin air means there is 25% less oxygen and air density. Consequently, teams run maximum downforce wings (Monaco levels) but only generate Monza-levels of actual downforce. The thin air also makes cooling the engine and brakes incredibly difficult, forcing teams to open massive cooling vents that cause drag. Slipstreaming on the 1.2km main straight is less effective due to the thin air.

```json
{
  "circuit": "Autodromo Hermanos Rodriguez",
  "location": "Mexico City, Mexico",
  "length_km": 4.304,
  "first_gp": 1962,
  "lap_record": {"time": "1:17.774", "driver": "Valtteri Bottas", "year": 2021},
  "drs_zones": 3,
  "track_characteristics": {
    "downforce_level": "Maximum (Wings) / Low (Effective)",
    "tyre_degradation": "Medium",
    "limiting_axle": "Rear",
    "brake_wear": "Extreme (Cooling issue)",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Turn 1", "Foro Sol Stadium Section"],
  "historical_significance": "Highest altitude race. Verstappen dominant venue. Hamilton clinched 2017 and 2018 titles here."
}
```

---

### AUTÓDROMO JOSÉ CARLOS PACE (Interlagos)

**Location:** São Paulo, Brazil
**First Grand Prix:** 1973
**Circuit Length:** 4.309 km
**Laps:** 71
**Race Distance:** 305.879 km
**Characteristics:** Anti-clockwise, short lap, unpredictable weather, overtaking friendly
**Notable Corners:** Senna S (Turns 1-2), Ferradura, Junção

Interlagos is one of the most beloved tracks on the calendar. Raced anti-clockwise, the short lap combines a twisting infield section with a massive, sweeping uphill climb to the finish line. Rain is frequent and unpredictable. Turn 1 (the Senna S) is one of the best overtaking spots of the year. The track frequently hosts Sprint races because overtaking is highly possible.

```json
{
  "circuit": "Autodromo Jose Carlos Pace (Interlagos)",
  "location": "Sao Paulo, Brazil",
  "length_km": 4.309,
  "first_gp": 1973,
  "lap_record": {"time": "1:10.540", "driver": "Valtteri Bottas", "year": 2018},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Medium-High",
    "tyre_degradation": "Medium-High",
    "limiting_axle": "Rear",
    "brake_wear": "Low",
    "overtaking_difficulty": "Low"
  },
  "key_corners": ["Senna S (T1-T2)", "Juncao (T12)"],
  "historical_significance": "Hamilton's 2008 final-corner title win. Verstappen's 2016 wet-weather masterclass. Hamilton's 2021 back-to-front victory."
}
```

---

### LAS VEGAS STRIP CIRCUIT

**Location:** Las Vegas, Nevada, USA
**First Grand Prix:** 2023
**Circuit Length:** 6.201 km
**Laps:** 50
**Race Distance:** 310.050 km
**Characteristics:** Night race, ultra-long straight, very cold temperatures
**Notable Corners:** Turn 1 (Hairpin), Turns 5-9 (Sphere section), Strip Straight

The Las Vegas circuit runs directly down the famous Strip. It features a 1.9km flat-out run where cars reach 350 km/h. Because the race is held late at night in November, track temperatures are often below 15°C — exceptionally cold for F1 tyres. Drivers struggle massively to keep heat in the tyres on the long straights, leading to heavy lock-ups under braking at the end of the Strip.

```json
{
  "circuit": "Las Vegas Strip Circuit",
  "location": "Las Vegas, USA",
  "length_km": 6.201,
  "first_gp": 2023,
  "lap_record": {"time": "1:35.490", "driver": "Oscar Piastri", "year": 2023},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Low",
    "tyre_degradation": "Low (Graining is the main issue due to cold)",
    "limiting_axle": "Front (Warm-up issue)",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Low"
  },
  "key_corners": ["Turn 1", "Turn 14 (End of the Strip)"],
  "historical_significance": "F1's first self-promoted race. Major commercial milestone. Verstappen secured 2024 title here."
}
```

---

### LUSAIL INTERNATIONAL CIRCUIT

**Location:** Lusail, Qatar
**First Grand Prix:** 2021
**Circuit Length:** 5.419 km
**Laps:** 57
**Race Distance:** 308.611 km
**Characteristics:** High-speed continuous corners, flat, brutal on tyres
**Notable Corners:** Turns 12-14 (Triple right hander)

Designed originally for MotoGP, Lusail consists almost entirely of medium and high-speed sweeping corners. There are very few heavy braking zones. This places an extraordinary sustained lateral load on the tyres, particularly the front-left. The 2023 race saw mandated 18-lap tyre stints because the kerbs and speeds were structurally destroying the Pirelli tyres.

```json
{
  "circuit": "Lusail International Circuit",
  "location": "Lusail, Qatar",
  "length_km": 5.419,
  "first_gp": 2021,
  "lap_record": {"time": "1:24.319", "driver": "Max Verstappen", "year": 2023},
  "drs_zones": 1,
  "track_characteristics": {
    "downforce_level": "Medium-High",
    "tyre_degradation": "Extreme",
    "limiting_axle": "Front-Left",
    "brake_wear": "Low",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Turn 1", "Turns 12-14"],
  "historical_significance": "Verstappen secured 2023 title here in the Sprint. 2023 race infamous for extreme heat exhaustion among drivers."
}
```

---

### YAS MARINA CIRCUIT

**Location:** Abu Dhabi, UAE
**First Grand Prix:** 2009
**Circuit Length:** 5.281 km
**Laps:** 58
**Race Distance:** 306.183 km
**Characteristics:** Twilight race, smooth surface, heavy traction zones
**Notable Corners:** Turn 5, Turn 6 (Hairpin), Turn 9 (Sweeper)

The traditional season finale, Abu Dhabi was heavily modified in 2021 to improve racing — removing two clunky chicanes in favour of a hairpin (Turn 6) and a long sweeper (Turn 9). The track transitions from daylight to night during the race, dropping track temperatures and altering car balance. Sector 3 remains a tight, 90-degree corner gauntlet that punishes overheating rear tyres.

```json
{
  "circuit": "Yas Marina Circuit",
  "location": "Abu Dhabi, UAE",
  "length_km": 5.281,
  "first_gp": 2009,
  "lap_record": {"time": "1:26.103", "driver": "Max Verstappen", "year": 2021},
  "drs_zones": 2,
  "track_characteristics": {
    "downforce_level": "Medium",
    "tyre_degradation": "Medium",
    "limiting_axle": "Rear",
    "brake_wear": "Medium",
    "overtaking_difficulty": "Medium"
  },
  "key_corners": ["Turn 6", "Turn 9"],
  "historical_significance": "Traditional season finale. Decided 2010, 2014, 2016 titles. Site of controversial 2021 Verstappen-Hamilton finale."
}
```

---

*Document End — circuit_profiles.md*
*RAG Library v1.0 | APEX F1 Analytical Platform*
*Coverage: 2005–2025 | Last Updated: 2025*
