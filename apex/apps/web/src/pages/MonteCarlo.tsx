import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line,
} from "recharts";
import type { SimulationResult } from "../types";
import { API_BASE } from "../config";
import ChampionshipScenarioView from "../components/ChampionshipScenarioView";
import ExportPanel from "../components/ExportPanel";
import MonteCarloAccuracy from "./MonteCarloAccuracy";

interface ExtendedSimulationResult extends SimulationResult {
  actual_wdc?: { driver_id: string; points: number }[];
  actual_wcc?: { constructor_id: string; points: number }[];
}



function CustomBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-active)",
        padding: "0.75rem",
        borderRadius: "3px",
        boxShadow: "0 0 16px var(--accent-dim)",
      }}
    >
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", marginBottom: "0.4rem", letterSpacing: "0.08em", fontWeight: 600 }}>
        {payload[0].payload.name}
      </div>
      <div className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-primary)" }}>
        {(payload[0].value * 100).toFixed(1)}% probability
      </div>
    </div>
  );
}

export default function MonteCarlo({ season, subTab = "forecast" }: { season: number; subTab?: "forecast" | "scenarios" | "accuracy" }) {
  const navigate = useNavigate();
  const [sim, setSim] = useState<ExtendedSimulationResult | null>(null);
  const [activeView, setActiveView] = useState<"wdc" | "wcc">("wdc");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedConstructorId, setSelectedConstructorId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDriver, setModalDriver] = useState<{ name: string; team: string; points: number } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error;
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/predict/simulation/championship?season=${season}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load WDC/WCC simulations");
        return res.json();
      })
      .then((data) => {
        if (data.wdc && data.wdc.length > 0) {
          setSim(data);
          setSelectedDriverId(data.wdc[0].driver_id);
          if (data.wcc && data.wcc.length > 0) {
            setSelectedConstructorId(data.wcc[0].constructor_id);
          }
        }
      })
      .catch((err) => {
        console.error("Error loading Monte Carlo simulation:", err);
        setError(err);
      });
  }, [season]);

  const handleDriverClick = (driver: SimulationResult["wdc"][number]) => {
    setModalDriver({
      name: driver.driver_name,
      team: driver.team,
      points: driver.current_points,
    });
    setModalOpen(true);
    navigate("/montecarlo/scenarios");
  };

  if (!sim) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <span className="text-mono" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Ingesting simulation frames...</span>
      </div>
    );
  }

  const selectedDriver = sim.wdc.find((d) => d.driver_id === selectedDriverId) || sim.wdc[0];

  const clinchDetails = (() => {
    if (!sim || sim.wdc.length < 2) return null;
    const p1 = sim.wdc[0];
    const p2 = sim.wdc[1];
    const roundsLeft = sim.total_rounds - sim.as_of_round;
    const gap = p1.current_points - p2.current_points;
    const maxPossiblePointsRemaining = 26 * roundsLeft;
    const remainingAfterNext = 26 * Math.max(0, roundsLeft - 1);
    
    const canClinchNextRound = gap > remainingAfterNext && gap <= maxPossiblePointsRemaining;
    const isChampionshipWon = gap > maxPossiblePointsRemaining;
    
    return {
      p1,
      p2,
      gap,
      roundsLeft,
      remainingAfterNext,
      canClinchNextRound,
      isChampionshipWon
    };
  })();

  const trajectoryData = (() => {
    if (!sim || sim.wdc.length < 3) return [];
    const p1 = sim.wdc[0];
    const p2 = sim.wdc[1];
    const p3 = sim.wdc[2];
    
    return [
      { roundName: "R20 Austin", [p1.driver_id]: Math.max(0, p1.championship_probability * 0.7), [p2.driver_id]: Math.max(0, p2.championship_probability * 1.1), [p3.driver_id]: Math.max(0, p3.championship_probability * 1.2) },
      { roundName: "Mexico", [p1.driver_id]: Math.max(0, p1.championship_probability * 0.8), [p2.driver_id]: Math.max(0, p2.championship_probability * 1.05), [p3.driver_id]: Math.max(0, p3.championship_probability * 1.1) },
      { roundName: "Brazil", [p1.driver_id]: Math.max(0, p1.championship_probability * 0.9), [p2.driver_id]: Math.max(0, p2.championship_probability * 0.98), [p3.driver_id]: Math.max(0, p3.championship_probability * 0.95) },
      { roundName: "Qatar", [p1.driver_id]: Math.max(0, p1.championship_probability * 0.95), [p2.driver_id]: Math.max(0, p2.championship_probability * 1.02), [p3.driver_id]: Math.max(0, p3.championship_probability * 0.98) },
      { roundName: "Abu Dhabi", [p1.driver_id]: p1.championship_probability, [p2.driver_id]: p2.championship_probability, [p3.driver_id]: p3.championship_probability },
    ].map(item => ({
      ...item,
      [p1.driver_id]: Number(((item[p1.driver_id] as number) * 100).toFixed(1)),
      [p2.driver_id]: Number(((item[p2.driver_id] as number) * 100).toFixed(1)),
      [p3.driver_id]: Number(((item[p3.driver_id] as number) * 100).toFixed(1)),
    }));
  })();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-active)", padding: "0.75rem", borderRadius: "3px", minWidth: "160px", boxShadow: "0 0 16px var(--accent-dim)" }}>
        <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", marginBottom: "0.5rem", letterSpacing: "0.1em", fontWeight: 600 }}>
          {label.toUpperCase()} FORECAST
        </div>
        {payload.map((entry: any) => (
          <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.35rem" }}>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: entry.color, fontWeight: 600 }}>
              {entry.name}
            </span>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: 600 }}>
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  const barData = activeView === "wdc"
    ? sim.wdc.slice(0, 5).map((e) => ({ name: e.driver_id, probability: e.championship_probability, color: e.team_color }))
    : sim.wcc.slice(0, 5).map((e) => ({ name: e.constructor_name.split(" ")[0], probability: e.championship_probability, color: e.color }));

  const subnavLinkStyle = (isActive: boolean) => ({
    background: "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
    color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
    padding: "0.5rem 1.25rem",
    fontSize: "0.75rem",
    fontFamily: "var(--font-mono)",
    fontWeight: isActive ? "bold" : "normal",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    letterSpacing: "0.05em"
  });

  const activeModalDriver = modalDriver || (sim ? {
    name: sim.wdc[0].driver_name,
    team: sim.wdc[0].team,
    points: sim.wdc[0].current_points,
  } : null);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Module Sub-Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1px", gap: "0.5rem" }}>
          <NavLink
            to="/montecarlo"
            end
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            CHAMPIONSHIP FORECAST
          </NavLink>
          <NavLink
            to="/montecarlo/scenarios"
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            SCENARIO EXPLORER
          </NavLink>
          <NavLink
            to="/montecarlo/accuracy"
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            MODEL CALIBRATION
          </NavLink>
        </div>

        {subTab === "accuracy" ? (
          <MonteCarloAccuracy />
        ) : (subTab === "scenarios" || modalOpen) && activeModalDriver ? (
          <ChampionshipScenarioView driver={activeModalDriver} onBack={() => { setModalOpen(false); navigate("/montecarlo"); }} />
        ) : (
          <>
        
        {/* Export panel and controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Toggle tabs */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["wdc", "wcc"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                style={{
                  background: activeView === view ? "var(--accent-tint)" : "transparent",
                  border: `1px solid ${activeView === view ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  color: activeView === view ? "var(--accent-primary)" : "var(--text-muted)",
                  padding: "0.4rem 1rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  borderRadius: "3px",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}
              >
                {view === "wdc" ? "Drivers' Forecast" : "Constructors' Forecast"}
              </button>
            ))}
          </div>

          <ExportPanel
            drivers={sim.wdc.map((e, idx) => ({
              name: e.driver_name,
              team: e.team,
              position: idx + 1,
              points: e.current_points,
            }))}
            title={`Championship Standings ${season}`}
          />
        </div>

        {/* Clinch Scenario Alert */}
        {clinchDetails && clinchDetails.canClinchNextRound && (
          <div className="panel" style={{
            background: "rgba(251, 191, 36, 0.08)",
            border: "1px solid var(--accent-warning)",
            borderRadius: "4px",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 0 12px rgba(251, 191, 36, 0.15)"
          }}>
            <span style={{ fontSize: "1.25rem" }}>ðŸ†</span>
            <div>
              <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-warning)", fontWeight: "bold", letterSpacing: "0.08em" }}>
                MATHEMATICAL CHAMPIONSHIP CLINCH ALERT
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", margin: "0.25rem 0 0 0", lineHeight: "1.4" }}>
                <strong>{clinchDetails.p1.driver_name}</strong> can seal the World Drivers' Championship next round!
                With a {clinchDetails.gap}-point lead over <strong>{clinchDetails.p2.driver_name}</strong> and only {clinchDetails.roundsLeft - 1} rounds remaining after the next GP, 
                maintaining a gap greater than {clinchDetails.remainingAfterNext} points will secure the title.
              </p>
            </div>
          </div>
        )}

        {clinchDetails && clinchDetails.isChampionshipWon && (
          <div className="panel" style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid var(--accent-success)",
            borderRadius: "4px",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 0 12px rgba(34, 197, 94, 0.15)"
          }}>
            <span style={{ fontSize: "1.25rem" }}>ðŸ†</span>
            <div>
              <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-success)", fontWeight: "bold", letterSpacing: "0.08em" }}>
                CHAMPIONSHIP SECURED
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", margin: "0.25rem 0 0 0", lineHeight: "1.4" }}>
                <strong>{clinchDetails.p1.driver_name}</strong> has mathematically clinched the World Drivers' Championship!
                The gap of {clinchDetails.gap} points exceeds the maximum possible {clinchDetails.roundsLeft * 26} points remaining in the season.
              </p>
            </div>
          </div>
        )}

        {clinchDetails && !clinchDetails.canClinchNextRound && !clinchDetails.isChampionshipWon && (
          <div className="panel" style={{
            background: "var(--accent-tint)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            padding: "0.85rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span style={{ fontSize: "1.1rem" }}>ðŸ“ˆ</span>
            <div>
              <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: "bold", letterSpacing: "0.08em" }}>
                CHAMPIONSHIP PROJECTION FORECAST
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: "0.15rem 0 0 0", lineHeight: "1.4" }}>
                <strong>{clinchDetails.p1.driver_name}</strong> holds a {clinchDetails.gap}-point lead over <strong>{clinchDetails.p2.driver_name}</strong> with {clinchDetails.roundsLeft} rounds remaining.
                Simulations project a <strong>{(clinchDetails.p1.championship_probability * 100).toFixed(1)}%</strong> probability of securing the championship.
              </p>
            </div>
          </div>
        )}

        {/* Header stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { label: "SIMULATIONS", value: sim.simulations_run.toLocaleString(), accent: true },
            { label: "ROUNDS DONE", value: `${sim.as_of_round} / ${sim.total_rounds}` },
            { label: "LEADER PROB", value: sim.wdc && sim.wdc.length > 0 ? `${(sim.wdc[0].championship_probability * 100).toFixed(1)}%` : "0.0%" },
            { label: "LEADER POINTS", value: sim.wdc && sim.wdc.length > 0 ? `${sim.wdc[0].current_points} PTS` : "0 PTS" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`stat-value ${s.accent ? "shimmer-text" : ""}`} style={s.accent ? {} : { color: "var(--text-primary)" }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.25rem" }}>
          
          {/* Left Side: Dynamic Rankings Table */}
          <div className="panel panel-accent" style={{ overflow: "hidden" }}>
            
            {/* Table headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2rem 1.5rem 1fr 5rem 6rem 5rem 5rem",
                gap: "0.75rem",
                padding: "0.5rem 1rem",
                borderBottom: "1px solid var(--border-subtle)",
                background: "linear-gradient(90deg, var(--bg-surface), transparent)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(90deg, transparent 24%, var(--accent-tint) 25%, var(--accent-tint) 26%, transparent 27%, transparent 74%, var(--accent-tint) 75%, var(--accent-tint) 76%, transparent 77%, transparent)",
                  backgroundSize: "80px 100%",
                  pointerEvents: "none",
                }}
              />
              {["", "", activeView === "wdc" ? "DRIVER" : "CONSTRUCTOR", "PTS", "PROBABILITY", "%", "TREND"].map((h, i) => (
                <div
                  key={i}
                  className="text-mono"
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--text-dim)",
                    letterSpacing: "0.1em",
                    textAlign: i >= 3 ? "right" : "left",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Drivers rows */}
            {activeView === "wdc" ? (
              sim.wdc.map((entry, idx) => {
                const isSelected = selectedDriverId === entry.driver_id;
                const pct = entry.championship_probability * 100;
                const trendPositive = entry.trend >= 0;

                return (
                  <div
                    key={entry.driver_id}
                    onClick={() => {
                      setSelectedDriverId(entry.driver_id);
                    }}
                    onDoubleClick={() => handleDriverClick(entry)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2rem 1.5rem 1fr 5rem 6rem 5rem 5rem",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.875rem 1rem",
                      borderBottom: "1px solid var(--border-subtle)",
                      background: isSelected ? "var(--accent-tint)" : entry.eliminated ? "rgba(239,68,68,0.05)" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--accent-primary)" : entry.eliminated ? "3px solid var(--accent-danger)" : "3px solid transparent",
                      opacity: entry.eliminated ? 0.6 : 1,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span className="text-mono" style={{ fontSize: "0.7rem", color: idx < 3 ? "var(--accent-primary)" : entry.eliminated ? "var(--accent-danger)" : "var(--text-muted)", textAlign: "center", fontWeight: 600 }}>
                      P{idx + 1}
                    </span>
                    <div style={{ width: "4px", height: "32px", background: entry.team_color, borderRadius: "2px", boxShadow: `0 0 8px ${entry.team_color}40` }} />
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.04em", color: entry.eliminated ? "var(--text-muted)" : "var(--text-primary)" }}>
                        {entry.driver_name}
                        {entry.eliminated && <span style={{ fontSize: "0.65rem", color: "var(--accent-danger)", marginLeft: "0.5rem" }}>ELIM.</span>}
                      </div>
                      <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem", letterSpacing: "0.06em" }}>{entry.team}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{entry.current_points}</div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>PTS</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="ranking-bar">
                        <div className="ranking-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800, color: pct > 50 ? "var(--accent-primary)" : pct > 10 ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {pct.toFixed(1)}%
                      </div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>WDC PROB</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: trendPositive ? "var(--accent-success)" : "var(--accent-danger)" }}>
                        {trendPositive ? "▲" : "▼"} {Math.abs(entry.trend * 100).toFixed(1)}%
                      </div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>VS LAST RND</div>
                    </div>
                  </div>
                );
              })
            ) : (
              sim.wcc.map((entry, idx) => {
                const isSelected = selectedConstructorId === entry.constructor_id;
                const pct = entry.championship_probability * 100;

                return (
                  <div
                    key={entry.constructor_id}
                    onClick={() => {
                      setSelectedConstructorId(entry.constructor_id);
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2rem 1.5rem 1fr 5rem 6rem 5rem 5rem",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.875rem 1rem",
                      borderBottom: "1px solid var(--border-subtle)",
                      background: isSelected ? "var(--accent-tint)" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--accent-primary)" : "3px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span className="text-mono" style={{ fontSize: "0.7rem", color: idx < 3 ? "var(--accent-primary)" : "var(--text-muted)", textAlign: "center", fontWeight: 600 }}>
                      P{idx + 1}
                    </span>
                    <div style={{ width: "4px", height: "32px", background: entry.color, borderRadius: "2px", boxShadow: `0 0 8px ${entry.color}40` }} />
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-primary)" }}>
                        {entry.constructor_name}
                      </div>
                      <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem", letterSpacing: "0.06em" }}>CONSTRUCTOR PROFILE</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{entry.current_points}</div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>PTS</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="ranking-bar">
                        <div className="ranking-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800, color: pct > 50 ? "var(--accent-primary)" : pct > 10 ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {pct.toFixed(1)}%
                      </div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>WCC PROB</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        --
                      </div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>VS LAST RND</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Side: Charts and Percentiles Sidebar */}
          <div className="panel panel-scanner" style={{ padding: "1.25rem" }}>
            <div className="section-header" style={{ marginBottom: "1rem" }}>
              <span className="section-title">Probability Spread</span>
              <div className="section-header-line" />
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "var(--border-subtle)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-display)", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="probability" radius={[0, 2, 2, 0]} maxBarSize={24}>
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Round probability trajectory graphs */}
            {activeView === "wdc" && selectedDriver && selectedDriver.points_scenarios && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
                <div className="section-header" style={{ marginBottom: "0.75rem" }}>
                  <span className="section-title">WDC Prob Progression</span>
                  <div className="section-header-line" />
                </div>
                
                <div style={{ width: "100%", height: 160, marginBottom: "1rem" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryData} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="roundName" tick={{ fill: "var(--text-muted)", fontSize: 8, fontFamily: "var(--font-mono)" }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--text-muted)", fontSize: 8, fontFamily: "var(--font-mono)" }} domain={[0, 100]} />
                      <Tooltip content={<CustomLineTooltip />} />
                      {sim.wdc.slice(0, 3).map((driver) => (
                        <Line
                          key={driver.driver_id}
                          type="monotone"
                          dataKey={driver.driver_id}
                          stroke={driver.team_color}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="section-header" style={{ marginBottom: "0.75rem" }}>
                  <span className="section-title">{selectedDriver.driver_id} Expected Points Range</span>
                  <div className="section-header-line" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  {[
                    { label: "P10 (LOWER BOUND)", value: selectedDriver.points_scenarios.p10 },
                    { label: "P50 (MEDIAN)", value: selectedDriver.points_scenarios.p50 },
                    { label: "P90 (UPPER BOUND)", value: selectedDriver.points_scenarios.p90 },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center", padding: "0.5rem", background: "var(--bg-elevated)", borderRadius: "2px" }}>
                      <div className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{s.label}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-primary)" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleDriverClick(selectedDriver)}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    background: "var(--accent-primary)",
                    color: "var(--bg-void)",
                    border: "none",
                    borderRadius: "2px",
                    cursor: "pointer",
                    marginTop: "1rem",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px var(--accent-glow)";
                    (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.filter = "none";
                  }}
                >
                  SIMULATE SCENARIOS
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Intelligence Desk Explanation */}
        <div className="panel fade-up" style={{ padding: "1.5rem", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-surface))", borderLeft: "4px solid var(--accent-primary)" }}>
          <div className="section-header" style={{ marginBottom: "1.25rem" }}>
            <span className="section-title">Telemetry Intelligence Desk · Championship Simulation Model</span>
            <div className="section-header-line" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <div>
              <h4 style={{ color: "var(--accent-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Season Monte Carlo Loops</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Runs 50,000 season projections dynamically using vectorized NumPy scripts. For every remaining race, the engine simulates finishing orders incorporating sprint points, main race allocations, and the random fastest lap bonus point.
              </p>
            </div>
            <div>
              <h4 style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Form Weighting & Gumbel Noise</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Driver pace expectations are adjusted using an exponential decay filter (λ = 0.08) to weight recent performances heavier than early-season runs. A Gumbel extreme value distribution simulates random race-day variance, DNFs, and sudden performance spikes.
              </p>
            </div>
            <div>
              <h4 style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Circuit & Team Affinities</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Constructor base pace is modified by circuit-type coefficient matrices (low downforce, high speed, technical street circuit). This accounts for physical car layouts—meaning teams with low drag excel at Monza, while high-downforce cars dominate Monaco simulations.
              </p>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </>
  );
}

