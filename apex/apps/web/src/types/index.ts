// ─── Shared ───────────────────────────────────────────────────
export type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTER" | "WET";
export type SessionType = "QUALIFYING" | "RACE" | "SPRINT";

// ─── Elo Ratings ──────────────────────────────────────────────
export interface EloRanking {
  driver_id: string;
  driver_name: string;
  team: string;
  team_color: string;
  elo_rating: number;
  uncertainty: number;
  trend_5_rounds: number;
  h2h_record: { wins: number; losses: number; ties: number };
  quali_dominance_pct: number;
  nationality_flag: string;
}

export interface EloHeadToHead {
  round: string;
  session: SessionType;
  winner: string;
  delta_pct: number;
  rating_change_a: number;
  rating_change_b: number;
}

// ─── Lap Time & Tyre Degradation ──────────────────────────────
export interface DegradationPoint {
  stint_lap: number;
  predicted_s: number;
  actual_s?: number;
}

export interface LapTimePrediction {
  predicted_lap_time_s: number;
  confidence_interval: [number, number];
  degradation_curve: DegradationPoint[];
  cliff_lap: number | null;
  cliff_severity_s_per_lap: number;
  compound: Compound;
  circuit_id: string;
}

// ─── Pit Strategy ─────────────────────────────────────────────
export interface PitRecommendation {
  pit_lap: number;
  compound_new: Compound;
  net_delta_s: number;
  traffic_clear: boolean;
  undercut_window: boolean;
  sc_probability: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  rationale: string;
}

export interface DriverRaceState {
  driver_id: string;
  current_lap: number;
  tyre: { compound: Compound; age: number };
  gap_ahead_s: number;
  gap_behind_s: number;
  position: number;
}

// ─── Championship Simulation ───────────────────────────────────
export interface ChampionshipEntry {
  driver_id: string;
  driver_name: string;
  team: string;
  team_color: string;
  current_points: number;
  championship_probability: number;
  max_possible_points: number;
  eliminated: boolean;
  points_scenarios: {
    p10: number; p25: number; p50: number; p75: number; p90: number;
  };
  trend: number; // probability change vs last round
}

export interface ConstructorChampionshipEntry {
  constructor_id: string;
  constructor_name: string;
  current_points: number;
  championship_probability: number;
  color: string;
}

export interface SimulationResult {
  as_of_round: number;
  total_rounds: number;
  simulations_run: number;
  wdc: ChampionshipEntry[];
  wcc: ConstructorChampionshipEntry[];
}
