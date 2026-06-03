import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import Modal from "./Modal";

import type { Compound } from "../types";

interface CompoundDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  compound: Compound | null;
}

// Mock detailed degradation data
const COMPOUND_DATA = {
  soft: {
    name: "SOFT",
    color: "#ff4466",
    cliffLap: 18,
    cliffSeverity: 1.2,
    confidence: 0.92,
    optimalRange: "Laps 1-12",
    degradationCurve: [
      { lap: 1, pace: 82.5, temp: 95, wear: 8 },
      { lap: 2, pace: 81.8, temp: 98, wear: 16 },
      { lap: 3, pace: 81.2, temp: 102, wear: 24 },
      { lap: 4, pace: 80.6, temp: 105, wear: 32 },
      { lap: 5, pace: 80.1, temp: 108, wear: 40 },
      { lap: 10, pace: 77.0, temp: 115, wear: 80 },
      { lap: 15, pace: 72.2, temp: 118, wear: 120 },
      { lap: 18, pace: 67.2, temp: 120, wear: 144 },
      { lap: 20, pace: 62.5, temp: 118, wear: 160 },
    ],
    comparisonData: [
      { driver: "Verstappen", avgPace: 82.1, cliffLap: 18 },
      { driver: "Leclerc", avgPace: 81.4, cliffLap: 17 },
      { driver: "Norris", avgPace: 81.8, cliffLap: 19 },
      { driver: "Hamilton", avgPace: 81.2, cliffLap: 18 },
    ],
  },
  medium: {
    name: "MEDIUM",
    color: "#ffcc00",
    cliffLap: 24,
    cliffSeverity: 0.4,
    confidence: 0.88,
    optimalRange: "Laps 1-20",
    degradationCurve: [
      { lap: 1, pace: 83.1, temp: 92, wear: 5 },
      { lap: 5, pace: 81.9, temp: 100, wear: 25 },
      { lap: 10, pace: 80.4, temp: 108, wear: 50 },
      { lap: 15, pace: 78.9, temp: 112, wear: 75 },
      { lap: 20, pace: 77.4, temp: 115, wear: 100 },
      { lap: 24, pace: 76.2, temp: 116, wear: 120 },
    ],
    comparisonData: [
      { driver: "Verstappen", avgPace: 82.8, cliffLap: 24 },
      { driver: "Leclerc", avgPace: 82.1, cliffLap: 23 },
      { driver: "Norris", avgPace: 82.5, cliffLap: 25 },
      { driver: "Hamilton", avgPace: 82.0, cliffLap: 24 },
    ],
  },
  hard: {
    name: "HARD",
    color: "#cccccc",
    cliffLap: 25,
    cliffSeverity: 0.2,
    confidence: 0.85,
    optimalRange: "Laps 1-25",
    degradationCurve: [
      { lap: 1, pace: 84.2, temp: 88, wear: 3 },
      { lap: 5, pace: 83.4, temp: 95, wear: 15 },
      { lap: 10, pace: 82.4, temp: 102, wear: 30 },
      { lap: 15, pace: 81.4, temp: 108, wear: 45 },
      { lap: 20, pace: 80.4, temp: 112, wear: 60 },
      { lap: 25, pace: 79.4, temp: 114, wear: 75 },
    ],
    comparisonData: [
      { driver: "Verstappen", avgPace: 83.9, cliffLap: 25 },
      { driver: "Leclerc", avgPace: 83.2, cliffLap: 25 },
      { driver: "Norris", avgPace: 83.6, cliffLap: 25 },
      { driver: "Hamilton", avgPace: 83.1, cliffLap: 25 },
    ],
  },
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
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)", marginTop: "0.25rem" }}>
        Pace: {payload[0].value.toFixed(2)}s
      </div>
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-warning)", marginTop: "0.2rem" }}>
        Wear: {payload[0].payload.wear}%
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
        boxShadow: "0 0 16px rgba(0,212,255,0.2)",
      }}
    >
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
        {payload[0].payload.driver}
      </div>
      <div className="text-mono" style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 600, marginTop: "0.25rem" }}>
        Avg Pace: {payload[0].value.toFixed(2)}s
      </div>
    </div>
  );
}

export default function CompoundDetailModal({ isOpen, onClose, compound }: CompoundDetailModalProps) {
  if (!compound) return null;

  const lookupKey = (compound.toLowerCase() === "soft" || compound.toLowerCase() === "hard" ? compound.toLowerCase() : "medium") as "soft" | "medium" | "hard";
  const data = COMPOUND_DATA[lookupKey];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${data.name} Compound Analysis`} subtitle="Detailed Degradation Profile" size="xl">
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Header Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { label: "CLIFF LAP", value: data.cliffLap, unit: "", accent: true },
            { label: "CLIFF SEVERITY", value: data.cliffSeverity.toFixed(2), unit: "s/lap" },
            { label: "CONFIDENCE", value: `${(data.confidence * 100).toFixed(0)}%`, unit: "" },
            { label: "OPTIMAL RANGE", value: data.optimalRange, unit: "" },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: "1rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
              <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                {stat.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.3rem",
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

        {/* Degradation Curve */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Lap-by-Lap Degradation Curve</span>
            <div className="section-header-line" />
          </div>
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.degradationCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="lap" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <YAxis yAxisId="left" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pace"
                  stroke="var(--accent-primary)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--accent-primary)", r: 3 }}
                  name="Pace (s)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="wear"
                  stroke="var(--accent-warning)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                  name="Wear (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver Comparison */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Driver Performance Comparison</span>
            <div className="section-header-line" />
          </div>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.comparisonData} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }} />
                <YAxis
                  type="category"
                  dataKey="driver"
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  width={95}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="avgPace" fill="var(--accent-primary)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Zones */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Performance Zones</span>
            <div className="section-header-line" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {[
              { zone: "OPTIMAL ZONE", range: "Laps 1-12", color: "var(--accent-success)", desc: "Peak pace, minimal degradation" },
              { zone: "FADING ZONE", range: "Laps 13-17", color: "var(--accent-warning)", desc: "Pace loss accelerating" },
              { zone: "CLIFF ZONE", range: "Laps 18+", color: "var(--accent-danger)", desc: "Exponential degradation" },
            ].map((zone) => (
              <div key={zone.zone} style={{ padding: "1rem", background: "var(--bg-panel)", borderRadius: "3px", border: `2px solid ${zone.color}40` }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", fontWeight: 700, color: zone.color, marginBottom: "0.5rem" }}>
                  {zone.zone}
                </div>
                <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  {zone.range}
                </div>
                <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  {zone.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pit Strategy Recommendation */}
        <div style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: "4px", border: `2px solid var(--accent-primary)40` }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Pit Strategy Recommendation</span>
            <div className="section-header-line" />
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>
            For {data.name} compound, optimal pit window is between laps {Math.max(1, data.cliffLap - 5)} and {data.cliffLap}. This maximizes remaining tyre life while avoiding the cliff zone. Monitor fuel consumption and traffic conditions to fine-tune exact pit lap. Consider undercut opportunities in the optimal zone for maximum time gain.
          </p>
        </div>
      </div>
    </Modal>
  );
}
