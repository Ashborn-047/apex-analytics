import { useState, useEffect } from "react";
import type { EloRanking } from "../types";
import { API_BASE } from "../config";
import DriverDetailModal from "../components/DriverDetailModal";
import ExportPanel from "../components/ExportPanel";

function DriverRow({ driver, rank, isSelected }: { driver: EloRanking; rank: number; isSelected: boolean }) {
  const eloMin = 1450;
  const eloMax = 1900;
  const eloPercent = Math.max(0, Math.min(100, ((driver.elo_rating - eloMin) / (eloMax - eloMin)) * 100));
  const trendPositive = driver.trend_5_rounds >= 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2rem 1.5rem 1fr 5rem 6rem 5rem 5rem",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.875rem 1rem",
        borderBottom: "1px solid var(--border-subtle)",
        background: isSelected ? "rgba(0,212,255,0.08)" : "transparent",
        borderLeft: isSelected ? "3px solid var(--accent-primary)" : "3px solid transparent",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      {/* Rank */}
      <span
        className="text-mono"
        style={{
          fontSize: "0.7rem",
          color: rank < 3 ? "var(--accent-primary)" : "var(--text-muted)",
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        P{rank + 1}
      </span>

      {/* Team color */}
      <div
        style={{
          width: "4px",
          height: "32px",
          background: driver.team_color || "var(--accent-primary)",
          borderRadius: "2px",
          boxShadow: `0 0 8px ${driver.team_color || "var(--accent-primary)"}40`,
        }}
      />

      {/* Driver */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-primary)",
          }}
        >
          {driver.driver_name}
        </div>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem", letterSpacing: "0.06em" }}>
          {driver.team}
        </div>
      </div>

      {/* ELO Rating */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-primary)" }}>
          {driver.elo_rating.toFixed(0)}
        </div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          ±{driver.uncertainty.toFixed(0)}
        </div>
      </div>

      {/* ELO Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div className="ranking-bar">
          <div
            className="ranking-bar-fill"
            style={{
              width: `${eloPercent}%`,
            }}
          />
        </div>
      </div>

      {/* Qualifying Win Rate */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {driver.quali_dominance_pct.toFixed(0)}%
        </div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          QUAL WIN
        </div>
      </div>

      {/* Trend */}
      <div style={{ textAlign: "right" }}>
        <div
          className="text-mono"
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: trendPositive ? "var(--accent-success)" : "var(--accent-danger)",
          }}
        >
          {trendPositive ? "▲" : "▼"} {Math.abs(driver.trend_5_rounds).toFixed(1)}%
        </div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          VS LAST RND
        </div>
      </div>
    </div>
  );
}

export default function EloDashboard({ season }: { season: number }) {
  const [rankings, setRankings] = useState<EloRanking[]>([]);
  const [selected, setSelected] = useState<EloRanking | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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
            if (prev) {
              const found = (data.rankings as EloRanking[]).find((r) => r.driver_id === prev.driver_id);
              if (found) return found;
            }
            return data.rankings[0];
          });
        }
      })
      .catch((err) => {
        console.error("Error loading ratings from microservice:", err);
        setError(() => { throw err; });
      });
  }, [season]);

  const activeDriver = selected || rankings[0];

  return (
    <>
      <DriverDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} driver={activeDriver} />
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Export and Actions panel */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div className="pulse-dot live" />
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)", letterSpacing: "0.1em", fontWeight: 600 }}>LIVE</span>
          </div>
          <ExportPanel
            drivers={rankings.map((r, i) => ({
              name: r.driver_name,
              team: r.team,
              position: i + 1,
              points: Math.round(r.elo_rating / 10),
              eloRating: r.elo_rating,
            }))}
            title={`Driver ELO Standings ${season}`}
          />
        </div>

        {/* Header stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { label: "TOP DRIVER", value: rankings[0]?.driver_name || "LOADING...", accent: true },
            { 
              label: "ELO RANGE", 
              value: rankings.length > 0 
                ? `${Math.min(...rankings.map((d) => d.elo_rating)).toFixed(0)} - ${Math.max(...rankings.map((d) => d.elo_rating)).toFixed(0)}` 
                : "LOADING..." 
            },
            { 
              label: "AVG RATING", 
              value: rankings.length > 0 
                ? (rankings.reduce((a, d) => a + d.elo_rating, 0) / rankings.length).toFixed(0) 
                : "LOADING..." 
            },
            { label: "DRIVERS RANKED", value: rankings.length.toString() },
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
        {rankings.length > 0 && activeDriver && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem" }}>
            {/* Main ranking table */}
            <div className="panel panel-accent" style={{ overflow: "hidden" }}>
              {/* Column headers */}
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
                {["", "", "DRIVER", "RATING", "ELO BAR", "QUAL %", "TREND"].map((h, i) => (
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

              {/* Driver rows */}
              {rankings.map((driver, i) => (
                <div
                  key={driver.driver_id}
                  onClick={() => setSelected(driver)}
                  onDoubleClick={() => {
                    setSelected(driver);
                    setModalOpen(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <DriverRow driver={driver} rank={i} isSelected={activeDriver.driver_id === driver.driver_id} />
                </div>
              ))}
            </div>

            {/* H2H Comparison Panel */}
            <div className="panel panel-scanner" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="section-header" style={{ marginBottom: "0.5rem" }}>
                <span className="section-title">H2H Comparison</span>
                <div className="section-header-line" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "var(--accent-primary)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {activeDriver.driver_name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {activeDriver.team}
                  </div>
                </div>

                {/* Stats */}
                {[
                  { label: "H2H WINS", value: activeDriver.h2h_record?.wins || 0, color: "var(--accent-success)" },
                  { label: "H2H LOSSES", value: activeDriver.h2h_record?.losses || 0, color: "var(--accent-danger)" },
                  { label: "H2H TIES", value: activeDriver.h2h_record?.ties || 0, color: "var(--text-muted)" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      background: "var(--bg-elevated)",
                      borderRadius: "2px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                      {stat.label}
                    </span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </span>
                  </div>
                ))}

                {/* Dominance bar */}
                {(() => {
                  const wins = activeDriver.h2h_record?.wins || 0;
                  const losses = activeDriver.h2h_record?.losses || 0;
                  const total = wins + losses;
                  const dominance = total > 0 ? (wins / total) * 100 : 0;
                  return (
                    <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
                      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                        H2H DOMINANCE
                      </div>
                      <div className="ranking-bar">
                        <div
                          className="ranking-bar-fill"
                          style={{
                            width: `${dominance}%`,
                          }}
                        />
                      </div>
                      <div
                        className="text-mono"
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--accent-primary)",
                          marginTop: "0.4rem",
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {dominance.toFixed(1)}%
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={() => setModalOpen(true)}
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
                    marginTop: "0.5rem",
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
                  VIEW DETAIL METRICS
                </button>
              </div>
            </div>
          </div>
        )}

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
    </>
  );
}
