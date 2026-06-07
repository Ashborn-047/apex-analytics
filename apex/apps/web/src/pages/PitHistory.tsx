import { useState } from "react";

export default function PitHistory() {
  const [selectedRace, setSelectedRace] = useState<string>("spa2025");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
          Historical Strategy & Pit Outcomes
        </h2>
        <p className="editorial" style={{ fontStyle: "italic", fontFamily: "var(--font-editorial)", fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Deconstructing tyre selection efficiency, undercut effectiveness, and safety car windows from completed sessions.
        </p>
      </div>

      {/* Selectors and Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
        <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
          SELECT GP HISTORY:
        </span>
        <select 
          value={selectedRace} 
          onChange={(e) => setSelectedRace(e.target.value)}
          className="selector-dropdown"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            padding: "0.3rem 0.6rem",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            borderRadius: "2px",
            outline: "none"
          }}
        >
          <option value="spa2025">2025 Belgian Grand Prix (Spa)</option>
          <option value="monza2025">2025 Italian Grand Prix (Monza)</option>
          <option value="silverstone2025">2025 British Grand Prix (Silverstone)</option>
          <option value="monaco2025">2025 Monaco Grand Prix (Monaco)</option>
        </select>
      </div>

      {/* Grid columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
        {/* Left: Driver Stint list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
            STRATEGY RUNS & STINTS SUMMARY
          </span>
          <div className="table-container" style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "5rem 10rem 1fr",
              background: "var(--bg-surface)",
              padding: "0.6rem 1rem",
              borderBottom: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              fontWeight: "bold",
              textTransform: "uppercase"
            }}>
              <span>Driver</span>
              <span>Stint Allocation</span>
              <span>Pit Laps</span>
            </div>

            {[
              { driver: "M. Verstappen", stints: ["SOFT (17)", "MEDIUM (27)"], pits: "Lap 17" },
              { driver: "L. Norris", stints: ["SOFT (16)", "MEDIUM (28)"], pits: "Lap 16" },
              { driver: "O. Piastri", stints: ["SOFT (15)", "HARD (29)"], pits: "Lap 15" },
              { driver: "L. Hamilton", stints: ["MEDIUM (20)", "HARD (24)"], pits: "Lap 20" }
            ].map((row, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "5rem 10rem 1fr",
                padding: "0.75rem 1rem",
                borderBottom: i < 3 ? "1px solid var(--border-ghost)" : "none",
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                alignItems: "center"
              }}>
                <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>{row.driver}</span>
                <span style={{ display: "flex", gap: "0.3rem" }}>
                  {row.stints.map((s, idx) => (
                    <span key={idx} style={{
                      fontSize: "0.55rem",
                      background: s.includes("SOFT") ? "rgba(192,57,43,0.15)" : s.includes("MEDIUM") ? "rgba(232,160,32,0.15)" : "rgba(240,236,228,0.15)",
                      border: s.includes("SOFT") ? "1px solid var(--status-danger)" : s.includes("MEDIUM") ? "1px solid var(--accent-primary)" : "1px solid var(--border-active)",
                      padding: "0.05rem 0.25rem",
                      borderRadius: "2px",
                      color: "var(--text-primary)"
                    }}>
                      {s}
                    </span>
                  ))}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>{row.pits}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Strategy Calls highlights */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="panel-scanner" style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-primary)", letterSpacing: "0.1em" }}>
              CRITICAL STRATEGY CALL OF THE RACE
            </span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-primary)" }}>
              The Verstappen Undercut Coverage
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Verstappen covered Norris's Lap 16 pit entry by boxing immediately on Lap 17. The 0.9s quicker stop by Red Bull secured his track position, preventing a clean undercut margin.
            </p>
            <div style={{
              marginTop: "0.5rem",
              background: "var(--bg-void)",
              border: "1px solid var(--border-ghost)",
              padding: "0.5rem 0.75rem",
              borderRadius: "2px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem"
            }}>
              <div>
                <span className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>UNDERCUT BENEFIT</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "bold", color: "var(--status-success)" }}>-0.45s / Lap</span>
              </div>
              <div>
                <span className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>STOP TIME GAP</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: "bold", color: "var(--status-success)" }}>-0.92s (RBR)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
