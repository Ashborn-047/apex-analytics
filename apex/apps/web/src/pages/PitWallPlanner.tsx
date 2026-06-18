import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import type { PitRecommendation, Compound, DriverRaceState } from "../types";
import { API_BASE } from "../config";
import StrategyDetailModal from "../components/StrategyDetailModal";
import PitLiveMode from "./PitLiveMode";
import PitHistory from "./PitHistory";

const COMPOUND_COLORS: Record<Compound, string> = {
  SOFT:   "#ff4466",
  MEDIUM: "#ffcc00",
  HARD:   "#cccccc",
  INTER:  "#44cc66",
  WET:    "#4488ff",
};

const AVAILABLE_DRIVERS = [
  { id: "ANT", name: "Kimi Antonelli", team: "Mercedes" },
  { id: "VER", name: "Max Verstappen", team: "Red Bull Racing" },
  { id: "NOR", name: "Lando Norris", team: "McLaren" },
  { id: "LEC", name: "Charles Leclerc", team: "Ferrari" },
  { id: "HAM", name: "Lewis Hamilton", team: "Ferrari" },
  { id: "RUS", name: "George Russell", team: "Mercedes" },
  { id: "PIA", name: "Oscar Piastri", team: "McLaren" },
  { id: "SAI", name: "Carlos Sainz", team: "Williams" },
  { id: "ALO", name: "Fernando Alonso", team: "Aston Martin" },
  { id: "PER", name: "Sergio Perez", team: "Red Bull Racing" },
  { id: "STR", name: "Lance Stroll", team: "Aston Martin" },
  { id: "GAS", name: "Pierre Gasly", team: "Alpine" },
  { id: "OCO", name: "Esteban Ocon", team: "Haas" },
  { id: "ALB", name: "Alex Albon", team: "Williams" },
  { id: "SAR", name: "Logan Sargeant", team: "Williams" },
  { id: "TSU", name: "Yuki Tsunoda", team: "RB" },
  { id: "RIC", name: "Daniel Ricciardo", team: "RB" },
  { id: "HUL", name: "Nico Hulkenberg", team: "Kick Sauber" },
  { id: "MAG", name: "Kevin Magnussen", team: "Haas" },
  { id: "BOT", name: "Valtteri Bottas", team: "Kick Sauber" },
  { id: "ZHO", name: "Guanyu Zhou", team: "Kick Sauber" },
];

function HUDDial({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="hud-dial" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        className="hud-dial-ring"
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `conic-gradient(from 0deg, ${color}, transparent ${percentage}%)`,
          boxShadow: `0 0 12px ${color}20`,
        }}
      >
        <div 
          className="hud-dial-inner"
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "50%",
            background: "var(--bg-void)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="hud-dial-value" style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color }}>
            {value.toFixed(1)}
          </div>
          <div className="hud-dial-label" style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-muted)" }}>
            {unit}
          </div>
        </div>
      </div>
      <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.5rem", letterSpacing: "0.08em", textAlign: "center" }}>
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

export default function PitWallPlanner({ season, subTab = "builder" }: { season: number; subTab?: "builder" | "live" | "history" }) {
  const [driverId, setDriverId] = useState<string>("VER");
  const [recommendations, setRecommendations] = useState<PitRecommendation[]>([]);
  const [selectedLap, setSelectedLap] = useState<number>(12);
  const [actualStops, setActualStops] = useState<ActualPitStop[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDetailLap, setSelectedDetailLap] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error;
  }
  const totalLaps = 53; // Monza race distance

  // Dynamic live driver status
  const [driverState, setDriverState] = useState<DriverRaceState>({
    driver_id: "VER",
    current_lap: 28,
    tyre: { compound: "MEDIUM", age: 15 },
    gap_ahead_s: 1.8,
    gap_behind_s: 3.4,
    position: 1
  });

  useEffect(() => {
    const mapping: Record<string, { pos: number; gapAhead: number; gapBehind: number; tyre: Compound; age: number }> = {
      ANT: { pos: 5, gapAhead: 1.1, gapBehind: 2.3, tyre: "MEDIUM", age: 14 },
      VER: { pos: 1, gapAhead: 0.0, gapBehind: 3.8, tyre: "MEDIUM", age: 18 },
      NOR: { pos: 2, gapAhead: 3.8, gapBehind: 2.1, tyre: "MEDIUM", age: 18 },
      LEC: { pos: 3, gapAhead: 2.1, gapBehind: 5.4, tyre: "MEDIUM", age: 15 },
      RUS: { pos: 4, gapAhead: 5.4, gapBehind: 1.1, tyre: "SOFT", age: 11 },
      PIA: { pos: 6, gapAhead: 2.3, gapBehind: 6.6, tyre: "MEDIUM", age: 18 },
      SAI: { pos: 7, gapAhead: 6.6, gapBehind: 0.5, tyre: "MEDIUM", age: 16 },
      HAM: { pos: 8, gapAhead: 0.5, gapBehind: 4.1, tyre: "SOFT", age: 12 },
      PER: { pos: 9, gapAhead: 4.1, gapBehind: 1.9, tyre: "HARD", age: 24 },
      ALO: { pos: 10, gapAhead: 1.9, gapBehind: 15.2, tyre: "MEDIUM", age: 20 },
      STR: { pos: 11, gapAhead: 15.2, gapBehind: 3.1, tyre: "MEDIUM", age: 15 },
      GAS: { pos: 12, gapAhead: 3.1, gapBehind: 1.4, tyre: "MEDIUM", age: 14 },
      OCO: { pos: 13, gapAhead: 1.4, gapBehind: 2.5, tyre: "MEDIUM", age: 16 },
      ALB: { pos: 14, gapAhead: 2.5, gapBehind: 0.8, tyre: "MEDIUM", age: 12 },
      SAR: { pos: 15, gapAhead: 0.8, gapBehind: 1.2, tyre: "MEDIUM", age: 10 },
      TSU: { pos: 16, gapAhead: 1.2, gapBehind: 4.5, tyre: "MEDIUM", age: 14 },
      RIC: { pos: 17, gapAhead: 4.5, gapBehind: 2.1, tyre: "MEDIUM", age: 15 },
      HUL: { pos: 18, gapAhead: 2.1, gapBehind: 0.5, tyre: "MEDIUM", age: 12 },
      MAG: { pos: 19, gapAhead: 0.5, gapBehind: 5.0, tyre: "MEDIUM", age: 11 },
      BOT: { pos: 20, gapAhead: 5.0, gapBehind: 1.2, tyre: "MEDIUM", age: 13 },
      ZHO: { pos: 21, gapAhead: 1.2, gapBehind: 10.0, tyre: "MEDIUM", age: 14 },
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
          setSelectedLap(data.recommendations[0].pit_lap);
        }
      })
      .catch((err) => {
        console.error("Error loading pit strategy from microservice:", err);
        setError(err);
      });
  }, [driverId, season]);

  // Fetch actual pit stops
  useEffect(() => {
    fetch(`${API_BASE}/api/predict/strategy/actuals?season=${season}&circuit_id=monza`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load actual pit stops");
        return res.json();
      })
      .then((data) => {
        if (data.stops) {
          setActualStops(data.stops);
        }
      })
      .catch((err) => {
        console.error("Error fetching actual pit stops:", err);
        setError(err);
      });
  }, [season]);

  const handleLapClick = (lap: number) => {
    setSelectedDetailLap(lap);
    setModalOpen(true);
  };

  const driverActualStop = actualStops.find(s => s.driver_id === driverId);

  const { trackList, exitTime, pitLoss } = (() => {
    const baseTimes: Record<string, number> = {
      VER: 0.0,
      NOR: 3.8,
      LEC: 5.9,
      RUS: 11.3,
      ANT: 12.4,
      PIA: 14.7,
      SAI: 21.3,
      HAM: 21.8,
      PER: 25.9,
      ALO: 27.8,
      STR: 43.0,
      GAS: 46.1,
      OCO: 47.5,
      ALB: 50.0,
      SAR: 50.8,
      TSU: 52.0,
      RIC: 56.5,
      HUL: 58.6,
      MAG: 59.1,
      BOT: 64.1,
      ZHO: 65.3,
    };
    
    const targetTime = baseTimes[driverId] || 0.0;
    const loss = 24.0;
    const exit = targetTime + loss;
    
    const list = Object.entries(baseTimes)
      .map(([id, time]) => ({ id, time }))
      .sort((a, b) => a.time - b.time);
      
    return {
      trackList: list,
      exitTime: exit,
      pitLoss: loss
    };
  })();

  const subnavLinkStyle = (isActive: boolean) => ({
    background: "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
    color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
    padding: "0.5rem 1.25rem",
    fontSize: "0.75rem",
    fontFamily: "var(--font-mono)",
    fontWeight: isActive ? "bold" : "normal",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    letterSpacing: "0.05em"
  });

  return (
    <>
      <StrategyDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} lapNumber={selectedDetailLap} />
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Module Sub-Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1px", gap: "0.5rem" }}>
          <NavLink
            to="/pitstop"
            end
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            STRATEGY BUILDER
          </NavLink>
          <NavLink
            to="/pitstop/live"
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            LIVE RACE MODE
          </NavLink>
          <NavLink
            to="/pitstop/history"
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            HISTORICAL RUNS
          </NavLink>
        </div>

        {subTab === "live" ? (
          <PitLiveMode />
        ) : subTab === "history" ? (
          <PitHistory />
        ) : (
          <>
        
        {/* Header toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>DRIVER SELECTION</span>
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
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div className="pulse-dot live" />
            <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: 600 }}>STRATEGY ROOM</span>
          </div>
        </div>

        {/* Live race state grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { label: "CURRENT LAP", value: `${driverState.current_lap} / ${totalLaps}`, accent: true },
            { label: "TYRE COMPOUND", value: driverState.tyre.compound },
            { label: "TYRE AGE", value: `${driverState.tyre.age} LAPS` },
            { label: "POSITION", value: `P${driverState.position}` },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`stat-value ${s.accent ? "shimmer-text" : ""}`} style={s.accent ? {} : { color: "var(--text-primary)" }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* HUD Gaps Telemetry */}
        <div className="panel panel-accent" style={{ padding: "1.5rem" }}>
          <div className="section-header" style={{ marginBottom: "1.5rem" }}>
            <span className="section-title">Live Gap Telemetry</span>
            <div className="section-header-line" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
            <HUDDial value={driverState.gap_ahead_s} max={5} label="GAP AHEAD" unit="seconds" color="var(--accent-primary)" />
            <HUDDial value={driverState.gap_behind_s} max={5} label="GAP BEHIND" unit="seconds" color="var(--accent-warning)" />
            <HUDDial value={30 - driverState.tyre.age} max={30} label="EST. TYRE LIFE" unit="laps" color="var(--accent-success)" />
          </div>
        </div>

        {/* 1D Track Location Exit Ribbon */}
        <div className="panel" style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent-warning)", background: "rgba(255, 255, 255, 0.01)" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">1D Pit Exit Track Re-entry Ribbon (Monza)</span>
            <div className="section-header-line" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              VISUALIZING EXIT POSITION AFTER A STANDARD {pitLoss}s PIT LANE LOSS
            </span>
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "var(--bg-void)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              height: "56px",
              padding: "0 1rem",
              overflowX: "auto",
              gap: "1.25rem",
              scrollbarWidth: "none"
            }}>
              {trackList.map((driver, index) => {
                const isSelf = driver.id === driverId;
                const nextDriver = trackList[index + 1];
                const showExit = exitTime > driver.time && (!nextDriver || exitTime < nextDriver.time);
                
                return (
                  <div key={driver.id} style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexShrink: 0 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      background: isSelf ? "rgba(239, 68, 68, 0.1)" : "transparent",
                      border: isSelf ? "1px dashed var(--accent-danger)" : "none",
                      borderRadius: "4px",
                      padding: isSelf ? "0.2rem 0.5rem" : "0",
                      opacity: isSelf ? 0.5 : 1
                    }}>
                      <div style={{
                        width: "4px",
                        height: "14px",
                        background: driver.id === "VER" || driver.id === "PER" ? "#3671C6" :
                                    driver.id === "NOR" || driver.id === "PIA" ? "#FF8700" :
                                    driver.id === "LEC" || driver.id === "SAI" ? "#E80020" : "#27F4D2",
                        borderRadius: "1.5px"
                      }} />
                      <span className="text-mono" style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                        {driver.id} {isSelf ? "(PITTING)" : ""}
                      </span>
                    </div>
                    
                    {showExit && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        background: "var(--accent-dim)",
                        border: "1px solid var(--accent-primary)",
                        borderRadius: "3px",
                        padding: "0.25rem 0.5rem",
                        boxShadow: "0 0 10px var(--accent-dim)",
                      }}>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)", fontWeight: "bold" }}>
                          ▼ MERGE ZONE (+{(exitTime - driver.time).toFixed(1)}s behind {driver.id})
                        </span>
                      </div>
                    )}
                    
                    {index < trackList.length - 1 && (
                      <div style={{
                        width: "40px",
                        height: "2px",
                        background: "var(--border-subtle)",
                        position: "relative",
                        opacity: 0.6
                      }}>
                        <span className="text-mono" style={{
                          position: "absolute",
                          top: "-12px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "0.55rem",
                          color: "var(--text-dim)",
                          fontWeight: 600
                        }}>
                          {(trackList[index+1].time - driver.time).toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Q&A Strategy Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[
            {
              q: "When should we pit?",
              a: recommendations.length > 0 
                ? `Pit on Lap ${recommendations[0].pit_lap} to leverage the optimal crossover window.`
                : "Pit on Lap 18-22 as medium tyres degrade towards the cliff zone.",
              icon: "⏱️"
            },
            {
              q: "Which compound is optimal?",
              a: recommendations.length > 0
                ? `Switch to ${recommendations[0].compound_new} compound. Sim shows net delta of ${recommendations[0].net_delta_s.toFixed(2)}s.`
                : "Switch to HARD tyres to complete the stint safely.",
              icon: "🛞"
            },
            {
              q: "What is the safety car risk?",
              a: recommendations.length > 0
                ? `SC probability is ${(recommendations[0].sc_probability * 100).toFixed(0)}%. Pitting under SC cuts loss to just ~12s.`
                : "Safety Car risk is moderate. Stay alert for VSC pit windows.",
              icon: "⚠️"
            }
          ].map((qa, idx) => (
            <div key={idx} className="panel" style={{ padding: "1.25rem", borderLeft: "3px solid var(--accent-primary)", background: "rgba(255,255,255,0.01)" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1rem" }}>{qa.icon}</span>
                <span className="text-mono" style={{ fontSize: "0.7rem", color: "var(--accent-primary)", fontWeight: "bold", letterSpacing: "0.08em" }}>
                  Q: {qa.q}
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                <strong>A:</strong> {qa.a}
              </p>
            </div>
          ))}
        </div>

        {/* Visual Timeline */}
        <div className="panel panel-scanner" style={{ padding: "1.5rem" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title">Race Timeline ({totalLaps} Laps)</span>
            <div className="section-header-line" />
          </div>

          <div style={{ position: "relative", height: "60px", background: "var(--bg-elevated)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, var(--accent-danger), var(--accent-warning), var(--accent-success))",
                opacity: 0.1,
              }}
            />

            {recommendations.map((rec) => (
              <div
                key={rec.pit_lap}
                style={{
                  position: "absolute",
                  left: `${(rec.pit_lap / totalLaps) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: "2px",
                  background: rec.confidence === "HIGH" ? "var(--accent-success)" : (rec.confidence === "MEDIUM" ? "var(--accent-warning)" : "var(--accent-danger)"),
                  cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: selectedLap === rec.pit_lap ? 1 : 0.5,
                  zIndex: 2,
                }}
                onClick={() => setSelectedLap(rec.pit_lap)}
                title={`Recommended Pit Stop Window: Lap ${rec.pit_lap}`}
              />
            ))}

            {driverActualStop && (
              <div
                style={{
                  position: "absolute",
                  left: `${(driverActualStop.pit_lap / totalLaps) * 100}%`,
                  top: "25%",
                  bottom: "25%",
                  width: "4px",
                  background: "var(--accent-warning)",
                  borderRadius: "2px",
                  boxShadow: "0 0 8px var(--accent-warning)",
                  zIndex: 3,
                }}
                title={`Actual executed stop: Lap ${driverActualStop.pit_lap}`}
              />
            )}

            <div
              style={{
                position: "absolute",
                left: `${(driverState.current_lap / totalLaps) * 100}%`,
                top: 0,
                bottom: 0,
                width: "3px",
                background: "var(--accent-primary)",
                boxShadow: "0 0 12px var(--accent-primary)",
                zIndex: 10,
              }}
            />

            {/* Lap scale readouts */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", paddingBottom: "0.5rem" }}>
              {[0, 13, 26, 39, 53].map((lap) => (
                <div
                  key={lap}
                  style={{
                    position: "absolute",
                    left: `${(lap / totalLaps) * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                    L{lap}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendation Cards */}
        {recommendations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="section-header">
              <span className="section-title">Pit Stop Recommendations</span>
              <div className="section-header-line" />
            </div>

            {recommendations.map((rec, idx) => (
              <div
                key={rec.pit_lap}
                className={idx === 0 ? "panel panel-scanner" : "panel"}
                style={{
                  padding: "1.25rem",
                  cursor: "pointer",
                  background: selectedLap === rec.pit_lap ? "var(--accent-tint)" : "transparent",
                  borderColor: selectedLap === rec.pit_lap ? "var(--accent-primary)" : "var(--border-subtle)",
                  transition: "all 0.2s",
                }}
                onClick={() => {
                  setSelectedLap(rec.pit_lap);
                  handleLapClick(rec.pit_lap);
                }}
              >
                {/* Metrics row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      PIT LAP
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                      LAP {rec.pit_lap}
                    </div>
                  </div>

                  <div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      NEW COMPOUND
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COMPOUND_COLORS[rec.compound_new] || "var(--text-primary)",
                      }}
                    >
                      {rec.compound_new}
                    </div>
                  </div>

                  <div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      NET DELTA
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: rec.net_delta_s < 0 ? "var(--accent-success)" : "var(--accent-danger)" }}>
                      {rec.net_delta_s > 0 ? "+" : ""}{rec.net_delta_s.toFixed(2)}s
                    </div>
                  </div>

                  <div>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      CONFIDENCE
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color:
                          rec.confidence === "HIGH"
                            ? "var(--accent-success)"
                            : (rec.confidence === "MEDIUM" ? "var(--accent-warning)" : "var(--accent-danger)"),
                      }}
                    >
                      {rec.confidence}
                    </div>
                  </div>
                </div>

                {/* Sub status badges row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div
                    style={{
                      padding: "0.5rem",
                      background: rec.traffic_clear ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)",
                      border: `1px solid ${rec.traffic_clear ? "var(--accent-success)" : "var(--accent-warning)"}40`,
                      borderRadius: "2px",
                      textAlign: "center",
                    }}
                  >
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: rec.traffic_clear ? "var(--accent-success)" : "var(--accent-warning)", fontWeight: 600, letterSpacing: "0.08em" }}>
                      TRAFFIC: {rec.traffic_clear ? "CLEAR" : "RISK"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "0.5rem",
                      background: rec.undercut_window ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      border: `1px solid ${rec.undercut_window ? "var(--accent-success)" : "var(--accent-danger)"}40`,
                      borderRadius: "2px",
                      textAlign: "center",
                    }}
                  >
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: rec.undercut_window ? "var(--accent-success)" : "var(--accent-danger)", fontWeight: 600, letterSpacing: "0.08em" }}>
                      UNDERCUT {rec.undercut_window ? "YES" : "NO"}
                    </div>
                  </div>

                  <div style={{ padding: "0.5rem", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "2px", textAlign: "center" }}>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>
                      SC PROB
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-primary)", marginTop: "0.2rem" }}>
                      {(rec.sc_probability * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div style={{ padding: "0.5rem", background: "var(--bg-elevated)", border: `1px solid ${idx === 0 ? "var(--accent-success)" : "var(--border-subtle)"}`, borderRadius: "2px", textAlign: "center" }}>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: idx === 0 ? "var(--accent-success)" : "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>
                      {idx === 0 ? "✓ RECOMMENDED" : "ALTERNATIVE"}
                    </div>
                  </div>
                </div>

                {/* Directive Rationale */}
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                  {rec.rationale}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Intelligence Desk Explanation */}
        <div className="panel fade-up" style={{ padding: "1.5rem", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-surface))", borderLeft: "4px solid var(--accent-primary)" }}>
          <div className="section-header" style={{ marginBottom: "1.25rem" }}>
            <span className="section-title">Telemetry Intelligence Desk · Pit Wall Strategy Solver</span>
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
          </>
        )}
      </div>
    </>
  );
}

