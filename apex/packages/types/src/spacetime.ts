export interface LivePosition {
  driver_number: string;
  x: number;
  y: number;
  z: number;
  timestamp: number;
  session_key: number;
}

export interface LiveGap {
  driver_number: string;
  gap_to_leader: number;
  interval: number;
  timestamp: number;
}

export interface SessionState {
  status: 'green' | 'sc' | 'vsc' | 'red';
  lap: number;
  total_laps: number;
  session_key: number;
}

export interface LiveTiming {
  driver_number: string;
  last_lap: number;
  sector_times: number[];
  timestamp: number;
}

export interface StrategyRecommendation {
  driver_number: string;
  undercut_viable: boolean;
  optimal_stop_lap: number;
  expected_gap: number;
}

export interface ChampionshipProbability {
  driver_number: string;
  probability: number;
  updated_at: number;
}

export interface PredictedLaptime {
  driver_number: string;
  compound: string;
  predicted_time: number;
  confidence_interval: [number, number];
}
