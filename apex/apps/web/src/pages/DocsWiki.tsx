import { useState } from "react";

// Types for routing and topics
type Topic =
  | "overview"
  | "elo"
  | "laptime"
  | "strategy"
  | "montecarlo"
  | "form"
  | "weather"
  | "outcome"
  | "dnf"
  | "quali";

interface FeatureRow {
  code: string;
  type: string;
  source: string;
  weight: string;
}

interface TopicData {
  title: string;
  scope: string;
  version: string;
  runMode: string;
  apiPath: string;
  summary: string;
  formula: string;
  logicSteps: string[];
  features: FeatureRow[];
}

export default function DocsWiki() {
  const [activeTopic, setActiveTopic] = useState<Topic>("overview");

  // State for Interactive Sandboxes
  // 1. Elo Sandbox
  const [eloDriverA, setEloDriverA] = useState<number>(1750);
  const [eloDriverB, setEloDriverB] = useState<number>(1700);
  // 2. Weibull DNF Sandbox
  const [trackSeverity, setTrackSeverity] = useState<number>(0.5); // 0 to 1
  const [puReliability, setPuReliability] = useState<number>(0.8); // 0 to 1
  // 3. Tyre Deg Sandbox
  const [tyreTrackTemp, setTyreTrackTemp] = useState<number>(35); // 15 to 55
  const [tyreFuelLoad, setTyreFuelLoad] = useState<number>(80); // 10 to 110

  // Elo win probability calculation: E_A = 1 / (1 + 10^((R_B - R_A)/400))
  const deltaElo = eloDriverB - eloDriverA;
  const probA = 1 / (1 + Math.pow(10, deltaElo / 400));
  const probB = 1 - probA;

  // Weibull DNF survival curve points: S(t) = exp(-(t/L)^k)
  // Scale parameter L is influenced by PU Reliability and Track Severity
  const weibullL = 60 * puReliability * (1.5 - trackSeverity);
  const weibullK = 1.6; // Shape parameter (increasing hazard over time)
  const dnfLaps = Array.from({ length: 11 }, (_, i) => {
    const lap = i * 6; // 0, 6, 12, ... 60
    const survival = Math.exp(-Math.pow(lap / weibullL, weibullK));
    return { lap, survival: Math.round(survival * 100) };
  });

  // Tyre degradation curves base calculations shifting with Temp and Fuel
  // SOFT, MEDIUM, HARD base lap times at Monza (81.5s base)
  // SOFT wears fast, MEDIUM moderate, HARD slow
  const getTyreDegCurve = (compound: "soft" | "medium" | "hard") => {
    const tempOffset = (tyreTrackTemp - 30) * 0.015;
    const fuelOffset = tyreFuelLoad * 0.035;
    const basePace = 80.5 + fuelOffset + tempOffset;
    
    const degRates = { soft: 0.12, medium: 0.06, hard: 0.03 };
    const cliffLaps = { soft: 14, medium: 22, hard: 32 };
    const rate = degRates[compound];
    const cliff = cliffLaps[compound];

    return Array.from({ length: 11 }, (_, i) => {
      const lap = i * 4; // 0, 4, 8, ... 40
      let wear = lap * rate;
      if (lap > cliff) {
        // Exponential cliff wear
        wear += Math.pow(lap - cliff, 1.8) * 0.08;
      }
      return { lap, pace: basePace + wear };
    });
  };

  const softCurve = getTyreDegCurve("soft");
  const mediumCurve = getTyreDegCurve("medium");
  const hardCurve = getTyreDegCurve("hard");

  // Math limits for plotting
  const minPace = Math.min(...softCurve.map(c => c.pace), ...mediumCurve.map(c => c.pace)) - 0.5;
  const maxPace = Math.max(...softCurve.map(c => c.pace), ...mediumCurve.map(c => c.pace)) + 1.0;
  const scalePace = (pace: number) => {
    const range = maxPace - minPace || 1;
    return 120 - ((pace - minPace) / range) * 100;
  };

  const TOPIC_REGISTRY: Record<Exclude<Topic, "overview">, TopicData> = {
    elo: {
      title: "Driver Elo Rating Engine",
      scope: "ML-SCOPE-01",
      version: "v1.2.4",
      runMode: "LIVE SESSION CRON",
      apiPath: "/api/predict/elo/rankings",
      summary: "Isolates driver skill from constructor performance by scoring head-to-head qualifying and race results specifically against same-car teammates.",
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

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
      {/* Sidebar navigation */}
      <div className="panel panel-scanner" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem", flex: "1 1 280px" }}>
        <div>
          <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.75rem", fontWeight: 700 }}>
            CORE PLATFORM
          </div>
          <button
            onClick={() => setActiveTopic("overview")}
            className="text-mono"
            style={{
              width: "100%",
              textAlign: "left",
              background: activeTopic === "overview" ? "rgba(0,212,255,0.08)" : "transparent",
              border: activeTopic === "overview" ? "1px solid var(--accent-primary)" : "1px solid transparent",
              color: activeTopic === "overview" ? "var(--accent-primary)" : "var(--text-secondary)",
              padding: "0.5rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: "bold",
              cursor: "pointer",
              borderRadius: "2px",
              transition: "all 0.2s"
            }}
          >
            ❖ System Overview
          </button>
        </div>

        <div>
          <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.75rem", fontWeight: 700 }}>
            PREDICTION MODELS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {[
              { id: "elo", label: "Driver Elo Ratings" },
              { id: "laptime", label: "Tyre & Lap Regressor" },
              { id: "strategy", label: "Pit Strategy Solver" },
              { id: "montecarlo", label: "MC Champ Simulator" },
              { id: "form", label: "Driver Form Index" },
              { id: "weather", label: "Weather Impact Model" },
              { id: "outcome", label: "Race Outcome Predictor" },
              { id: "dnf", label: "DNF Risk Predictor" },
              { id: "quali", label: "Qualifying Predictor" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveTopic(m.id as Topic)}
                className="text-mono"
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: activeTopic === m.id ? "rgba(0,212,255,0.08)" : "transparent",
                  border: activeTopic === m.id ? "1px solid var(--accent-primary)" : "1px solid transparent",
                  color: activeTopic === m.id ? "var(--accent-primary)" : "var(--text-secondary)",
                  padding: "0.45rem 0.75rem",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "2px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (activeTopic !== m.id) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTopic !== m.id) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                ⬡ {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Wiki Detail Content */}
      <div className="panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", flex: "999 1 500px", minWidth: "300px" }}>
        {activeTopic === "overview" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.6rem", color: "var(--accent-primary)", margin: 0 }}>F1 Predictive Modeling Overview</h2>
              <p className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.25rem", letterSpacing: "0.08em" }}>
                CORE TELEMETRY INFRASTRUCTURE & ML ENGINE DATA FLOWS
              </p>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              The **APEX F1 Analytical Platform** deploys a series of classical statistics, quadratic regressors, survival hazard models, and tree-based classification systems to compute telemetry predictions.
              Unlike real-time state metrics (owned by Silverwall), the APEX ML microservice processes historical timelines from a serverless **Neon PostgreSQL** database and feeds outputs dynamically to the React clients.
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {[
                { title: "Neon PostgreSQL", desc: "Houses 25+ years of historical lap timing tables, results, and tyre stop metrics.", icon: "⚡" },
                { title: "FastAPI Python Backend", desc: "Houses scikit-learn, XGBoost, and statsmodels modules running batch jobs.", icon: "❖" },
                { title: "Dynamic Sync Worker", desc: "A cron sync worker executes periodically to sync standings and update ratings.", icon: "⬡" }
              ].map((c) => (
                <div key={c.title} style={{ flex: "1 1 200px", padding: "1rem", background: "var(--bg-elevated)", borderRadius: "3px", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>{c.icon}</span>
                    <h4 style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{c.title}</h4>
                  </div>
                  <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>{c.desc}</p>
                </div>
              ))}
            </div>

            <div className="section-header">
              <span className="section-title">Ingestion & Sync Architecture</span>
              <div className="section-header-line" />
            </div>

            <div style={{ background: "var(--bg-void)", border: "1px solid var(--border-subtle)", padding: "1.25rem", borderRadius: "4px" }}>
              <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", marginBottom: "0.75rem", fontWeight: 700 }}>
                APEX CORE DATA FEED CONNECTIONS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { step: "1. Jolpica Ingestor", desc: "Pulls schedule summaries and timing records from the historical APIs and seeds database." },
                  { step: "2. ML Sync Pipeline", desc: "Extracts grouped driver stints and syncs them to local caches on the FastAPI python container." },
                  { step: "3. Prediction Inference", desc: "React frontend calls /predict endpoints which queries the cached weights for high-fidelity outputs." }
                ].map((s) => (
                  <div key={s.step} style={{ display: "flex", gap: "1rem" }}>
                    <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: "bold", minWidth: "120px" }}>{s.step}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          (() => {
            const data = TOPIC_REGISTRY[activeTopic];
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Header info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.6rem", color: "var(--accent-primary)", margin: 0 }}>{data.title}</h2>
                    <p className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.25rem", letterSpacing: "0.08em" }}>
                      SCOPE: {data.scope} · VERSION: {data.version}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                    <span
                      className="text-mono"
                      style={{
                        fontSize: "0.55rem",
                        fontWeight: "bold",
                        background: "rgba(0, 212, 255, 0.1)",
                        border: "1px solid var(--border-accent)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "2px",
                        color: "var(--accent-primary)"
                      }}
                    >
                      {data.runMode}
                    </span>
                    <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>
                      API: {data.apiPath}
                    </span>
                  </div>
                </div>

                {/* Brief Summary */}
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {data.summary}
                </div>

                {/* Split layout: left steps, right formula */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                  <div style={{ flex: "1.2 1 300px" }}>
                    <div className="section-header" style={{ marginBottom: "0.75rem" }}>
                      <span className="section-title">Algorithmic Execution Steps</span>
                      <div className="section-header-line" />
                    </div>
                    <ul style={{ paddingLeft: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {data.logicSteps.map((s, idx) => (
                        <li key={idx} style={{ fontSize: "0.7rem", color: "var(--text-secondary)", listStyleType: "square" }}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ flex: "0.8 1 250px" }}>
                    <div className="section-header" style={{ marginBottom: "0.75rem" }}>
                      <span className="section-title">Mathematical Formulation</span>
                      <div className="section-header-line" />
                    </div>
                    <pre
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.65rem",
                        background: "var(--bg-void)",
                        padding: "1rem",
                        borderRadius: "3px",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--accent-primary)",
                        overflowX: "auto",
                        margin: 0
                      }}
                    >
                      {data.formula}
                    </pre>
                  </div>
                </div>

                {/* Feature Registry Table */}
                <div>
                  <div className="section-header" style={{ marginBottom: "0.75rem" }}>
                    <span className="section-title">Feature Inputs Registry</span>
                    <div className="section-header-line" />
                  </div>
                  <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "3px", overflowX: "auto" }}>
                    <div style={{ minWidth: "550px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 1fr", background: "var(--bg-elevated)", padding: "0.4rem 0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        {["FEATURE CODE", "DATA TYPE", "DATABASE FEED SOURCE", "MODEL WEIGHT"].map((h) => (
                          <span key={h} className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 700 }}>
                            {h}
                          </span>
                        ))}
                      </div>
                      {data.features.map((f, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 1fr", padding: "0.5rem 0.75rem", borderBottom: i < data.features.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)" }}>{f.code}</span>
                          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)" }}>{f.type}</span>
                          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>{f.source}</span>
                          <span className="text-mono" style={{ fontSize: "0.65rem", color: f.weight.includes("Critical") || f.weight.includes("High") ? "var(--accent-warning)" : "var(--text-muted)" }}>{f.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Physics Sandbox Widget */}
                <div style={{ marginTop: "0.5rem" }}>
                  <div className="section-header" style={{ marginBottom: "0.75rem" }}>
                    <span className="section-title">Interactive Model Sandbox Playground</span>
                    <div className="section-header-line" />
                  </div>

                  <div className="panel" style={{ padding: "1.25rem", background: "rgba(0, 212, 255, 0.01)" }}>
                    {activeTopic === "elo" && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                        {/* Sliders */}
                        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Driver A Elo</span>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: "bold" }}>{eloDriverA}</span>
                            </div>
                            <input
                              type="range"
                              min="1400"
                              max="2100"
                              value={eloDriverA}
                              onChange={(e) => setEloDriverA(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--accent-primary)" }}
                            />
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Driver B Elo</span>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-warning)", fontWeight: "bold" }}>{eloDriverB}</span>
                            </div>
                            <input
                              type="range"
                              min="1400"
                              max="2100"
                              value={eloDriverB}
                              onChange={(e) => setEloDriverB(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--accent-warning)" }}
                            />
                          </div>
                        </div>

                        {/* Interactive SVG Probability Gauge */}
                        <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                          <svg viewBox="0 0 240 90" style={{ width: "100%", height: "auto", maxWidth: "240px" }}>
                            {/* Background track */}
                            <path d="M 20 80 A 100 100 0 0 1 220 80" fill="none" stroke="var(--border-subtle)" strokeWidth="8" strokeLinecap="round" />
                            {/* Driver A segment */}
                            <path
                              d="M 20 80 A 100 100 0 0 1 220 80"
                              fill="none"
                              stroke="var(--accent-primary)"
                              strokeWidth="8"
                              strokeDasharray={`${probA * 314} 314`}
                              strokeLinecap="round"
                            />
                            {/* Divider indicator pin */}
                            <line
                              x1="120"
                              y1="80"
                              x2={120 - 70 * Math.cos(probA * Math.PI)}
                              y2={80 - 70 * Math.sin(probA * Math.PI)}
                              stroke="var(--text-primary)"
                              strokeWidth="3"
                            />
                            <circle cx="120" cy="80" r="4" fill="var(--text-primary)" />
                          </svg>
                          <div style={{ display: "flex", gap: "2rem", marginTop: "0.5rem" }}>
                            <div style={{ textAlign: "center" }}>
                              <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>PROBABILITY A</div>
                              <div className="text-mono" style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--accent-primary)" }}>{(probA * 100).toFixed(1)}%</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>PROBABILITY B</div>
                              <div className="text-mono" style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--accent-warning)" }}>{(probB * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTopic === "dnf" && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                        {/* Sliders */}
                        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Track Severity</span>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-danger)", fontWeight: "bold" }}>{(trackSeverity * 100).toFixed(0)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={trackSeverity}
                              onChange={(e) => setTrackSeverity(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--accent-danger)" }}
                            />
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>PU Component Reliability</span>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-success)", fontWeight: "bold" }}>{(puReliability * 100).toFixed(0)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.3"
                              max="1"
                              step="0.05"
                              value={puReliability}
                              onChange={(e) => setPuReliability(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--accent-success)" }}
                            />
                          </div>
                        </div>

                        {/* Interactive Weibull Survival Curve Plot */}
                        <div style={{ flex: "1 1 280px" }}>
                          <span className="text-mono" style={{ display: "block", fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                            PROJECTED SURVIVAL PROBABILITY (CLASSIFIED %) BY LAP
                          </span>
                          <div style={{ display: "flex", alignItems: "flex-end", height: "100px", gap: "4px", borderBottom: "1px solid var(--border-subtle)", borderLeft: "1px solid var(--border-subtle)", paddingLeft: "0.5rem" }}>
                            {dnfLaps.map((pt) => (
                              <div key={pt.lap} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div
                                  style={{
                                    width: "100%",
                                    height: `${pt.survival}px`,
                                    background: pt.survival > 75 ? "rgba(34,197,94,0.3)" : (pt.survival > 40 ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.3)"),
                                    borderTop: `2px solid ${pt.survival > 75 ? "var(--accent-success)" : (pt.survival > 40 ? "var(--accent-warning)" : "var(--accent-danger)")}`,
                                    borderRadius: "1px 1px 0 0"
                                  }}
                                />
                                <span className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>L{pt.lap}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTopic === "laptime" && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                        {/* Sliders */}
                        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Track Temperature</span>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-warning)", fontWeight: "bold" }}>{tyreTrackTemp}°C</span>
                            </div>
                            <input
                              type="range"
                              min="15"
                              max="55"
                              value={tyreTrackTemp}
                              onChange={(e) => setTyreTrackTemp(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--accent-warning)" }}
                            />
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Starting Fuel Load</span>
                              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: "bold" }}>{tyreFuelLoad} kg</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="110"
                              value={tyreFuelLoad}
                              onChange={(e) => setTyreFuelLoad(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--accent-primary)" }}
                            />
                          </div>
                        </div>

                        {/* Interactive Degradation Curves Map SVG */}
                        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <svg viewBox="0 0 320 130" style={{ width: "100%", height: "auto", maxWidth: "320px" }}>
                            {/* Grid lines */}
                            <line x1="20" y1="20" x2="300" y2="20" stroke="var(--border-subtle)" strokeDasharray="2 2" />
                            <line x1="20" y1="70" x2="300" y2="70" stroke="var(--border-subtle)" strokeDasharray="2 2" />
                            <line x1="20" y1="120" x2="300" y2="120" stroke="var(--border-subtle)" />

                            {/* SOFT spline */}
                            <path
                              d={`M ${softCurve.map((c, i) => `${20 + i * 28} ${scalePace(c.pace)}`).join(" L ")}`}
                              fill="none"
                              stroke="#ff4466"
                              strokeWidth="2.5"
                            />
                            {/* MEDIUM spline */}
                            <path
                              d={`M ${mediumCurve.map((c, i) => `${20 + i * 28} ${scalePace(c.pace)}`).join(" L ")}`}
                              fill="none"
                              stroke="#ffcc00"
                              strokeWidth="2.5"
                            />
                            {/* HARD spline */}
                            <path
                              d={`M ${hardCurve.map((c, i) => `${20 + i * 28} ${scalePace(c.pace)}`).join(" L ")}`}
                              fill="none"
                              stroke="#cccccc"
                              strokeWidth="2"
                            />
                          </svg>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", padding: "0 10px" }}>
                            <span className="text-mono" style={{ fontSize: "0.55rem", color: "#ff4466" }}>SOFT</span>
                            <span className="text-mono" style={{ fontSize: "0.55rem", color: "#ffcc00" }}>MEDIUM</span>
                            <span className="text-mono" style={{ fontSize: "0.55rem", color: "#cccccc" }}>HARD</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!["elo", "dnf", "laptime"].includes(activeTopic) && (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80px" }}>
                        <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          ⚡ Model playground loaded. Sliders configured on FastAPI python microservice.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
