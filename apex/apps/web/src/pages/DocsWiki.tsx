import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { TOPIC_REGISTRY } from "./DocsData";

// Premium Inline SVGs
const BookIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
  </svg>
);

const GearIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const RegistryIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const LightningIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const ApiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const SyncIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const DocIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

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

export default function DocsWiki({ subTab = "concept" }: { subTab?: "concept" | "logic" | "features" | "sandbox" | "changelog" }) {
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState<Topic>("overview");
  const [conceptStep, setConceptStep] = useState<"what" | "why" | "when" | "how" | "compare">("what");

  const activeSubTab = subTab;
  const setActiveSubTab = (tab: "concept" | "logic" | "features" | "sandbox" | "changelog") => {
    const pathMap = {
      concept: "/docs",
      logic: "/docs/math",
      features: "/docs/sources",
      sandbox: "/docs/sandbox",
      changelog: "/docs/changelog"
    };
    navigate(pathMap[tab]);
  };

  const handleTopicChange = (topic: Topic) => {
    setActiveTopic(topic);
    setActiveSubTab("concept");
    setConceptStep("what");
  };

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
              background: activeTopic === "overview" ? "var(--accent-tint)" : "transparent",
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
                onClick={() => handleTopicChange(m.id as Topic)}
                className="text-mono"
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: activeTopic === m.id ? "var(--accent-tint)" : "transparent",
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
                    (e.currentTarget as HTMLElement).style.background = "var(--accent-tint)";
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
                { title: "Neon PostgreSQL", desc: "Houses 25+ years of historical lap timing tables, results, and tyre stop metrics.", icon: <DatabaseIcon /> },
                { title: "FastAPI Python Backend", desc: "Houses scikit-learn, XGBoost, and statsmodels modules running batch jobs.", icon: <ApiIcon /> },
                { title: "Dynamic Sync Worker", desc: "A cron sync worker executes periodically to sync standings and update ratings.", icon: <SyncIcon /> }
              ].map((c) => (
                <div key={c.title} style={{ flex: "1 1 200px", padding: "1rem", background: "var(--bg-elevated)", borderRadius: "3px", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    {c.icon}
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

                {/* Sub-tabs Segmented Navigation */}
                <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.25rem" }}>
                  {[
                    { id: "concept", label: "Concept Overview", path: "/docs", icon: <BookIcon /> },
                    { id: "logic", label: "Logic & Math", path: "/docs/math", icon: <GearIcon /> },
                    { id: "features", label: "Ingest Registry", path: "/docs/sources", icon: <RegistryIcon /> },
                    { id: "sandbox", label: "Sandbox Playground", path: "/docs/sandbox", icon: <LightningIcon /> },
                    { id: "changelog", label: "Changelog", path: "/docs/changelog", icon: <DocIcon /> }
                  ].map((tab) => {
                    const isActive = activeSubTab === tab.id;
                    return (
                      <NavLink
                        key={tab.id}
                        to={tab.path}
                        end={tab.id === "concept"}
                        className="text-mono"
                        style={{
                          background: "transparent",
                          border: "none",
                          borderBottom: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
                          color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                          padding: "0.5rem 1rem",
                          fontSize: "0.75rem",
                          fontWeight: isActive ? "bold" : "normal",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          textDecoration: "none"
                        }}
                      >
                        {tab.icon}
                        {tab.label}
                      </NavLink>
                    );
                  })}
                </div>

                {/* Sub-tab Content Area */}
                <div style={{ marginTop: "1rem" }}>
                  {activeSubTab === "concept" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {/* Short summary banner */}
                      <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.6, borderLeft: "3px solid var(--accent-primary)", paddingLeft: "1rem", fontStyle: "italic", background: "var(--accent-tint)", padding: "0.75rem 1rem", borderRadius: "0 4px 4px 0" }}>
                        "{data.summary}"
                      </div>

                      {/* Progressive Guided Stepper Bar */}
                      <div style={{ display: "flex", alignItems: "center", width: "100%", margin: "1rem 0 1.5rem 0", flexWrap: "wrap", gap: "1rem" }}>
                        {[
                          { id: "what", title: "Definition" },
                          { id: "why", title: "Purpose" },
                          { id: "when", title: "Trigger" },
                          { id: "how", title: "Deep Dive" },
                          { id: "compare", title: "Compare F1" }
                        ].map((step, index) => {
                          const isCurrent = conceptStep === step.id;
                          const stepsOrder = ["what", "why", "when", "how", "compare"];
                          const currentIdx = stepsOrder.indexOf(conceptStep);
                          const stepIdx = stepsOrder.indexOf(step.id);
                          const isCompleted = stepIdx < currentIdx;

                          return (
                            <div key={step.id} style={{ display: "flex", alignItems: "center", flex: index < 4 ? "1 1 120px" : "none" }}>
                              <button
                                onClick={() => setConceptStep(step.id as any)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  padding: 0,
                                  textAlign: "left",
                                  outline: "none"
                                }}
                              >
                                <div style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: isCurrent ? "var(--accent-primary)" : (isCompleted ? "rgba(232, 160, 32, 0.15)" : "var(--bg-elevated)"),
                                  border: isCurrent ? "2px solid var(--accent-primary)" : `1px solid ${isCompleted ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                                  color: isCurrent ? "var(--bg-void)" : (isCompleted ? "var(--accent-primary)" : "var(--text-muted)"),
                                  fontSize: "0.65rem",
                                  fontWeight: "bold",
                                  boxShadow: isCurrent ? "0 0 8px var(--accent-dim)" : "none",
                                  transition: "all 0.2s"
                                }}>
                                  {index + 1}
                                </div>
                                <span className="text-mono" style={{
                                  fontSize: "0.75rem",
                                  fontWeight: isCurrent ? "bold" : 600,
                                  color: isCurrent ? "var(--accent-primary)" : (isCompleted ? "var(--text-primary)" : "var(--text-muted)"),
                                  letterSpacing: "0.05em"
                                }}>
                                  {step.title}
                                </span>
                              </button>
                              
                              {index < 4 && (
                                <div style={{
                                  flex: 1,
                                  height: "1px",
                                  background: isCompleted ? "var(--accent-primary)" : "var(--border-subtle)",
                                  margin: "0 0.75rem",
                                  opacity: 0.5,
                                  transition: "background 0.3s ease",
                                  minWidth: "20px"
                                }} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Content Panels with Sequential Action Flow Buttons */}
                      {conceptStep === "what" && (
                        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                          <div style={{ background: "var(--accent-tint)", borderLeft: "3px solid var(--accent-primary)", padding: "1.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", borderLeftWidth: "3px" }}>
                            <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>
                              01 // CORE CONCEPT & DEFINITION
                            </div>
                            <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", margin: "0 0 0.75rem 0", letterSpacing: "0.02em" }}>
                              What is the {data.title}?
                            </h3>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
                              {data.what}
                            </p>
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                            <button
                              onClick={() => setConceptStep("why")}
                              className="btn-primary"
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                            >
                              Next: Purpose ➔
                            </button>
                          </div>
                        </div>
                      )}

                      {conceptStep === "why" && (
                        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                          <div style={{ background: "rgba(251, 191, 36, 0.015)", borderLeft: "3px solid var(--accent-warning)", padding: "1.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", borderLeftWidth: "3px" }}>
                            <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-warning)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>
                              02 // ANALYTICAL VALUE & PURPOSE
                            </div>
                            <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", margin: "0 0 0.75rem 0", letterSpacing: "0.02em" }}>
                              Why do we use this model?
                            </h3>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
                              {data.why}
                            </p>
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                            <button
                              onClick={() => setConceptStep("what")}
                              className="text-mono"
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-secondary)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                padding: "0.5rem 1.25rem",
                                cursor: "pointer",
                                borderRadius: "2px"
                              }}
                            >
                              ⬅ Back: Definition
                            </button>
                            <button
                              onClick={() => setConceptStep("when")}
                              className="btn-primary"
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                            >
                              Next: Trigger ➔
                            </button>
                          </div>
                        </div>
                      )}

                      {conceptStep === "when" && (
                        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                          <div style={{ background: "rgba(34, 197, 94, 0.015)", borderLeft: "3px solid var(--accent-success)", padding: "1.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", borderLeftWidth: "3px" }}>
                            <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-success)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>
                              03 // SYSTEM INTEGRATION & TRIGGER
                            </div>
                            <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", margin: "0 0 0.75rem 0", letterSpacing: "0.02em" }}>
                              When does it run?
                            </h3>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
                              {data.when}
                            </p>
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                            <button
                              onClick={() => setConceptStep("why")}
                              className="text-mono"
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-secondary)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                padding: "0.5rem 1.25rem",
                                cursor: "pointer",
                                borderRadius: "2px"
                              }}
                            >
                              ⬅ Back: Purpose
                            </button>
                            <button
                              onClick={() => setConceptStep("how")}
                              className="btn-primary"
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                            >
                              Next: Deep Dive ➔
                            </button>
                          </div>
                        </div>
                      )}

                       {conceptStep === "how" && (
                        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                          <div style={{ background: "rgba(232, 160, 32, 0.015)", borderLeft: "3px solid var(--accent-primary)", padding: "1.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", borderLeftWidth: "3px" }}>
                            <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>
                              04 // METHODOLOGY & DETAILS
                            </div>
                            <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", margin: "0 0 0.75rem 0", letterSpacing: "0.02em" }}>
                              Methodology Deep Dive
                            </h3>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
                              {data.how}
                            </p>
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                            <button
                              onClick={() => setConceptStep("when")}
                              className="text-mono"
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-secondary)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                padding: "0.5rem 1.25rem",
                                cursor: "pointer",
                                borderRadius: "2px"
                              }}
                            >
                              ⬅ Back: Trigger
                            </button>
                            <button
                              onClick={() => setConceptStep("compare")}
                              className="btn-primary"
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                            >
                              Next: Compare F1 ➔
                            </button>
                          </div>
                        </div>
                      )}

                      {conceptStep === "compare" && (
                        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderLeft: "3px solid var(--accent-primary)", padding: "1.5rem", borderRadius: "0 4px 4px 0", borderLeftWidth: "3px" }}>
                            <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>
                              05 // APEX VS OFFICIAL F1 COMPARISON
                            </div>
                            <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", margin: "0 0 0.75rem 0", letterSpacing: "0.02em" }}>
                              APEX vs. Official F1 Ratings
                            </h3>
                            <div className="compare-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
                              {/* Official F1 Model */}
                              <div className="matrix-card f1" style={{ border: "1px solid var(--border-subtle)", borderTop: "2px solid var(--status-danger)", padding: "1.25rem", borderRadius: "4px" }}>
                                <div className="matrix-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontFamily: "var(--font-display)", fontWeight: "bold" }}>
                                  <span style={{ color: "var(--text-primary)" }}>{data.f1Compare.title}</span>
                                  <span style={{ fontSize: "0.6rem", color: "var(--status-danger)", border: "1px solid var(--status-danger)", padding: "0.1rem 0.4rem", borderRadius: "2px", fontFamily: "var(--font-mono)" }}>
                                    {data.f1Compare.badge}
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                  {data.f1Compare.items.map((item, idx) => (
                                    <div key={idx} style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
                                      <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.15rem" }}>{item.label}:</strong>
                                      <span style={{ color: "var(--text-secondary)" }}>{item.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* APEX Model */}
                              <div className="matrix-card apex" style={{ border: "1px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)", padding: "1.25rem", borderRadius: "4px" }}>
                                <div className="matrix-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontFamily: "var(--font-display)", fontWeight: "bold" }}>
                                  <span style={{ color: "var(--text-primary)" }}>{data.apexCompare.title}</span>
                                  <span style={{ fontSize: "0.6rem", color: "var(--accent-primary)", border: "1px solid var(--border-accent)", padding: "0.1rem 0.4rem", borderRadius: "2px", fontFamily: "var(--font-mono)" }}>
                                    {data.apexCompare.badge}
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                  {data.apexCompare.items.map((item, idx) => (
                                    <div key={idx} style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
                                      <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.15rem" }}>{item.label}:</strong>
                                      <span style={{ color: "var(--text-secondary)" }}>{item.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                            <button
                              onClick={() => setConceptStep("how")}
                              className="text-mono"
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-secondary)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                padding: "0.5rem 1.25rem",
                                cursor: "pointer",
                                borderRadius: "2px"
                              }}
                            >
                              ⬅ Back: Deep Dive
                            </button>
                            <button
                              onClick={() => setActiveSubTab("logic")}
                              className="btn-primary"
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                            >
                              Explore Logic & Math ➔
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSubTab === "logic" && (
                    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                        <div style={{ flex: "1.2 1 300px" }}>
                          <div className="section-header" style={{ marginBottom: "1rem" }}>
                            <span className="section-title" style={{ fontSize: "0.75rem" }}>Algorithmic Execution Steps</span>
                            <div className="section-header-line" />
                          </div>
                          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {data.logicSteps.map((s, idx) => (
                              <li key={idx} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, listStyleType: "square" }}>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ flex: "0.8 1 250px" }}>
                          <div className="section-header" style={{ marginBottom: "1rem" }}>
                            <span className="section-title" style={{ fontSize: "0.75rem" }}>Mathematical Formulation</span>
                            <div className="section-header-line" />
                          </div>
                          <pre
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.75rem",
                              background: "var(--bg-void)",
                              padding: "1.25rem",
                              borderRadius: "3px",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--accent-primary)",
                              overflowX: "auto",
                              margin: 0,
                              lineHeight: 1.6
                            }}
                          >
                            {data.formula}
                          </pre>
                        </div>
                      </div>

                      {/* Math Term Glossary Grid (New in v3.0) */}
                      {data.mathTerms && data.mathTerms.length > 0 && (
                        <div style={{ marginTop: "1rem" }}>
                          <div className="section-header" style={{ marginBottom: "1rem" }}>
                            <span className="section-title" style={{ fontSize: "0.75rem" }}>Variable Glossary</span>
                            <div className="section-header-line" />
                          </div>
                          <div className="glossary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                            {data.mathTerms.map((term, idx) => (
                              <div key={idx} className="glossary-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-ghost)", padding: "1rem", borderRadius: "4px" }}>
                                <h5 style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-primary)", margin: "0 0 0.4rem 0" }}>
                                  {term.symbol} — {term.name}
                                </h5>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
                                  {term.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                        <button
                          onClick={() => setActiveSubTab("features")}
                          className="btn-primary"
                          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                          Next Tab: Ingest Registry ➔
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSubTab === "features" && (
                    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div>
                        <div className="section-header" style={{ marginBottom: "1rem" }}>
                          <span className="section-title" style={{ fontSize: "0.75rem" }}>Feature Inputs Registry</span>
                          <div className="section-header-line" />
                        </div>
                        <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "3px", overflowX: "auto" }}>
                          <div style={{ minWidth: "550px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 1fr", background: "var(--bg-elevated)", padding: "0.6rem 1rem", borderBottom: "1px solid var(--border-subtle)" }}>
                              {["FEATURE CODE", "DATA TYPE", "DATABASE FEED SOURCE", "MODEL WEIGHT"].map((h) => (
                                <span key={h} className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>
                                  {h}
                                </span>
                              ))}
                            </div>
                            {data.features.map((f, i) => (
                              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 1fr", padding: "0.75rem 1rem", borderBottom: i < data.features.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                                <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--accent-primary)" }}>{f.code}</span>
                                <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-primary)" }}>{f.type}</span>
                                <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{f.source}</span>
                                <span className="text-mono" style={{ fontSize: "0.75rem", color: f.weight.includes("Critical") || f.weight.includes("High") ? "var(--accent-warning)" : "var(--text-muted)" }}>{f.weight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Data Ingestion Pipeline Diagram */}
                      <div style={{ marginTop: "1rem" }}>
                        <div className="section-header" style={{ marginBottom: "1rem" }}>
                          <span className="section-title" style={{ fontSize: "0.75rem" }}>Data Ingestion Pipeline Flow</span>
                          <div className="section-header-line" />
                        </div>
                        <div style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-ghost)",
                          padding: "1.25rem",
                          borderRadius: "4px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                          flexWrap: "wrap"
                        }}>
                          {[
                            { step: "OpenF1 Feed", desc: "Live timing json" },
                            { step: "Bun Cron", desc: "Ingestion tick" },
                            { step: "DB Cache", desc: "PostgreSQL" },
                            { step: "APEX Models", desc: "Python Inference" },
                            { step: "Frontend", desc: "Telemetry UI" }
                          ].map((s, idx, arr) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <div style={{
                                background: "var(--bg-void)",
                                border: "1px solid var(--border-subtle)",
                                padding: "0.6rem 0.8rem",
                                borderRadius: "2px",
                                textAlign: "center"
                              }}>
                                <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--accent-primary)", fontWeight: "bold" }}>{s.step}</span>
                                <span className="text-mono" style={{ display: "block", fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{s.desc}</span>
                              </div>
                              {idx < arr.length - 1 && (
                                <span className="text-mono" style={{ fontSize: "0.85rem", color: "var(--accent-primary)" }}>➜</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                        <button
                          onClick={() => setActiveSubTab("sandbox")}
                          className="btn-primary"
                          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                          Next Tab: Sandbox Playground ➜
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSubTab === "sandbox" && (
                    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div>
                        <div className="section-header" style={{ marginBottom: "1rem" }}>
                          <span className="section-title" style={{ fontSize: "0.75rem" }}>Interactive Model Sandbox Playground</span>
                          <div className="section-header-line" />
                        </div>

                        <div className="panel" style={{ padding: "1.5rem", background: "var(--accent-tint)" }}>
                          {activeTopic === "elo" && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                              {/* Sliders */}
                              <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                    <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Driver A Elo</span>
                                    <span className="text-mono" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: "bold" }}>{eloDriverA}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1400"
                                    max="2100"
                                    value={eloDriverA}
                                    onChange={(e) => setEloDriverA(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
                                  />
                                </div>

                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                    <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Driver B Elo</span>
                                    <span className="text-mono" style={{ fontSize: "0.8rem", color: "var(--accent-warning)", fontWeight: "bold" }}>{eloDriverB}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1400"
                                    max="2100"
                                    value={eloDriverB}
                                    onChange={(e) => setEloDriverB(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--accent-warning)", cursor: "pointer" }}
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
                                <div style={{ display: "flex", gap: "2rem", marginTop: "0.75rem" }}>
                                  <div style={{ textAlign: "center" }}>
                                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>PROBABILITY A</div>
                                    <div className="text-mono" style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--accent-primary)" }}>{(probA * 100).toFixed(1)}%</div>
                                  </div>
                                  <div style={{ textAlign: "center" }}>
                                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>PROBABILITY B</div>
                                    <div className="text-mono" style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--accent-warning)" }}>{(probB * 100).toFixed(1)}%</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTopic === "dnf" && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                              {/* Sliders */}
                              <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                    <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Track Severity</span>
                                    <span className="text-mono" style={{ fontSize: "0.8rem", color: "var(--accent-danger)", fontWeight: "bold" }}>{(trackSeverity * 100).toFixed(0)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={trackSeverity}
                                    onChange={(e) => setTrackSeverity(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--accent-danger)", cursor: "pointer" }}
                                  />
                                </div>

                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                    <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>PU Component Reliability</span>
                                    <span className="text-mono" style={{ fontSize: "0.8rem", color: "var(--accent-success)", fontWeight: "bold" }}>{(puReliability * 100).toFixed(0)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.3"
                                    max="1"
                                    step="0.05"
                                    value={puReliability}
                                    onChange={(e) => setPuReliability(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--accent-success)", cursor: "pointer" }}
                                  />
                                </div>
                              </div>

                              {/* Interactive Weibull Survival Curve Plot */}
                              <div style={{ flex: "1 1 280px" }}>
                                <span className="text-mono" style={{ display: "block", fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
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
                              <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                    <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Track Temperature</span>
                                    <span className="text-mono" style={{ fontSize: "0.8rem", color: "var(--accent-warning)", fontWeight: "bold" }}>{tyreTrackTemp}°C</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="15"
                                    max="55"
                                    value={tyreTrackTemp}
                                    onChange={(e) => setTyreTrackTemp(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--accent-warning)", cursor: "pointer" }}
                                  />
                                </div>

                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                    <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Starting Fuel Load</span>
                                    <span className="text-mono" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: "bold" }}>{tyreFuelLoad} kg</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="110"
                                    value={tyreFuelLoad}
                                    onChange={(e) => setTyreFuelLoad(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
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
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", padding: "0 10px" }}>
                                  <span className="text-mono" style={{ fontSize: "0.6rem", color: "#ff4466" }}>SOFT</span>
                                  <span className="text-mono" style={{ fontSize: "0.6rem", color: "#ffcc00" }}>MEDIUM</span>
                                  <span className="text-mono" style={{ fontSize: "0.6rem", color: "#cccccc" }}>HARD</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {!["elo", "dnf", "laptime"].includes(activeTopic) && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80px" }}>
                              <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                ⚡ Model playground loaded. Sliders configured on FastAPI python microservice.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
                        <button
                          onClick={() => handleTopicChange(activeTopic)}
                          className="text-mono"
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                            fontSize: "0.75rem",
                            padding: "0.5rem 1.25rem",
                            cursor: "pointer",
                            borderRadius: "2px"
                          }}
                        >
                          ↺ Restart Guide
                        </button>
                        <button
                          onClick={() => setActiveSubTab("changelog")}
                          className="text-mono"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent-primary)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          Next Tab: Changelog ➔
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSubTab === "changelog" && (
                    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div>
                        <div className="section-header" style={{ marginBottom: "1rem" }}>
                          <span className="section-title" style={{ fontSize: "0.75rem" }}>System Change Log & Version History</span>
                          <div className="section-header-line" />
                        </div>

                        <div className="panel" style={{ padding: "1.5rem" }}>
                          <p className="text-secondary" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                            Audit trail of mathematical optimizations, weight adjustments, and database schema updates across all F1 telemetry models.
                          </p>

                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {[
                              {
                                version: "v2.1.0-beta",
                                date: "2026-06-05",
                                model: "Monte Carlo Engine",
                                severity: "Major",
                                desc: "Recalibrated championship transition probabilities using 2026 pre-season simulation coefficients. Adjusted weightings for power unit wear metrics."
                              },
                              {
                                version: "v2.0.4",
                                date: "2026-05-28",
                                model: "Tyre Degradation",
                                severity: "Minor",
                                desc: "Refined thermal degradation curve fitting for high-downforce tracks (Spa, Silverstone) under track temperature surges exceeding 45°C."
                              },
                              {
                                version: "v2.0.0",
                                date: "2026-05-15",
                                model: "Driver Elo / H2H",
                                severity: "Critical",
                                desc: "Migrated from linear performance index to ensemble XGBoost + dynamic Elo scoring. Resolved cold-start rating drift for rookies and reserve drivers."
                              },
                              {
                                version: "v1.8.2",
                                date: "2026-04-30",
                                model: "Pit Wall Planner",
                                severity: "Major",
                                desc: "Optimized multi-agent state space traversal for rain-to-dry pit window transition recommendations, reducing API search latency by 45%."
                              },
                              {
                                version: "v1.7.0",
                                date: "2026-04-12",
                                model: "Ingestion Pipeline",
                                severity: "Info",
                                desc: "Aligned timing telemetry parsing rate to 250ms ticks. Upgraded OpenF1 API polling queue buffers to prevent packet drop during peak race conditions."
                              }
                            ].map((log, idx) => {
                              let badgeColor = "var(--text-muted)";
                              let badgeBg = "var(--bg-elevated)";
                              if (log.severity === "Critical") {
                                badgeColor = "var(--status-danger)";
                                badgeBg = "rgba(192, 57, 43, 0.15)";
                              } else if (log.severity === "Major") {
                                badgeColor = "var(--status-warning)";
                                badgeBg = "rgba(184, 134, 11, 0.15)";
                              } else if (log.severity === "Minor") {
                                badgeColor = "var(--accent-primary)";
                                badgeBg = "var(--accent-tint)";
                              }

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "3px",
                                    padding: "1rem",
                                    background: "var(--bg-surface)",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                    alignItems: "flex-start"
                                  }}
                                >
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "140px" }}>
                                    <span className="text-mono" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>{log.version}</span>
                                    <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{log.date}</span>
                                  </div>

                                  <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                      <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--accent-primary)", fontWeight: "bold" }}>{log.model.toUpperCase()}</span>
                                      <span
                                        className="text-mono"
                                        style={{
                                          fontSize: "0.55rem",
                                          padding: "0.1rem 0.4rem",
                                          borderRadius: "2px",
                                          color: badgeColor,
                                          background: badgeBg,
                                          border: `1px solid ${badgeColor}30`,
                                          fontWeight: "bold"
                                        }}
                                      >
                                        {log.severity}
                                      </span>
                                    </div>
                                    <p className="text-secondary" style={{ fontSize: "0.8rem", margin: 0, lineHeight: "1.4" }}>
                                      {log.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
                        <button
                          onClick={() => handleTopicChange(activeTopic)}
                          className="text-mono"
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                            fontSize: "0.75rem",
                            padding: "0.5rem 1.25rem",
                            cursor: "pointer",
                            borderRadius: "2px"
                          }}
                        >
                          ↺ Restart Guide
                        </button>
                        <button
                          onClick={() => {
                            setActiveTopic("overview");
                            setActiveSubTab("concept");
                          }}
                          className="text-mono"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent-primary)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          Back to System Overview ➔
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

