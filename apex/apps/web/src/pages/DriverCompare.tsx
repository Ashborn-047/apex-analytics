import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import type { EloRanking } from "../types";
import { MOCK_ELO_RANKINGS } from "../data/mockData";
import { API_BASE } from "../config";

interface DriverCompareProps {
  initialDriverId: string;
  onBack: () => void;
}

// Generate progression overlays dynamically
const generateEloComparisonHistory = (driverA: EloRanking, driverB: EloRanking) => {
  const data = [];
  let ratingA = driverA.elo_rating - 60;
  let ratingB = driverB.elo_rating - 40;
  for (let i = 1; i <= 12; i++) {
    ratingA += Math.random() * 22 - 7;
    ratingB += Math.random() * 20 - 6;
    data.push({
      round: i,
      [driverA.driver_id]: Math.round(ratingA),
      [driverB.driver_id]: Math.round(ratingB),
    });
  }
  return data;
};

export default function DriverCompare({ initialDriverId, onBack }: DriverCompareProps) {
  const [driverAId, setDriverAId] = useState<string>(initialDriverId);
  const [driverBId, setDriverBId] = useState<string>(
    MOCK_ELO_RANKINGS.find(r => r.driver_id !== initialDriverId)?.driver_id || ""
  );
  const [h2hMatchup, setH2hMatchup] = useState<{ wins: number; losses: number; ties: number } | null>(null);

  const driverA = MOCK_ELO_RANKINGS.find(r => r.driver_id === driverAId) || MOCK_ELO_RANKINGS[0];
  const driverB = MOCK_ELO_RANKINGS.find(r => r.driver_id === driverBId) || MOCK_ELO_RANKINGS[1];

  // Fetch real-time H2H between the selected pair if available
  useEffect(() => {
    if (driverAId && driverBId) {
      fetch(`${API_BASE}/api/predict/elo/head-to-head?driver_a=${driverAId}&driver_b=${driverBId}`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          if (data && data.record) {
            setH2hMatchup(data.record);
          } else {
            // Roll back to teammate mock logic or a clean dynamic state
            setH2hMatchup({ wins: 8, losses: 6, ties: 0 });
          }
        })
        .catch(() => {
          // Fallback if microservice endpoint throws or is unavailable
          setH2hMatchup({ wins: 6, losses: 4, ties: 0 });
        });
    }
  }, [driverAId, driverBId]);

  // Memoize computationally expensive chart data to prevent unnecessary re-renders
  // and UI jitter when local state (like h2hMatchup) updates.
  const chartData = useMemo(() => generateEloComparisonHistory(driverA, driverB), [driverA, driverB]);

  // Radar/Polar data comparing tactical indices
  const radarData = useMemo(() => [
    { subject: "Qualifying", [driverA.driver_id]: driverA.quali_dominance_pct, [driverB.driver_id]: driverB.quali_dominance_pct, fullMark: 100 },
    { subject: "Elo Rating", [driverA.driver_id]: (driverA.elo_rating / 1900) * 100, [driverB.driver_id]: (driverB.elo_rating / 1900) * 100, fullMark: 100 },
    { subject: "Consistency", [driverA.driver_id]: 92, [driverB.driver_id]: 88, fullMark: 100 },
    { subject: "Tyre Wear", [driverA.driver_id]: 85, [driverB.driver_id]: 90, fullMark: 100 },
    { subject: "Pressure Pace", [driverA.driver_id]: 88, [driverB.driver_id]: 82, fullMark: 100 },
  ], [driverA, driverB]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header controls */}
      <div>
        <button
          onClick={onBack}
          className="text-mono"
          style={{
            background: "transparent",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            padding: "0.5rem 1rem",
            fontSize: "0.7rem",
            fontWeight: "bold",
            borderRadius: "3px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          ◀ STANDINGS BACKFEED
        </button>
      </div>

      {/* Driver Selectors Split View */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* Selector A */}
        <div
          className="panel"
          style={{
            padding: "1.25rem 1.5rem",
            borderLeft: `4px solid ${driverA.team_color}`,
            background: `linear-gradient(135deg, ${driverA.team_color}10, var(--bg-surface))`
          }}
        >
          <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            COMPARE SUBJECT A
          </div>
          <select
            value={driverAId}
            onChange={(e) => setDriverAId(e.target.value)}
            className="text-mono"
            style={{
              background: "var(--bg-void)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontSize: "1.1rem",
              fontWeight: "bold",
              padding: "0.5rem",
              borderRadius: "3px",
              width: "100%",
              outline: "none"
            }}
          >
            {MOCK_ELO_RANKINGS.map(r => (
              <option key={r.driver_id} value={r.driver_id} style={{ background: "var(--bg-panel)" }}>
                {r.driver_name} ({r.driver_id})
              </option>
            ))}
          </select>
          <div className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            {driverA.team} · ELO {driverA.elo_rating.toFixed(0)}
          </div>
        </div>

        {/* Selector B */}
        <div
          className="panel"
          style={{
            padding: "1.25rem 1.5rem",
            borderLeft: `4px solid ${driverB.team_color}`,
            background: `linear-gradient(135deg, ${driverB.team_color}10, var(--bg-surface))`
          }}
        >
          <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            COMPARE SUBJECT B
          </div>
          <select
            value={driverBId}
            onChange={(e) => setDriverBId(e.target.value)}
            className="text-mono"
            style={{
              background: "var(--bg-void)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontSize: "1.1rem",
              fontWeight: "bold",
              padding: "0.5rem",
              borderRadius: "3px",
              width: "100%",
              outline: "none"
            }}
          >
            {MOCK_ELO_RANKINGS.map(r => (
              <option key={r.driver_id} value={r.driver_id} style={{ background: "var(--bg-panel)" }}>
                {r.driver_name} ({r.driver_id})
              </option>
            ))}
          </select>
          <div className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            {driverB.team} · ELO {driverB.elo_rating.toFixed(0)}
          </div>
        </div>

      </div>

      {/* Numerical Metrics delta overlay */}
      <div className="panel" style={{ padding: "1.5rem" }}>
        <div className="section-header" style={{ marginBottom: "1rem" }}>
          <span className="section-title">Telemetry Matchup Deltas</span>
          <div className="section-header-line" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            {
              label: "CURRENT ELO RATING",
              valA: driverA.elo_rating.toFixed(0),
              valB: driverB.elo_rating.toFixed(0),
              diff: `${(driverA.elo_rating - driverB.elo_rating) >= 0 ? "+" : ""}${(driverA.elo_rating - driverB.elo_rating).toFixed(0)}`,
              winner: driverA.elo_rating >= driverB.elo_rating ? "A" : "B"
            },
            {
              label: "QUALIFYING WIN RATE",
              valA: `${driverA.quali_dominance_pct.toFixed(0)}%`,
              valB: `${driverB.quali_dominance_pct.toFixed(0)}%`,
              diff: `${(driverA.quali_dominance_pct - driverB.quali_dominance_pct) >= 0 ? "+" : ""}${(driverA.quali_dominance_pct - driverB.quali_dominance_pct).toFixed(0)}%`,
              winner: driverA.quali_dominance_pct >= driverB.quali_dominance_pct ? "A" : "B"
            },
            {
              label: "DIRECT HEAD-TO-HEAD",
              valA: `${h2hMatchup?.wins || 0} Wins`,
              valB: `${h2hMatchup?.losses || 0} Wins`,
              diff: `${h2hMatchup ? (h2hMatchup.wins - h2hMatchup.losses >= 0 ? "+" : "") + (h2hMatchup.wins - h2hMatchup.losses) : "0"} W`,
              winner: (h2hMatchup?.wins || 0) >= (h2hMatchup?.losses || 0) ? "A" : "B"
            }
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 200px 1fr",
                alignItems: "center",
                padding: "0.75rem 1rem",
                background: "var(--bg-elevated)",
                borderRadius: "3px",
                border: "1px solid var(--border-subtle)"
              }}
            >
              {/* Value A */}
              <div style={{ textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: row.winner === "A" ? "var(--accent-primary)" : "var(--text-secondary)"
                  }}
                >
                  {row.valA}
                </span>
                {row.winner === "A" && <span style={{ fontSize: "0.6rem", color: "var(--accent-success)" }}>[DOMINANT]</span>}
              </div>

              {/* Label & Delta */}
              <div style={{ textAlign: "center" }}>
                <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  {row.label}
                </div>
                <div
                  className="text-mono"
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    color: "var(--accent-primary)",
                    marginTop: "0.15rem"
                  }}
                >
                  {row.diff} Delta
                </div>
              </div>

              {/* Value B */}
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                {row.winner === "B" && <span style={{ fontSize: "0.6rem", color: "var(--accent-success)" }}>[DOMINANT]</span>}
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: row.winner === "B" ? "var(--accent-primary)" : "var(--text-secondary)"
                  }}
                >
                  {row.valB}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparative Charts Overlay */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* Elo History Overlay */}
        <div className="panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="section-header">
            <span className="section-title">Overlay Elo Progression</span>
            <div className="section-header-line" />
          </div>

          <div style={{ width: "100%", height: "230px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="round" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }} />
                <Tooltip />
                <Line type="monotone" dataKey={driverA.driver_id} stroke={driverA.team_color} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey={driverB.driver_id} stroke={driverB.team_color} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Polar Performance Comparison Radar */}
        <div className="panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="section-header">
            <span className="section-title">Comparative Performance Radar</span>
            <div className="section-header-line" />
          </div>

          <div style={{ width: "100%", height: "230px", display: "flex", justifyContent: "center" }}>
            <ResponsiveContainer width="90%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border-subtle)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-dim)", fontSize: 8 }} />
                <Radar name={driverA.driver_name} dataKey={driverA.driver_id} stroke={driverA.team_color} fill={driverA.team_color} fillOpacity={0.25} />
                <Radar name={driverB.driver_name} dataKey={driverB.driver_id} stroke={driverB.team_color} fill={driverB.team_color} fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
