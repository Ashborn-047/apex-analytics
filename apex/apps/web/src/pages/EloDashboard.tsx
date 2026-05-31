import { useState, useEffect } from "react";
import { MOCK_ELO_RANKINGS } from "../data/mockData";
import type { EloRanking } from "../types";

function EloBar({ pct }: { pct: number }) {
  return (
    <div className="prob-bar" style={{ width: "100%" }}>
      <div className="prob-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className="text-mono"
      style={{
        fontSize: "0.7rem",
        color: positive ? "var(--accent-success)" : "var(--accent-danger)",
        letterSpacing: "0.04em",
      }}
    >
      {positive ? "▲" : "▼"} {Math.abs(value).toFixed(1)}
    </span>
  );
}

function DriverRow({
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
  const maxElo = 1900;
  const minElo = 1600;
  const pct = ((driver.elo_rating - minElo) / (maxElo - minElo)) * 100;

  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "2.5rem 1fr 7rem 6rem 6rem",
        gap: "0.75rem",
        alignItems: "center",
        padding: "0.875rem 1rem",
        borderBottom: "1px solid var(--border-subtle)",
        cursor: "pointer",
        background: isSelected ? "var(--bg-elevated)" : "transparent",
        borderLeft: isSelected ? "2px solid var(--accent-primary)" : "2px solid transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Rank */}
      <div
        className="text-mono"
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: rank <= 3 ? "var(--accent-primary)" : "var(--text-muted)",
          textAlign: "center",
        }}
      >
        P{rank}
      </div>

      {/* Driver info + bar */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
          <span style={{ fontSize: "0.85rem" }}>{driver.nationality_flag}</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {driver.driver_name}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <span
            style={{
              width: "8px", height: "8px", borderRadius: "2px",
              background: driver.team_color, flexShrink: 0,
            }}
          />
          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {driver.team}
          </span>
        </div>
        <EloBar pct={pct} />
      </div>

      {/* Elo */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
          {driver.elo_rating.toFixed(0)}
        </div>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginTop: "0.2rem" }}>
          ELO ±{driver.uncertainty.toFixed(0)}
        </div>
      </div>

      {/* Quali % */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {driver.quali_dominance_pct.toFixed(0)}%
        </div>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: "0.2rem" }}>
          QUALI WIN
        </div>
      </div>

      {/* Trend */}
      <div style={{ textAlign: "right" }}>
        <TrendBadge value={driver.trend_5_rounds} />
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: "0.2rem" }}>
          5-RND TREND
        </div>
      </div>
    </div>
  );
}

function H2HPanel({ driver }: { driver: EloRanking }) {
  const { h2h_record: rec } = driver;
  const total = rec.wins + rec.losses + rec.ties;
  const winPct = total > 0 ? (rec.wins / total) * 100 : 0;

  return (
    <div className="panel fade-up" style={{ padding: "1.5rem" }}>
      <div className="section-header" style={{ marginBottom: "1rem" }}>
        <span className="section-title">Teammate Comparison</span>
        <div className="section-header-line" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "1rem" }}>{driver.nationality_flag}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-primary)" }}>
          {driver.driver_name}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "WINS", value: rec.wins, color: "var(--accent-success)" },
          { label: "LOSSES", value: rec.losses, color: "var(--accent-danger)" },
          { label: "TIES", value: rec.ties, color: "var(--text-muted)" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center", background: "var(--bg-elevated)", padding: "0.75rem", borderRadius: "3px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.12em", marginTop: "0.25rem" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>H2H DOMINANCE</span>
          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)" }}>{winPct.toFixed(0)}%</span>
        </div>
        <div className="prob-bar">
          <div className="prob-bar-fill" style={{ width: `${winPct}%` }} />
        </div>
      </div>

      <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
              ELO RATING
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)" }}>
              {driver.elo_rating.toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
              QUALI WIN RATE
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {driver.quali_dominance_pct.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EloDashboard() {
  const [rankings, setRankings] = useState<EloRanking[]>(MOCK_ELO_RANKINGS);
  const [selected, setSelected] = useState<EloRanking>(MOCK_ELO_RANKINGS[0]);

  useEffect(() => {
    fetch("/api/predict/elo/rankings")
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
      .catch((err) => console.error("Error loading ratings from microservice:", err));
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem" }}>
      {/* Rankings table */}
      <div className="panel" style={{ overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Driver Elo Rankings
            </h2>
            <p className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: "0.25rem" }}>
              WEIGHTED TEAMMATE HEAD-TO-HEAD · ROUND 12 / 24
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div className="pulse-dot" />
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2.5rem 1fr 7rem 6rem 6rem",
          gap: "0.75rem",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}>
          {["RNK", "DRIVER", "ELO", "Q-WIN%", "TREND"].map((h) => (
            <div key={h} className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em", textAlign: h !== "DRIVER" ? "right" : "left" }}>
              {h === "RNK" ? <span style={{ textAlign: "center", display: "block" }}>{h}</span> : h}
            </div>
          ))}
        </div>

        {rankings.map((driver, i) => (
          <DriverRow
            key={driver.driver_id}
            rank={i + 1}
            driver={driver}
            isSelected={selected.driver_id === driver.driver_id}
            onClick={() => setSelected(driver)}
          />
        ))}
      </div>

      {/* Detail panel */}
      <H2HPanel driver={selected} />
    </div>
  );
}
