import { useState } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";

const HISTORY_DATA = [
  { round: "R1 Bahrain", VER: 2100, NOR: 2050, HAM: 1980, PIA: 1890 },
  { round: "R2 Saudi",   VER: 2115, NOR: 2060, HAM: 1970, PIA: 1910 },
  { round: "R3 Australia", VER: 2095, NOR: 2080, HAM: 1965, PIA: 1930 },
  { round: "R4 Japan",     VER: 2110, NOR: 2075, HAM: 1980, PIA: 1945 },
  { round: "R5 China",     VER: 2130, NOR: 2068, HAM: 1975, PIA: 1950 },
  { round: "R6 Miami",     VER: 2115, NOR: 2095, HAM: 1990, PIA: 1970 },
  { round: "R7 Imola",     VER: 2125, NOR: 2105, HAM: 1985, PIA: 1980 },
  { round: "R8 Monaco",    VER: 2100, NOR: 2115, HAM: 1995, PIA: 1990 },
  { round: "R9 Canada",    VER: 2112, NOR: 2108, HAM: 2010, PIA: 1985 },
  { round: "R10 Spain",    VER: 2135, NOR: 2112, HAM: 2005, PIA: 1995 }
];

const DRIVER_METRIC_MAP = {
  VER: { name: "Max Verstappen", color: "#e8a020", team: "Red Bull" },
  NOR: { name: "Lando Norris", color: "#ea580c", team: "McLaren" },
  HAM: { name: "Lewis Hamilton", color: "#00c8f0", team: "Mercedes" },
  PIA: { name: "Oscar Piastri", color: "#ff8c00", team: "McLaren" }
};

export default function EloHistory() {
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(["VER", "NOR"]);

  const toggleDriver = (id: string) => {
    setSelectedDrivers(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(d => d !== id) : prev)
        : [...prev, id]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title block */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
          Rating Trajectory over Time
        </h2>
        <p className="editorial" style={{ fontStyle: "italic", fontFamily: "var(--font-editorial)", fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Analyzing historical skill adjustments and relative performance indices across Grand Prix rounds.
        </p>
      </div>

      {/* Selector and Chart Panel */}
      <div className="panel-scanner" style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "4px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        {/* Selector switches */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Compare Drivers:
          </span>
          {Object.entries(DRIVER_METRIC_MAP).map(([id, meta]) => {
            const isChecked = selectedDrivers.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleDriver(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: isChecked ? "var(--accent-tint)" : "var(--bg-void)",
                  border: isChecked ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  borderRadius: "2px",
                  padding: "0.4rem 0.75rem",
                  color: isChecked ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: meta.color }} />
                {meta.name}
              </button>
            );
          })}
        </div>

        {/* Chart View */}
        <div style={{ height: "280px", width: "100%", marginTop: "0.5rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={HISTORY_DATA} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border-ghost)" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="round" 
                stroke="var(--text-muted)" 
                fontSize={10} 
                fontFamily="var(--font-mono)" 
                tickLine={false} 
              />
              <YAxis 
                domain={["dataMin - 50", "dataMax + 50"]} 
                stroke="var(--text-muted)" 
                fontSize={10} 
                fontFamily="var(--font-mono)" 
                tickLine={false} 
                axisLine={false}
              />
              <ChartTooltip
                contentStyle={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-mid)",
                  borderRadius: "4px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--text-primary)"
                }}
              />
              {selectedDrivers.map(drv => (
                <Line
                  key={drv}
                  type="monotone"
                  dataKey={drv}
                  name={DRIVER_METRIC_MAP[drv as keyof typeof DRIVER_METRIC_MAP].name}
                  stroke={DRIVER_METRIC_MAP[drv as keyof typeof DRIVER_METRIC_MAP].color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--bg-void)" }}
                  activeDot={{ r: 5, strokeWidth: 1 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event log / delta changes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h3 className="text-mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          HISTORICAL ELO CONTEXT LOG (RECENT SESSION OUTCOMES)
        </h3>
        <div className="table-container" style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "4px",
          overflow: "hidden"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "3rem 6rem 8rem 1fr 4rem 5rem",
            background: "var(--bg-surface)",
            padding: "0.6rem 1rem",
            borderBottom: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            fontWeight: "bold",
            textTransform: "uppercase"
          }}>
            <span>Round</span>
            <span>Session</span>
            <span>Driver Duel</span>
            <span>Outcome Description</span>
            <span style={{ textAlign: "right" }}>Delta</span>
            <span style={{ textAlign: "right" }}>New Elo</span>
          </div>

          {[
            { round: "R10", session: "Spain GP", drivers: "VER vs NOR", desc: "Verstappen beats pole-sitter Norris by +2.21s in race finish", delta: "+23.1", elo: "2135" },
            { round: "R09", session: "Canada GP", drivers: "VER vs NOR", desc: "Norris beats Verstappen in qualifying, Verstappen wins damp race", delta: "+4.2", elo: "2112" },
            { round: "R08", session: "Monaco GP", drivers: "NOR vs PIA", desc: "Piastri finishes P2, Norris finishes P4 at high-downforce street run", delta: "-15.0", elo: "2115" },
            { round: "R07", session: "Imola GP", drivers: "VER vs NOR", desc: "Verstappen holds off late-charging Norris by 0.725s margin", delta: "+10.8", elo: "2125" }
          ].map((row, idx) => (
            <div key={idx} style={{
              display: "grid",
              gridTemplateColumns: "3rem 6rem 8rem 1fr 4rem 5rem",
              padding: "0.6rem 1rem",
              borderBottom: idx < 3 ? "1px solid var(--border-ghost)" : "none",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              alignItems: "center"
            }}>
              <span style={{ color: "var(--accent-primary)" }}>{row.round}</span>
              <span style={{ color: "var(--text-secondary)" }}>{row.session}</span>
              <span style={{ color: "var(--text-primary)" }}>{row.drivers}</span>
              <span style={{ color: "var(--text-secondary)" }}>{row.desc}</span>
              <span style={{ textAlign: "right", color: row.delta.startsWith("+") ? "var(--status-success)" : "var(--status-danger)" }}>
                {row.delta}
              </span>
              <span style={{ textAlign: "right", color: "var(--text-primary)", fontWeight: "bold" }}>{row.elo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
