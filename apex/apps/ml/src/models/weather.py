import numpy as np
from typing import Dict, List, Any, Optional

class WeatherImpactModel:
  """
  Weather Impact Prediction Model.
  Models the effects of track temperature, air conditions, wind speed, and rain
  surface moisture on lap times, tyre selection crossover points, and driver
  wet-weather capability rankings.
  """
  def __init__(self):
    # Historical wet-weather driver performance multipliers (higher is better in the wet)
    self.wet_weather_multipliers: Dict[str, float] = {
      "HAM": 1.09, "VER": 1.08, "ALO": 1.06, "LEC": 1.04,
      "RUS": 1.02, "NOR": 1.03, "SAI": 1.01, "PIA": 0.99,
      "GAS": 0.98, "OCO": 0.97, "HUL": 0.99, "BOT": 0.98,
      "TSU": 0.95, "PER": 0.94, "STR": 0.92, "ALB": 0.96,
      "RIC": 0.93, "MAG": 0.94, "SAR": 0.85, "ZHO": 0.90
    }
    
    self.driver_names = {
      "VER": "Max Verstappen", "NOR": "Lando Norris", "LEC": "Charles Leclerc",
      "HAM": "Lewis Hamilton", "RUS": "George Russell", "PIA": "Oscar Piastri",
      "SAI": "Carlos Sainz", "ALO": "Fernando Alonso", "PER": "Sergio Perez",
      "STR": "Lance Stroll", "GAS": "Pierre Gasly", "OCO": "Esteban Ocon",
      "ALB": "Alexander Albon", "SAR": "Logan Sargeant", "TSU": "Yuki Tsunoda",
      "RIC": "Daniel Ricciardo", "HUL": "Nico Hulkenberg", "MAG": "Kevin Magnussen",
      "BOT": "Valtteri Bottas", "ZHO": "Guanyu Zhou"
    }

  def calculate_impact(
    self,
    track_temp_c: float,
    air_temp_c: float,
    humidity: float,
    rain_probability: float,
    wind_speed_kmh: float
  ) -> Dict[str, Any]:
    """
    Predict lap time delta (seconds) and tyre compound recommendation based on weather variables.
    """
    # 1. Temperature-based performance loss (optimal track surface is 30-35°C)
    # Extreme heat (e.g. 50°C) triggers thermal tyre degradation and power loss.
    temp_delta = 0.0
    if track_temp_c > 38.0:
      # ~0.04s loss per degree above 38°C
      temp_delta += (track_temp_c - 38.0) * 0.04
    elif track_temp_c < 22.0:
      # Difficult to warm tyres: ~0.06s loss per degree below 22°C
      temp_delta += (22.0 - track_temp_c) * 0.06

    # 2. Wind drag impact (linear penalty above 15 km/h)
    wind_delta = max(0.0, (wind_speed_kmh - 15.0) * 0.015)

    # 3. Rain surface moisture delta (wet surfaces slow cars down exponentially)
    # Crossover parameters:
    # - Dry compound boundary: rain_probability < 0.20
    # - Intermediate compound boundary: 0.20 <= rain_probability < 0.60 (adds ~4.0s - 12.0s)
    # - Wet compound boundary: rain_probability >= 0.60 (adds ~12.0s - 25.0s)
    rain_delta = 0.0
    compound_rec = "MEDIUM"
    switch_prob = 0.0
    risk_level = "SAFE"

    if rain_probability < 0.20:
      # Slicks optimal
      compound_rec = "MEDIUM"
      rain_delta = rain_probability * 1.5
      switch_prob = rain_probability * 0.3
      risk_level = "SAFE"
    elif rain_probability < 0.55:
      # Intermediate crossover zone
      compound_rec = "INTER"
      rain_delta = 4.5 + (rain_probability - 0.2) * 15.0
      switch_prob = 0.6 + (rain_probability - 0.2) * 0.8
      risk_level = "CAUTION"
    else:
      # Full wet track conditions
      compound_rec = "WET"
      rain_delta = 12.0 + (rain_probability - 0.55) * 28.0
      switch_prob = 0.95
      risk_level = "DANGEROUS"

    total_delta = temp_delta + wind_delta + rain_delta

    return {
      "lap_time_delta_s": round(total_delta, 3),
      "compound_recommendation": compound_rec,
      "switch_probability": round(float(np.clip(switch_prob, 0.0, 1.0)), 2),
      "risk_assessment": risk_level,
      "details": {
        "temperature_impact_s": round(temp_delta, 3),
        "wind_drag_impact_s": round(wind_delta, 3),
        "surface_moisture_impact_s": round(rain_delta, 3)
      }
    }

  def get_wet_rankings(self) -> List[Dict[str, Any]]:
    """
    Get driver wet-weather ratings.
    """
    rankings = []
    for d_id, mult in self.wet_weather_multipliers.items():
      # Normalize wet skill rating to 0-100 scale (e.g. 1.09 maps to 99, 0.85 maps to 45)
      wet_skill = (mult - 0.8) * 310.0
      rankings.append({
        "driver_id": d_id,
        "driver_name": self.driver_names.get(d_id, d_id),
        "wet_coefficient": mult,
        "wet_skill_rating": round(float(np.clip(wet_skill, 0.0, 100.0)), 1)
      })
    return sorted(rankings, key=lambda x: x["wet_coefficient"], reverse=True)
