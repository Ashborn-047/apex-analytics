import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import type { SimulationResult } from "../types";
import { API_BASE } from "../config";
import ChampionshipScenarioView from "../components/ChampionshipScenarioView";
import ExportPanel from "../components/ExportPanel";

interface ExtendedSimulationResult extends SimulationResult {
  actual_wdc?: { driver_id: string; points: number }[];
  actual_wcc?: { constructor_id: string; points: number }[];
}

function PointsScenarioBar({ scenarios, color }: { scenarios: { p10: number; p25: number; p50: number; p75: number; p90: number }; color: string }) {
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

function CustomBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-active)",
        padding: "0.75rem",
        borderRadius: "3px",
        boxShadow: "0 0 16px rgba(0,212,255,0.2)",
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

export default function MonteCarlo({ season }: { season: number }) {
  const [sim, setSim] = useState<ExtendedSimulationResult | null>(null);
  const [activeView, setActiveView] = useState<"wdc" | "wcc">("wdc");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedConstructorId, setSelectedConstructorId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDriver, setModalDriver] = useState<{ name: string; team: string; points: number } | null>(null);
  const [, setError] = useState<unknown>(null);

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
        setError(() => { throw err; });
      });
  }, [season]);

  const handleDriverClick = (driver: SimulationResult["wdc"][number]) => {
    setModalDriver({
      name: driver.driver_name,
      team: driver.team,
      points: driver.current_points,
    });
    setModalOpen(true);
  };

  if (!sim) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <span className="text-mono" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Ingesting simulation frames...</span>
      </div>
    );
  }

  const selectedDriver = sim.wdc.find((d) => d.driver_id === selectedDriverId) || sim.wdc[0];

  const barData = activeView === "wdc"
    ? sim.wdc.slice(0, 5).map((e) => ({ name: e.driver_id, probability: e.championship_probability, color: e.team_color }))
    : sim.wcc.slice(0, 5).map((e) => ({ name: e.constructor_name.split(" ")[0], probability: e.championship_probability, color: e.color }));

  return (
    <>
      {modalOpen && modalDriver ? (
        <ChampionshipScenarioView driver={modalDriver} onBack={() => setModalOpen(false)} />
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Export panel and controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Toggle tabs */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["wdc", "wcc"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                style={{
                  background: activeView === view ? "rgba(0,212,255,0.08)" : "transparent",
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
                    "linear-gradient(90deg, transparent 24%, rgba(0,212,255,0.02) 25%, rgba(0,212,255,0.02) 26%, transparent 27%, transparent 74%, rgba(0,212,255,0.02) 75%, rgba(0,212,255,0.02) 76%, transparent 77%, transparent)",
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
                      background: isSelected ? "rgba(0,212,255,0.08)" : entry.eliminated ? "rgba(239,68,68,0.05)" : "transparent",
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
                      background: isSelected ? "rgba(0,212,255,0.08)" : "transparent",
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

            {/* Selected driver points percentiles scenarios */}
            {activeView === "wdc" && selectedDriver && selectedDriver.points_scenarios && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
                <div className="section-header" style={{ marginBottom: "0.75rem" }}>
                  <span className="section-title">{selectedDriver.driver_id} Points Scenarios</span>
                  <div className="section-header-line" />
                </div>
                <PointsScenarioBar scenarios={selectedDriver.points_scenarios} color={selectedDriver.team_color} />
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.75rem" }}>
                  {[
                    { label: "P10", value: selectedDriver.points_scenarios.p10 },
                    { label: "P50", value: selectedDriver.points_scenarios.p50 },
                    { label: "P90", value: selectedDriver.points_scenarios.p90 },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center", padding: "0.5rem", background: "var(--bg-elevated)", borderRadius: "2px" }}>
                      <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{s.label}</div>
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
      </div>
      )}
    </>
  );
}
