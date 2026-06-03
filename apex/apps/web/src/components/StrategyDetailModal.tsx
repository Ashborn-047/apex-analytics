import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Modal from "./Modal";

interface StrategyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lapNumber: number | null;
}

// Mock strategy detail data
const STRATEGY_SCENARIOS = [
  {
    name: "Aggressive Undercut",
    pitLap: 12,
    compound: "MEDIUM",
    netDelta: -0.85,
    riskLevel: "LOW",
    successRate: 0.92,
    rationale: "Pit early to undercut P1. Clear track, optimal fuel load.",
  },
  {
    name: "Conservative Hold",
    pitLap: 15,
    compound: "HARD",
    netDelta: -0.42,
    riskLevel: "MEDIUM",
    successRate: 0.78,
    rationale: "Wait for traffic to clear. Reduce undercut risk.",
  },
  {
    name: "Late Pit (Overcut)",
    pitLap: 18,
    compound: "HARD",
    netDelta: 0.12,
    riskLevel: "HIGH",
    successRate: 0.45,
    rationale: "Pit late to overcut. Only viable if leading.",
  },
];

// Mock fuel consumption data
const FUEL_DATA = [
  { lap: 1, fuelRemaining: 110, consumption: 2.2 },
  { lap: 5, fuelRemaining: 99, consumption: 2.2 },
  { lap: 10, fuelRemaining: 88, consumption: 2.2 },
  { lap: 12, fuelRemaining: 84, consumption: 2.2 },
  { lap: 15, fuelRemaining: 78, consumption: 2.2 },
  { lap: 20, fuelRemaining: 67, consumption: 2.2 },
];

// Mock race state at specific lap
const RACE_STATE_AT_LAP = {
  12: [
    { position: 1, driver: "Verstappen", gap: 0, compound: "SOFT", tyreAge: 12 },
    { position: 2, driver: "Leclerc", gap: 1.2, compound: "SOFT", tyreAge: 12 },
    { position: 3, driver: "Hamilton", gap: 2.5, compound: "MEDIUM", tyreAge: 8 },
  ],
};

function CustomLineTooltip({ active, payload }: any) {
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
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: 600 }}>
        Lap {payload[0].payload.lap}
      </div>
      <div className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-primary)", marginTop: "0.25rem" }}>
        Fuel: {payload[0].value.toFixed(1)} kg
      </div>
    </div>
  );
}

export default function StrategyDetailModal({ isOpen, onClose, lapNumber }: StrategyDetailModalProps) {
  if (!lapNumber) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Strategy Analysis - Lap ${lapNumber}`} subtitle="Pit Stop Scenarios & Race State" size="xl">
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Strategy Scenarios */}
        <div>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Available Pit Strategies</span>
            <div className="section-header-line" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {STRATEGY_SCENARIOS.map((strategy, idx) => (
              <div
                key={strategy.name}
                style={{
                  padding: "1rem",
                  background: idx === 0 ? "rgba(0,212,255,0.08)" : "var(--bg-elevated)",
                  border: idx === 0 ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      STRATEGY
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {strategy.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      PIT LAP
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                      {strategy.pitLap}
                    </div>
                  </div>

                  <div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      NET DELTA
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: strategy.netDelta < 0 ? "var(--accent-success)" : "var(--accent-danger)" }}>
                      {strategy.netDelta > 0 ? "+" : ""}{strategy.netDelta.toFixed(2)}s
                    </div>
                  </div>

                  <div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      SUCCESS RATE
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                      {(strategy.successRate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      padding: "0.5rem 0.75rem",
                      background: strategy.riskLevel === "LOW" ? "rgba(34,197,94,0.1)" : strategy.riskLevel === "MEDIUM" ? "rgba(251,191,36,0.1)" : "rgba(239,68,68,0.1)",
                      border: `1px solid ${strategy.riskLevel === "LOW" ? "var(--accent-success)" : strategy.riskLevel === "MEDIUM" ? "var(--accent-warning)" : "var(--accent-danger)"}40`,
                      borderRadius: "2px",
                    }}
                  >
                    <div
                      className="text-mono"
                      style={{
                        fontSize: "0.6rem",
                        color: strategy.riskLevel === "LOW" ? "var(--accent-success)" : strategy.riskLevel === "MEDIUM" ? "var(--accent-warning)" : "var(--accent-danger)",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                      }}
                    >
                      RISK: {strategy.riskLevel}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                  {strategy.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Consumption */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Fuel Consumption Projection</span>
            <div className="section-header-line" />
          </div>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={FUEL_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="lap" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Tooltip content={<CustomLineTooltip />} />
                <Line type="monotone" dataKey="fuelRemaining" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ fill: "var(--accent-primary)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Race State */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Race State at Lap {lapNumber}</span>
            <div className="section-header-line" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {RACE_STATE_AT_LAP[12 as keyof typeof RACE_STATE_AT_LAP].map((driver) => (
              <div
                key={driver.position}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2rem 1fr 4rem 5rem 5rem",
                  gap: "1rem",
                  alignItems: "center",
                  padding: "0.75rem",
                  background: "var(--bg-panel)",
                  borderRadius: "3px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                  P{driver.position}
                </div>

                <div style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {driver.driver}
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: driver.gap === 0 ? "var(--accent-primary)" : "var(--accent-warning)" }}>
                    {driver.gap === 0 ? "LEADER" : `+${driver.gap.toFixed(1)}s`}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0.3rem 0.6rem",
                      background: driver.compound === "SOFT" ? "rgba(255,68,102,0.1)" : driver.compound === "MEDIUM" ? "rgba(255,204,0,0.1)" : "rgba(204,204,204,0.1)",
                      border: `1px solid ${driver.compound === "SOFT" ? "var(--accent-danger)" : driver.compound === "MEDIUM" ? "var(--accent-warning)" : "var(--text-muted)"}40`,
                      borderRadius: "2px",
                    }}
                  >
                    <div
                      className="text-mono"
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        color: driver.compound === "SOFT" ? "var(--accent-danger)" : driver.compound === "MEDIUM" ? "var(--accent-warning)" : "var(--text-muted)",
                      }}
                    >
                      {driver.compound}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                    {driver.tyreAge} laps
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
