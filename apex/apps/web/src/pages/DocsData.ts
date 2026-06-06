export interface FeatureRow {
  code: string;
  type: string;
  source: string;
  weight: string;
}

export interface TopicData {
  title: string;
  scope: string;
  version: string;
  runMode: string;
  apiPath: string;
  summary: string;
  what: string;
  why: string;
  when: string;
  how: string;
  formula: string;
  logicSteps: string[];
  features: FeatureRow[];
}

export const TOPIC_REGISTRY: Record<string, TopicData> = {
  elo: {
    title: "Driver Elo Rating Engine",
    scope: "ML-SCOPE-01",
    version: "v1.2.4",
    runMode: "LIVE SESSION CRON",
    apiPath: "/api/predict/elo/rankings",
    summary: "Isolates driver skill from constructor performance by scoring head-to-head qualifying and race results specifically against same-car teammates.",
    what: "The Driver Elo Rating Engine is a mathematical rating framework designed to evaluate and track a driver's intrinsic pace and racing ability. Unlike standard championship standings which conflate the driver's performance with the aerodynamic and engine superiority of their car, this model isolates driver skill. It does this by treating same-constructor teammates as direct adversaries in a zero-sum rating system, since they operate under identical technical limits.",
    why: "In Formula 1, over 80% of finishing variation is historically driven by constructor resources. Standard points standings do not tell us whether a driver in P10 is outperforming their machinery, or if a driver in P1 is merely coasting in the fastest car. Isolating driver skill is critical for driver recruitment, performance evaluations, and setting baseline probabilities for race forecasts.",
    when: "This engine runs as an automated cron worker at the conclusion of every session (Practice, Qualifying, Sprint, and Main Grand Prix) once official timing feeds are parsed and populated. It recalculates the updated Elo coordinates and uncertainty limits for all 20 active drivers.",
    how: "The system compares the session outcome between teammates (Qualifying lap time deltas and Race finish positions). It feeds these deltas into a logistic probability function to compute expected outcomes. If a driver beats their teammate by a larger margin than expected, their rating increases and the teammate's rating decreases by an equal amount. The K-factor (magnitude of rating change) scales dynamically based on the driver's historical lap count, allowing rookie ratings to stabilize quickly while veteran ratings remain robust against single-session outliers.",
    formula: "E_A = 1 / (1 + 10^((R_B - R_A) / 400)) \n\nR'_A = R_A + K * (S_A - E_A)",
    logicSteps: [
      "Identifies all active same-constructor teammate pairs for each session.",
      "Extracts lap time deltas for qualifying and grid finish positions for races.",
      "Applies a sigmoid mapping to scale margins: larger deltas yield larger Elo adjustments.",
      "Updates ratings using a dynamic K-factor based on career experience (lower K for veterans, higher K for rookies).",
      "Tracks uncertainty bounds (standard deviation) which decrease asymptotically with session coverage."
    ],
    features: [
      { code: "teammate_id", type: "Categorical (String)", source: "Postgres (results)", weight: "High (Base Reference)" },
      { code: "quali_delta_s", type: "Continuous (Float)", source: "Postgres (qualifying)", weight: "Medium (Quali Elo)" },
      { code: "finish_delta_pos", type: "Integer (Grid Diff)", source: "Postgres (results)", weight: "High (Race Elo)" },
      { code: "experience_laps", type: "Integer (Cumulative)", source: "Postgres (lap_times)", weight: "Low (K-factor scaling)" }
    ]
  },
  laptime: {
    title: "Tyre Degradation & Stint Regressor",
    scope: "ML-SCOPE-02",
    version: "v2.0.1",
    runMode: "ON-DEMAND INFERENCE",
    apiPath: "/api/predict/lap-time",
    summary: "Trains Ridge and XGBoost regressors on historical stint lap times to model compound decay curves adjusted for track temperature and fuel load.",
    what: "This regressor predicts lap times throughout a tire stint by modeling chemical and thermal tire wear. It maps how compound degradation curves progress over successive laps under varying environment states. The model differentiates between three dry compounds (Soft, Medium, Hard) and factors in track temperature, vehicle weight (fuel load), and track roughness characteristics.",
    why: "Tire management is the single most critical variable in modern F1 race pace. Teams must know exactly how long a compound will maintain its working temperature window, when the severe thermal 'cliff' will occur, and what lap times are achievable on alternative strategies to optimize pit stop timings and execute undercuts.",
    when: "The regressor runs in real-time, executing on-demand inference whenever a user modifies the Tyre & Lap simulator parameters or when live telemetry feeds update ambient track temperatures during a grand prix session.",
    how: "The model runs a Ridge polynomial regressor. It first corrects raw lap times by removing outliers (such as yellow flags or safety cars) and applying a linear fuel weight burn correction (-0.03s per lap as fuel is consumed). It then fits quadratic degradation slopes for each compound. Finally, it adds constructors' chassis-specific tire wear modifiers (e.g. some cars are historically 'gentler' on tires than others).",
    formula: "T_pred = T_base + α * (StintLap)^2 + β * (TrackTemp) - 0.03 * (FuelLoad)",
    logicSteps: [
      "Filters out safety cars, virtual safety cars, out-laps, and pit-in laps from the historical dataset.",
      "Applies a linear fuel-burn rate correction (-0.03s per kg of fuel burned) to isolate the true chemical tyre wear.",
      "Fits polynomial coefficients (α) for SOFT, MEDIUM, and HARD compounds on dry sessions.",
      "Adjusts base pace linearly using active track temperature and constructor-specific baseline offsets.",
      "Flags the onset of the thermal 'tyre cliff' when stint pace standard deviation exceeds 2.2σ."
    ],
    features: [
      { code: "compound", type: "One-Hot (SOFT/MED/HARD)", source: "Postgres (pit_stops)", weight: "Critical" },
      { code: "stint_lap", type: "Integer (1 to 50)", source: "Postgres (lap_times)", weight: "High (Quadratic wear)" },
      { code: "track_temp_c", type: "Continuous (Float)", source: "OpenF1 (Telemetry)", weight: "High (Thermal decay)" },
      { code: "fuel_load_kg", type: "Continuous (Calculated)", source: "Postgres (Session)", weight: "Medium (Weight offset)" }
    ]
  },
  strategy: {
    title: "Optimal Pit Stop Strategy Solver",
    scope: "ML-SCOPE-03",
    version: "v1.5.0",
    runMode: "ON-DEMAND SOLVER",
    apiPath: "/api/predict/strategy/pit-window/:id",
    summary: "Performs O(N²) stint searches to find the fastest combination of tyre compounds and pit stops that minimizes overall race duration.",
    what: "The Pit Stop Strategy Solver is an optimization module that computes the theoretically fastest race plan. It evaluates possible stint lengths and compound sequences (e.g. Medium-Hard, Soft-Medium-Hard) while strictly enforcing F1 sporting regulations (such as using at least two different dry compounds in a dry race).",
    why: "Determining the optimal strategy requires balancing conflicting factors: newer tires yield faster lap times, but pit lane entries cost a fixed time penalty (~20–25s depending on the circuit). The solver evaluates these offsets to prevent drivers from getting stuck in traffic (dirty air) or missing safety car windows.",
    when: "The solver runs on-demand before the race to establish the baseline strategy, and is continually re-run mid-race to adapt to active race incidents, competitor pit stops, and safety car interventions.",
    how: "The engine models the race as a shortest-path graph search. The vertices represent laps and tyre age states, while edges represent the time elapsed. It applies a Poisson distribution of safety car probabilities based on historical track records, discounting pit stop time losses by 50% during simulated SC periods. It also checks teammate coordinates to prevent 'double-stacking' bottlenecks in the pit lane.",
    formula: "T_total = Sum(LapTimes_c) + N_stops * PitLaneLoss + Sum(TrafficDelay)",
    logicSteps: [
      "Generates all valid combinations of tyre stints (e.g. Medium-Hard, Soft-Medium-Hard) complying with the F1 rule requiring at least two different dry compounds.",
      "Integrates a safety car rate Poisson distribution per track, downweighting pit lane loss by 50% during high-risk windows.",
      "Calculates undercut/overcut deltas based on opponent stint degradation slope differences.",
      "Applies a dirty-air traffic penalty (+0.35s/lap) if the driver is projected to emerge in a tight gap (<3.0s) behind other runners."
    ],
    features: [
      { code: "pit_loss_s", type: "Continuous (Track Const)", source: "Registry (Static)", weight: "High" },
      { code: "sc_probability", type: "Probability (0 to 1)", source: "Postgres (Historical SC)", weight: "Medium (Loss discount)" },
      { code: "traffic_gap_s", type: "Continuous (Dynamic)", source: "SpacetimeDB (live_positions)", weight: "High (Merge penalty)" },
      { code: "crossover_lap", type: "Integer (Lap number)", source: "ML Regressor", weight: "Critical" }
    ]
  },
  montecarlo: {
    title: "Monte Carlo Championship Simulator",
    scope: "ML-SCOPE-04",
    version: "v1.8.2",
    runMode: "BATCH SCHEDULED",
    apiPath: "/api/predict/simulation/championship",
    summary: "Runs 50,000 seasonal projections utilizing current points standings, remaining schedules, and driver/constructor skill probability densities.",
    what: "The Monte Carlo Championship Simulator is a stochastic forecasting engine that models the remaining races of the season. By executing tens of thousands of random walks, it projects the probability distributions of the final World Drivers' Championship (WDC) and World Constructors' Championship (WCC) standings.",
    why: "In a dynamic sporting season, predicting standings by simply extrapolating current points averages is highly inaccurate. It fails to account for track-specific chassis performance, random mechanical failures (DNFs), driver collisions, and rain variables. Monte Carlo simulations provide realistic confidence intervals and clinch limits.",
    when: "Runs as a weekly batch job after the conclusion of every Grand Prix, ensuring that the latest points tables and updated driver Elo ratings are incorporated.",
    how: "The simulator sets up a random walk for each remaining race. For each iteration, the baseline performance of each driver is established using their current Elo rating. The model then adds Gumbel extreme-value noise to simulate unexpected events (like crashes or engine failures). It also applies circuit affinities (e.g. Red Bull performing better on high-speed circuits, Ferrari on traction-heavy tracks) to bias the results toward historical constructor layouts.",
    formula: "Skill_D = Elo_D + Gumbel(μ, β) \n\nP_finish = Softmax(Skill_D + CircuitAffinity)",
    logicSteps: [
      "Extracts current championship points standings and the count of remaining rounds.",
      "Models race outcomes by adding Gumbel extreme-value noise to driver Elo ratings to simulate DNFs, crashes, and rain anomalies.",
      "Adjusts team base pace according to circuit classification (e.g., Monza rewards low drag, Monaco rewards high downforce).",
      "Calculates points distributed for each iteration (including sprint rounds and fastest lap bonuses) and tabulates finishing ranges.",
      "Computes mathematical clinch margins and elimination rounds across the iterations."
    ],
    features: [
      { code: "current_points", type: "Integer", source: "Postgres (results)", weight: "Critical" },
      { code: "circuit_type", type: "Categorical", source: "Postgres (circuits)", weight: "High (Affinities)" },
      { code: "elo_rating", type: "Continuous", source: "ML Elo System", weight: "Critical" },
      { code: "rounds_remaining", type: "Integer", source: "Postgres (races)", weight: "High" }
    ]
  },
  form: {
    title: "Driver Form Index",
    scope: "ML-SCOPE-05",
    version: "v1.0.1",
    runMode: "LIVE SESSION CRON",
    apiPath: "/api/predict/driver-form/:driver_id",
    summary: "Computes a rolling 0-100 rating of recent driver form using Exponentially Weighted Moving Average (EWMA) to weight recent races higher.",
    what: "The Driver Form Index is a rolling performance tracker that measures a driver's short-term momentum. Unlike Elo ratings, which look at a driver's long-term career baseline, the Form Index applies a high discount factor to older races to isolate how the driver has performed over the last 5 to 10 sessions.",
    why: "Drivers experience fluctuations in performance due to physical fatigue, upgrade packages that fit their driving style, track layout preferences, and psychological momentum. Capturing this form factor is crucial for predicting short-term qualifying upsets and race finishing intervals.",
    when: "Calculated automatically at the end of every session, updating the active 10-race rolling database.",
    how: "The model pulls the teammate qualifying time gap, race finish deltas, and pace standard deviation (consistency) from the last 10 rounds. It applies an Exponentially Weighted Moving Average (EWMA) with a decay parameter (λ = 0.08). This weights the most recent round highest, with older rounds decay exponentially. The output is scaled to a 0–100 index.",
    formula: "Y_t = λ * X_t + (1 - λ) * Y_(t-1)  (where λ = 0.08)",
    logicSteps: [
      "Pulls qualifying position differences and race finish position deltas vs. teammate for the last 10 rounds.",
      "Applies the EWMA decay filter to reward recent strong outcomes over early-season performances.",
      "Computes a lap-to-lap pace consistency metric by evaluating standard deviations of lap times within clean stints.",
      "Outputs form ratings (0-100%) and form trends (IMPROVING, STABLE, DECLINING)."
    ],
    features: [
      { code: "quali_delta", type: "Continuous", source: "Postgres (qualifying)", weight: "Medium" },
      { code: "finish_delta", type: "Integer", source: "Postgres (results)", weight: "High" },
      { code: "consistency_idx", type: "Continuous (0-100)", source: "Postgres (lap_times)", weight: "Medium" }
    ]
  },
  weather: {
    title: "Weather Impact Model",
    scope: "ML-SCOPE-06",
    version: "v1.1.0",
    runMode: "ON-DEMAND INFERENCE",
    apiPath: "/api/predict/weather-impact",
    summary: "Calculates lap time offsets and compound crossovers based on track surface wetness, humidity, and temperature.",
    what: "The Weather Impact Model is an environmental physics regressor that calculates how atmospheric conditions (air/track temperature, humidity, wind speed, and precipitation) affect vehicle performance. It specifically tracks wet-weather offsets and computes dry-to-wet compound crossover triggers.",
    why: "When rain falls, track surface friction drops dramatically, increasing lap times by up to 10–30 seconds. Choosing the exact moment to transition from dry Slicks to Intermediates (or vice-versa) is a high-risk decision that can win or lose a race. The model predicts these 'crossover windows' by tracking rain intensity.",
    when: "During active race sessions when rain is forecast, executing on-demand updates every 30 seconds as live track telemetry updates.",
    how: "The model runs a polynomial regression on track surface temperature to predict tire adhesion levels. It calculates a dynamic Grip Loss Multiplier. For wet conditions, the base lap time is scaled up based on rain accumulation indexes. It adjusts these penalties using driver-specific wet-weather skill coefficients (e.g. Verstappen and Hamilton are historically penalised less in wet conditions).",
    formula: "LapTimeDelta_w = Poly(TrackTemp) + WetnessGripLoss * Coefficient_D",
    logicSteps: [
      "Receives weather inputs: track/air temperature, humidity, and rain probability.",
      "Calculates wetness grip loss offsets that scale lap times up to +15.0s (Inters) and +25.0s (Full Wets).",
      "Applies historical driver-specific wet-weather coefficients (e.g. Hamilton, Verstappen have high wet multipliers) to adjust wet pace.",
      "Generates dry-to-wet compound crossover switch recommendations."
    ],
    features: [
      { code: "track_temp_c", type: "Continuous", source: "OpenF1 / Inputs", weight: "High" },
      { code: "rain_probability", type: "Probability (0 to 1)", source: "OpenF1 / Inputs", weight: "Critical" },
      { code: "humidity_pct", type: "Continuous", source: "OpenF1 / Inputs", weight: "Low" }
    ]
  },
  outcome: {
    title: "Race Outcome Predictor",
    scope: "ML-SCOPE-07",
    version: "v2.1.0",
    runMode: "ON-DEMAND INFERENCE",
    apiPath: "/predict/race-outcome",
    summary: "Estimates finish position probability distributions (P1–P10) centered around expected finishes using starting grid slots, teammate Elo margins, driver form, and constructor affinities.",
    what: "The Race Outcome Predictor is a machine learning classifier that projects the final finishing positions (P1 through P20) for each driver on the starting grid. Rather than predicting a single deterministic result, it outputs a probability distribution across the entire grid.",
    why: "Knowing the statistical probability of finishing in a specific position helps strategy engineers calculate Expected Points, optimize defensive pit stop layouts, and identify the risks of alternative starting tires (e.g., Softs vs Hard).",
    when: "Executed immediately after the conclusion of Qualifying once the official starting grid is established.",
    how: "The model is built on an XGBoost Classifier trained on historical F1 grid-to-finish transition records. It takes the starting grid slot as the primary feature, then applies modifiers based on the driver's current Elo rating, the constructor's historical track performance (chassis layout compatibility), and the driver's rolling Form Index.",
    formula: "Prob_finish = Softmax(GridPosition * w_g + EloRating * w_e + FormIndex * w_f)",
    logicSteps: [
      "Pulls pre-race starting grid slots for the upcoming session.",
      "Combines driver Elo ratings, constructor strength metrics, and active driver form ratings.",
      "Applies an XGBoost Classifier trained on historical grid-to-finish position records to yield position probability ranges.",
      "Calculates Expected Points by multiplying probabilities by F1 points distributions."
    ],
    features: [
      { code: "grid_position", type: "Integer (1 to 20)", source: "Postgres (qualifying)", weight: "Critical" },
      { code: "elo_rating", type: "Continuous", source: "ML Elo System", weight: "High" },
      { code: "form_index", type: "Continuous", source: "ML Form System", weight: "Medium" }
    ]
  },
  dnf: {
    title: "DNF Risk & Reliability Predictor",
    scope: "ML-SCOPE-08",
    version: "v1.4.2",
    runMode: "BATCH SCHEDULED",
    apiPath: "/api/predict/dnf-risk/:driver_id",
    summary: "Evaluates reliability hazard rates over race lap increments using a Weibull survival model tuned to team components and circuit classes.",
    what: "The DNF Risk & Reliability Predictor evaluates the lap-by-lap probability of a driver retiring from the race (Did Not Finish). It categorizes risks into mechanical failures (engine, gearbox, hydraulics) and collision failures, outputting a survival curve over the race distance.",
    why: "DNFs are highly disruptive events that alter strategy. Understanding a competitor's high-risk DNF window allows strategist groups to hedge their pit stop timings, while understanding a driver's own risk profile tells them when to run conservative engine maps to preserve components.",
    when: "Updated in batch runs before each Grand Prix weekend and recalculated live during the session as mileage increases.",
    how: "The model is based on a Weibull survival distribution, which is the industry standard for component wear modeling. The hazard rate (probability of failure at lap t, given survival up to t) scales based on the constructor's historical mechanical failure rate, the driver's collision index, the track's severity rating (e.g., bumpy street tracks increase component vibration; hot tracks strain cooling), and cumulative power unit mileage.",
    formula: "S(t) = exp( -(t / L)^k )  (where k = 1.6 shape, L = scale)",
    logicSteps: [
      "Analyzes team reliability scales (historical mechanical DNFs) and driver crash factors (collision history).",
      "Categorizes circuit DNF multipliers (e.g. Monaco street circuits have high collision hazard; Monza high speed mechanical hazard).",
      "Fits a Weibull survival curve representing lap-by-lap classified finish probabilities.",
      "Calculates risk classifications (LOW, MEDIUM, HIGH, CRITICAL) and breakdown of failure types."
    ],
    features: [
      { code: "constructor_id", type: "Categorical", source: "Postgres (results)", weight: "High (Mechanical history)" },
      { code: "circuit_type", type: "Categorical", source: "Postgres (circuits)", weight: "High (Street vs High Speed)" },
      { code: "driver_crash_multiplier", type: "Continuous", source: "Postgres (results)", weight: "Medium" }
    ]
  },
  quali: {
    title: "Qualifying Position Predictor",
    scope: "ML-SCOPE-09",
    version: "v1.3.1",
    runMode: "ON-DEMAND INFERENCE",
    apiPath: "/predict/qualifying",
    summary: "Predicts expected qualifying positions, Q3 entry probabilities, and pole position chances using constructor power unit ratings and circuit affinities.",
    what: "The Qualifying Position Predictor projects single-lap qualifying times and distributions. It models Q3 entry likelihoods and pole position probabilities by evaluating constructor qualifying engine modes ('party modes') and driver qualification records.",
    why: "Track position is king in Formula 1. Predicting qualifying thresholds is essential for tyre selection during qualifying sessions, allowing engineers to decide whether to save a set of Soft tires for Q3 or use them early to avoid Q1/Q2 elimination.",
    when: "Runs on-demand during Free Practice 3 (FP3) and prior to the start of Q1.",
    how: "The model runs an XGBoost Regressor. It evaluates constructor power unit ratings (derived from historical speed traps and GPS telemetry) and combines them with driver circuit qualification affinities. It then corrects for ambient temperature and track evolution (which speeds up the track as rubber is laid down).",
    formula: "QualiPace_D = TeamPowerUnitRating * w_t + CircuitAffinity_D * w_c",
    logicSteps: [
      "Extracts constructor power unit performance ratios (derived from average qualifying times).",
      "Applies driver circuit affinities (historical qualifying positions at similar track configurations).",
      "Uses an XGBoost Regressor model to project best Q3 lap times and qualifying grid distributions.",
      "Outputs Q3 entry likelihood percentages and pole position probabilities."
    ],
    features: [
      { code: "pu_rating", type: "Continuous", source: "Postgres (results)", weight: "Critical" },
      { code: "circuit_affinity", type: "Continuous", source: "Postgres (qualifying)", weight: "High" },
      { code: "track_temp_c", type: "Continuous", source: "OpenF1 (Telemetry)", weight: "Medium" }
    ]
  }
};
