import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { MOCK_SIMULATION } from "../data/mockData";
import type { ChampionshipEntry, SimulationResult } from "../types";

function ProbabilityBar({ probability, color }: { probability: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="prob-bar">
        <div style={{ height: "100%", width: `${probability * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: "2px", transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

function DriverChampionshipRow({ entry, rank }: { entry: ChampionshipEntry; rank: number }) {
  const pct = entry.championship_probability * 100;
  const trendPositive = entry.trend >= 0;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "2rem 1.5rem 1fr 5rem 6rem 5rem 5rem",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.875rem 1rem",
      borderBottom: "1px solid var(--border-subtle)",
      background: rank === 0 ? "var(--bg-elevated)" : "transparent",
      borderLeft: rank === 0 ? "2px solid var(--accent-primary)" : "2px solid transparent",
    }}>
      {/* Rank */}
      <span className="text-mono" style={{ fontSize: "0.7rem", color: rank < 3 ? "var(--accent-primary)" : "var(--text-muted)", textAlign: "center" }}>
        P{rank + 1}
      </span>

      {/* Team color */}
      <div style={{ width: "4px", height: "32px", background: entry.team_color, borderRadius: "2px" }} />

      {/* Driver */}
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {entry.driver_name}
        </div>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem", letterSpacing: "0.06em" }}>
          {entry.team}
        </div>
      </div>

      {/* Points */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{entry.current_points}</div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>PTS</div>
      </div>

      {/* Probability bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ProbabilityBar probability={entry.championship_probability} color={entry.team_color} />
      </div>

      {/* Probability % */}
      <div style={{ textAlign: "right" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800,
          color: pct > 50 ? "var(--accent-primary)" : pct > 10 ? "var(--text-primary)" : "var(--text-muted)",
        }}>
          {pct.toFixed(1)}%
        </div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>WDC PROB</div>
      </div>

      {/* Trend */}
      <div style={{ textAlign: "right" }}>
        <div className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: trendPositive ? "var(--accent-success)" : "var(--accent-danger)" }}>
          {trendPositive ? "+" : ""}{(entry.trend * 100).toFixed(1)}%
        </div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>VS LAST RND</div>
      </div>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomBarTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-active)", padding: "0.75rem", borderRadius: "3px" }}>
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.4rem", letterSpacing: "0.08em" }}>{label}</div>
      <div className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-primary)" }}>
        {(payload[0].value * 100).toFixed(1)}% championship probability
      </div>
    </div>
  );
};

export default function MonteCarlo() {
  const [sim, setSim] = useState<SimulationResult>(MOCK_SIMULATION);
  const [activeView, setActiveView] = useState<"wdc" | "wcc">("wdc");

  useEffect(() => {
    fetch("/api/predict/simulation/championship")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load WDC/WCC simulations");
        return res.json();
      })
      .then((data) => {
        if (data.wdc && data.wdc.length > 0) {
          setSim(data);
        }
      })
      .catch((err) => console.error("Error loading Monte Carlo simulation:", err));
  }, []);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {[
          { label: "SIMULATIONS", value: sim.simulations_run.toLocaleString(), accent: true },
          { label: "ROUNDS DONE", value: `${sim.as_of_round} / ${sim.total_rounds}` },
          { label: "LEADER PROB", value: `${(sim.wdc[0].championship_probability * 100).toFixed(1)}%` },
          { label: "LEADER POINTS", value: `${sim.wdc[0].current_points} PTS` },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-value ${s.accent ? "shimmer-text" : ""}`} style={s.accent ? {} : { color: "var(--text-primary)" }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.25rem" }}>
        {/* Main table */}
        <div className="panel" style={{ overflow: "hidden" }}>
          {/* Toggle */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)" }}>
            {(["wdc", "wcc"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                style={{
                  flex: 1, padding: "0.875rem",
                  fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: "transparent", cursor: "pointer",
                  color: activeView === v ? "var(--accent-primary)" : "var(--text-muted)",
                  borderBottom: `2px solid ${activeView === v ? "var(--accent-primary)" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                {v === "wdc" ? "Drivers' Championship" : "Constructors' Championship"}
              </button>
            ))}
          </div>

          {/* Column headers */}
          {activeView === "wdc" && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "2rem 1.5rem 1fr 5rem 6rem 5rem 5rem",
                gap: "0.75rem", padding: "0.5rem 1rem",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
              }}>
                {["", "", "DRIVER", "PTS", "PROBABILITY", "%", "TREND"].map((h, i) => (
                  <div key={i} className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em", textAlign: i >= 3 ? "right" : "left" }}>
                    {h}
                  </div>
                ))}
              </div>
              {sim.wdc.map((entry, i) => (
                <DriverChampionshipRow key={entry.driver_id} entry={entry} rank={i} />
              ))}
            </>
          )}

          {activeView === "wcc" && (
            <div style={{ padding: "1rem" }}>
              {sim.wcc.map((entry) => (
                <div key={entry.constructor_id} style={{
                  display: "grid", gridTemplateColumns: "1.5rem 1fr 5rem 6rem",
                  alignItems: "center", gap: "0.75rem", padding: "0.875rem 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}>
                  <div style={{ width: "4px", height: "32px", background: entry.color, borderRadius: "2px" }} />
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>{entry.constructor_name}</div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{entry.current_points} PTS</div>
                  </div>
                  <ProbabilityBar probability={entry.championship_probability} color={entry.color} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      {(entry.championship_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart sidebar */}
        <div className="panel" style={{ padding: "1.25rem" }}>
          <div className="section-header" style={{ marginBottom: "1.25rem" }}>
            <span className="section-title">{activeView === "wdc" ? "WDC" : "WCC"} Probability Distribution</span>
            <div className="section-header-line" />
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={activeView === "wdc" ? barData : wccBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                axisLine={false} tickLine={false}
                domain={[0, 1]}
              />
              <YAxis
                type="category" dataKey="name"
                tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-display)", fontWeight: 700 }}
                axisLine={false} tickLine={false} width={36}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="probability" radius={[0, 2, 2, 0]} maxBarSize={24}>
                {(activeView === "wdc" ? barData : wccBarData).map((entry) => (
                  <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Points percentiles for leader */}
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <div className="section-header" style={{ marginBottom: "0.75rem" }}>
              <span className="section-title">{sim.wdc[0].driver_id} Points Scenarios</span>
              <div className="section-header-line" />
            </div>
            {Object.entries(sim.wdc[0].points_scenarios).map(([pct, pts]) => (
              <div key={pct} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  {pct.toUpperCase()} SCENARIO
                </span>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: 600 }}>
                  {pts} PTS
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
