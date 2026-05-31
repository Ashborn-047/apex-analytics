import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Cell,
} from "recharts";
import { MOCK_SIMULATION } from "../data/mockData";
import type { SimulationResult } from "../types";
import { API_BASE } from "../config";

interface ExtendedSimulationResult extends SimulationResult {
  actual_wdc?: { driver_id: string; points: number }[];
  actual_wcc?: { constructor_id: string; points: number }[];
}

function CircularProbabilityDial({ value, color }: { value: number; color: string }) {
  const percentage = value * 100;
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: "relative", width: "60px", height: "60px", flexShrink: 0 }}>
      <svg width="60" height="60" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="30" cy="30" r="22" fill="none" stroke="var(--border-subtle)" strokeWidth="2" />
        <circle
          cx="30"
          cy="30"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease", filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "var(--text-primary)"
      }}>
        {percentage.toFixed(0)}%
      </div>
    </div>
  );
}

function PointsScenarioBar({ scenarios, color }: { scenarios: Record<string, number>; color: string }) {
  const p10 = scenarios.p10 || 0;
  const p50 = scenarios.p50 || 0;
  const p90 = scenarios.p90 || 0;
  const max = Math.max(1, p90 * 1.1);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "24px" }}>
      {/* Box-whisker visualization */}
      <div style={{ flex: 1, position: "relative", height: "100%" }}>
        {/* Whisker line (P10 to P90) */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: `${(p10 / max) * 100}%`,
          right: `${100 - (p90 / max) * 100}%`,
          height: "1px",
          background: color,
          opacity: 0.4,
          transform: "translateY(-50%)",
        }} />
        
        {/* Box (P25 to P75) */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: `${((scenarios.p25 || 0) / max) * 100}%`,
          right: `${100 - ((scenarios.p75 || 0) / max) * 100}%`,
          height: "14px",
          background: `${color}40`,
          border: `1px solid ${color}`,
          borderRadius: "2px",
          transform: "translateY(-50%)",
        }} />
        
        {/* Median line (P50) */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: `${(p50 / max) * 100}%`,
          width: "2px",
          height: "16px",
          background: color,
          transform: "translate(-50%, -50%)",
        }} />
      </div>
      
      {/* Value labels */}
      <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", minWidth: "40px", textAlign: "right" }}>
        {p50.toFixed(0)}
      </div>
    </div>
  );
}

export default function MonteCarlo({ season }: { season: number }) {
  const isCompletedSeason = season < 2026;
  const [sim, setSim] = useState<ExtendedSimulationResult>(MOCK_SIMULATION);
  const [activeView, setActiveView] = useState<"wdc" | "wcc">("wdc");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedConstructorId, setSelectedConstructorId] = useState<string>("");

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
      .catch((err) => console.error("Error loading Monte Carlo simulation:", err));
  }, [season]);

  const selectedDriver = sim.wdc.find((d) => d.driver_id === selectedDriverId) || sim.wdc[0] || MOCK_SIMULATION.wdc[0];
  const selectedConstructor = sim.wcc.find((c) => c.constructor_id === selectedConstructorId) || sim.wcc[0] || MOCK_SIMULATION.wcc[0];

  const barData = sim.wdc.slice(0, 8).map((e) => ({
    name: e.driver_id,
    probability: e.championship_probability,
    color: e.team_color,
  }));

  const wccBarData = sim.wcc.map((e) => ({
    name: e.constructor_name.split(" ")[0],
    probability: e.championship_probability,
    color: e.color,
  }));

  // Compare actual vs simulated calculations for drivers
  const actualWdc = sim.actual_wdc;
  const actualWcc = sim.actual_wcc;
  
  let actualDriverPoints: number | null = null;
  let actualDriverRank: number | null = null;
  let simulatedDriverMedianPoints = selectedDriver.points_scenarios?.p50 || selectedDriver.current_points;
  let simulatedDriverRank = sim.wdc.findIndex(d => d.driver_id === selectedDriverId) + 1;
  
  if (actualWdc && actualWdc.length > 0) {
    const sortedActualWdc = [...actualWdc].sort((a, b) => b.points - a.points);
    actualDriverRank = sortedActualWdc.findIndex(d => d.driver_id === selectedDriverId) + 1;
    const found = actualWdc.find(d => d.driver_id === selectedDriverId);
    actualDriverPoints = found ? found.points : 0;
  }

  // Compare actual vs simulated calculations for constructors
  let actualConstructorPoints: number | null = null;
  let actualConstructorRank: number | null = null;
  let simulatedConstructorPoints = selectedConstructor.current_points;
  let simulatedConstructorRank = sim.wcc.findIndex(c => c.constructor_id === selectedConstructorId) + 1;

  if (actualWcc && actualWcc.length > 0) {
    const sortedActualWcc = [...actualWcc].sort((a, b) => b.points - a.points);
    actualConstructorRank = sortedActualWcc.findIndex(c => c.constructor_id === selectedConstructorId) + 1;
    const found = actualWcc.find(c => c.constructor_id === selectedConstructorId);
    actualConstructorPoints = found ? found.points : 0;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {[
          { label: "MONTE CARLO LOOPS", value: sim.simulations_run.toLocaleString(), accent: true },
          {
            label: isCompletedSeason && sim.as_of_round < sim.total_rounds
              ? `STANDINGS (R${sim.as_of_round} CUTOFF)`
              : "STANDINGS ROUND",
            value: isCompletedSeason
              ? `Round ${sim.total_rounds} / ${sim.total_rounds}`
              : `Round ${sim.as_of_round} / ${sim.total_rounds}`
          },
          { label: "LEADER PROBABILITY", value: sim.wdc && sim.wdc.length > 0 ? `${(sim.wdc[0].championship_probability * 100).toFixed(1)}%` : "0.0%" },
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.25rem" }}>
        
        {/* Left Side: Cards grid */}
        <div className="panel panel-accent" style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Toggle */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", background: "linear-gradient(90deg, rgba(0,212,255,0.05), transparent)" }}>
            {(["wdc", "wcc"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                style={{
                  flex: 1, padding: "1rem",
                  fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: activeView === v ? "rgba(0,212,255,0.08)" : "transparent", 
                  cursor: "pointer",
                  color: activeView === v ? "var(--accent-primary)" : "var(--text-muted)",
                  borderBottom: `2px solid ${activeView === v ? "var(--accent-primary)" : "transparent"}`,
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderTop: "none", borderLeft: "none", borderRight: "none"
                }}
              >
                {v === "wdc" ? "Drivers' Forecast" : "Constructors' Forecast"}
              </button>
            ))}
          </div>

          {/* Cards Display Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", padding: "1rem" }}>
            {activeView === "wdc" ? (
              sim.wdc.map((entry, idx) => {
                const isSelected = selectedDriverId === entry.driver_id;
                return (
                  <div
                    key={entry.driver_id}
                    onClick={() => setSelectedDriverId(entry.driver_id)}
                    className="panel panel-scanner"
                    style={{
                      padding: "1rem",
                      cursor: "pointer",
                      background: isSelected ? "rgba(0,212,255,0.08)" : "var(--bg-panel)",
                      borderColor: isSelected ? "var(--accent-primary)" : "var(--border-subtle)",
                      boxShadow: isSelected ? "0 0 16px var(--accent-glow)" : "none",
                      borderLeft: `4px solid ${entry.team_color}`,
                      transition: "all 0.2s",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      opacity: entry.eliminated ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    }}
                  >
                    <CircularProbabilityDial value={entry.championship_probability} color={entry.team_color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>
                        P{idx + 1} · {entry.current_points} PTS
                      </div>
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", margin: "0.15rem 0", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.driver_name}
                      </h4>
                      {entry.eliminated ? (
                        <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-danger)" }}>MATHEMATICALLY ELIMINATED</span>
                      ) : (
                        <span className="text-mono" style={{ fontSize: "0.55rem", color: entry.trend >= 0 ? "var(--accent-success)" : "var(--accent-danger)" }}>
                          {entry.trend >= 0 ? "▲" : "▼"} {Math.abs(entry.trend * 100).toFixed(1)}% vs last rnd
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              sim.wcc.map((entry, idx) => {
                const isSelected = selectedConstructorId === entry.constructor_id;
                return (
                  <div
                    key={entry.constructor_id}
                    onClick={() => setSelectedConstructorId(entry.constructor_id)}
                    className="panel panel-scanner"
                    style={{
                      padding: "1rem",
                      cursor: "pointer",
                      background: isSelected ? "rgba(0,212,255,0.08)" : "var(--bg-panel)",
                      borderColor: isSelected ? "var(--accent-primary)" : "var(--border-subtle)",
                      boxShadow: isSelected ? "0 0 16px var(--accent-glow)" : "none",
                      borderLeft: `4px solid ${entry.color}`,
                      transition: "all 0.2s",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    }}
                  >
                    <CircularProbabilityDial value={entry.championship_probability} color={entry.color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>
                        P{idx + 1} · {entry.current_points} PTS
                      </div>
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", margin: "0.15rem 0", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.constructor_name}
                      </h4>
                      <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-primary)" }}>
                        {(entry.championship_probability * 100).toFixed(1)}% WCC PROB
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Details and Comparisons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* Details Panel */}
          <div className="panel panel-scanner" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="section-header" style={{ marginBottom: "0.5rem" }}>
              <span className="section-title">
                {activeView === "wdc" ? `${selectedDriver.driver_id} Forecasting` : `${selectedConstructor.constructor_name} Forecasting`}
              </span>
              <div className="section-header-line" />
            </div>

            {activeView === "wdc" ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "4px", height: "30px", background: selectedDriver.team_color }} />
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", textTransform: "uppercase", margin: 0, color: "var(--text-primary)" }}>
                      {selectedDriver.driver_name}
                    </h3>
                    <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{selectedDriver.team}</span>
                  </div>
                </div>

                {/* Points scenario box-whisker */}
                <div style={{ background: "var(--bg-void)", padding: "1rem", borderRadius: "2px", border: "1px solid var(--border-subtle)" }}>
                  <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>POINTS PROBABILITY SPREAD</div>
                  <PointsScenarioBar scenarios={selectedDriver.points_scenarios} color={selectedDriver.team_color} />
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "1rem" }}>
                    {[
                      { label: "P10 (Worst Case)", value: selectedDriver.points_scenarios.p10 },
                      { label: "P50 (Median Fit)", value: selectedDriver.points_scenarios.p50 },
                      { label: "P90 (Best Case)", value: selectedDriver.points_scenarios.p90 },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: "center", padding: "0.4rem", background: "var(--bg-elevated)", borderRadius: "2px" }}>
                        <div className="text-mono" style={{ fontSize: "0.45rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>{s.label}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-primary)" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated vs Actual Final Comparison */}
                <div style={{ background: "rgba(0, 212, 255, 0.04)", padding: "1rem", borderRadius: "2px", border: "1px solid var(--accent-primary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>SIMULATED vs ACTUAL SEASON STATUS</span>
                  
                  {actualDriverPoints !== null ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", textAlign: "center" }}>
                        <div>
                          <div className="text-mono" style={{ fontSize: "0.45rem", color: "var(--text-dim)" }}>STANDINGS METRIC</div>
                          <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Rank</div>
                          <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Total Points</div>
                        </div>
                        <div>
                          <div className="text-mono" style={{ fontSize: "0.45rem", color: "var(--accent-primary)" }}>SIMULATED (MEDIAN)</div>
                          <div className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>P{simulatedDriverRank}</div>
                          <div className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{simulatedDriverMedianPoints}</div>
                        </div>
                        <div>
                          <div className="text-mono" style={{ fontSize: "0.45rem", color: "var(--accent-warning)" }}>ACTUAL RESULTS</div>
                          <div className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-warning)", marginTop: "0.25rem" }}>P{actualDriverRank}</div>
                          <div className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-warning)" }}>{actualDriverPoints}</div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: "0.25rem", paddingTop: "0.5rem", borderTop: "1px dashed rgba(0, 212, 255, 0.2)", display: "flex", justifyContent: "space-between" }}>
                        <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>Prediction Model Error</span>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: Math.abs(simulatedDriverMedianPoints - actualDriverPoints) < 15 ? "var(--accent-success)" : "var(--accent-warning)", fontWeight: 600 }}>
                          Delta: {actualDriverPoints - simulatedDriverMedianPoints >= 0 ? "+" : ""}{actualDriverPoints - simulatedDriverMedianPoints} points
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "0.5rem 0" }}>
                      Active season in progress. Final actual championship standings are pending.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "4px", height: "30px", background: selectedConstructor.color }} />
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", textTransform: "uppercase", margin: 0, color: "var(--text-primary)" }}>
                      {selectedConstructor.constructor_name}
                    </h3>
                    <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>CONSTRUCTOR PROFILE</span>
                  </div>
                </div>

                <div style={{ background: "var(--bg-void)", padding: "1rem", borderRadius: "2px", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>CHAMPIONSHIP PROBABILITY</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, color: selectedConstructor.color }}>
                    {(selectedConstructor.championship_probability * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Simulated vs Actual Final Comparison */}
                <div style={{ background: "rgba(0, 212, 255, 0.04)", padding: "1rem", borderRadius: "2px", border: "1px solid var(--accent-primary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>SIMULATED vs ACTUAL CONSTRUCTORS</span>
                  
                  {actualConstructorPoints !== null ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", textAlign: "center" }}>
                        <div>
                          <div className="text-mono" style={{ fontSize: "0.45rem", color: "var(--text-dim)" }}>STANDINGS METRIC</div>
                          <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Rank</div>
                          <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Total Points</div>
                        </div>
                        <div>
                          <div className="text-mono" style={{ fontSize: "0.45rem", color: "var(--accent-primary)" }}>SIMULATED (MEDIAN)</div>
                          <div className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>P{simulatedConstructorRank}</div>
                          <div className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{simulatedConstructorPoints}</div>
                        </div>
                        <div>
                          <div className="text-mono" style={{ fontSize: "0.45rem", color: "var(--accent-warning)" }}>ACTUAL RESULTS</div>
                          <div className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-warning)", marginTop: "0.25rem" }}>P{actualConstructorRank}</div>
                          <div className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-warning)" }}>{actualConstructorPoints}</div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: "0.25rem", paddingTop: "0.5rem", borderTop: "1px dashed rgba(0, 212, 255, 0.2)", display: "flex", justifyContent: "space-between" }}>
                        <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>Prediction Model Error</span>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: Math.abs(simulatedConstructorPoints - actualConstructorPoints) < 25 ? "var(--accent-success)" : "var(--accent-warning)", fontWeight: 600 }}>
                          Delta: {actualConstructorPoints - simulatedConstructorPoints >= 0 ? "+" : ""}{actualConstructorPoints - simulatedConstructorPoints} points
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "0.5rem 0" }}>
                      Active season in progress. Final actual constructors' standings are pending.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bar Chart Panel */}
          <div className="panel panel-scanner" style={{ padding: "1rem" }}>
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", display: "block", marginBottom: "0.75rem" }}>
              PROBABILITY MARGIN DISTRIBUTION
            </span>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={activeView === "wdc" ? barData : wccBarData}
                layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis
                  type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "var(--border-subtle)" }} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="name"
                  tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-display)", fontWeight: 700 }}
                  axisLine={false} tickLine={false} width={36}
                />
                <Bar dataKey="probability" radius={[0, 2, 2, 0]} maxBarSize={16}>
                  {(activeView === "wdc" ? barData : wccBarData).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
    </div>
  );
}
