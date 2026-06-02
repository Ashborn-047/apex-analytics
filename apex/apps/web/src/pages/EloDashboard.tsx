import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
} from "recharts";
import { MOCK_ELO_RANKINGS } from "../data/mockData";
import type { EloRanking } from "../types";
import { API_BASE } from "../config";

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className="text-mono"
      style={{
        fontSize: "0.7rem",
        color: positive ? "var(--accent-success)" : "var(--accent-danger)",
        letterSpacing: "0.04em",
        fontWeight: 600,
        background: positive ? "rgba(0, 230, 115, 0.1)" : "rgba(255, 77, 77, 0.1)",
        padding: "0.15rem 0.4rem",
        borderRadius: "2px",
        border: `1px solid ${positive ? "rgba(0, 230, 115, 0.2)" : "rgba(255, 77, 77, 0.2)"}`
      }}
    >
      {positive ? "▲" : "▼"} {Math.abs(value).toFixed(1)}
    </span>
  );
}

function DriverCard({
  rank,
  driver,
  isSelected,
  onClick,
}: {
  rank: number;
  driver: EloRanking;
  isSelected: boolean;
  onClick: () => void;
}) {
  const ratingChange = driver.history && driver.history.length > 1
    ? driver.elo_rating - driver.history[0].elo
    : 0;

  return (
    <div
      onClick={onClick}
      className="panel panel-scanner"
      style={{
        padding: "1.25rem",
        cursor: "pointer",
        background: isSelected ? "rgba(0,212,255,0.08)" : "var(--bg-panel)",
        borderColor: isSelected ? "var(--accent-primary)" : "var(--border-subtle)",
        borderLeft: `4px solid ${driver.team_color || "var(--accent-primary)"}`,
        boxShadow: isSelected ? "0 0 16px var(--accent-glow)" : "none",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        position: "relative",
      }}
      title={`Season rating change: ${ratingChange >= 0 ? "+" : ""}${ratingChange.toFixed(0)} Elo`}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.transform = "none";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{
            fontSize: "0.7rem",
            fontWeight: 800,
            color: rank <= 3 ? "var(--bg-void)" : "var(--text-muted)",
            background: rank <= 3 ? "var(--accent-primary)" : "var(--bg-elevated)",
            padding: "0.15rem 0.4rem",
            borderRadius: "2px",
            fontFamily: "var(--font-mono)",
            border: rank <= 3 ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
          }}>
            P{rank}
          </span>
          <span style={{ fontSize: "0.85rem" }}>{driver.nationality_flag}</span>
        </div>
        <TrendBadge value={driver.trend_5_rounds} />
      </div>

      {/* Driver Identity */}
      <div>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-primary)",
          margin: 0,
        }}>
          {driver.driver_name}
        </h3>
        <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {driver.team}
        </span>
      </div>

      {/* Readouts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "auto" }}>
        <div style={{ background: "var(--bg-void)", padding: "0.5rem", borderRadius: "2px", border: "1px solid var(--border-subtle)" }}>
          <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)", letterSpacing: "0.08em", marginBottom: "0.15rem" }}>
            ELO RATING
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-primary)" }}>
              {driver.elo_rating.toFixed(0)}
            </span>
            <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
              ±{driver.uncertainty.toFixed(0)}
            </span>
          </div>
        </div>

        <div style={{ background: "var(--bg-void)", padding: "0.5rem", borderRadius: "2px", border: "1px solid var(--border-subtle)" }}>
          <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)", letterSpacing: "0.08em", marginBottom: "0.15rem" }}>
            QUALI DOMINANCE
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {driver.quali_dominance_pct.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Season rating change badge overlay */}
      {ratingChange !== 0 && (
        <div className="text-mono" style={{
          position: "absolute",
          bottom: "0.25rem",
          right: "0.5rem",
          fontSize: "0.5rem",
          color: ratingChange >= 0 ? "var(--accent-success)" : "var(--accent-danger)",
          opacity: 0.6
        }}>
          {ratingChange >= 0 ? "+" : ""}{ratingChange.toFixed(0)} Elo this season
        </div>
      )}
    </div>
  );
}

function H2HPanel({ driver }: { driver: EloRanking }) {
  const rec = driver.h2h_record || { wins: 0, losses: 0, ties: 0 };
  const total = rec.wins + rec.losses + rec.ties;
  const winPct = total > 0 ? (rec.wins / total) * 100 : 0;

  return (
    <div className="panel panel-scanner fade-up" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="section-header" style={{ marginBottom: "0.5rem" }}>
        <span className="section-title">Teammate H2H</span>
        <div className="section-header-line" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1rem" }}>{driver.nationality_flag}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-primary)" }}>
          {driver.driver_name}
        </span>
      </div>

      {/* H2H Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        {[
          { label: "WINS", value: rec.wins, color: "var(--accent-success)" },
          { label: "LOSSES", value: rec.losses, color: "var(--accent-danger)" },
          { label: "TIES", value: rec.ties, color: "var(--text-muted)" },
        ].map((s) => (
          <div key={s.label} style={{ 
            textAlign: "center", 
            background: "var(--bg-elevated)", 
            padding: "0.75rem", 
            borderRadius: "3px",
            border: "1px solid var(--border-subtle)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${s.color}20`;
            (e.currentTarget as HTMLElement).style.borderColor = s.color;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
          }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.12em", marginTop: "0.25rem" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* H2H Dominance Bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>H2H DOMINANCE</span>
          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: 600 }}>{winPct.toFixed(0)}%</span>
        </div>
        <div className="ranking-bar">
          <div className="ranking-bar-fill" style={{ width: `${winPct}%` }} />
        </div>
      </div>

      {/* ELO Progression Sparkline */}
      <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border-subtle)" }}>
        <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          ELO PROGRESSION OVER SEASON
        </div>
        <div style={{ width: "100%", height: "80px", background: "var(--bg-void)", padding: "0.25rem", borderRadius: "2px", border: "1px solid var(--border-subtle)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={driver.history || []} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="round" hide />
              <YAxis domain={["dataMin - 15", "dataMax + 15"]} hide />
              <ChartTooltip
                contentStyle={{ background: "var(--bg-void)", border: "1px solid var(--border-accent)", borderRadius: "2px", padding: "0.25rem 0.5rem" }}
                labelStyle={{ color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "var(--font-mono)" }}
                itemStyle={{ color: "var(--accent-primary)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", padding: 0 }}
                formatter={(value) => [`${Number(value).toFixed(0)} Elo`, "Rating"]}
                labelFormatter={(label) => `Round ${label}`}
              />
              <Line
                type="monotone"
                dataKey="elo"
                stroke="var(--accent-primary)"
                strokeWidth={2}
                dot={{ r: 2, fill: "var(--accent-primary)", strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
              ELO RATING
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)" }}>
              {driver.elo_rating ? driver.elo_rating.toFixed(0) : "0"}
            </div>
          </div>
          <div>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
              QUALI WIN %
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {driver.quali_dominance_pct ? driver.quali_dominance_pct.toFixed(0) : "0"}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EloDashboard({ season }: { season: number }) {
  const [rankings, setRankings] = useState<EloRanking[]>(MOCK_ELO_RANKINGS);
  const [selected, setSelected] = useState<EloRanking>(MOCK_ELO_RANKINGS[0]);
  const [, setError] = useState<unknown>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/predict/elo/rankings?season=${season}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load rankings");
        return res.json();
      })
      .then((data) => {
        if (data.rankings && data.rankings.length > 0) {
          setRankings(data.rankings);
          setSelected((prev) => {
            const found = (data.rankings as EloRanking[]).find((r) => r.driver_id === prev.driver_id);
            return found ?? data.rankings[0];
          });
        }
      })
      .catch((err) => {
        console.error("Error loading ratings from microservice:", err);
        setError(() => { throw err; });
      });
  }, [season]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header and Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg, rgba(0,212,255,0.05), transparent)", padding: "1.25rem 1.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Driver Elo Standings
          </h2>
          <p className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: "0.25rem", margin: 0 }}>
            WEIGHTED TEAMMATE HEAD-TO-HEAD COMPARISON · {season} SEASON
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div className="pulse-dot live" />
          <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)", letterSpacing: "0.1em", fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem" }}>
        {/* Card standinds grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem", alignContent: "start" }}>
          {rankings.map((driver, i) => (
            <DriverCard
              key={driver.driver_id}
              rank={i + 1}
              driver={driver}
              isSelected={selected.driver_id === driver.driver_id}
              onClick={() => setSelected(driver)}
            />
          ))}
        </div>

        {/* Detail panel */}
        <div>
          <H2HPanel driver={selected} />
        </div>
      </div>

      {/* Intelligence Desk Explanation */}
      <div className="panel fade-up" style={{ padding: "1.5rem", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-surface))", borderLeft: "4px solid var(--accent-primary)" }}>
        <div className="section-header" style={{ marginBottom: "1.25rem" }}>
          <span className="section-title">Telemetry Intelligence Desk · Driver Elo Model</span>
          <div className="section-header-line" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <div>
            <h4 style={{ color: "var(--accent-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Core Elo Rating Algorithm</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Our machine learning pipeline separates driver ability from car performance by evaluating <strong>teammate head-to-head comparisons</strong>. Since teammates drive identical cars, comparing their lap-time margins and finishing ratios isolates driver capability from team budgets.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Qualifying Dominance Index</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Represents the percentage of qualifying sessions where this driver outqualified their teammate. Margin differences are scaled via a sigmoid activation function to account for tight margins on fast tracks versus larger gaps on technical street circuits.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Model Uncertainty (±)</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Calculated dynamically using the density of recent sessions. Rookies or drivers returning after a break start with higher uncertainty metrics (initially ±80), which decays into high confidence as session data is ingested from Postgres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
