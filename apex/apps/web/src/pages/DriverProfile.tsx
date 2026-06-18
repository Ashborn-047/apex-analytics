import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { MOCK_ELO_RANKINGS } from "../data/mockData";

interface DriverProfileProps {
  driverId: string;
  onBack: () => void;
  onCompare: (driverId: string) => void;
}

// Helper to generate career history from debut to 2026
const generateCareerEloHistory = (driverId: string, currentRating: number) => {
  const years = [2022, 2023, 2024, 2025, 2026];
  let rating = currentRating - 120;
  return years.map((year, idx) => {
    // Add some random variation but trend upwards for top drivers
    const multiplier = ["VER", "NOR", "LEC", "PIA", "RUS"].includes(driverId) ? 25 : 5;
    rating += Math.round(Math.random() * 40 - 15 + idx * multiplier);
    return {
      year,
      rating: Math.min(1900, Math.max(1400, rating)),
    };
  });
};

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

const MOCK_H2H_MATCHUPS = [
  { opponent: "Teammate", wins: 18, losses: 4, ties: 0 },
  { opponent: "M. Verstappen", wins: 2, losses: 8, ties: 1 },
  { opponent: "L. Hamilton", wins: 5, losses: 3, ties: 2 },
  { opponent: "C. Leclerc", wins: 4, losses: 6, ties: 0 },
];

const MOCK_CIRCUIT_AFFINITIES = [
  { circuit: "Monaco", performance: 92, type: "Street" },
  { circuit: "Singapore", performance: 88, type: "Street" },
  { circuit: "Silverstone", performance: 85, type: "High Speed" },
  { circuit: "Monza", performance: 78, type: "Low Downforce" },
  { circuit: "Suzuka", performance: 82, type: "Technical" },
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
        {payload[0].payload.round ? `Round ${payload[0].payload.round}` : `Season ${payload[0].payload.year}`}
      </div>
      <div className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 600 }}>
        Rating: {payload[0].value}
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
        vs {payload[0].payload.opponent}
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-success)" }}>
          W: {payload[0].payload.wins}
        </div>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-danger)" }}>
          L: {payload[0].payload.losses}
        </div>
        <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-warning)" }}>
          T: {payload[0].payload.ties}
        </div>
      </div>
    </div>
  );
}

export default function DriverProfile({ driverId, onBack, onCompare }: DriverProfileProps) {
  const [timelineMode, setTimelineMode] = useState<"season" | "career">("season");

  const driver = MOCK_ELO_RANKINGS.find(r => r.driver_id === driverId) || MOCK_ELO_RANKINGS[0];

  const seasonProgression = driver.history && driver.history.length > 0
    ? driver.history.map(h => ({ round: h.round, rating: h.elo }))
    : generateEloProgression(driver.elo_rating);

  const careerHistory = generateCareerEloHistory(driver.driver_id, driver.elo_rating);

  const h2hWins = driver.h2h_record?.wins || 0;
  const h2hLosses = driver.h2h_record?.losses || 0;
  const h2hDominance = (h2hWins + h2hLosses) > 0 ? (h2hWins / (h2hWins + h2hLosses)) * 100 : 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
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

        <button
          onClick={() => onCompare(driver.driver_id)}
          style={{
            background: "linear-gradient(135deg, var(--accent-dim), var(--accent-tint))",
            border: "1px solid var(--accent-primary)",
            color: "var(--accent-primary)",
            padding: "0.5rem 1.25rem",
            fontSize: "0.7rem",
            fontFamily: "var(--font-mono)",
            fontWeight: "bold",
            borderRadius: "3px",
            cursor: "pointer",
            boxShadow: "0 0 12px rgba(0,212,255,0.1)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px var(--accent-dim)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(0,212,255,0.1)";
            (e.currentTarget as HTMLElement).style.transform = "none";
          }}
        >
          ⚖ COMPARE DRIVER
        </button>
      </div>

      {/* Driver Identity Card */}
      <div
        className="panel panel-accent"
        style={{
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: `linear-gradient(135deg, ${driver.team_color}18, var(--bg-surface))`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {/* Nationality Flag representation */}
          <div style={{ fontSize: "2.5rem" }}>{driver.nationality_flag}</div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", color: "var(--text-primary)", margin: 0 }}>
              {driver.driver_name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: driver.team_color
                }}
              />
              <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {driver.team}
              </span>
              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>|</span>
              <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--accent-primary)", fontWeight: 600 }}>
                {driver.driver_id} ID
              </span>
            </div>
          </div>
        </div>

        {/* ELO Rating HUD */}
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              ELO RATING
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
              {driver.elo_rating.toFixed(0)}
            </div>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-secondary)", letterSpacing: "0.05em", marginTop: "0.15rem" }}>
              UNRESOLVED ±{driver.uncertainty.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout of telemetry stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* Card 1: Elo History Charts */}
        <div className="panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="section-header" style={{ flex: 1, margin: 0 }}>
              <span className="section-title">Elo Timeline Progression</span>
              <div className="section-header-line" />
            </div>
            <div style={{ display: "flex", background: "var(--bg-void)", border: "1px solid var(--border-subtle)", borderRadius: "3px", padding: "2px" }}>
              <button
                onClick={() => setTimelineMode("season")}
                className="text-mono"
                style={{
                  background: timelineMode === "season" ? "var(--bg-elevated)" : "transparent",
                  border: "none",
                  color: timelineMode === "season" ? "var(--accent-primary)" : "var(--text-secondary)",
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "2px"
                }}
              >
                SEASON
              </button>
              <button
                onClick={() => setTimelineMode("career")}
                className="text-mono"
                style={{
                  background: timelineMode === "career" ? "var(--bg-elevated)" : "transparent",
                  border: "none",
                  color: timelineMode === "career" ? "var(--accent-primary)" : "var(--text-secondary)",
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "2px"
                }}
              >
                CAREER
              </button>
            </div>
          </div>

          <div style={{ width: "100%", height: "240px", marginTop: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineMode === "season" ? seasonProgression : careerHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis
                  dataKey={timelineMode === "season" ? "round" : "year"}
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="var(--accent-primary)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--accent-primary)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Teammate H2H matches */}
        <div className="panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="section-header">
            <span className="section-title">Teammate Matchup Analysis</span>
            <div className="section-header-line" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "1.5rem", alignItems: "center" }}>
            {/* Dominance wheel logic simulated via stats */}
            <div style={{ textAlign: "center", background: "var(--bg-elevated)", padding: "1.25rem 1rem", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                H2H DOMINANCE
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--accent-success)", marginTop: "0.25rem" }}>
                {h2hDominance.toFixed(1)}%
              </div>
              <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                {h2hWins} W - {h2hLosses} L
              </div>
            </div>

            <div style={{ width: "100%", height: "180px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_H2H_MATCHUPS} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 8, fontFamily: "var(--font-mono)" }} />
                  <YAxis
                    type="category"
                    dataKey="opponent"
                    tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                    width={85}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="wins" stackId="a" fill="var(--accent-success)" radius={[0, 1, 1, 0]} />
                  <Bar dataKey="losses" stackId="a" fill="var(--accent-danger)" />
                  <Bar dataKey="ties" stackId="a" fill="var(--accent-warning)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 3: Circuit affinities */}
        <div className="panel" style={{ padding: "1.5rem" }}>
          <div className="section-header" style={{ marginBottom: "1.25rem" }}>
            <span className="section-title">Circuit Performance Profiles</span>
            <div className="section-header-line" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {MOCK_CIRCUIT_AFFINITIES.map((c) => (
              <div key={c.circuit} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ minWidth: "120px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase" }}>
                    {c.circuit}
                  </div>
                  <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                    {c.type} Sector
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ranking-bar" style={{ height: "6px" }}>
                    <div
                      className="ranking-bar-fill"
                      style={{
                        width: `${c.performance}%`,
                        background: c.performance > 85 ? "var(--accent-primary)" : "var(--text-secondary)"
                      }}
                    />
                  </div>
                </div>
                <div style={{ minWidth: "40px", textAlign: "right" }}>
                  <span className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                    {c.performance}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Tactical performance metrics */}
        <div className="panel" style={{ padding: "1.5rem" }}>
          <div className="section-header" style={{ marginBottom: "1.25rem" }}>
            <span className="section-title">ML Performance Ratings</span>
            <div className="section-header-line" />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "QUALIFYING DOMINANCE", value: `${driver.quali_dominance_pct.toFixed(0)}%`, desc: "Teammate outqualifying ratio" },
              { label: "CONSISTENCY INDEX", value: "91 / 100", desc: "Lap pace variance coefficient" },
              { label: "PRESSURE FACTOR", value: "85 / 100", desc: "Position preservation under attack" },
              { label: "TYRE MANAGEMENT", value: "88 / 100", desc: "Stint wear conservation rating" },
            ].map((metric) => (
              <div
                key={metric.label}
                style={{
                  padding: "1rem",
                  background: "var(--bg-elevated)",
                  borderRadius: "3px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-primary)", letterSpacing: "0.08em", fontWeight: 600 }}>
                    {metric.label}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                    {metric.value}
                  </div>
                </div>
                <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  {metric.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

