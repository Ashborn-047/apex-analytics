import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { MOCK_DEGRADATION, SOFT_DEGRADATION, HARD_DEGRADATION } from "../data/mockData";
import type { Compound, LapTimePrediction } from "../types";
import { API_BASE } from "../config";

const COMPOUND_COLORS: Record<Compound, string> = {
  SOFT:   "#ff4466",
  MEDIUM: "#ffcc00",
  HARD:   "#cccccc",
  INTER:  "#44cc66",
  WET:    "#4488ff",
};

const ALL_COMPOUNDS = [SOFT_DEGRADATION, MOCK_DEGRADATION, HARD_DEGRADATION];

function formatTime(s: number) {
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, "0")}`;
}

function CompoundBadge({ compound, active, onClick }: { compound: Compound; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? COMPOUND_COLORS[compound] : "var(--border-subtle)"}`,
        background: active ? `${COMPOUND_COLORS[compound]}18` : "transparent",
        color: active ? COMPOUND_COLORS[compound] : "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        fontWeight: 600,
        padding: "0.3rem 0.75rem",
        borderRadius: "2px",
        cursor: "pointer",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        transition: "all 0.15s",
      }}
    >
      {compound}
    </button>
  );
}

function StatsRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: accent ? "var(--accent-warning)" : "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function TyreLapPredictor() {
  const [activeCompounds, setActiveCompounds] = useState<Set<Compound>>(new Set(["SOFT", "MEDIUM", "HARD"]));
  const [compoundsData, setCompoundsData] = useState<LapTimePrediction[]>(ALL_COMPOUNDS);

  useEffect(() => {
    const fetchCompound = (comp: Compound) => {
      return fetch(`${API_BASE}/api/predict/lap-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circuit_id: "monza",
          compound: comp,
          stint_lap: 1,
          tyre_age_total: 1,
          track_temp_c: 42.5,
          fuel_load_kg: 68.0,
          driver_id: "VER"
        })
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to load compound " + comp);
        return res.json();
      });
    };

    Promise.all([fetchCompound("SOFT"), fetchCompound("MEDIUM"), fetchCompound("HARD")])
      .then((results) => {
        setCompoundsData(results);
      })
      .catch((err) => console.error("Error loading tyre predictions from microservice:", err));
  }, []);

  const toggle = (c: Compound) => {
    setActiveCompounds((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  };

  // Build combined chart data
  const maxLap = Math.max(...compoundsData.flatMap((d) => d.degradation_curve.map((p) => p.stint_lap)));
  const chartData = Array.from({ length: maxLap }, (_, i) => {
    const lap = i + 1;
    const entry: Record<string, number> = { lap };
    for (const comp of compoundsData) {
      const point = comp.degradation_curve.find((p) => p.stint_lap === lap);
      if (point) entry[comp.compound] = point.predicted_s;
    }
    return entry;
  });

  interface TooltipPayloadEntry {
    dataKey: string;
    value: number;
  }
  interface TyreTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: number;
  }
  const CustomTooltip = ({ active, payload, label }: TyreTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-active)", padding: "0.75rem", borderRadius: "3px", minWidth: "160px" }}>
        <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>
          STINT LAP {label}
        </div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.2rem" }}>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: COMPOUND_COLORS[p.dataKey as Compound] }}>
              {p.dataKey}
            </span>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: 600 }}>
              {formatTime(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem" }}>
      {/* Chart panel */}
      <div className="panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Tyre Degradation Curves
            </h2>
            <p className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: "0.25rem" }}>
              MONZA · XGBoost Regression · ±0.25s MAE
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["SOFT", "MEDIUM", "HARD"] as Compound[]).map((c) => (
              <CompoundBadge key={c} compound={c} active={activeCompounds.has(c)} onClick={() => toggle(c)} />
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="lap"
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              label={{ value: "STINT LAP", position: "insideBottom", offset: -2, fill: "var(--text-dim)", fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
              axisLine={{ stroke: "var(--border-subtle)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(1)}s`}
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Cliff reference lines */}
            {compoundsData.filter((d) => activeCompounds.has(d.compound) && d.cliff_lap).map((d) => (
              <ReferenceLine
                key={d.compound}
                x={d.cliff_lap!}
                stroke={COMPOUND_COLORS[d.compound]}
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{ value: `CLIFF`, position: "top", fill: COMPOUND_COLORS[d.compound], fontSize: 9, fontFamily: "var(--font-mono)" }}
              />
            ))}

            {compoundsData.filter((d) => activeCompounds.has(d.compound)).map((d) => (
              <Line
                key={d.compound}
                type="monotone"
                dataKey={d.compound}
                stroke={COMPOUND_COLORS[d.compound]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: COMPOUND_COLORS[d.compound], strokeWidth: 0 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", justifyContent: "center" }}>
          {compoundsData.map((d) => (
            <div key={d.compound} style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: activeCompounds.has(d.compound) ? 1 : 0.3 }}>
              <div style={{ width: "20px", height: "2px", background: COMPOUND_COLORS[d.compound], borderRadius: "1px" }} />
              <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>{d.compound}</span>
              <span className="text-mono" style={{ fontSize: "0.55rem", color: COMPOUND_COLORS[d.compound], opacity: 0.8 }}>CLIFF L{d.cliff_lap}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "20px", height: "2px", background: "var(--text-dim)", borderRadius: "1px", borderTop: "1px dashed var(--text-dim)" }} />
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>CLIFF ONSET</span>
          </div>
        </div>
      </div>

      {/* Stats sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {compoundsData.map((pred) => (
          <div
            key={pred.compound}
            className="panel"
            style={{
              padding: "1rem",
              borderColor: activeCompounds.has(pred.compound) ? `${COMPOUND_COLORS[pred.compound]}40` : "var(--border-subtle)",
              opacity: activeCompounds.has(pred.compound) ? 1 : 0.4,
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span
                className="badge"
                style={{
                  background: `${COMPOUND_COLORS[pred.compound]}18`,
                  color: COMPOUND_COLORS[pred.compound],
                  border: `1px solid ${COMPOUND_COLORS[pred.compound]}40`,
                }}
              >
                {pred.compound}
              </span>
              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                {pred.circuit_id.toUpperCase()}
              </span>
            </div>
            <StatsRow label="Predicted (L1)" value={formatTime(pred.degradation_curve[0].predicted_s)} />
            <StatsRow label="Cliff Lap" value={pred.cliff_lap ? `L${pred.cliff_lap}` : "None"} accent={!!pred.cliff_lap} />
            <StatsRow label="Cliff Severity" value={`+${pred.cliff_severity_s_per_lap.toFixed(2)}s/lap`} accent />
            <StatsRow label="CI (±)" value={`±${((pred.confidence_interval[1] - pred.confidence_interval[0]) / 2).toFixed(2)}s`} />
          </div>
        ))}
      </div>
    </div>
  );
}
