import numpy as np
from typing import Dict, List, Any, Optional

class DriverFormIndex:
  """
  Driver Form Index Calculation Model.
  Computes a rolling 0-100 performance index using Exponentially Weighted Moving
  Average (EWMA) of recent lap pace consistency, teammate qualifying margins, and
  finishing offsets compared to Elo expectation models.
  """
  def __init__(self, alpha: float = 0.08):
    self.alpha = alpha # EWMA smoothing factor (higher alpha = weights recent races heavier)
    
    # Base starting form indices (0-100) matching existing season standings
    self.form_indices: Dict[str, float] = {
      "VER": 96.0, "NOR": 92.0, "LEC": 85.0, "HAM": 78.0,
      "RUS": 88.0, "PIA": 89.0, "SAI": 81.0, "ALO": 74.0,
      "PER": 68.0, "STR": 65.0, "GAS": 70.0, "OCO": 72.0,
      "ALB": 75.0, "SAR": 45.0, "TSU": 73.0, "RIC": 67.0,
      "HUL": 76.0, "MAG": 66.0, "BOT": 68.0, "ZHO": 60.0
    }
    
    # Store history of past ratings to calculate trend derivatives
    self.history: Dict[str, List[float]] = {
      d: [val - 4.0, val - 2.0, val] for d, val in self.form_indices.items()
    }
    
    # Dynamic teammate mappings will be populated from race entry lists
    self.teammates = {}

  def calculate_ewma(self, history: List[float]) -> float:
    if not history:
      return 50.0
    weights = np.exp(np.linspace(-1, 0, len(history)) * self.alpha)
    weights /= weights.sum()
    return float(np.sum(np.array(history) * weights))

  def get_form(self, driver_id: str) -> Dict[str, Any]:
    driver_id = driver_id.upper()
    current_val = self.form_indices.get(driver_id, 70.0)
    history_vals = self.history.get(driver_id, [current_val])
    
    # Calculate trend from the first derivative of recent form index path
    trend = "STABLE"
    if len(history_vals) >= 2:
      diff = history_vals[-1] - history_vals[-2]
      if diff > 1.5:
        trend = "IMPROVING"
      elif diff < -1.5:
        trend = "DECLINING"
        
    # Calculate consistency (mock standard deviation based on past history variance)
    consistency = float(np.clip(100.0 - np.std(history_vals) * 10, 50.0, 100.0))
    
    return {
      "driver_id": driver_id,
      "form_index": round(current_val, 1),
      "form_trend": trend,
      "consistency_score": round(consistency, 1),
      "pace_delta_vs_teammate": self.get_mock_teammate_delta(driver_id)
    }

  def get_mock_teammate_delta(self, driver_id: str) -> float:
    # This will be replaced with dynamic SQL aggregation of qualifying times
    return 0.0

  def update_form(
    self,
    driver_id: str,
    lap_times: List[float],
    qual_pos: int,
    finish_pos: int,
    expected_finish_pos: float
  ) -> float:
    driver_id = driver_id.upper()
    
    # Handle unknown drivers dynamically
    if driver_id not in self.form_indices:
        self.form_indices[driver_id] = 50.0
    if driver_id not in self.history:
        self.history[driver_id] = [50.0]

    # 1. Lap pace consistency factor
    lap_consistency = 100.0
    if len(lap_times) >= 5:
      std_dev = np.std(lap_times)
      # Lower standard deviation = higher consistency score (mapped to 0-100)
      lap_consistency = float(np.clip(100.0 - std_dev * 15, 0.0, 100.0))
      
    # 2. Qualifying offset factor (lower qual position = higher score)
    qual_score = float(np.clip(100.0 - (qual_pos - 1) * 5.0, 0.0, 100.0))
    
    # 3. Race outcome vs expected factor (positive outcome vs expectations increases score)
    expected_delta = expected_finish_pos - finish_pos
    outcome_score = float(np.clip(70.0 + expected_delta * 6.0, 0.0, 100.0))
    
    # Combine components with weightings
    session_score = 0.3 * lap_consistency + 0.3 * qual_score + 0.4 * outcome_score
    
    # Apply EWMA
    current_history = self.history.get(driver_id, [])
    current_history.append(session_score)
    if len(current_history) > 10:
      current_history.pop(0)
      
    self.history[driver_id] = current_history
    new_index = self.calculate_ewma(current_history)
    self.form_indices[driver_id] = new_index
    
    return new_index

  def get_rankings(self) -> List[Dict[str, Any]]:
    rankings = []
    for d_id in self.form_indices:
      rankings.append(self.get_form(d_id))
    return sorted(rankings, key=lambda x: x["form_index"], reverse=True)
