import { useState, useEffect } from "react";

export default function PitLiveMode() {
  const [currentLap, setCurrentLap] = useState<number>(18);
  const [activeAlert, setActiveAlert] = useState<string | null>("UNDERCUT THREAT: Norris (McLaren) enters window");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLap(l => (l < 44 ? l + 1 : 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
            Live Race Strategy Tracker
          </h2>
          <p className="editorial" style={{ fontStyle: "italic", fontFamily: "var(--font-editorial)", fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Real-time stint monitors, competitor windows, and telemetry-driven tactical recommendation matrices.
          </p>
        </div>
        <div style={{
          background: "rgba(90,138,60,0.1)",
          border: "1px solid var(--status-success)",
          color: "var(--status-success)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          fontWeight: "bold",
          padding: "0.3rem 0.6rem",
          borderRadius: "2px",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem"
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--status-success)" }} className="pulse-dot" />
          FEED ACTIVE
        </div>
      </div>

      {/* Alert Banner */}
      {activeAlert && (
        <div style={{
          background: "rgba(192,57,43,0.1)",
          border: "1px solid var(--status-danger)",
          borderRadius: "4px",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: "bold" }}>
            ⚠️ {activeAlert.toUpperCase()}
          </span>
          <button 
            onClick={() => setActiveAlert(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem"
            }}
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "1.5rem" }}>
        {/* Left: Telemetry Panel */}
        <div className="panel-scanner" style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "4px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          <div>
            <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>CURRENT RACE PROGRESS</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.2rem" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
                LAP {currentLap}
              </span>
              <span className="text-mono" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                / 44
              </span>
            </div>
            <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-secondary)", display: "block" }}>
              CIRCUIT: SPA-FRANCORCHAMPS
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {[
              { label: "Est. Tyre Life Remaining", val: "38%", color: "var(--accent-primary)" },
              { label: "Target Pit Lap", val: "Lap 22", color: "var(--text-primary)" },
              { label: "Pit Stop Window", val: "Laps 20 - 24", color: "var(--status-success)" }
            ].map((stat, i) => (
              <div key={i} style={{ background: "var(--bg-void)", border: "1px solid var(--border-subtle)", padding: "0.6rem 0.8rem", borderRadius: "2px" }}>
                <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>
                  {stat.label.toUpperCase()}
                </span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: stat.color }}>
                  {stat.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Competitor delta and timelines */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Competitor Tracker */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              COMPETITOR TIMING GAP & WINDOW ESTIMATE
            </span>
            <div className="table-container" style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "3rem 6rem 5rem 6rem 1fr",
                background: "var(--bg-surface)",
                padding: "0.6rem 1rem",
                borderBottom: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}>
                <span>Pos</span>
                <span>Driver</span>
                <span>Gap</span>
                <span>Tyre Age</span>
                <span>Status/Directive</span>
              </div>

              {[
                { pos: "P1", name: "Max Verstappen", gap: "LEADER", age: "18 laps (S)", status: "Stay out (box L22)" },
                { pos: "P2", name: "Lando Norris", gap: "+2.48s", age: "18 laps (S)", status: "Undercut vulnerability critical" },
                { pos: "P3", name: "Lewis Hamilton", gap: "+8.12s", age: "19 laps (M)", status: "Pit window open" },
                { pos: "P4", name: "Oscar Piastri", gap: "+11.35s", age: "18 laps (S)", status: "Traffic zone warning" }
              ].map((row, idx) => (
                <div key={idx} style={{
                  display: "grid",
                  gridTemplateColumns: "3rem 6rem 5rem 6rem 1fr",
                  padding: "0.6rem 1rem",
                  borderBottom: idx < 3 ? "1px solid var(--border-ghost)" : "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  alignItems: "center"
                }}>
                  <span style={{ color: "var(--accent-primary)" }}>{row.pos}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{row.name}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{row.gap}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{row.age}</span>
                  <span style={{ 
                    color: row.status.includes("critical") ? "var(--status-danger)" : row.status.includes("open") ? "var(--status-success)" : "var(--text-muted)" 
                  }}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
