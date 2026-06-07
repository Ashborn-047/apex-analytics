import { useState } from "react";

interface CircuitInfo {
  id: string;
  name: string;
  location: string;
  length: string;
  severity: number; // 1 to 10
  softCliff: number;
  medCliff: number;
  hardCliff: number;
  strategy: string;
}

const CIRCUITS: CircuitInfo[] = [
  { id: "monza", name: "Monza Circuit", location: "Italy", length: "5.793 km", severity: 4, softCliff: 12, medCliff: 22, hardCliff: 36, strategy: "S-H 1-Stop" },
  { id: "spa", name: "Spa-Francorchamps", location: "Belgium", length: "7.004 km", severity: 7, softCliff: 8, medCliff: 16, hardCliff: 28, strategy: "M-H 1-Stop" },
  { id: "monaco", name: "Circuit de Monaco", location: "Monaco", length: "3.337 km", severity: 2, softCliff: 24, medCliff: 38, hardCliff: 52, strategy: "S-H 1-Stop" },
  { id: "silverstone", name: "Silverstone Circuit", location: "Great Britain", length: "5.891 km", severity: 9, softCliff: 7, medCliff: 14, hardCliff: 24, strategy: "M-H-H 2-Stop" },
  { id: "suzuka", name: "Suzuka Circuit", location: "Japan", length: "5.807 km", severity: 8, softCliff: 9, medCliff: 17, hardCliff: 26, strategy: "S-M-H 2-Stop" },
  { id: "bahrain", name: "Bahrain International", location: "Bahrain", length: "5.412 km", severity: 8.5, softCliff: 8, medCliff: 15, hardCliff: 25, strategy: "S-H-H 2-Stop" }
];

export default function TyreCircuits() {
  const [selectedCircuit, setSelectedCircuit] = useState<string>("spa");

  const active = CIRCUITS.find(c => c.id === selectedCircuit) || CIRCUITS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page description */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
          Historical Circuit Wear Database
        </h2>
        <p className="editorial" style={{ fontStyle: "italic", fontFamily: "var(--font-editorial)", fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Explore compound thermal decay indexes and baseline cliff triggers aggregated across Grand Prix seasons.
        </p>
      </div>

      {/* Two column splitter */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "1.5rem" }}>
        {/* Left Column: Circuit List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Select Active Circuit
          </span>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            padding: "0.75rem"
          }}>
            {CIRCUITS.map(circ => {
              const isSelected = circ.id === selectedCircuit;
              return (
                <button
                  key={circ.id}
                  onClick={() => setSelectedCircuit(circ.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    padding: "0.6rem 0.8rem",
                    background: isSelected ? "var(--accent-tint)" : "var(--bg-void)",
                    border: isSelected ? "1px solid var(--accent-primary)" : "1px solid var(--border-ghost)",
                    borderRadius: "2px",
                    color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ fontWeight: isSelected ? "bold" : "normal" }}>{circ.name}</span>
                  <span style={{ 
                    fontSize: "0.6rem", 
                    color: circ.severity >= 7 ? "var(--status-danger)" : "var(--status-success)", 
                    background: "rgba(0,0,0,0.15)", 
                    padding: "0.1rem 0.3rem",
                    borderRadius: "2px"
                  }}>
                    SEV: {circ.severity}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Circuit Details */}
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
            <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--accent-primary)", letterSpacing: "0.1em" }}>
              TRACK SPECIFICATION PROFILE
            </span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--text-primary)", marginTop: "0.1rem" }}>
              {active.name}
            </h3>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
              LOCATION: {active.location.toUpperCase()} · LAP DISTANCE: {active.length}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Severity Card */}
            <div style={{ background: "var(--bg-void)", border: "1px solid var(--border-subtle)", padding: "0.75rem", borderRadius: "2px" }}>
              <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>
                WEAR SEVERITY RATIO
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                {active.severity} / 10
              </span>
              <div style={{ height: "4px", background: "var(--bg-elevated)", marginTop: "0.4rem", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${active.severity * 10}%`, background: active.severity >= 7 ? "var(--status-danger)" : "var(--status-success)" }} />
              </div>
            </div>

            {/* Winning Strategy */}
            <div style={{ background: "var(--bg-void)", border: "1px solid var(--border-subtle)", padding: "0.75rem", borderRadius: "2px" }}>
              <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>
                TYPICAL WINNING COMBINATION
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {active.strategy}
              </span>
              <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-secondary)", display: "block", marginTop: "0.15rem" }}>
                Under standard dry temperatures
              </span>
            </div>
          </div>

          {/* Average Cliff Laps */}
          <div>
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
              AVERAGE THERMAL CLIFF LAP PER DRY COMPOUND
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {/* Soft */}
              <div style={{ display: "grid", gridTemplateColumns: "4rem 1fr 2rem", alignItems: "center", gap: "0.75rem" }}>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--status-danger)", fontWeight: "bold" }}>SOFT</span>
                <div style={{ height: "8px", background: "var(--bg-void)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${(active.softCliff / 60) * 100}%`, background: "var(--status-danger)" }} />
                </div>
                <span className="text-mono" style={{ fontSize: "0.7rem", textAlign: "right", color: "var(--text-primary)" }}>L{active.softCliff}</span>
              </div>
              {/* Medium */}
              <div style={{ display: "grid", gridTemplateColumns: "4rem 1fr 2rem", alignItems: "center", gap: "0.75rem" }}>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: "bold" }}>MEDIUM</span>
                <div style={{ height: "8px", background: "var(--bg-void)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${(active.medCliff / 60) * 100}%`, background: "var(--accent-primary)" }} />
                </div>
                <span className="text-mono" style={{ fontSize: "0.7rem", textAlign: "right", color: "var(--text-primary)" }}>L{active.medCliff}</span>
              </div>
              {/* Hard */}
              <div style={{ display: "grid", gridTemplateColumns: "4rem 1fr 2rem", alignItems: "center", gap: "0.75rem" }}>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: "bold" }}>HARD</span>
                <div style={{ height: "8px", background: "var(--bg-void)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${(active.hardCliff / 60) * 100}%`, background: "var(--text-secondary)" }} />
                </div>
                <span className="text-mono" style={{ fontSize: "0.7rem", textAlign: "right", color: "var(--text-primary)" }}>L{active.hardCliff}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
