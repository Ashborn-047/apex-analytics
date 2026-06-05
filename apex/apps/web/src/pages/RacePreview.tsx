import { useState, useEffect } from "react";
import { API_BASE } from "../config";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, Cell
} from "recharts";

interface DriverMeta {
  id: string;
  name: string;
  team: string;
  teamId: string;
  color: string;
}

const DRIVERS: DriverMeta[] = [
  { id: "VER", name: "Max Verstappen", team: "Red Bull Racing", teamId: "red_bull", color: "#3671C6" },
  { id: "NOR", name: "Lando Norris", team: "McLaren", teamId: "mclaren", color: "#FF8700" },
  { id: "LEC", name: "Charles Leclerc", team: "Ferrari", teamId: "ferrari", color: "#E80020" },
  { id: "HAM", name: "Lewis Hamilton", team: "Ferrari", teamId: "ferrari", color: "#E80020" },
  { id: "RUS", name: "George Russell", team: "Mercedes", teamId: "mercedes", color: "#27F4D2" },
  { id: "PIA", name: "Oscar Piastri", team: "McLaren", teamId: "mclaren", color: "#FF8700" },
  { id: "SAI", name: "Carlos Sainz", team: "Williams", teamId: "williams", color: "#37BEDD" },
  { id: "ALO", name: "Fernando Alonso", team: "Aston Martin", teamId: "aston_martin", color: "#229971" },
  { id: "PER", name: "Sergio Perez", team: "Red Bull Racing", teamId: "red_bull", color: "#3671C6" },
];

interface QualifyingPrediction {
  driver_id: string;
  constructor_id: string;
  predicted_position: number;
  expected_position: number;
  expected_lap_time_s: number;
  q3_probability: number;
  pole_probability: number;
}

interface RaceOutcomePrediction {
  driver_id: string;
  expected_position: number;
  predicted_position: number;
  podium_probability: number;
  points_expected: number;
  position_probabilities: Record<string, number>;
}

export default function RacePreview({ season }: { season: number }) {
  const [circuitId, setCircuitId] = useState<string>("monza");
  const [circuitType, setCircuitType] = useState<string>("high_speed");
  const [trackTemp, setTrackTemp] = useState<number>(35.0);
  const [airTemp, setAirTemp] = useState<number>(25.0);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("VER");

  const [qualGrid, setQualGrid] = useState<QualifyingPrediction[]>([]);
  const [raceOutcomes, setRaceOutcomes] = useState<RaceOutcomePrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    // 1. Fetch Qualifying Predictions
    fetch(`${API_BASE}/api/predict/qualifying`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        circuit_id: circuitId,
        circuit_type: circuitType,
        track_temp_c: trackTemp,
        air_temp_c: airTemp,
        drivers: DRIVERS.map(d => ({ driver_id: d.id, constructor_id: d.teamId }))
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load qualifying predictions");
        return res.json();
      })
      .then((qualData) => {
        if (qualData.predictions) {
          // Sort qualifying grid descending by expected position (since lower is better grid slot)
          const sortedGrid = [...qualData.predictions].sort((a, b) => a.expected_position - b.expected_position) as QualifyingPrediction[];
          setQualGrid(sortedGrid);

          // 2. Fetch Race Outcomes using predicted grid slots
          const eloValues: Record<string, { elo: number; teammateElo: number; form: number }> = {
            VER: { elo: 1880, teammateElo: 1680, form: 95 },
            NOR: { elo: 1820, teammateElo: 1750, form: 92 },
            LEC: { elo: 1810, teammateElo: 1780, form: 85 },
            HAM: { elo: 1800, teammateElo: 1780, form: 82 },
            RUS: { elo: 1760, teammateElo: 1800, form: 88 },
            PIA: { elo: 1750, teammateElo: 1820, form: 89 },
            SAI: { elo: 1745, teammateElo: 1650, form: 81 },
            ALO: { elo: 1780, teammateElo: 1550, form: 76 },
            PER: { elo: 1680, teammateElo: 1880, form: 65 },
          };

          return fetch(`${API_BASE}/api/predict/race-outcome`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              circuit_type: circuitType,
              drivers: sortedGrid.map((q, idx) => {
                const ratings = eloValues[q.driver_id] || { elo: 1650, teammateElo: 1650, form: 75 };
                return {
                  driver_id: q.driver_id,
                  grid_position: idx + 1,
                  driver_elo: ratings.elo,
                  driver_form: ratings.form,
                  teammate_elo: ratings.teammateElo,
                  constructor_affinity: circuitType === "high_speed" && q.constructor_id === "red_bull" ? 1.05 : 1.0
                };
              })
            })
          });
        }
        throw new Error("No qualifying predictions returned");
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load race outcome predictions");
        return res.json();
      })
      .then((raceData) => {
        if (raceData.predictions) {
          setRaceOutcomes(raceData.predictions);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Race preview calculation failed:", err);
        setLoading(false);
      });
  }, [circuitId, circuitType, trackTemp, airTemp, season]);

  const activeDriver = DRIVERS.find(d => d.id === selectedDriverId) || DRIVERS[0];
  const activeQual = qualGrid.find(q => q.driver_id === selectedDriverId);
  const activeRace = raceOutcomes.find(r => r.driver_id === selectedDriverId);

  // Format Recharts data for the clicked driver's finishing position distribution
  const chartData = activeRace && activeRace.position_probabilities
    ? Object.entries(activeRace.position_probabilities).map(([pos, prob]) => ({
        position: pos,
        probability: prob * 100
      }))
    : [];

  const formatLapTime = (s: number) => {
    if (isNaN(s) || s <= 0) return "--:--.---";
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, "0")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Simulation Controls Toolbar */}
      <div className="panel" style={{ padding: "1.25rem", background: "rgba(0, 212, 255, 0.01)" }}>
        <span className="text-mono" style={{ display: "block", fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
          PRE-RACE SIMULATION CONFIGURATOR
        </span>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
          <div>
            <label className="text-mono" style={{ display: "block", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: "0.35rem" }}>SELECT CIRCUIT</label>
            <select
              value={circuitId}
              onChange={(e) => {
                const val = e.target.value;
                setCircuitId(val);
                // Assign layout categories
                if (val === "monza" || val === "spa") setCircuitType("low_downforce");
                else if (val === "monaco" || val === "singapore") setCircuitType("street_circuit");
                else setCircuitType("high_speed");
              }}
              className="text-mono"
              style={{
                width: "100%",
                background: "var(--bg-void)",
                color: "var(--accent-primary)",
                border: "1px solid var(--border-active)",
                borderRadius: "3px",
                padding: "0.4rem 0.5rem",
                fontSize: "0.75rem",
                outline: "none"
              }}
            >
              <option value="monza">Monza (Low Downforce)</option>
              <option value="monaco">Monaco (Street Circuit)</option>
              <option value="spa">Spa-Francorchamps (Fast Flowing)</option>
              <option value="singapore">Singapore Marina Bay (Street)</option>
              <option value="albert_park">Albert Park (Technical)</option>
              <option value="bahrain">Sakhir Bahrain (Traction)</option>
            </select>
          </div>

          <div>
            <label className="text-mono" style={{ display: "block", fontSize: "0.6rem", color: "var(--text-dim)", marginBottom: "0.35rem" }}>LAYOUT CATEGORY</label>
            <div className="text-mono" style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "3px",
              padding: "0.4rem 0.5rem",
              fontSize: "0.75rem",
              color: "var(--text-primary)",
              textTransform: "uppercase"
            }}>
              {circuitType.replace('_', ' ')}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Track Temp</span>
              <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-primary)", fontWeight: "bold" }}>{trackTemp}°C</span>
            </div>
            <input
              type="range"
              min="15"
              max="55"
              value={trackTemp}
              onChange={(e) => setTrackTemp(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-primary)", marginTop: "0.2rem" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Air Temp</span>
              <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-primary)", fontWeight: "bold" }}>{airTemp}°C</span>
            </div>
            <input
              type="range"
              min="12"
              max="42"
              value={airTemp}
              onChange={(e) => setAirTemp(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-primary)", marginTop: "0.2rem" }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <span className="text-mono" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Running pre-race grid simulations...</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          
          {/* LEFT COLUMN: Qualifying Start Grid */}
          <div className="panel panel-accent" style={{ padding: "1.5rem" }}>
            <div className="section-header" style={{ marginBottom: "1rem" }}>
              <span className="section-title">Predicted Qualifying Grid Slots</span>
              <div className="section-header-line" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {qualGrid.map((driver, index) => {
                const meta = DRIVERS.find(d => d.id === driver.driver_id) || DRIVERS[0];
                const isSelected = selectedDriverId === driver.driver_id;
                
                return (
                  <div
                    key={driver.driver_id}
                    onClick={() => setSelectedDriverId(driver.driver_id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2rem 1.5rem 1fr 5.5rem 5rem",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.8rem",
                      background: isSelected ? "rgba(0, 212, 255, 0.08)" : "transparent",
                      border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    {/* Grid slot number */}
                    <span className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 800, color: index < 3 ? "var(--accent-primary)" : "var(--text-muted)" }}>
                      P{index + 1}
                    </span>
                    
                    {/* Team Color indicator */}
                    <div style={{ width: "3px", height: "24px", background: meta.color, borderRadius: "1px" }} />
                    
                    {/* Identity */}
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-primary)" }}>
                        {meta.name}
                      </div>
                      <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>
                        {meta.team}
                      </div>
                    </div>

                    {/* Best Lap Time */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {formatLapTime(driver.expected_lap_time_s)}
                      </div>
                      <span className="text-mono" style={{ fontSize: "0.5rem", color: "var(--text-dim)" }}>EST. Q3 LAP</span>
                    </div>

                    {/* Q3 Entry Probability badge */}
                    <div style={{ textAlign: "right" }}>
                      <span className="text-mono" style={{
                        display: "inline-block",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "2px",
                        background: driver.q3_probability >= 0.8 ? "rgba(34,197,94,0.12)" : driver.q3_probability >= 0.5 ? "rgba(251,191,36,0.12)" : "rgba(239,68,68,0.12)",
                        border: `1px solid ${driver.q3_probability >= 0.8 ? "var(--accent-success)" : driver.q3_probability >= 0.5 ? "var(--accent-warning)" : "var(--accent-danger)"}30`,
                        color: driver.q3_probability >= 0.8 ? "var(--accent-success)" : driver.q3_probability >= 0.5 ? "var(--accent-warning)" : "var(--accent-danger)"
                      }}>
                        {(driver.q3_probability * 100).toFixed(0)}% Q3
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Race Outcome Predictions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Driver Detail Summary Card */}
            <div className="panel panel-scanner" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                <div style={{ width: "4px", height: "32px", background: activeDriver.color, borderRadius: "2px" }} />
                <div>
                  <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>SELECTED DRIVER STRATEGY PROJECTIONS</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-primary)", margin: 0 }}>
                    {activeDriver.name}
                  </h3>
                </div>
              </div>

              {activeRace && activeQual && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                  <div className="stat-card" style={{ background: "rgba(255,255,255,0.01)" }}>
                    <div className="stat-value" style={{ color: "var(--accent-primary)" }}>
                      P{activeQual.predicted_position}
                    </div>
                    <div className="stat-label">GRID SLOT (EST)</div>
                  </div>

                  <div className="stat-card" style={{ background: "rgba(255,255,255,0.01)" }}>
                    <div className="stat-value" style={{ color: activeRace.expected_position <= 3 ? "var(--accent-success)" : "var(--text-primary)" }}>
                      P{activeRace.predicted_position}
                    </div>
                    <div className="stat-label">FINISH POS (EST)</div>
                  </div>

                  <div className="stat-card" style={{ background: "rgba(255,255,255,0.01)" }}>
                    <div className="stat-value" style={{ color: "var(--accent-success)" }}>
                      {(activeRace.podium_probability * 100).toFixed(0)}%
                    </div>
                    <div className="stat-label">PODIUM CHANCE</div>
                  </div>
                </div>
              )}

              {activeRace && (
                <div style={{ marginTop: "1rem", background: "var(--bg-void)", padding: "0.75rem", borderRadius: "3px", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>PROJECTED CHAMPIONSHIP POINTS EXPECTATION</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                    {activeRace.points_expected.toFixed(1)} PTS
                  </span>
                </div>
              )}
            </div>

            {/* Probability distribution chart */}
            <div className="panel" style={{ padding: "1.5rem" }}>
              <div className="section-header" style={{ marginBottom: "1rem" }}>
                <span className="section-title">Expected Race Finishing Position Distribution</span>
                <div className="section-header-line" />
              </div>

              {chartData.length > 0 ? (
                <div style={{ width: "100%", height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="position" tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }} />
                      <ChartTooltip content={({ active, payload }: any) => {
                        if (!active || !payload || !payload.length) return null;
                        const val = payload[0].value;
                        const numVal = typeof val === 'number' ? val : parseFloat(val);
                        return (
                          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-active)", padding: "0.5rem", borderRadius: "3px" }}>
                            <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)" }}>
                              FINISHING POSITION {payload[0].payload.position}
                            </div>
                            <div className="text-mono" style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                              {numVal.toFixed(1)}% Chance
                            </div>
                          </div>
                        );
                      }} />
                      <Bar dataKey="probability" radius={[2, 2, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={activeDriver.color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                  <span className="text-mono" style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>No outcome telemetry available</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
