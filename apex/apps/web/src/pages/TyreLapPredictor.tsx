import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  ComposedChart, Line, Area, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import type { Compound, LapTimePrediction } from "../types";
import { API_BASE } from "../config";
import CompoundDetailModal from "../components/CompoundDetailModal";
import TyreCircuits from "./TyreCircuits";
import TyreAccuracy from "./TyreAccuracy";

const COMPOUND_COLORS: Record<Compound, string> = {
  SOFT:   "#ff4466",
  MEDIUM: "#ffcc00",
  HARD:   "#cccccc",
  INTER:  "#44cc66",
  WET:    "#4488ff",
};

const DRIVERS = [
  { id: "ANT", name: "Kimi Antonelli", team: "Mercedes", color: "#27F4D2" },
  { id: "VER", name: "Max Verstappen", team: "Red Bull Racing", color: "#3671C6" },
  { id: "NOR", name: "Lando Norris", team: "McLaren", color: "#FF8700" },
  { id: "LEC", name: "Charles Leclerc", team: "Ferrari", color: "#E80020" },
  { id: "HAM", name: "Lewis Hamilton", team: "Ferrari", color: "#E80020" },
  { id: "RUS", name: "George Russell", team: "Mercedes", color: "#27F4D2" },
  { id: "PIA", name: "Oscar Piastri", team: "McLaren", color: "#FF8700" },
  { id: "SAI", name: "Carlos Sainz", team: "Williams", color: "#37BEDD" },
  { id: "ALO", name: "Fernando Alonso", team: "Aston Martin", color: "#229971" },
  { id: "PER", name: "Sergio Perez", team: "Red Bull Racing", color: "#3671C6" },
  { id: "STR", name: "Lance Stroll", team: "Aston Martin", color: "#229971" },
  { id: "GAS", name: "Pierre Gasly", team: "Alpine", color: "#0090FF" },
  { id: "OCO", name: "Esteban Ocon", team: "Haas", color: "#B6BABD" },
  { id: "ALB", name: "Alex Albon", team: "Williams", color: "#37BEDD" },
  { id: "SAR", name: "Logan Sargeant", team: "Williams", color: "#37BEDD" },
  { id: "TSU", name: "Yuki Tsunoda", team: "RB", color: "#469BFF" },
  { id: "RIC", name: "Daniel Ricciardo", team: "RB", color: "#469BFF" },
  { id: "HUL", name: "Nico Hulkenberg", team: "Kick Sauber", color: "#52e252" },
  { id: "MAG", name: "Kevin Magnussen", team: "Haas", color: "#B6BABD" },
  { id: "BOT", name: "Valtteri Bottas", team: "Kick Sauber", color: "#52e252" },
  { id: "ZHO", name: "Guanyu Zhou", team: "Kick Sauber", color: "#52e252" },
];

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

interface SimulatedLap {
  lap: number;
  predicted_s: number;
  simulated_s: number;
  tyre_health_percent: number;
  is_cliff: boolean;
}

export default function TyreLapPredictor({ season, subTab = "predictor" }: { season: number; subTab?: "predictor" | "circuits" | "accuracy" }) {
  const [selectedDriver, setSelectedDriver] = useState<string>("VER");
  const [selectedCompound, setSelectedCompound] = useState<"soft" | "medium" | "hard">("medium");
  const [compoundsData, setCompoundsData] = useState<LapTimePrediction[]>([]);
  const [actualLaps, setActualLaps] = useState<ActualLap[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDetailCompound, setSelectedDetailCompound] = useState<Compound | null>(null);
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error;
  }

  // Live Stint Simulator State
  const [simTrackTemp, setSimTrackTemp] = useState<number>(35);
  const [simStartingFuel, setSimStartingFuel] = useState<number>(80);
  const [simNoiseLevel] = useState<number>(0.15);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedLaps, setSimulatedLaps] = useState<SimulatedLap[]>([]);
  const [simCurrentLap, setSimCurrentLap] = useState<number>(0);
  const [simLapsPool, setSimLapsPool] = useState<SimulatedLap[]>([]);

  const startSimulation = () => {
    if (isSimulating) return;
    
    fetch(`${API_BASE}/api/predict/live-stint/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compound: selectedCompound.toUpperCase(),
        track_temp_c: simTrackTemp,
        fuel_load_kg: simStartingFuel,
        laps: 25,
        noise_level: simNoiseLevel,
        driver_id: selectedDriver
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to start live stint simulation");
        return res.json();
      })
      .then((data) => {
        if (data.status === "success" && data.laps && data.laps.length > 0) {
          setSimulatedLaps([]);
          setSimCurrentLap(0);
          setSimLapsPool(data.laps);
          setIsSimulating(true);
        }
      })
      .catch((err) => {
        console.error("Simulation run failed:", err);
        setError(err);
      });
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setSimulatedLaps([]);
    setSimCurrentLap(0);
    setSimLapsPool([]);
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isSimulating && simLapsPool.length > 0) {
      intervalId = setInterval(() => {
        setSimCurrentLap((prev) => {
          const next = prev + 1;
          if (next > simLapsPool.length) {
            if (intervalId) clearInterval(intervalId);
            setIsSimulating(false);
            return prev;
          }
          setSimulatedLaps((prevLaps) => [
            ...prevLaps,
            simLapsPool[next - 1]
          ]);
          return next;
        });
      }, 700);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSimulating, simLapsPool]);

  // Stop simulation if compound or driver changes
  useEffect(() => {
    stopSimulation();
  }, [selectedCompound, selectedDriver]);

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
          driver_id: selectedDriver
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
      .catch((err) => {
        console.error("Error loading tyre predictions from microservice:", err);
        setError(err);
      });
  }, [season, selectedDriver]);

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
        }
      })
      .catch((err) => {
        console.error("Error fetching actual lap times:", err);
        setError(err);
      });
  }, [season]);

  const activePrediction = compoundsData.find((d) => d.compound === selectedCompound.toUpperCase()) || compoundsData[1];
  const ciWidth = activePrediction?.confidence_interval?.length >= 2 
    ? (activePrediction.confidence_interval[1] - activePrediction.confidence_interval[0]) / 2
    : 0.25;

  // Build combined chart data
  const chartData = Array.from({ length: 25 }, (_, idx) => {
    const lap = idx + 1;
    const softPt = compoundsData.find(d => d.compound === "SOFT")?.degradation_curve?.find(p => p.stint_lap === lap);
    const mediumPt = compoundsData.find(d => d.compound === "MEDIUM")?.degradation_curve?.find(p => p.stint_lap === lap);
    const hardPt = compoundsData.find(d => d.compound === "HARD")?.degradation_curve?.find(p => p.stint_lap === lap);
    
    const activePredicted = selectedCompound === "soft" ? softPt?.predicted_s 
      : (selectedCompound === "medium" ? mediumPt?.predicted_s : hardPt?.predicted_s);

    const simLap = simulatedLaps.find(sl => sl.lap === lap);

    return {
      lap,
      soft: softPt ? Number(softPt.predicted_s.toFixed(3)) : undefined,
      medium: mediumPt ? Number(mediumPt.predicted_s.toFixed(3)) : undefined,
      hard: hardPt ? Number(hardPt.predicted_s.toFixed(3)) : undefined,
      ci_band: activePredicted ? [Number((activePredicted - ciWidth).toFixed(3)), Number((activePredicted + ciWidth).toFixed(3))] : undefined,
      simulated: simLap ? Number(simLap.simulated_s.toFixed(3)) : undefined,
      tyre_health: simLap ? simLap.tyre_health_percent : undefined
    };
  });

  const scatterData = actualLaps
    .filter((l) => l.compound === selectedCompound.toUpperCase())
    .map((l) => ({
      lap: l.stint_lap,
      actual: l.lap_time_s,
      driver_id: l.driver_id
    }));

  const handleCompoundClick = (compName: "soft" | "medium" | "hard") => {
    setSelectedCompound(compName);
    setSelectedDetailCompound(compName.toUpperCase() as Compound);
    setModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-active)", padding: "0.75rem", borderRadius: "3px", minWidth: "180px", boxShadow: "0 0 16px var(--accent-dim)" }}>
        <div className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", marginBottom: "0.5rem", letterSpacing: "0.1em", fontWeight: 600 }}>
          STINT LAP {label}
        </div>
        
        {payload.map((entry: any) => {
          if (["soft", "medium", "hard"].includes(entry.dataKey)) {
            return (
              <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.35rem" }}>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: entry.color, fontWeight: selectedCompound === entry.dataKey ? 700 : 400 }}>
                  {entry.name.toUpperCase()} {selectedCompound === entry.dataKey ? "(ACTIVE)" : ""}
                </span>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: 600 }}>
                  {formatTime(entry.value)}
                </span>
              </div>
            );
          }
          if (entry.dataKey === "simulated") {
            return (
              <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.35rem" }}>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", fontWeight: 600 }}>
                  SIMULATED LIVE
                </span>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: 600 }}>
                  {formatTime(entry.value)}
                </span>
              </div>
            );
          }
          return null;
        })}

        {scatterData.filter(s => s.lap === label).length > 0 && (
          <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border-subtle)" }}>
            <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>ACTUAL TELEMETRY</div>
            {scatterData.filter(s => s.lap === label).slice(0, 3).map((s, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--accent-primary)" }}>
                  {s.driver_id}
                </span>
                <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>
                  {formatTime(s.actual)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getTyreManagementLabel = (driverId: string) => {
    const managers: Record<string, { multiplier: number; grade: string }> = {
      VER: { multiplier: 0.82, grade: "S (0.82x)" },
      NOR: { multiplier: 0.88, grade: "A (0.88x)" },
      LEC: { multiplier: 0.92, grade: "B+ (0.92x)" },
      HAM: { multiplier: 0.80, grade: "S+ (0.80x)" },
      RUS: { multiplier: 0.95, grade: "B (0.95x)" },
      PIA: { multiplier: 0.93, grade: "B+ (0.93x)" },
      SAI: { multiplier: 0.86, grade: "A (0.86x)" },
      ALO: { multiplier: 0.83, grade: "S (0.83x)" },
      PER: { multiplier: 0.85, grade: "S (0.85x)" },
    };
    return managers[driverId] || { multiplier: 1.0, grade: "B (1.00x)" };
  };

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
      <CompoundDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} compound={selectedDetailCompound} />
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Module Sub-Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1px", gap: "0.5rem" }}>
          <NavLink
            to="/tyres"
            end
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            WEAR PREDICTOR
          </NavLink>
          <NavLink
            to="/tyres/circuits"
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            CIRCUIT DATABASE
          </NavLink>
          <NavLink
            to="/tyres/accuracy"
            style={({ isActive }) => subnavLinkStyle(isActive)}
          >
            ACCURACY LOG
          </NavLink>
        </div>

        {subTab === "circuits" ? (
          <TyreCircuits />
        ) : subTab === "accuracy" ? (
          <TyreAccuracy />
        ) : (
          <>
        
        {/* Driver Selector Row */}
        <div className="panel" style={{ padding: "1rem", background: "var(--accent-tint)" }}>
          <span className="text-mono" style={{ display: "block", fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            SELECT TELEMETRY PROFILE (CAR & DRIVER DEGRADATION RATIO)
          </span>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            {DRIVERS.map((driver) => {
              const isSelected = selectedDriver === driver.id;
              return (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    background: isSelected ? "var(--accent-dim)" : "rgba(255, 255, 255, 0.02)",
                    border: isSelected ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                    borderRadius: "4px",
                    padding: "0.4rem 0.8rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    minWidth: "150px",
                    textAlign: "left"
                  }}
                >
                  <div style={{ width: "3px", height: "20px", background: driver.color, borderRadius: "1.5px" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: isSelected ? "var(--accent-primary)" : "var(--text-primary)" }}>{driver.id}</div>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{driver.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Header stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" }}>
          {[
            { label: "CIRCUIT", value: activePrediction?.circuit_id?.toUpperCase() === "MONZA" ? "Monza GP" : "Monaco GP", accent: true },
            { label: "TRACK TEMP", value: `${simTrackTemp}°C` },
            { label: "AIR TEMP", value: `${Math.round(simTrackTemp * 0.7)}°C` },
            { label: "TYRE MANAGEMENT", value: getTyreManagementLabel(selectedDriver).grade, accent: true },
            { label: "TRACK TYPE", value: activePrediction?.circuit_id?.toUpperCase() === "MONZA" ? "Traditional Circuit" : "Street Circuit" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`stat-value ${s.accent ? "shimmer-text" : ""}`} style={s.accent ? {} : { color: "var(--text-primary)", fontSize: "0.95rem" }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        {compoundsData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.25rem" }}>
            
            {/* Main chart panel */}
            <div className="panel panel-accent" style={{ padding: "1.5rem" }}>
              <div className="section-header" style={{ marginBottom: "1rem" }}>
                <span className="section-title">Tyre Degradation Curves (25 Laps)</span>
                <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--accent-primary)", marginLeft: "1rem" }}>
                  ACTIVE CONFIGURATION: {selectedCompound.toUpperCase()}
                </span>
                <div className="section-header-line" />
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                {[
                  { name: "SOFT", color: COMPOUND_COLORS.SOFT, label: "ðŸŸ¢ Optimal (SOFT)" },
                  { name: "MEDIUM", color: COMPOUND_COLORS.MEDIUM, label: "ðŸŸ¡ Fading (MEDIUM)" },
                  { name: "HARD", color: COMPOUND_COLORS.HARD, label: "ðŸ”´ Cliff Zone (HARD)" },
                ].map((item) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "3px", height: "16px", background: item.color, borderRadius: "1px" }} />
                    <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis
                      dataKey="lap"
                      tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                      axisLine={{ stroke: "var(--border-subtle)" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v.toFixed(1)}s`}
                      tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                      axisLine={{ stroke: "var(--border-subtle)" }}
                      domain={["auto", "auto"]}
                    />
                    
                    {/* Confidence Range Area */}
                    <Area
                      type="monotone"
                      dataKey="ci_band"
                      fill={`${COMPOUND_COLORS[selectedCompound.toUpperCase() as Compound]}14`}
                      stroke="none"
                      activeDot={false}
                    />

                    <ChartTooltip content={<CustomTooltip />} />

                    {/* soft line */}
                    <Line
                      type="monotone"
                      dataKey="soft"
                      stroke={COMPOUND_COLORS.SOFT}
                      strokeWidth={selectedCompound === "soft" ? 3 : 1.5}
                      opacity={selectedCompound === "soft" ? 1 : 0.35}
                      dot={false}
                      isAnimationActive={false}
                    />
                    
                    {/* medium line */}
                    <Line
                      type="monotone"
                      dataKey="medium"
                      stroke={COMPOUND_COLORS.MEDIUM}
                      strokeWidth={selectedCompound === "medium" ? 3 : 1.5}
                      opacity={selectedCompound === "medium" ? 1 : 0.35}
                      dot={false}
                      isAnimationActive={false}
                    />

                    {/* hard line */}
                    <Line
                      type="monotone"
                      dataKey="hard"
                      stroke={COMPOUND_COLORS.HARD}
                      strokeWidth={selectedCompound === "hard" ? 3 : 1.5}
                      opacity={selectedCompound === "hard" ? 1 : 0.35}
                      dot={false}
                      isAnimationActive={false}
                    />

                    {/* Actual laps overlay scatter */}
                    {scatterData.length > 0 && (
                      <Scatter
                        name="Actual Laps"
                        data={scatterData}
                        dataKey="actual"
                        fill="var(--accent-dim)"
                        stroke="var(--accent-dim)"
                        strokeWidth={1}
                      />
                    )}

                    {/* Live simulation overlay line */}
                    {simulatedLaps.length > 0 && (
                      <Line
                        type="monotone"
                        dataKey="simulated"
                        stroke="var(--accent-primary)"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={{ r: 3.5, fill: "var(--accent-primary)", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "var(--accent-primary)" }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Sector Indicators */}
              <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {[
                  { label: "OPTIMAL ZONE", color: "var(--accent-success)", range: `Laps 1-${Math.max(1, (activePrediction?.cliff_lap || 15) - 3)}` },
                  { label: "FADING ZONE", color: "var(--accent-warning)", range: `Laps ${Math.max(1, (activePrediction?.cliff_lap || 15) - 2)}-${activePrediction?.cliff_lap || 15}` },
                  { label: "CLIFF ZONE", color: "var(--accent-danger)", range: `Laps ${activePrediction?.cliff_lap || 15}+` },
                ].map((zone) => (
                  <div key={zone.label} style={{ padding: "0.5rem", background: "var(--bg-elevated)", borderRadius: "2px", border: `1px solid ${zone.color}40` }}>
                    <div className="text-mono" style={{ fontSize: "0.6rem", color: zone.color, fontWeight: 600, letterSpacing: "0.08em" }}>
                      {zone.label}
                    </div>
                    <div className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {zone.range}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar with compound cards & live stint simulator */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {compoundsData.map((pred) => {
                const compKey = pred.compound.toLowerCase() as "soft" | "medium" | "hard";
                const isSelected = selectedCompound === compKey;
                return (
                  <div
                    key={pred.compound}
                    className="panel panel-scanner"
                    style={{
                      padding: "1rem",
                      cursor: "pointer",
                      background: isSelected ? "var(--accent-tint)" : "transparent",
                      borderColor: isSelected ? COMPOUND_COLORS[pred.compound] : "var(--border-subtle)",
                      boxShadow: isSelected ? `0 0 12px ${COMPOUND_COLORS[pred.compound]}25` : "none",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setSelectedCompound(compKey)}
                    onDoubleClick={() => handleCompoundClick(compKey)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: "4px", height: "16px", background: COMPOUND_COLORS[pred.compound], borderRadius: "1px" }} />
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: COMPOUND_COLORS[pred.compound] }}>
                        {pred.compound}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                          CLIFF LAP
                        </span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                          L{pred.cliff_lap || "N/A"}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                          CLIFF SEVERITY
                        </span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: COMPOUND_COLORS[pred.compound] }}>
                          +{pred.cliff_severity_s_per_lap?.toFixed(2)}s/l
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                          CONFIDENCE
                        </span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-success)" }}>
                          {pred.compound === "SOFT" ? "92%" : (pred.compound === "MEDIUM" ? "88%" : "85%")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Live Stint Simulator panel in sidebar */}
              <div
                className="panel panel-scanner"
                style={{
                  padding: "1rem",
                  borderColor: isSimulating ? "var(--accent-primary)" : "var(--border-subtle)",
                  background: "var(--accent-tint)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginTop: "0.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                    LIVE STINT SIMULATOR
                  </span>
                  {isSimulating && <div className="pulse-dot live" />}
                </div>

                {!isSimulating && simulatedLaps.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Track Temp</span>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-primary)", fontWeight: "bold" }}>{simTrackTemp}°C</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="55"
                        value={simTrackTemp}
                        onChange={(e) => setSimTrackTemp(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--accent-primary)" }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Starting Fuel</span>
                        <span className="text-mono" style={{ fontSize: "0.6rem", color: "var(--text-primary)", fontWeight: "bold" }}>{simStartingFuel} kg</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="110"
                        value={simStartingFuel}
                        onChange={(e) => setSimStartingFuel(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--accent-primary)" }}
                      />
                    </div>

                    <button
                      onClick={startSimulation}
                      className="btn btn-primary"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        background: "var(--accent-primary)",
                        color: "var(--bg-void)",
                        border: "none",
                        borderRadius: "2px",
                        cursor: "pointer",
                      }}
                    >
                      RUN SIMULATION
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ background: "var(--bg-void)", padding: "0.5rem", borderRadius: "2px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>Progress</span>
                        <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-primary)", fontWeight: 600 }}>{simCurrentLap} / 25 Laps</span>
                      </div>
                      {simulatedLaps.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span className="text-mono" style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>Wear / Health</span>
                          <span className="text-mono" style={{ fontSize: "0.55rem", color: simulatedLaps[simulatedLaps.length - 1].tyre_health_percent > 35 ? "var(--accent-success)" : "var(--accent-danger)", fontWeight: 600 }}>
                            {simulatedLaps[simulatedLaps.length - 1].tyre_health_percent}%
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={stopSimulation}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        background: "var(--accent-danger)",
                        color: "var(--bg-void)",
                        border: "none",
                        borderRadius: "2px",
                        cursor: "pointer",
                      }}
                    >
                      RESET
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
    </>
  )}
</div>
</>
  );
}

