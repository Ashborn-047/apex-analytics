import numpy as np
import pandas as pd
import math
from typing import Dict, List, Any, Optional

try:
  from xgboost import XGBRegressor
except ImportError:
  XGBRegressor = None

class QualifyingPredictor:
  """
  F1 Qualifying Position & Lap Time Predictor.
  Estimates qualifying grid order, expected best lap times (seconds), Q3 entry
  probabilities, and pole position chances based on driver Elo, constructor strength,
  and track conditions.
  """
  def __init__(self):
    self.is_trained = False
    self.model = None
    
    # Base expected qualifying positions per constructor layout (populated dynamically during training)
    self.constructor_quali_base = {}
    self.driver_quali_offsets = {}
    
    # Track base lap times for Q3 reference (seconds)
    self.track_base_times = {
      "monza": 80.0,
      "monaco": 71.0,
      "singapore": 90.0,
      "spa": 102.0,
      "villeneuve": 72.0,
      "shanghai": 91.5,
      "albert_park": 76.5,
      "bahrain": 89.0
    }

  def predict_qualifying(
    self,
    driver_id: str,
    constructor_id: str,
    circuit_id: str,
    circuit_type: str,
    track_temp_c: float,
    air_temp_c: float,
    driver_elo: Optional[float] = None
  ) -> Dict[str, Any]:
    """
    Predict qualifying position, expected lap time, and Q3/pole probabilities.
    """
    driver_id = driver_id.upper()
    constructor_id = constructor_id.lower()
    circuit_id = circuit_id.lower()
    circuit_type = circuit_type.lower()
    
    # 1. Base expected position from constructor baseline
    expected_pos = self.constructor_quali_base.get(constructor_id, 10.0)
    
    # 2. Driver skill adjustment
    # Use dynamic driver Elo if provided, else fallback to trained dynamic offset
    if driver_elo is not None:
        # Assuming average Elo ~ 1600. Higher Elo reduces expected position.
        # Scale: every 100 Elo points is worth ~1.5 grid slots
        driver_offset = (1650.0 - driver_elo) / 60.0
    else:
        # Fallback to dynamically trained offset, or 0.0 if totally unknown
        driver_offset = self.driver_quali_offsets.get(driver_id, 0.0)

    expected_pos += driver_offset
    
    # 3. Circuit type adjustment
    # Ferrari/Leclerc excel at low downforce/street circuits. Red Bull at high-speed tracks.
    if circuit_type == "street_circuit" and driver_id in ["LEC", "ALO"]:
      expected_pos -= 0.5
    elif circuit_type == "low_downforce" and constructor_id == "ferrari":
      expected_pos -= 0.4
    elif circuit_type == "high_speed" and constructor_id == "red_bull":
      expected_pos -= 0.6
      
    # Clip position bounds (1st to 20th)
    expected_pos = float(np.clip(expected_pos, 1.0, 20.0))
    
    # 4. Predict expected lap time
    # Base lap time for circuit, default to average F1 lap if unknown
    base_time = self.track_base_times.get(circuit_id, 85.0)
    
    # Adjust for track temperature: optimal tyre window is 30-38°C track temp
    temp_penalty = 0.0
    if track_temp_c > 38.0:
      temp_penalty += (track_temp_c - 38.0) * 0.02
    elif track_temp_c < 22.0:
      temp_penalty += (22.0 - track_temp_c) * 0.03
      
    # Adjust lap time based on expected qualifying position (P1 has best lap time; P20 is ~1.8s slower)
    pos_penalty = (expected_pos - 1.0) * 0.09
    
    predicted_lap_time = base_time + temp_penalty + pos_penalty

    # 5. Calculate probabilities via standard error curves
    std_dev = 1.8 # Qualifying position variance
    
    # Probability of reaching Q3 (finishing in top 10)
    # Cumulative distribution approximation: P(Pos <= 10)
    q3_prob = 1.0 / (1.0 + math.exp((expected_pos - 10.0) / std_dev))
    
    # Probability of securing pole position (P(Pos <= 1.5))
    pole_prob = 1.0 / (1.0 + math.exp((expected_pos - 1.2) / 0.5))

    return {
      "driver_id": driver_id,
      "constructor_id": constructor_id,
      "predicted_position": int(np.clip(round(expected_pos), 1, 20)),
      "expected_position": round(expected_pos, 1),
      "expected_lap_time_s": round(predicted_lap_time, 3),
      "q3_probability": round(float(q3_prob), 3),
      "pole_probability": round(float(pole_prob), 3)
    }

  def train(self, historical_results: List[Dict[str, Any]]):
    """
    Train an XGBoost Regressor if installed, otherwise marks model as active/trained.
    """
    if len(historical_results) < 10:
      raise ValueError("Insufficient training results (minimum 10 required).")
      
    self.is_trained = True
    
    if XGBRegressor is not None:
      try:
        df = pd.DataFrame(historical_results)

        # Calculate dynamic features if they don't exist
        if 'constructor_quali_base' not in df.columns:
            # Dynamically calculate average constructor position
            self.constructor_quali_base = df.groupby('constructor_id')['qualifying_position'].mean().to_dict()
            df['constructor_quali_base'] = df['constructor_id'].apply(lambda x: self.constructor_quali_base.get(str(x).lower(), 10.0))

        if 'driver_offset' not in df.columns:
            # Dynamically calculate driver offset from their constructor average
            df['calc_offset'] = df['qualifying_position'] - df['constructor_quali_base']
            self.driver_quali_offsets = df.groupby('driver_id')['calc_offset'].mean().to_dict()
            df['driver_offset'] = df['driver_id'].apply(lambda x: self.driver_quali_offsets.get(str(x).upper(), 0.0))

        x = df[['constructor_quali_base', 'driver_offset', 'track_temp_c', 'air_temp_c']].values
        y = df['qualifying_position'].values
        
        self.model = XGBRegressor(n_estimators=50, max_depth=3, random_state=42)
        self.model.fit(x, y)
      except Exception:
        self.model = None
