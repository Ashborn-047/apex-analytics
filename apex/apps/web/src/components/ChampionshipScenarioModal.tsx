import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import Modal from "./Modal";

interface ChampionshipScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: { name: string; team: string; points: number } | null;
}

// Mock scenario data
const SCENARIO_DATA = {
  "Max Verstappen": {
    currentPoints: 245,
    eliminationProbability: 0.02,
    championshipProbability: 0.78,
    scenarios: [
      { outcome: "Win All Remaining", points: 245 + 150, probability: 0.08 },
      { outcome: "Win 80% Races", points: 245 + 120, probability: 0.15 },
      { outcome: "Win 60% Races", points: 245 + 90, probability: 0.25 },
      { outcome: "Win 40% Races", points: 245 + 60, probability: 0.28 },
      { outcome: "Win 20% Races", points: 245 + 30, probability: 0.18 },
      { outcome: "Worst Case", points: 245 + 10, probability: 0.06 },
    ],
    raceByRaceProbs: [
      { race: "Austria", p1: 0.65, p2: 0.22, p3: 0.08, dnf: 0.05 },
      { race: "Silverstone", p1: 0.58, p2: 0.25, p3: 0.12, dnf: 0.05 },
      { race: "Hungary", p1: 0.62, p2: 0.20, p3: 0.13, dnf: 0.05 },
      { race: "Spa", p1: 0.71, p2: 0.18, p3: 0.07, dnf: 0.04 },
      { race: "Monza", p1: 0.68, p2: 0.19, p3: 0.09, dnf: 0.04 },
    ],
  },
};

function CustomScenarioTooltip({ active, payload }: any) {
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
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
        {payload[0].payload.outcome}
      </div>
      <div className="text-mono" style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 600, marginTop: "0.25rem" }}>
        {(payload[0].payload.probability * 100).toFixed(1)}% chance
      </div>
    </div>
  );
}

function CustomRaceTooltip({ active, payload }: any) {
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
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
        {payload[0].payload.race}
      </div>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="text-mono" style={{ fontSize: "0.65rem", color: entry.color, marginTop: "0.2rem" }}>
          {entry.name}: {(entry.value * 100).toFixed(0)}%
        </div>
      ))}
    </div>
  );
}

export default function ChampionshipScenarioModal({ isOpen, onClose, driver }: ChampionshipScenarioModalProps) {
  if (!driver) return null;

  const data = SCENARIO_DATA[driver.name as keyof typeof SCENARIO_DATA] || {
    currentPoints: driver.points,
    eliminationProbability: driver.points < 180 ? 0.95 : (driver.points < 220 ? 0.35 : 0.02),
    championshipProbability: driver.points > 240 ? 0.78 : (driver.points > 200 ? 0.15 : 0.01),
    scenarios: [
      { outcome: "Win All Remaining", points: driver.points + 150, probability: 0.05 },
      { outcome: "Win 80% Races", points: driver.points + 120, probability: 0.10 },
      { outcome: "Win 60% Races", points: driver.points + 90, probability: 0.20 },
      { outcome: "Win 40% Races", points: driver.points + 60, probability: 0.35 },
      { outcome: "Win 20% Races", points: driver.points + 30, probability: 0.20 },
      { outcome: "Worst Case", points: driver.points + 10, probability: 0.10 },
    ],
    raceByRaceProbs: [
      { race: "Austria", p1: driver.points > 240 ? 0.65 : 0.25, p2: 0.22, p3: 0.08, dnf: 0.05 },
      { race: "Silverstone", p1: driver.points > 240 ? 0.58 : 0.22, p2: 0.25, p3: 0.12, dnf: 0.05 },
      { race: "Hungary", p1: driver.points > 240 ? 0.62 : 0.20, p2: 0.20, p3: 0.13, dnf: 0.05 },
      { race: "Spa", p1: driver.points > 240 ? 0.71 : 0.30, p2: 0.18, p3: 0.07, dnf: 0.04 },
      { race: "Monza", p1: driver.points > 240 ? 0.68 : 0.28, p2: 0.19, p3: 0.09, dnf: 0.04 },
    ],
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${driver.name} - Championship Scenarios`} subtitle="Points Distribution & Elimination Analysis" size="xl">
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Header Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[
            { label: "CURRENT POINTS", value: data.currentPoints, accent: true },
            { label: "CHAMPIONSHIP PROBABILITY", value: `${(data.championshipProbability * 100).toFixed(0)}%` },
            { label: "ELIMINATION PROBABILITY", value: `${(data.eliminationProbability * 100).toFixed(1)}%` },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: "1rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                {stat.label}
              </div>
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
            </div>
          ))}
        </div>

        {/* Two-Column Grid */}
        <div className="scenarios-grid">
          {/* Left Column: Charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Scenario Distribution */}
            <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="section-header" style={{ marginBottom: "1rem" }}>
                <span className="section-title">Points Scenario Distribution</span>
                <div className="section-header-line" />
              </div>
              <div style={{ width: "100%", height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.scenarios}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="outcome" tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }} angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} label={{ value: "Points", angle: -90, position: "insideLeft" }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} label={{ value: "Probability", angle: 90, position: "insideRight" }} />
                    <Tooltip content={<CustomScenarioTooltip />} />
                    <Bar yAxisId="left" dataKey="points" fill="var(--accent-primary)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Race-by-Race Probabilities */}
            <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="section-header" style={{ marginBottom: "1rem" }}>
                <span className="section-title">Race-by-Race Finishing Probabilities</span>
                <div className="section-header-line" />
              </div>
              <div style={{ width: "100%", height: "280px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.raceByRaceProbs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="race" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                    <Tooltip content={<CustomRaceTooltip />} />
                    <Line type="monotone" dataKey="p1" stroke="var(--accent-success)" strokeWidth={2.5} name="P1" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="p2" stroke="var(--accent-primary)" strokeWidth={2} name="P2" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="p3" stroke="var(--accent-warning)" strokeWidth={2} name="P3" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Breakdowns */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Scenario Breakdown */}
            <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="section-header" style={{ marginBottom: "1rem" }}>
                <span className="section-title">Detailed Scenario Breakdown</span>
                <div className="section-header-line" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {data.scenarios.map((scenario) => (
                  <div
                    key={scenario.outcome}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 0.8fr 1fr",
                      gap: "0.75rem",
                      alignItems: "center",
                      padding: "0.75rem",
                      background: "var(--bg-panel)",
                      borderRadius: "3px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                        SCENARIO
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {scenario.outcome}
                      </div>
                    </div>

                    <div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                        FINAL PTS
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                        {scenario.points}
                      </div>
                    </div>

                    <div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                        PROBABILITY
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <div style={{ flex: 1, height: "4px", background: "var(--border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              background: "var(--accent-primary)",
                              width: `${scenario.probability * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-mono" style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent-primary)", minWidth: "35px", textAlign: "right" }}>
                          {(scenario.probability * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remaining Races Impact */}
            <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="section-header" style={{ marginBottom: "1rem" }}>
                <span className="section-title">Remaining Races Impact</span>
                <div className="section-header-line" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                {[
                  { race: "Austria", impact: "HIGH", reason: "High points available, favorable track" },
                  { race: "Silverstone", impact: "CRITICAL", reason: "Home race, maximum points opportunity" },
                  { race: "Hungary", impact: "MEDIUM", reason: "Balanced track, moderate points" },
                  { race: "Spa", impact: "HIGH", reason: "High-speed circuit, strong performance expected" },
                ].map((item) => (
                  <div key={item.race} style={{ padding: "1rem", background: "var(--bg-panel)", borderRadius: "3px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {item.race}
                      </div>
                      <div
                        style={{
                          padding: "0.3rem 0.6rem",
                          background:
                            item.impact === "CRITICAL"
                              ? "rgba(239,68,68,0.1)"
                              : item.impact === "HIGH"
                                ? "rgba(251,191,36,0.1)"
                                : "rgba(34,197,94,0.1)",
                          border: `1px solid ${item.impact === "CRITICAL" ? "var(--accent-danger)" : item.impact === "HIGH" ? "var(--accent-warning)" : "var(--accent-success)"}40`,
                          borderRadius: "2px",
                        }}
                      >
                        <div
                          className="text-mono"
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            color: item.impact === "CRITICAL" ? "var(--accent-danger)" : item.impact === "HIGH" ? "var(--accent-warning)" : "var(--accent-success)",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {item.impact}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .scenarios-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2rem;
        }
        @media (max-width: 1024px) {
          .scenarios-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </Modal>
  );
}
