import type {
  EloRanking,
  LapTimePrediction,
  PitRecommendation,
  SimulationResult,
  DriverRaceState,
} from "../types";

export const MOCK_ELO_RANKINGS: EloRanking[] = [
  { driver_id: "ANT", driver_name: "Kimi Antonelli",    team: "Mercedes",         team_color: "#047857", elo_rating: 1885, uncertainty: 18, trend_5_rounds: +22.4, h2h_record: { wins: 12, losses: 10, ties: 0 }, quali_dominance_pct: 70, nationality_flag: "🇮🇹" },
  { driver_id: "VER", driver_name: "Max Verstappen",   team: "Red Bull Racing",  team_color: "#1e3a8a", elo_rating: 1847, uncertainty: 21, trend_5_rounds: +12.1, h2h_record: { wins: 18, losses: 4, ties: 0 },  quali_dominance_pct: 82, nationality_flag: "🇳🇱" },
  { driver_id: "NOR", driver_name: "Lando Norris",     team: "McLaren",          team_color: "#ea580c", elo_rating: 1791, uncertainty: 24, trend_5_rounds: +18.4, h2h_record: { wins: 16, losses: 6, ties: 0 },  quali_dominance_pct: 73, nationality_flag: "🇬🇧" },
  { driver_id: "LEC", driver_name: "Charles Leclerc",  team: "Ferrari",          team_color: "#dc2626", elo_rating: 1773, uncertainty: 27, trend_5_rounds: +4.2,  h2h_record: { wins: 14, losses: 8, ties: 0 },  quali_dominance_pct: 64, nationality_flag: "🇲🇨" },
  { driver_id: "HAM", driver_name: "Lewis Hamilton",   team: "Ferrari",          team_color: "#dc2626", elo_rating: 1761, uncertainty: 19, trend_5_rounds: -3.1,  h2h_record: { wins: 12, losses: 10, ties: 0 }, quali_dominance_pct: 55, nationality_flag: "🇬🇧" },
  { driver_id: "RUS", driver_name: "George Russell",   team: "Mercedes",         team_color: "#047857", elo_rating: 1748, uncertainty: 22, trend_5_rounds: +8.7,  h2h_record: { wins: 15, losses: 7, ties: 0 },  quali_dominance_pct: 68, nationality_flag: "🇬🇧" },
  { driver_id: "PIA", driver_name: "Oscar Piastri",    team: "McLaren",          team_color: "#ea580c", elo_rating: 1739, uncertainty: 31, trend_5_rounds: +11.2, h2h_record: { wins: 14, losses: 8, ties: 0 },  quali_dominance_pct: 59, nationality_flag: "🇦🇺" },
  { driver_id: "SAI", driver_name: "Carlos Sainz",     team: "Williams",         team_color: "#0284c7", elo_rating: 1722, uncertainty: 20, trend_5_rounds: -1.8,  h2h_record: { wins: 13, losses: 9, ties: 0 },  quali_dominance_pct: 61, nationality_flag: "🇪🇸" },
  { driver_id: "ALO", driver_name: "Fernando Alonso",  team: "Aston Martin",     team_color: "#065f46", elo_rating: 1715, uncertainty: 18, trend_5_rounds: +2.4,  h2h_record: { wins: 12, losses: 10, ties: 0 }, quali_dominance_pct: 58, nationality_flag: "🇪🇸" },
];

export const MOCK_DEGRADATION: LapTimePrediction = {
  predicted_lap_time_s: 82.314,
  confidence_interval: [81.9, 82.7],
  cliff_lap: 19,
  cliff_severity_s_per_lap: 0.18,
  compound: "MEDIUM",
  circuit_id: "monza",
  degradation_curve: [
    { stint_lap: 1,  predicted_s: 81.85 },
    { stint_lap: 2,  predicted_s: 81.92 },
    { stint_lap: 3,  predicted_s: 81.98 },
    { stint_lap: 4,  predicted_s: 82.05 },
    { stint_lap: 5,  predicted_s: 82.09 },
    { stint_lap: 6,  predicted_s: 82.14 },
    { stint_lap: 7,  predicted_s: 82.17 },
    { stint_lap: 8,  predicted_s: 82.21 },
    { stint_lap: 9,  predicted_s: 82.24 },
    { stint_lap: 10, predicted_s: 82.28 },
    { stint_lap: 11, predicted_s: 82.33 },
    { stint_lap: 12, predicted_s: 82.38 },
    { stint_lap: 13, predicted_s: 82.43 },
    { stint_lap: 14, predicted_s: 82.50 },
    { stint_lap: 15, predicted_s: 82.58 },
    { stint_lap: 16, predicted_s: 82.67 },
    { stint_lap: 17, predicted_s: 82.78 },
    { stint_lap: 18, predicted_s: 82.93 },
    { stint_lap: 19, predicted_s: 83.22 },
    { stint_lap: 20, predicted_s: 83.64 },
    { stint_lap: 21, predicted_s: 84.10 },
    { stint_lap: 22, predicted_s: 84.62 },
  ],
};

export const SOFT_DEGRADATION: LapTimePrediction = {
  ...MOCK_DEGRADATION,
  compound: "SOFT",
  cliff_lap: 12,
  cliff_severity_s_per_lap: 0.28,
  degradation_curve: [
    { stint_lap: 1,  predicted_s: 81.40 },
    { stint_lap: 2,  predicted_s: 81.49 },
    { stint_lap: 3,  predicted_s: 81.58 },
    { stint_lap: 4,  predicted_s: 81.70 },
    { stint_lap: 5,  predicted_s: 81.82 },
    { stint_lap: 6,  predicted_s: 81.98 },
    { stint_lap: 7,  predicted_s: 82.14 },
    { stint_lap: 8,  predicted_s: 82.35 },
    { stint_lap: 9,  predicted_s: 82.61 },
    { stint_lap: 10, predicted_s: 82.90 },
    { stint_lap: 11, predicted_s: 83.22 },
    { stint_lap: 12, predicted_s: 83.70 },
    { stint_lap: 13, predicted_s: 84.35 },
    { stint_lap: 14, predicted_s: 85.10 },
    { stint_lap: 15, predicted_s: 85.92 },
  ],
};

export const HARD_DEGRADATION: LapTimePrediction = {
  ...MOCK_DEGRADATION,
  compound: "HARD",
  cliff_lap: 28,
  cliff_severity_s_per_lap: 0.09,
  degradation_curve: [
    { stint_lap: 1,  predicted_s: 82.50 },
    { stint_lap: 5,  predicted_s: 82.58 },
    { stint_lap: 10, predicted_s: 82.70 },
    { stint_lap: 15, predicted_s: 82.85 },
    { stint_lap: 20, predicted_s: 83.02 },
    { stint_lap: 25, predicted_s: 83.22 },
    { stint_lap: 28, predicted_s: 83.55 },
    { stint_lap: 30, predicted_s: 83.82 },
    { stint_lap: 33, predicted_s: 84.18 },
  ],
};

export const MOCK_DRIVER_STATE: DriverRaceState = {
  driver_id: "LEC",
  current_lap: 28,
  tyre: { compound: "MEDIUM", age: 15 },
  gap_ahead_s: 2.1,
  gap_behind_s: 4.8,
  position: 3,
};

export const MOCK_PIT_RECOMMENDATIONS: PitRecommendation[] = [
  {
    pit_lap: 31,
    compound_new: "HARD",
    net_delta_s: -2.4,
    traffic_clear: true,
    undercut_window: true,
    sc_probability: 0.22,
    confidence: "HIGH",
    rationale: "Undercut HAM (gap 2.1s). Emerge 1.3s ahead with 8-lap fresh tyre advantage. Clean air guaranteed.",
  },
  {
    pit_lap: 33,
    compound_new: "MEDIUM",
    net_delta_s: -0.8,
    traffic_clear: true,
    undercut_window: false,
    sc_probability: 0.27,
    confidence: "MEDIUM",
    rationale: "Conservative window. HAM may respond by pitting on L32. Slight exposure to traffic from ALO.",
  },
  {
    pit_lap: 35,
    compound_new: "SOFT",
    net_delta_s: +1.1,
    traffic_clear: false,
    undercut_window: false,
    sc_probability: 0.31,
    confidence: "LOW",
    rationale: "Overcut risk. Must maintain pace within 0.8s/lap of HAM. Traffic from ALO likely at pit exit.",
  },
];

export const MOCK_SIMULATION: SimulationResult = {
  as_of_round: 12,
  total_rounds: 24,
  simulations_run: 1_000_000,
  wdc: [
    { driver_id: "VER", driver_name: "Max Verstappen",  team: "Red Bull Racing",  team_color: "#1e3a8a", current_points: 287, championship_probability: 0.634, max_possible_points: 627, eliminated: false, trend: -0.041, points_scenarios: { p10: 341, p25: 368, p50: 401, p75: 438, p90: 471 } },
    { driver_id: "NOR", driver_name: "Lando Norris",    team: "McLaren",          team_color: "#ea580c", current_points: 261, championship_probability: 0.298, max_possible_points: 601, eliminated: false, trend: +0.038, points_scenarios: { p10: 295, p25: 325, p50: 362, p75: 401, p90: 441 } },
    { driver_id: "LEC", driver_name: "Charles Leclerc", team: "Ferrari",          team_color: "#dc2626", current_points: 198, championship_probability: 0.051, max_possible_points: 538, eliminated: false, trend: +0.008, points_scenarios: { p10: 225, p25: 255, p50: 295, p75: 335, p90: 378 } },
    { driver_id: "RUS", driver_name: "George Russell",  team: "Mercedes",         team_color: "#047857", current_points: 175, championship_probability: 0.012, max_possible_points: 515, eliminated: false, trend: +0.004, points_scenarios: { p10: 198, p25: 225, p50: 265, p75: 308, p90: 352 } },
    { driver_id: "ANT", driver_name: "Kimi Antonelli",   team: "Mercedes",         team_color: "#047857", current_points: 115, championship_probability: 0.003, max_possible_points: 455, eliminated: false, trend: +0.015, points_scenarios: { p10: 135, p25: 155, p50: 185, p75: 215, p90: 245 } },
    { driver_id: "PIA", driver_name: "Oscar Piastri",   team: "McLaren",          team_color: "#ea580c", current_points: 142, championship_probability: 0.004, max_possible_points: 482, eliminated: false, trend: +0.002, points_scenarios: { p10: 162, p25: 188, p50: 228, p75: 272, p90: 318 } },
    { driver_id: "SAI", driver_name: "Carlos Sainz",    team: "Williams",         team_color: "#0284c7", current_points: 98,  championship_probability: 0.001, max_possible_points: 438, eliminated: false, trend: -0.001, points_scenarios: { p10: 115, p25: 138, p50: 172, p75: 212, p90: 255 } },
  ],
  wcc: [
    { constructor_id: "red_bull", constructor_name: "Red Bull Racing", current_points: 412, championship_probability: 0.548, color: "#1e3a8a" },
    { constructor_id: "mclaren",  constructor_name: "McLaren",         current_points: 389, championship_probability: 0.361, color: "#ea580c" },
    { constructor_id: "ferrari",  constructor_name: "Ferrari",         current_points: 341, championship_probability: 0.078, color: "#dc2626" },
    { constructor_id: "mercedes", constructor_name: "Mercedes",        current_points: 298, championship_probability: 0.013, color: "#047857" },
  ],
};
