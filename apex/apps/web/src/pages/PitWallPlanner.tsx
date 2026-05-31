import { useState, useEffect } from "react";
import { MOCK_PIT_RECOMMENDATIONS, MOCK_DRIVER_STATE } from "../data/mockData";
import type { PitRecommendation, Compound } from "../types";

const COMPOUND_COLORS: Record<Compound, string> = {
  SOFT:   "#ff4466", MEDIUM: "#ffcc00", HARD: "#cccccc", INTER: "#44cc66", WET: "#4488ff",
};

function CompoundDot({ compound }: { compound: Compound }) {
  return (
    <span
      style={{
        display: "inline-block", width: "10px", height: "10px", borderRadius: "50%",
        background: COMPOUND_COLORS[compound], flexShrink: 0,
      }}
    />
  );
}

function ConfidencePip({ level }: { level: "HIGH" | "MEDIUM" | "LOW" }) {
  const map = { HIGH: { color: "var(--accent-success)", bars: 3 }, MEDIUM: { color: "var(--accent-warning)", bars: 2 }, LOW: { color: "var(--accent-danger)", bars: 1 } };
  const { color, bars } = map[level];
  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
      {[1, 2, 3].map((b) => (
        <div key={b} style={{ width: "4px", height: `${b * 4}px`, borderRadius: "1px", background: b <= bars ? color : "var(--border-subtle)" }} />
      ))}
    </div>
  );
}

function RecommendationCard({ rec, rank }: { rec: PitRecommendation; rank: number }) {
  const isBest = rank === 0;
  return (
    <div
      className="panel"
      style={{
        padding: "1.25rem",
        borderColor: isBest ? "var(--border-accent)" : "var(--border-subtle)",
        boxShadow: isBest ? "0 0 24px var(--accent-glow)" : "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center",
            background: isBest ? "var(--accent-primary)" : "var(--bg-elevated)",
            color: isBest ? "var(--bg-void)" : "var(--text-muted)",
            fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 800,
          }}>
            {rank + 1}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: isBest ? "var(--accent-primary)" : "var(--text-primary)" }}>
              BOX LAP {rec.pit_lap}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
              <CompoundDot compound={rec.compound_new} />
              <span className="text-mono" style={{ fontSize: "0.6rem", color: COMPOUND_COLORS[rec.compound_new], letterSpacing: "0.08em" }}>
                {rec.compound_new}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800,
            color: rec.net_delta_s < 0 ? "var(--accent-success)" : "var(--accent-danger)",
          }}>
            {rec.net_delta_s < 0 ? "" : "+"}{rec.net_delta_s.toFixed(1)}s
          </div>
          <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>NET DELTA</div>
        </div>
      </div>

      {/* Status row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
        {[
          { label: "TRAFFIC", value: rec.traffic_clear ? "CLEAR" : "RISK", ok: rec.traffic_clear },
          { label: "UNDERCUT", value: rec.undercut_window ? "YES" : "NO", ok: rec.undercut_window },
          { label: "SC PROB", value: `${(rec.sc_probability * 100).toFixed(0)}%`, ok: rec.sc_probability > 0.3 },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-elevated)", padding: "0.5rem", borderRadius: "2px", textAlign: "center" }}>
            <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>{s.label}</div>
            <div className="text-mono" style={{ fontSize: "0.7rem", fontWeight: 600, color: s.ok ? "var(--accent-success)" : "var(--accent-warning)" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <ConfidencePip level={rec.confidence} />
        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          CONFIDENCE: {rec.confidence}
        </span>
      </div>

      {/* Rationale */}
      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, fontStyle: "italic" }}>
        "{rec.rationale}"
      </p>
    </div>
  );
}

export default function PitWallPlanner() {
  const [recommendations, setRecommendations] = useState<PitRecommendation[]>(MOCK_PIT_RECOMMENDATIONS);
  const state = MOCK_DRIVER_STATE;

  useEffect(() => {
    fetch(`/api/predict/strategy/pit-window/2025_R12/${state.driver_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load strategy pit windows");
        return res.json();
      })
      .then((data) => {
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        }
      })
      .catch((err) => console.error("Error loading pit strategy from microservice:", err));
  }, [state.driver_id]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem" }}>
      {/* Driver state panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="panel panel-accent" style={{ padding: "1.25rem" }}>
          <div className="section-header">
            <span className="section-title">Live Race State</span>
            <div className="section-header-line" />
            <div className="pulse-dot" />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
              {state.driver_id}
            </div>
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginTop: "0.25rem" }}>
              P{state.position} · FERRARI
            </div>
          </div>

          {[
            { label: "CURRENT LAP", value: `L${state.current_lap}` },
            { label: "TYRE", value: state.tyre.compound },
            { label: "TYRE AGE", value: `${state.tyre.age} LAPS` },
            { label: "GAP AHEAD", value: `${state.gap_ahead_s.toFixed(1)}s` },
            { label: "GAP BEHIND", value: `${state.gap_behind_s.toFixed(1)}s` },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>{item.label}</span>
              <span className="text-mono" style={{ fontSize: "0.7rem", fontWeight: 600, color: item.label === "TYRE" ? COMPOUND_COLORS[state.tyre.compound as Compound] : "var(--text-primary)" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Pit window visual */}
        <div className="panel" style={{ padding: "1.25rem" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Pit Windows</span>
            <div className="section-header-line" />
          </div>

          <div style={{ position: "relative", height: "60px" }}>
            {/* Race track bar */}
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "4px", background: "var(--bg-elevated)", transform: "translateY(-50%)", borderRadius: "2px" }} />
            {/* Current lap marker */}
            <div style={{
              position: "absolute", top: "50%", width: "2px", height: "24px",
              background: "var(--accent-primary)", transform: "translateY(-50%)",
              left: `${(state.current_lap / 58) * 100}%`,
            }}>
              <div className="text-mono" style={{ position: "absolute", bottom: "-18px", left: "-8px", fontSize: "0.55rem", color: "var(--accent-primary)", whiteSpace: "nowrap" }}>
                L{state.current_lap}
              </div>
            </div>
            {/* Pit window markers */}
            {recommendations.map((rec, i) => (
              <div key={i} style={{
                position: "absolute", top: "50%", width: "2px", height: "16px",
                background: i === 0 ? "var(--accent-success)" : "var(--text-muted)",
                transform: "translateY(-50%)",
                left: `${(rec.pit_lap / 58) * 100}%`,
                opacity: i === 0 ? 1 : 0.4,
              }} />
            ))}
          </div>

          <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)", letterSpacing: "0.08em", textAlign: "center", marginTop: "0.5rem" }}>
            LAPS 1 → 58 · MONZA 2025
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Optimal Pit Windows
            </h2>
            <p className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: "0.25rem" }}>
              UNDERCUT / OVERCUT MODEL · 58-LAP BRUTE-FORCE SEARCH
            </p>
          </div>
          <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            {recommendations.length} CANDIDATES RANKED
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} rank={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
