import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import Modal from "./Modal";

import type { EloRanking } from "../types";

interface DriverDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: EloRanking | null;
}

// Mock ELO progression data
const generateEloProgression = (startRating: number) => {
  const data = [];
  let currentRating = startRating - 50;
  for (let i = 1; i <= 12; i++) {
    currentRating += Math.random() * 20 - 5;
    data.push({
      round: i,
      rating: Math.round(currentRating),
    });
  }
  return data;
};

// Mock H2H matchup data
const MOCK_H2H_MATCHUPS = [
  { opponent: "Teammate", wins: 18, losses: 4, ties: 0 },
  { opponent: "Max Verstappen", wins: 2, losses: 8, ties: 1 },
  { opponent: "Lewis Hamilton", wins: 5, losses: 3, ties: 2 },
  { opponent: "Charles Leclerc", wins: 4, losses: 6, ties: 0 },
];

// Mock circuit affinity data
const MOCK_CIRCUIT_AFFINITIES = [
  { circuit: "Monaco", performance: 92 },
  { circuit: "Singapore", performance: 88 },
  { circuit: "Silverstone", performance: 85 },
  { circuit: "Monza", performance: 78 },
  { circuit: "Suzuka", performance: 82 },
];

function CustomLineTooltip({ active, payload }: any) {
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
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: 600 }}>
        Round {payload[0].payload.round}
      </div>
      <div className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 600 }}>
        {payload[0].value}
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
        boxShadow: "0 0 16px var(--accent-dim)",
      }}
    >
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
        {payload[0].payload.opponent}
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <div>
          <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-success)" }}>
            W: {payload[0].payload.wins}
          </div>
        </div>
        <div>
          <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-danger)" }}>
            L: {payload[0].payload.losses}
          </div>
        </div>
        <div>
          <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-warning)" }}>
            T: {payload[0].payload.ties}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverDetailModal({ isOpen, onClose, driver }: DriverDetailModalProps) {
  // ⚡ Bolt: [performance improvement] Wrap mock data generation in useMemo to prevent
  // unnecessary recalculation and UI jumps on re-renders, as it uses Math.random()
  const eloProgression = useMemo(() => {
    if (!driver) return [];
    return driver.history && driver.history.length > 0
      ? driver.history.map(h => ({ round: h.round, rating: h.elo }))
      : generateEloProgression(driver.elo_rating);
  }, [driver]);

  if (!driver) return null;

  const h2hWins = driver.h2h_record?.wins || 0;
  const h2hLosses = driver.h2h_record?.losses || 0;
  const h2hDominance = (h2hWins + h2hLosses) > 0 ? (h2hWins / (h2hWins + h2hLosses)) * 100 : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={driver.driver_name} subtitle={driver.team} size="xl">
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Profile Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
          {[
            { label: "ELO RATING", value: driver.elo_rating.toFixed(0), unit: `±${driver.uncertainty.toFixed(0)}`, accent: true },
            { label: "QUALI WIN %", value: `${driver.quali_dominance_pct.toFixed(0)}%`, unit: "" },
            { label: "H2H WINS", value: h2hWins, unit: "vs all" },
            { label: "H2H DOMINANCE", value: `${h2hDominance.toFixed(1)}%`, unit: "" },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: "1rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                {stat.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: stat.accent ? "var(--accent-primary)" : "var(--text-primary)",
                  }}
                >
                  {stat.value}
                </div>
                {stat.unit && (
                  <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                    {stat.unit}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ELO Progression Chart */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">ELO Progression (Season)</span>
            <div className="section-header-line" />
          </div>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eloProgression}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="round" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Tooltip content={<CustomLineTooltip />} />
                <Line type="monotone" dataKey="rating" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ fill: "var(--accent-primary)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* H2H Matchups */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">H2H Matchup Record</span>
            <div className="section-header-line" />
          </div>
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_H2H_MATCHUPS} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }} />
                <YAxis
                  type="category"
                  dataKey="opponent"
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  width={95}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="wins" stackId="a" fill="var(--accent-success)" radius={[0, 2, 2, 0]} />
                <Bar dataKey="losses" stackId="a" fill="var(--accent-danger)" />
                <Bar dataKey="ties" stackId="a" fill="var(--accent-warning)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circuit Affinities */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Circuit Performance Index</span>
            <div className="section-header-line" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {MOCK_CIRCUIT_AFFINITIES.map((circuit) => (
              <div key={circuit.circuit} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ minWidth: "100px" }}>
                  <div className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {circuit.circuit}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ranking-bar">
                    <div
                      className="ranking-bar-fill"
                      style={{
                        width: `${circuit.performance}%`,
                      }}
                    />
                  </div>
                </div>
                <div style={{ minWidth: "50px", textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                    {circuit.performance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Performance Metrics</span>
            <div className="section-header-line" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            {[
              { label: "Qualifying Performance Index", value: "94" },
              { label: "Race Pace Index", value: "91" },
              { label: "Consistency Score", value: "88" },
              { label: "Pressure Performance", value: "85" },
            ].map((metric) => (
              <div key={metric.label} style={{ padding: "1rem", background: "var(--bg-panel)", borderRadius: "3px", border: "1px solid var(--border-subtle)" }}>
                <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                  {metric.label}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

