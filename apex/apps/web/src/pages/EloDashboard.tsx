import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import type { EloRanking } from "../types";
import { API_BASE } from "../config";
import ExportPanel from "../components/ExportPanel";
import EloHistory from "./EloHistory";

/**
 * Lightweight SVG sparkline for rendering driver rating history inline within a table row.
 *
 * @param props - Component props containing the array of numbers to plot.
 * @returns An SVG element displaying the sparkline, or null if insufficient data.
 */
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const width = 50;
  const height = 14;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - 1 - ((val - min) / range) * (height - 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ stroke: "var(--accent-primary)", fill: "none", strokeWidth: 1.5, opacity: 0.8 }}>
      <polyline points={points} />
    </svg>
  );
}

/**
 * Props for the DriverRow component.
 */
interface DriverRowProps {
  /** The Elo ranking data for the driver */
  driver: EloRanking;
  /** The rank index of the driver (0-indexed) */
  rank: number;
  /** Flag indicating if the row is currently selected */
  isSelected: boolean;
  /** Flag indicating if the driver is selected for comparison */
  isCompareChecked: boolean;
  /** Callback triggered when toggling the compare checkbox */
  onCompareToggle: (e: React.MouseEvent) => void;
  /** The performance form percentage index */
  formIndex: number;
  /** The performance form trend direction ("UP" or "DOWN") */
  formTrend: string;
}

/**
 * Renders a single row in the Elo standings table, displaying driver info, team color,
 * rating value, a visual progression bar, performance form badge, and historic sparkline.
 */
function DriverRow({
  driver,
  rank,
  isSelected,
  isCompareChecked,
  onCompareToggle,
  formIndex,
  formTrend
}: DriverRowProps) {
  const eloMin = 1450;
  const eloMax = 1900;
  const eloPercent = Math.max(0, Math.min(100, ((driver.elo_rating - eloMin) / (eloMax - eloMin)) * 100));
  
  // Extract mock sparkline progression
  const sparklineData = driver.history ? driver.history.map(h => h.elo) : [1720, 1730, 1715, 1740, driver.elo_rating];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2.5rem 2rem 1.5rem 1fr 5rem 5rem 4.5rem 4.5rem 4rem",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid var(--border-subtle)",
        background: isSelected ? "var(--accent-tint)" : "transparent",
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
      {/* Compare Checkbox */}
      <div style={{ textAlign: "center" }} onClick={onCompareToggle}>
        <input
          type="checkbox"
          checked={isCompareChecked}
          onChange={() => {}} // Controlled internally via onClick on row cell
          style={{
            cursor: "pointer",
            accentColor: "var(--accent-primary)",
            width: "14px",
            height: "14px"
          }}
        />
      </div>

      {/* Rank */}
      <span
        className="text-mono"
        style={{
          fontSize: "0.7rem",
          color: rank < 3 ? "var(--accent-primary)" : "var(--text-secondary)",
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        P{rank + 1}
      </span>

      {/* Team color line */}
      <div
        style={{
          width: "4px",
          height: "28px",
          background: driver.team_color || "var(--accent-primary)",
          borderRadius: "2px",
          boxShadow: `0 0 8px ${driver.team_color || "var(--accent-primary)"}30`,
        }}
      />

      {/* Driver Identity */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-primary)",
          }}
        >
          {driver.driver_name} {driver.nationality_flag}
        </div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
          {driver.team}
        </div>
      </div>

      {/* ELO Rating */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 800, color: "var(--accent-primary)" }}>
          {driver.elo_rating.toFixed(0)}
        </div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)", letterSpacing: "0.05em" }}>
          ±{driver.uncertainty.toFixed(0)}
        </div>
      </div>

      {/* ELO Progress visual bar */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="ranking-bar" style={{ height: "4px" }}>
          <div
            className="ranking-bar-fill"
            style={{
              width: `${eloPercent}%`,
              background: "var(--accent-primary)"
            }}
          />
        </div>
      </div>

      {/* Form Index Badge */}
      <div style={{ textAlign: "center" }}>
        <span
          className="text-mono"
          style={{
            display: "inline-block",
            fontSize: "0.65rem",
            fontWeight: "bold",
            padding: "0.15rem 0.4rem",
            borderRadius: "2px",
            background: formIndex >= 90 ? "rgba(34,197,94,0.15)" : formIndex >= 75 ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${formIndex >= 90 ? "var(--accent-success)" : formIndex >= 75 ? "var(--accent-warning)" : "var(--accent-danger)"}40`,
            color: formIndex >= 90 ? "var(--accent-success)" : formIndex >= 75 ? "var(--accent-warning)" : "var(--accent-danger)"
          }}
        >
          {formIndex}% {formTrend === "UP" ? "▲" : "▼"}
        </span>
      </div>

      {/* Micro Sparkline */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Sparkline data={sparklineData} />
      </div>

      {/* Qualifying Dominance */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {driver.quali_dominance_pct.toFixed(0)}%
        </div>
        <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
          QUAL H2H
        </div>
      </div>
    </div>
  );
}

/**
 * Props for the EloDashboard component.
 */
interface EloDashboardProps {
  /** The active season year to load Elo data for */
  season: number;
  /** Optional callback to open a specific driver's profile view */
  onViewProfile?: (driverId: string) => void;
  /** Optional callback to initiate a compare view with the driver */
  onViewCompare?: (driverId: string) => void;
  /** Optional sub-tab selector ("standings" or "history") */
  subTab?: "standings" | "history";
}

/**
 * EloDashboard is the primary dashboard page component for driver ratings,
 * displaying current standings list, statistics card deck, compare launch controls,
 * and historical trajectory visualizer.
 */
export default function EloDashboard({ season, onViewProfile, onViewCompare, subTab = "standings" }: EloDashboardProps) {
  const [rankings, setRankings] = useState<EloRanking[]>([]);
  const [selected, setSelected] = useState<EloRanking | null>(null);
  const [scope, setScope] = useState<"season" | "career">("season");
  const [compareList, setCompareList] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error;
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/predict/elo/rankings?season=${season}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load rankings");
        return res.json();
      })
      .then((data) => {
        if (data.rankings && data.rankings.length > 0) {
          let sortedRankings = data.rankings as EloRanking[];
          
          // If all-time career scope is enabled, modify the Elo values and sort to showcase Career changes
          if (scope === "career") {
            const careerPeakValues: Record<string, number> = {
              HAM: 1888, // Peak Mercedes Hamilton
              VER: 1862, // Peak Verstappen
              ALO: 1850, // Peak Alonso
              NOR: 1805,
              LEC: 1795,
              RUS: 1765,
              PIA: 1750,
              SAI: 1745,
            };
            
            sortedRankings = sortedRankings.map(d => ({
              ...d,
              elo_rating: careerPeakValues[d.driver_id] || d.elo_rating
            })).sort((a, b) => b.elo_rating - a.elo_rating);
          }

          setRankings(sortedRankings);
          setSelected(prev => {
            if (prev) {
              const found = sortedRankings.find(r => r.driver_id === prev.driver_id);
              if (found) return found;
            }
            return sortedRankings[0];
          });
        }
      })
      .catch((err) => {
        console.error("Error loading ratings from microservice:", err);
        setError(err);
      });
  }, [season, scope]);

  const handleCompareToggle = (driverId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click trigger
    setCompareList(prev => {
      if (prev.includes(driverId)) {
        return prev.filter(id => id !== driverId);
      } else {
        if (prev.length >= 2) {
          // Keep max 2 items by removing the oldest
          return [prev[1], driverId];
        }
        return [...prev, driverId];
      }
    });
  };

  const activeDriver = selected || rankings[0];

  // In-memory mock Form Index metrics matching Model 1 outputs
  const mockFormMetrics: Record<string, { val: number; trend: string }> = {
    VER: { val: 96, trend: "UP" },
    NOR: { val: 92, trend: "UP" },
    LEC: { val: 85, trend: "DOWN" },
    HAM: { val: 78, trend: "DOWN" },
    RUS: { val: 88, trend: "UP" },
    PIA: { val: 89, trend: "UP" },
    SAI: { val: 81, trend: "DOWN" },
    ALO: { val: 74, trend: "DOWN" },
  };

  const statsSummary = useMemo(() => {
    if (!rankings || rankings.length === 0) return null;
    let minElo = Infinity;
    let maxElo = -Infinity;
    let sumElo = 0;

    for (let i = 0; i < rankings.length; i++) {
      const elo = rankings[i].elo_rating;
      if (elo < minElo) minElo = elo;
      if (elo > maxElo) maxElo = elo;
      sumElo += elo;
    }

    return {
      minElo,
      maxElo,
      avgElo: sumElo / rankings.length
    };
  }, [rankings]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Module Sub-Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1px", gap: "0.5rem" }}>
        <NavLink
          to="/elo"
          end
          style={({ isActive }) => subnavLinkStyle(isActive)}
        >
          STANDINGS
        </NavLink>
        <NavLink
          to="/elo/history"
          style={({ isActive }) => subnavLinkStyle(isActive)}
        >
          RATING HISTORY
        </NavLink>
      </div>

      {subTab === "history" ? (
        <EloHistory />
      ) : (
        <>
      {/* Top Header Controls with Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Scope Selector Filter */}
        <div style={{ display: "flex", background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: "4px", padding: "3px" }}>
          <button
            onClick={() => setScope("season")}
            className="text-mono"
            style={{
              background: scope === "season" ? "var(--bg-elevated)" : "transparent",
              border: "none",
              color: scope === "season" ? "var(--accent-primary)" : "var(--text-secondary)",
              padding: "0.4rem 1.25rem",
              fontSize: "0.7rem",
              fontWeight: "bold",
              cursor: "pointer",
              borderRadius: "2px",
              letterSpacing: "0.08em"
            }}
          >
            CURRENT SEASON ELO
          </button>
          <button
            onClick={() => setScope("career")}
            className="text-mono"
            style={{
              background: scope === "career" ? "var(--bg-elevated)" : "transparent",
              border: "none",
              color: scope === "career" ? "var(--accent-primary)" : "var(--text-secondary)",
              padding: "0.4rem 1.25rem",
              fontSize: "0.7rem",
              fontWeight: "bold",
              cursor: "pointer",
              borderRadius: "2px",
              letterSpacing: "0.08em"
            }}
          >
            CAREER ALL-TIME PEAKS
          </button>
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

      {/* Header Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {[
          { label: "P1 LEADER", value: rankings[0]?.driver_name || "LOADING...", accent: true },
          { 
            label: "ELO SPREAD", 
            value: statsSummary
              ? `${statsSummary.minElo.toFixed(0)} - ${statsSummary.maxElo.toFixed(0)}`
              : "LOADING..." 
          },
          { 
            label: "AVERAGE GRID RATING", 
            value: statsSummary
              ? statsSummary.avgElo.toFixed(0)
              : "LOADING..." 
          },
          { label: "INDEXED DRIVERS", value: rankings.length.toString() },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-value ${s.accent ? "shimmer-text" : ""}`} style={s.accent ? {} : { color: "var(--text-primary)" }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table Rankings Layout */}
      {rankings.length > 0 && activeDriver && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.25rem" }}>
          
          {/* Main ranking table */}
          <div className="panel panel-accent" style={{ overflow: "hidden" }}>
            
            {/* Headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2.5rem 2rem 1.5rem 1fr 5rem 5rem 4.5rem 4.5rem 4rem",
                gap: "0.75rem",
                padding: "0.5rem 1rem",
                borderBottom: "1px solid var(--border-subtle)",
                background: "linear-gradient(90deg, var(--bg-surface), transparent)",
              }}
            >
              {["COMP", "", "", "DRIVER", "RATING", "ELO BAR", "FORM", "TREND", "QUAL H2H"].map((h, i) => (
                <div
                  key={i}
                  className="text-mono"
                  style={{
                    fontSize: "0.55rem",
                    color: "var(--text-dim)",
                    letterSpacing: "0.1em",
                    textAlign: i >= 4 && i !== 6 && i !== 7 ? "right" : i === 6 || i === 7 ? "center" : "left",
                    fontWeight: 600
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {rankings.map((driver, i) => {
              const form = mockFormMetrics[driver.driver_id] || { val: 80, trend: "STABLE" };
              return (
                <div
                  key={driver.driver_id}
                  onClick={() => setSelected(driver)}
                  onDoubleClick={() => onViewProfile && onViewProfile(driver.driver_id)}
                  style={{ cursor: "pointer" }}
                >
                  <DriverRow
                    driver={driver}
                    rank={i}
                    isSelected={activeDriver.driver_id === driver.driver_id}
                    isCompareChecked={compareList.includes(driver.driver_id)}
                    onCompareToggle={(e) => handleCompareToggle(driver.driver_id, e)}
                    formIndex={form.val}
                    formTrend={form.trend}
                  />
                </div>
              );
            })}
          </div>

          {/* Quick HUD panel */}
          <div className="panel panel-scanner" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="section-header" style={{ marginBottom: "0.5rem" }}>
              <span className="section-title">Telemetry Deck</span>
              <div className="section-header-line" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--accent-primary)"
                  }}
                >
                  {activeDriver.driver_name}
                </div>
                <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                  {activeDriver.team}
                </div>
              </div>

              {[
                { label: "CURRENT RATING", value: activeDriver.elo_rating.toFixed(0), color: "var(--text-primary)" },
                { label: "UNCERTAINTY", value: `±${activeDriver.uncertainty.toFixed(0)}`, color: "var(--text-muted)" },
                { label: "QUALIFYING H2H", value: `${activeDriver.quali_dominance_pct.toFixed(0)}% Wins`, color: "var(--accent-primary)" },
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
                  <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                    {stat.label}
                  </span>
                  <span className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              ))}

              <button
                onClick={() => onViewProfile && onViewProfile(activeDriver.driver_id)}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                  background: "var(--accent-primary)",
                  color: "var(--bg-void)",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                  boxShadow: "0 0 10px rgba(0,212,255,0.1)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px var(--accent-glow)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(0,212,255,0.1)";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                OPEN DRIVER PROFILE ðŸ¡¥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Action Bar at the Bottom */}
      {compareList.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(17,24,32,0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--accent-primary)",
            borderRadius: "4px",
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 16px var(--accent-dim)",
            zIndex: 1000,
            animation: "slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
              COMPARE SELECTED:
            </span>
            {compareList.map(id => {
              const name = rankings.find((r: EloRanking) => r.driver_id === id)?.driver_name.split(" ")[1] || id;
              return (
                <span
                  key={id}
                  className="text-mono"
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    padding: "0.15rem 0.4rem",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "2px",
                    color: "var(--accent-primary)"
                  }}
                >
                  {name} ({id})
                </span>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setCompareList([])}
              className="text-mono"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-danger)",
                cursor: "pointer",
                fontSize: "0.65rem",
                fontWeight: "bold"
              }}
            >
              CLEAR
            </button>
            <button
              onClick={() => compareList.length === 2 && onViewCompare && onViewCompare(compareList[0])}
              disabled={compareList.length < 2}
              style={{
                background: compareList.length === 2 ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: compareList.length === 2 ? "var(--bg-void)" : "var(--text-muted)",
                border: "none",
                borderRadius: "2px",
                padding: "0.3rem 1rem",
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                fontWeight: "bold",
                cursor: compareList.length === 2 ? "pointer" : "not-allowed",
                boxShadow: compareList.length === 2 ? "0 0 10px var(--accent-dim)" : "none",
                transition: "all 0.2s"
              }}
            >
              LAUNCH COMPARISON ðŸ¡¥
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* CSS Animation Keyframes inline style */}
      <style>{`
        @keyframes slideInUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

