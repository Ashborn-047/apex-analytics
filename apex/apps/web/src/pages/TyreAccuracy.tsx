export default function TyreAccuracy() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
          Model Accuracy & Validation Log
        </h2>
        <p className="editorial" style={{ fontStyle: "italic", fontFamily: "var(--font-editorial)", fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Evaluating regression variance against real-world tyre performance data collected post-session.
        </p>
      </div>

      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {[
          { label: "Overall Accuracy", val: "94.2%", info: "Within ±1.5 Laps" },
          { label: "Sessions Logged", val: "48 / 48", info: "100% data coverage" },
          { label: "Mean Cliff Error", val: "0.82 Laps", info: "Asymptotic deviation" },
          { label: "Calibration Delta", val: "±0.15s", info: "Averaged lap time margin" }
        ].map((c, i) => (
          <div key={i} style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            padding: "0.8rem 1rem",
          }}>
            <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>
              {c.label.toUpperCase()}
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)", display: "block", marginTop: "0.1rem" }}>
              {c.val}
            </span>
            <span className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-secondary)", display: "block", marginTop: "0.15rem" }}>
              {c.info}
            </span>
          </div>
        ))}
      </div>

      {/* Accuracy log Table */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
          HISTORICAL ACCURACY COMPARISON MATRIX
        </span>
        <div className="table-container" style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "4px",
          overflow: "hidden"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "5rem 6rem 5rem 6rem 6rem 5rem 6rem 1fr",
            background: "var(--bg-surface)",
            padding: "0.6rem 1rem",
            borderBottom: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            fontWeight: "bold",
            textTransform: "uppercase"
          }}>
            <span>Circuit</span>
            <span>Driver</span>
            <span>Compound</span>
            <span>Predicted Cliff</span>
            <span>Actual Cliff</span>
            <span>Error</span>
            <span>Accuracy</span>
            <span>Validation Code</span>
          </div>

          {[
            { track: "Monza", driver: "VER", compound: "MEDIUM", pred: "Lap 22", act: "Lap 23", err: "-1 Lap", acc: "95.6%", code: "VAL-OK-0209" },
            { track: "Monza", driver: "ANT", compound: "MEDIUM", pred: "Lap 22", act: "Lap 22", err: "0 Laps", acc: "100.0%", code: "VAL-OK-0210" },
            { track: "Monza", driver: "NOR", compound: "SOFT", pred: "Lap 12", act: "Lap 12", err: "0 Laps", acc: "100.0%", code: "VAL-OK-0211" },
            { track: "Spa", driver: "VER", compound: "HARD", pred: "Lap 28", act: "Lap 26", err: "+2 Laps", acc: "92.8%", code: "VAL-WARN-0222" },
            { track: "Spa", driver: "NOR", compound: "MEDIUM", pred: "Lap 16", act: "Lap 17", err: "-1 Lap", acc: "94.1%", code: "VAL-OK-0223" },
            { track: "Spa", driver: "ANT", compound: "SOFT", pred: "Lap 9", act: "Lap 10", err: "-1 Lap", acc: "90.0%", code: "VAL-OK-0224" },
            { track: "Monaco", driver: "HAM", compound: "SOFT", pred: "Lap 24", act: "Lap 25", err: "-1 Lap", acc: "96.0%", code: "VAL-OK-0231" },
            { track: "Silverstone", driver: "RUS", compound: "HARD", pred: "Lap 24", act: "Lap 25", err: "-1 Lap", acc: "96.0%", code: "VAL-OK-0240" },
            { track: "Silverstone", driver: "ANT", compound: "MEDIUM", pred: "Lap 14", act: "Lap 14", err: "0 Laps", acc: "100.0%", code: "VAL-OK-0241" }
          ].map((row, idx) => (
            <div key={idx} style={{
              display: "grid",
              gridTemplateColumns: "5rem 6rem 5rem 6rem 6rem 5rem 6rem 1fr",
              padding: "0.6rem 1rem",
              borderBottom: idx < 8 ? "1px solid var(--border-ghost)" : "none",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              alignItems: "center"
            }}>
              <span style={{ color: "var(--text-primary)" }}>{row.track}</span>
              <span style={{ color: "var(--text-secondary)" }}>{row.driver}</span>
              <span style={{ 
                color: row.compound === "SOFT" ? "var(--status-danger)" : row.compound === "MEDIUM" ? "var(--accent-primary)" : "var(--text-primary)",
                fontWeight: "bold" 
              }}>{row.compound}</span>
              <span style={{ color: "var(--text-secondary)" }}>{row.pred}</span>
              <span style={{ color: "var(--text-secondary)" }}>{row.act}</span>
              <span style={{ 
                color: row.err === "0 Laps" ? "var(--status-success)" : Math.abs(parseInt(row.err)) > 1 ? "var(--status-warning)" : "var(--text-secondary)" 
              }}>{row.err}</span>
              <span style={{ color: "var(--accent-primary)", fontWeight: "bold" }}>{row.acc}</span>
              <span style={{ color: "var(--text-muted)" }}>{row.code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
