import { useState, useEffect } from "react";
import { MOCK_PIT_RECOMMENDATIONS } from "../data/mockData";
import type { PitRecommendation, Compound, DriverRaceState } from "../types";
import { API_BASE } from "../config";

const COMPOUND_COLORS: Record<Compound, string> = {
  SOFT:   "#ff4466", MEDIUM: "#ffcc00", HARD: "#cccccc", INTER: "#44cc66", WET: "#4488ff",
};

const AVAILABLE_DRIVERS = [
  { id: "VER", name: "Max Verstappen", team: "Red Bull Racing" },
  { id: "NOR", name: "Lando Norris", team: "McLaren" },
  { id: "LEC", name: "Charles Leclerc", team: "Ferrari" },
  { id: "RUS", name: "George Russell", team: "Mercedes" },
  { id: "PIA", name: "Oscar Piastri", team: "McLaren" },
  { id: "SAI", name: "Carlos Sainz", team: "Ferrari" },
  { id: "HAM", name: "Lewis Hamilton", team: "Mercedes" },
  { id: "PER", name: "Sergio Perez", team: "Red Bull Racing" },
  { id: "ALO", name: "Fernando Alonso", team: "Aston Martin" },
];

function CompoundDot({ compound }: { compound: Compound }) {
  return (
    <span
      style={{
        display: "inline-block", width: "10px", height: "10px", borderRadius: "50%",
        background: COMPOUND_COLORS[compound], flexShrink: 0,
        boxShadow: `0 0 6px ${COMPOUND_COLORS[compound]}60`,
      }}
    />
  );
}

function ConfidencePip({ level }: { level: "HIGH" | "MEDIUM" | "LOW" }) {
  const map = { HIGH: { color: "var(--accent-success)", bars: 3 }, MEDIUM: { color: "var(--accent-warning)", bars: 2 }, LOW: { color: "var(--accent-danger)", bars: 1 } };
  const { color, bars } = map[level] || map["MEDIUM"];
  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
      {[1, 2, 3].map((b) => (
        <div key={b} style={{ width: "4px", height: `${b * 4}px`, borderRadius: "1px", background: b <= bars ? color : "var(--border-subtle)", transition: "all 0.2s" }} />
      ))}
    </div>
  );
}

function HUDDial({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="40" cy="40" r="30" fill="none" stroke="var(--border-subtle)" strokeWidth="2" />
          <circle
            cx="40"
            cy="40"
            r="30"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.4s ease", filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div className="text-mono" style={{ fontSize: "1.1rem", fontWeight: 700, color }}>
            {value.toFixed(1)}
          </div>
          <div className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>
            {unit}
          </div>
        </div>
      </div>
      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
        {label}
      </div>
    </div>
  );
}

interface ActualPitStop {
  driver_id: string;
  stint_number: number;
  current_compound: Compound;
  new_compound: Compound;
  pit_lap: number;
  pace_loss_s: number;
}

export default function PitWallPlanner({ season }: { season: number }) {
  const [driverId, setDriverId] = useState<string>("VER");
  const [recommendations, setRecommendations] = useState<PitRecommendation[]>(MOCK_PIT_RECOMMENDATIONS);
  const [selectedRecIndex, setSelectedRecIndex] = useState<number>(0);
  const [actualStops, setActualStops] = useState<ActualPitStop[]>([]);

  // Dynamic live driver status based on selected driver ID
  const [driverState, setDriverState] = useState<DriverRaceState>({
    driver_id: "VER",
    current_lap: 28,
    tyre: { compound: "MEDIUM", age: 15 },
    gap_ahead_s: 1.8,
    gap_behind_s: 3.4,
    position: 1
  });

  useEffect(() => {
    // Generate static driver state details
    const mapping: Record<string, { pos: number; gapAhead: number; gapBehind: number; tyre: Compound; age: number }> = {
      VER: { pos: 1, gapAhead: 0.0, gapBehind: 3.8, tyre: "MEDIUM", age: 18 },
      NOR: { pos: 2, gapAhead: 3.8, gapBehind: 2.1, tyre: "MEDIUM", age: 18 },
      LEC: { pos: 3, gapAhead: 2.1, gapBehind: 5.4, tyre: "MEDIUM", age: 15 },
      RUS: { pos: 4, gapAhead: 5.4, gapBehind: 1.2, tyre: "SOFT", age: 11 },
      PIA: { pos: 5, gapAhead: 1.2, gapBehind: 8.9, tyre: "MEDIUM", age: 18 },
      SAI: { pos: 6, gapAhead: 8.9, gapBehind: 0.5, tyre: "MEDIUM", age: 16 },
      HAM: { pos: 7, gapAhead: 0.5, gapBehind: 4.1, tyre: "SOFT", age: 12 },
      PER: { pos: 8, gapAhead: 4.1, gapBehind: 1.9, tyre: "HARD", age: 24 },
      ALO: { pos: 9, gapAhead: 1.9, gapBehind: 15.2, tyre: "MEDIUM", age: 20 },
    };

    const info = mapping[driverId] || mapping["VER"];
    setDriverState({
      driver_id: driverId,
      current_lap: 28,
      tyre: { compound: info.tyre, age: info.age },
      gap_ahead_s: info.gapAhead,
      gap_behind_s: info.gapBehind,
      position: info.pos
    });

    fetch(`${API_BASE}/api/predict/strategy/pit-window/${season}_R12/${driverId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load strategy pit windows");
        return res.json();
      })
      .then((data) => {
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
          setSelectedRecIndex(0);
        }
      })
      .catch((err) => console.error("Error loading pit strategy from microservice:", err));
  }, [driverId, season]);

  // Fetch actual pit stops for this season
  useEffect(() => {
    fetch(`${API_BASE}/api/predict/strategy/actuals?season=${season}&circuit_id=monza`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load actual pit stops");
        return res.json();
      })
      .then((data) => {
        if (data.stops) {
          setActualStops(data.stops);
        } else {
          setActualStops([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching actual pit stops:", err);
        setActualStops([]);
      });
  }, [season]);

  const selectedRec = recommendations[selectedRecIndex] || recommendations[0] || MOCK_PIT_RECOMMENDATIONS[0];
  const driverActualStop = actualStops.find(s => s.driver_id === driverId);

  // Strategy Pace Delta Impact Calculations
  const recommendedBoxLap = selectedRec.pit_lap;
  const actualBoxLap = driverActualStop?.pit_lap || null;

  let deltaLaps: number | null = null;
  const paceLossPerLap = driverActualStop?.pace_loss_s || 0.45; // Default fallback if actual not synced
  let estimatedDeltaImpactS = 0.0;
  let impactString = "No comparison data";

  if (actualBoxLap !== null) {
    deltaLaps = actualBoxLap - recommendedBoxLap;
    estimatedDeltaImpactS = Math.abs(deltaLaps * paceLossPerLap);

    if (deltaLaps > 0) {
      impactString = `Est. ${estimatedDeltaImpactS.toFixed(1)}s lost due to overcut degradation`;
    } else if (deltaLaps < 0) {
      impactString = `Est. ${estimatedDeltaImpactS.toFixed(1)}s lost in traffic due to premature undercut`;
    } else {
      impactString = "Window optimized perfectly (0.0s delta)";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Control Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg, rgba(0,212,255,0.05), transparent)", padding: "1.25rem 1.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Pit Wall Strategy Planner
          </h2>
          <p className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: "0.25rem", margin: 0 }}>
            MONZA · UNDERCUT & OVERCUT SOLVER
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>DRIVER ANALYSES</span>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="text-mono"
              style={{
                background: "var(--bg-void)",
                color: "var(--accent-primary)",
                border: "1px solid var(--border-active)",
                borderRadius: "3px",
                padding: "0.25rem 0.5rem",
                fontSize: "0.75rem",
                outline: "none"
              }}
            >
              {AVAILABLE_DRIVERS.map(d => (
                <option key={d.id} value={d.id}>{d.id} - {d.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", alignSelf: "end" }}>
            <div className="pulse-dot live" />
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)", letterSpacing: "0.1em", fontWeight: 600 }}>STRATEGY ROOM</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem" }}>
        
        {/* Left Side: Live State and Dials */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="panel panel-accent" style={{ padding: "1.25rem" }}>
            <div className="section-header" style={{ marginBottom: "1rem" }}>
              <span className="section-title">Live Stint Context</span>
              <div className="pulse-dot live" />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
                {driverState.driver_id}
              </div>
              <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginTop: "0.25rem" }}>
                P{driverState.position} · {AVAILABLE_DRIVERS.find(d => d.id === driverId)?.team.toUpperCase()}
              </div>
            </div>

            {[
              { label: "CURRENT LAP", value: `L${driverState.current_lap}` },
              { label: "TYRE COMPOUND", value: driverState.tyre.compound },
              { label: "TYRE AGE", value: `${driverState.tyre.age} LAPS` },
              { label: "GAP AHEAD", value: `${driverState.gap_ahead_s.toFixed(1)}s` },
              { label: "GAP BEHIND", value: `${driverState.gap_behind_s.toFixed(1)}s` },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>{item.label}</span>
                <span className="text-mono" style={{ fontSize: "0.7rem", fontWeight: 600, color: item.label === "TYRE COMPOUND" ? COMPOUND_COLORS[driverState.tyre.compound as Compound] : "var(--text-primary)" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* HUD Dials */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <HUDDial value={driverState.gap_ahead_s} max={5} label="GAP AHEAD" unit="s" color="var(--accent-primary)" />
            <HUDDial value={driverState.gap_behind_s} max={5} label="GAP BEHIND" unit="s" color="var(--accent-warning)" />
          </div>

          {/* Interactive Window Visual Slider */}
          <div className="panel" style={{ padding: "1.25rem" }}>
            <div className="section-header" style={{ marginBottom: "1rem" }}>
              <span className="section-title">Pit Window Timeline</span>
              <div className="section-header-line" />
            </div>

            <div style={{ position: "relative", height: "80px", marginTop: "1rem" }}>
              <div style={{ 
                position: "absolute", 
                top: "50%", 
                left: 0, 
                right: 0, 
                height: "6px", 
                background: "linear-gradient(90deg, var(--bg-elevated), var(--border-active), var(--bg-elevated))", 
                transform: "translateY(-50%)", 
                borderRadius: "3px",
              }} />
              
              {/* Current Lap */}
              <div style={{
                position: "absolute", top: "50%", width: "3px", height: "32px",
                background: "var(--accent-primary)", transform: "translateY(-50%)",
                left: `${(driverState.current_lap / 53) * 100}%`,
                boxShadow: "0 0 12px var(--accent-primary)60",
              }}>
                <div className="text-mono" style={{ position: "absolute", bottom: "-24px", left: "-12px", fontSize: "0.55rem", color: "var(--accent-primary)", whiteSpace: "nowrap", fontWeight: 600 }}>
                  L{driverState.current_lap}
                </div>
              </div>

              {/* Recommended Window Area */}
              <div style={{
                position: "absolute",
                top: "50%",
                height: "16px",
                transform: "translateY(-50%)",
                background: "rgba(0, 230, 115, 0.15)",
                border: "1px solid rgba(0, 230, 115, 0.3)",
                borderRadius: "2px",
                left: `${((recommendedBoxLap - 2) / 53) * 100}%`,
                width: `${(4 / 53) * 100}%`
              }}>
                <div className="text-mono" style={{ position: "absolute", top: "-22px", left: "0", fontSize: "0.5rem", color: "var(--accent-success)", whiteSpace: "nowrap" }}>
                  REC LAP {recommendedBoxLap}
                </div>
              </div>

              {/* Actual executed stop marker */}
              {actualBoxLap !== null && (
                <div style={{
                  position: "absolute", top: "50%", width: "8px", height: "8px", borderRadius: "50%",
                  background: "var(--accent-warning)", transform: "translate(-50%, -50%)",
                  left: `${(actualBoxLap / 53) * 100}%`,
                  boxShadow: "0 0 12px var(--accent-warning)",
                  cursor: "pointer"
                }}>
                  <div className="text-mono" style={{ position: "absolute", bottom: "-32px", left: "-16px", fontSize: "0.55rem", color: "var(--accent-warning)", whiteSpace: "nowrap", fontWeight: 600 }}>
                    ACT L{actualBoxLap}
                  </div>
                </div>
              )}
            </div>

            <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)", letterSpacing: "0.08em", textAlign: "center", marginTop: "1.25rem" }}>
              LAPS 1 → 53 · MONZA
            </div>
          </div>
        </div>

        {/* Right Side: Grid of Strategies and Details Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* Strategy Option Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {recommendations.map((rec, idx) => {
              const isSelected = selectedRecIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedRecIndex(idx)}
                  className="panel panel-scanner"
                  style={{
                    padding: "1rem",
                    cursor: "pointer",
                    background: isSelected ? "rgba(0,212,255,0.08)" : "var(--bg-panel)",
                    borderColor: isSelected ? "var(--accent-primary)" : "var(--border-subtle)",
                    boxShadow: isSelected ? "0 0 16px var(--accent-glow)" : "none",
                    borderLeft: `4px solid ${idx === 0 ? "var(--accent-success)" : "var(--text-muted)"}`,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                      OPTION {idx + 1} {idx === 0 ? "(BEST)" : ""}
                    </span>
                    <span className="text-mono" style={{ fontSize: "0.85rem", fontWeight: 700, color: rec.net_delta_s < 0 ? "var(--accent-success)" : "var(--accent-danger)" }}>
                      {rec.net_delta_s < 0 ? "" : "+"}{rec.net_delta_s.toFixed(1)}s
                    </span>
                  </div>
                  
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-primary)" }}>
                    BOX LAP {rec.pit_lap}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <CompoundDot compound={rec.compound_new} />
                    <span className="text-mono" style={{ fontSize: "0.65rem", color: COMPOUND_COLORS[rec.compound_new] }}>
                      ➔ {rec.compound_new}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Sidebar Panel */}
          <div className="panel" style={{ padding: "1.5rem", background: "var(--bg-void)", border: "1px solid var(--border-active)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-primary)", margin: 0 }}>
                  Box Strategy Telemetry
                </h3>
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  PLANNING PARAMS & ACTUALS CORRELATION
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ConfidencePip level={selectedRec.confidence} />
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>CONFIDENCE: {selectedRec.confidence}</span>
              </div>
            </div>

            {/* In-depth details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ background: "var(--bg-elevated)", padding: "0.75rem", borderRadius: "2px", border: "1px solid var(--border-subtle)" }}>
                  <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>TRAFFIC SPACING</div>
                  <div className="text-mono" style={{ fontSize: "0.85rem", fontWeight: 600, color: selectedRec.traffic_clear ? "var(--accent-success)" : "var(--accent-danger)", marginTop: "0.25rem" }}>
                    {selectedRec.traffic_clear ? "CLEAR WINDOW (> 3.2s)" : "HEAVY TRAFFIC RISK"}
                  </div>
                </div>
                <div style={{ background: "var(--bg-elevated)", padding: "0.75rem", borderRadius: "2px", border: "1px solid var(--border-subtle)" }}>
                  <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>SAFETY CAR HEDGE</div>
                  <div className="text-mono" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                    {(selectedRec.sc_probability * 100).toFixed(0)}% Probability
                  </div>
                </div>
              </div>

              {/* Recommended vs Actual overlay box */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ background: "rgba(0, 212, 255, 0.04)", padding: "1rem", borderRadius: "2px", border: "1px solid var(--accent-primary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>COMPARATIVE FORECAST vs ACTUAL</div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <div className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-dim)" }}>RECOMMENDED</div>
                      <div className="text-mono" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-success)" }}>Lap {recommendedBoxLap}</div>
                    </div>
                    <div>
                      <div className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-dim)" }}>ACTUAL STOP</div>
                      <div className="text-mono" style={{ fontSize: "1rem", fontWeight: 700, color: actualBoxLap ? "var(--accent-warning)" : "var(--text-muted)" }}>
                        {actualBoxLap ? `Lap ${actualBoxLap}` : "No Stop Recorded"}
                      </div>
                    </div>
                  </div>

                  {deltaLaps !== null && (
                    <div style={{ marginTop: "0.25rem", paddingTop: "0.5rem", borderTop: "1px dashed rgba(0, 212, 255, 0.2)" }}>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>STRATEGY VARIATION</div>
                      <div className="text-mono" style={{ fontSize: "0.75rem", color: deltaLaps === 0 ? "var(--accent-success)" : "var(--accent-warning)", fontWeight: 600, marginTop: "0.15rem" }}>
                        {deltaLaps > 0 ? `Pitted ${deltaLaps} Lap${deltaLaps > 1 ? "s" : ""} Late` : (deltaLaps < 0 ? `Pitted ${Math.abs(deltaLaps)} Lap${Math.abs(deltaLaps) > 1 ? "s" : ""} Early` : "Pitted on exact model lap")}
                      </div>
                      <div className="text-mono" style={{ fontSize: "0.7rem", color: "var(--text-primary)", fontStyle: "italic", marginTop: "0.25rem" }}>
                        "{impactString}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rationale explanation */}
            <div style={{ marginTop: "1rem", background: "var(--bg-elevated)", padding: "0.75rem", borderRadius: "2px", border: "1px dashed var(--border-subtle)" }}>
              <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>STRATEGY DIRECTIVE</span>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
                "{selectedRec.rationale}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Desk Explanation */}
      <div className="panel fade-up" style={{ padding: "1.5rem", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-surface))", borderLeft: "4px solid var(--accent-primary)" }}>
        <div className="section-header" style={{ marginBottom: "1.25rem" }}>
          <span className="section-title">Telemetry Intelligence Desk · Pit Wall Strategy Model</span>
          <div className="section-header-line" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <div>
            <h4 style={{ color: "var(--accent-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Dynamic Stint Solver</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              A brute-force strategy search engine (O(N²) stint space) evaluates all compound combinations (Soft, Medium, Hard) to minimize total race time. Predictions factor in track grip evolution, tyre decay slopes, and fuel load burn rates.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Poisson Safety Car Windows</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              The model scales pit stop time loss dynamically. During high-risk laps, it weights historical Poisson Safety Car rates—pitting during a virtual or full Safety Car cuts standard pit lane loss by 50%, yielding huge strategy gains.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "0.5rem", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>Traffic & Clean Air Verification</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              The model evaluates if a driver emerges in traffic or "dirty air" (which triggers a 0.3s penalty per lap). It ensures the re-entry window has a clear spacing gap (&gt;3.0s) to optimize the out-lap pacing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
