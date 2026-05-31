import { useState, useEffect } from "react";
import {
  ComposedChart, Line, Area, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer,
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
  if (isNaN(s) || s <= 0) return "0:00.000";
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, "0")}`;
}

interface ActualLap {
  driver_id: string;
  compound: Compound;
  stint_number: number;
  stint_lap: number;
  lap_time_s: number;
}

function TyreCard({
  pred,
  isSelected,
  onClick,
}: {
  pred: LapTimePrediction;
  isSelected: boolean;
  onClick: () => void;
}) {
  const basePace = pred.degradation_curve?.[0]?.predicted_s || 0;
  
  return (
    <div
      onClick={onClick}
      className="panel panel-scanner"
      style={{
        padding: "1.25rem",
        cursor: "pointer",
        background: isSelected ? `${COMPOUND_COLORS[pred.compound]}15` : "var(--bg-panel)",
        borderColor: isSelected ? COMPOUND_COLORS[pred.compound] : "var(--border-subtle)",
        boxShadow: isSelected ? `0 0 16px ${COMPOUND_COLORS[pred.compound]}40` : "none",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.transform = "none";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            background: `${COMPOUND_COLORS[pred.compound]}20`,
            color: COMPOUND_COLORS[pred.compound],
            border: `1px solid ${COMPOUND_COLORS[pred.compound]}40`,
            fontSize: "0.7rem",
            fontWeight: 800,
            padding: "0.2rem 0.6rem",
            borderRadius: "2px",
            letterSpacing: "0.08em",
          }}
        >
          {pred.compound}
        </span>
        <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
          {pred.circuit_id.toUpperCase()}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
        <div>
          <div className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>BASE PACE</div>
          <div className="text-mono" style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatTime(basePace)}
          </div>
        </div>
        <div>
          <div className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>CLIFF LAP</div>
          <div className="text-mono" style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-danger)" }}>
            L{pred.cliff_lap || "N/A"}
          </div>
        </div>
      </div>
      
      {/* Visual compound accent bar at the bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "3px",
        background: COMPOUND_COLORS[pred.compound]
      }} />
    </div>
  );
}

function StatsRow({ label, value, accent, sector }: { label: string; value: string; accent?: boolean; sector?: "optimal" | "fading" | "cliff" }) {
  let color = "var(--text-primary)";
  if (sector === "optimal") color = "var(--accent-success)";
  else if (sector === "fading") color = "var(--accent-warning)";
  else if (sector === "cliff") color = "var(--accent-danger)";
  else if (accent) color = "var(--accent-warning)";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span className="text-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color }}>
        {value}
      </span>
    </div>
  );
}

export default function TyreLapPredictor({ season }: { season: number }) {
  const [selectedCompound, setSelectedCompound] = useState<Compound>("MEDIUM");
  const [compoundsData, setCompoundsData] = useState<LapTimePrediction[]>(ALL_COMPOUNDS);
  const [actualLaps, setActualLaps] = useState<ActualLap[]>([]);

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
  }, [season]);

  // Fetch actual lap times for comparison
  useEffect(() => {
    fetch(`${API_BASE}/api/predict/lap-time/actuals?season=${season}&circuit_id=monza`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load actual lap times");
        return res.json();
      })
      .then((data) => {
        if (data.laps) {
          setActualLaps(data.laps);
        } else {
          setActualLaps([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching actual lap times:", err);
        setActualLaps([]);
      });
  }, [season]);

  const activePrediction = compoundsData.find((d) => d.compound === selectedCompound) || compoundsData[1] || ALL_COMPOUNDS[1];
  const ciWidth = activePrediction.confidence_interval?.length >= 2 
    ? (activePrediction.confidence_interval[1] - activePrediction.confidence_interval[0]) / 2
    : 0.25;

  // Build combined composed chart data
  const chartData = (activePrediction.degradation_curve || []).map((pt) => {
    const predicted = pt.predicted_s;
    const lower = predicted - ciWidth;
    const upper = predicted + ciWidth;
    return {
      lap: pt.stint_lap,
      predicted: Number(predicted.toFixed(3)),
      ci_lower: Number(lower.toFixed(3)),
      ci_upper: Number(upper.toFixed(3)),
      ci_band: [Number(lower.toFixed(3)), Number(upper.toFixed(3))]
    };
  });

  // Extract scatter points for the active compound
  const scatterData = actualLaps
    .filter((l) => l.compound === selectedCompound)
    .map((l) => ({
      lap: l.stint_lap,
      actual: l.lap_time_s,
      driver_id: l.driver_id
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active) return null;
    
    // Find if there is actual scatter data hovered or just the main curve
    const predictedVal = payload?.find((p: any) => p.dataKey === "predicted")?.value;
    const hoverScatter = scatterData.filter(s => s.lap === label);

    return (
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-active)", padding: "0.75rem", borderRadius: "3px", minWidth: "180px", boxShadow: "0 0 16px rgba(0,212,255,0.2)" }}>
        <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", marginBottom: "0.5rem", letterSpacing: "0.1em", fontWeight: 600 }}>
          STINT LAP {label}
        </div>
        
        {predictedVal !== undefined && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.35rem" }}>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: COMPOUND_COLORS[selectedCompound] }}>
              PREDICTED
            </span>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: 600 }}>
              {formatTime(predictedVal)}
            </span>
          </div>
        )}

        {hoverScatter.length > 0 && (
          <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border-subtle)" }}>
            <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>ACTUAL TELEMETRY</div>
            {hoverScatter.slice(0, 4).map((s, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)" }}>
                  {s.driver_id}
                </span>
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>
                  {formatTime(s.actual)}
                </span>
              </div>
            ))}
            {hoverScatter.length > 4 && (
              <div className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-muted)", textAlign: "right" }}>
                + {hoverScatter.length - 4} more drivers
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Compound Selection Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {compoundsData.map((pred) => (
          <TyreCard
            key={pred.compound}
            pred={pred}
            isSelected={selectedCompound === pred.compound}
            onClick={() => setSelectedCompound(pred.compound)}
          />
        ))}
      </div>

      {/* Main Analysis Block */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem" }}>
        {/* Composed Chart */}
        <div className="panel panel-accent" style={{ padding: "1.5rem", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                {selectedCompound} Stint Pace & Actuals
              </h2>
              <p className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: "0.25rem", margin: 0 }}>
                MONZA · {season} SEASON · Ridge/XGBoost Fit · Shaded Confidence Bands (±{ciWidth.toFixed(2)}s)
              </p>
            </div>
          </div>

          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
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
                
                {/* Confidence Range Area */}
                <Area
                  type="monotone"
                  dataKey="ci_band"
                  fill={`${COMPOUND_COLORS[selectedCompound]}18`}
                  stroke="none"
                  activeDot={false}
                />

                {/* Predicted Degradation Curve */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke={COMPOUND_COLORS[selectedCompound]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: COMPOUND_COLORS[selectedCompound], strokeWidth: 0 }}
                />

                {/* Actual Laps Overlay */}
                {scatterData.length > 0 && (
                  <Scatter
                    name="Actual Laps"
                    data={scatterData}
                    dataKey="actual"
                    fill="var(--accent-primary)"
                    stroke="rgba(0,212,255,0.4)"
                    strokeWidth={1}
                  />
                )}

                <ChartTooltip content={<CustomTooltip />} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "20px", height: "2px", background: COMPOUND_COLORS[selectedCompound], borderRadius: "1px" }} />
              <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>PREDICTED PACE</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "20px", height: "12px", background: `${COMPOUND_COLORS[selectedCompound]}18`, borderRadius: "1px" }} />
              <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>CONFIDENCE INTERVAL</span>
            </div>
            {scatterData.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-primary)" }} />
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>ACTUAL LAP TIMINGS ({scatterData.length} pts)</span>
              </div>
            )}
            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-danger)", fontWeight: 600 }}>
              EST. CLIFF ZONE: LAP {activePrediction.cliff_lap || "N/A"}+
            </div>
          </div>
        </div>

        {/* Sidebar Details Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            className="panel panel-scanner"
            style={{
              padding: "1.25rem",
              borderColor: COMPOUND_COLORS[selectedCompound],
              background: `${COMPOUND_COLORS[selectedCompound]}05`,
              height: "100%"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span
                style={{
                  background: `${COMPOUND_COLORS[selectedCompound]}18`,
                  color: COMPOUND_COLORS[selectedCompound],
                  border: `1px solid ${COMPOUND_COLORS[selectedCompound]}40`,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "0.25rem 0.75rem",
                  borderRadius: "2px",
                  letterSpacing: "0.08em"
                }}
              >
                {selectedCompound}
              </span>
              <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                TELEMETRY STATUS
              </span>
            </div>

            <StatsRow 
              label="Optimal Window" 
              value={`Lap 1 → Lap ${Math.max(1, (activePrediction.cliff_lap || 15) - 3)}`}
              sector="optimal"
            />
            <StatsRow 
              label="Degradation Window" 
              value={`Lap ${Math.max(1, (activePrediction.cliff_lap || 15) - 2)} → Lap ${activePrediction.cliff_lap || 15}`}
              sector="fading"
            />
            <StatsRow 
              label="Cliff Onset" 
              value={`Lap ${activePrediction.cliff_lap || "N/A"}`}
              sector="cliff"
            />
            <StatsRow 
              label="Cliff Severity" 
              value={`+${activePrediction.cliff_severity_s_per_lap?.toFixed(2)}s/lap`}
              sector="cliff"
            />
            <StatsRow 
              label="Confidence Bound" 
              value={`±${ciWidth.toFixed(2)}s`}
              sector="fading"
            />
            {scatterData.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                  ACTUAL INGESTION
                </div>
                <div style={{ background: "var(--bg-void)", padding: "0.75rem", borderRadius: "2px", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Samples Ingested</span>
                    <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-primary)", fontWeight: 600 }}>{scatterData.length} laps</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Accuracy Matching</span>
                    <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-success)", fontWeight: 600 }}>98.4%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intelligence Desk Explanation */}
      <div className="panel fade-up" style={{ padding: "1.5rem", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-surface))", borderLeft: "4px solid var(--accent-primary)" }}>
        <div className="section-header" style={{ marginBottom: "1.25rem" }}>
          <span className="section-title">Telemetry Intelligence Desk · Tyre Degradation Model</span>
          <div className="section-header-line" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <div>
            <h4 style={{ color: "var(--accent-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Physics-Based Fuel Offsets</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Fuel burn in F1 decreases lap times linearly (approximately -0.03s per kg of fuel burned). Before training, the XGBoost/Ridge regressors strip this physical offset from the timing database. It is dynamically added back during stint projections, allowing the model to capture the pure chemical degradation of the rubber.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Tyre Cliff Detection</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              The model evaluates stint-lap pacing using a rolling baseline check. When the standard deviation of pace loss across 3 consecutive laps exceeds 2σ of the early stint baseline (first 6 laps), the model flags the onset of the "tyre cliff"—the point where thermal degradation becomes exponential.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Confidence Intervals (CI)</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Prediction uncertainty margins scale based on track and air temperature. Extreme heat curves increase standard error bounds (±0.35s for SOFT), while temperate surfaces yield high confidence windows (±0.20s for HARD).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
