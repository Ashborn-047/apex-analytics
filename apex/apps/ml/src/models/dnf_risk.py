import numpy as np
import math
from typing import Dict, List, Any, Optional

class DNFRiskPredictor:
  """
  F1 DNF Risk & Reliability Survival Predictor.
  Uses a Weibull survival distribution model to predict lap-by-lap reliability,
  collision risks, and mechanical wear failure rates over the course of a race stint.
  """
  def __init__(self):
    # Base mechanical reliability rates per constructor (higher is more reliable)
    self.constructor_reliability = {
      "red_bull": 1.0, "mclaren": 0.98, "ferrari": 0.95, "mercedes": 0.97,
      "aston_martin": 0.92, "rb": 0.90, "haas": 0.88, "alpine": 0.85,
      "williams": 0.86, "sauber": 0.80
    }
    
    # Driver history crash multiplier (higher value = higher risk of collision)
    self.driver_crash_factors = {
      "VER": 0.8, "NOR": 0.9, "LEC": 1.1, "RUS": 1.2, "PIA": 0.95,
      "SAI": 1.0, "HAM": 0.85, "PER": 1.3, "ALO": 0.75, "STR": 1.4,
      "GAS": 1.1, "OCO": 1.3, "ALB": 1.0, "SAR": 1.8, "TSU": 1.2,
      "RIC": 1.0, "HUL": 0.95, "MAG": 1.5, "BOT": 0.90, "ZHO": 1.1
    }

  def calculate_risk(
    self,
    driver_id: str,
    constructor_id: str,
    circuit_type: str,
    total_laps: int,
    grid_position: int
  ) -> Dict[str, Any]:
    """
    Calculate full survival curve, DNF probability, and failure category breakdown.
    """
    driver_id = driver_id.upper()
    constructor_id = constructor_id.lower()
    circuit_type = circuit_type.lower()
    
    # Get base scales
    reliability_coeff = self.constructor_reliability.get(constructor_id, 0.90)
    crash_coeff = self.driver_crash_factors.get(driver_id, 1.0)
    
    # 1. Setup Weibull parameters
    # Scale parameter lambda: average laps to failure.
    # Base scale is 600 laps. High reliability increases it, high crash coefficient decreases it.
    scale_lambda = 600.0 * reliability_coeff / (0.8 + 0.2 * crash_coeff)
    
    # Shape parameter kappa: wear-out rate (kappa > 1 means failure rate increases over time)
    shape_kappa = 1.15
    
    # 2. Adjust for circuit type
    # Street circuits have higher collision rates, which lowers scale lambda.
    if circuit_type == "street_circuit":
      scale_lambda *= 0.82
      collision_bias = 0.65
    elif circuit_type == "low_downforce":
      scale_lambda *= 0.95
      collision_bias = 0.45
    else: # high_speed
      scale_lambda *= 1.0
      collision_bias = 0.50
      
    # 3. Adjust for grid position
    # Starting at the back (e.g. P18-P20) increases Lap 1 crash probability due to pack density.
    lap_1_drop = 0.0
    if grid_position > 15:
      lap_1_drop = 0.04 * crash_coeff
    elif grid_position > 8:
      lap_1_drop = 0.02 * crash_coeff
    else:
      lap_1_drop = 0.008 * crash_coeff

    # 4. Generate lap-by-lap survival curve S(t)
    survival_curve = []
    current_survival = 1.0 - lap_1_drop
    
    for lap in range(1, total_laps + 1):
      # Weibull survival formula S(t) = exp(-(t/lambda)^kappa)
      weibull_survival = math.exp(-((lap / scale_lambda) ** shape_kappa))
      # Apply initial drop offset
      lap_survival = (1.0 - lap_1_drop) * weibull_survival
      
      survival_curve.append({
        "lap": lap,
        "survival_probability": round(float(lap_survival), 4)
      })

    # DNF Probability is the complement of survival at the final lap
    final_survival = survival_curve[-1]["survival_probability"]
    dnf_prob = round(1.0 - final_survival, 4)

    # 5. Calculate failure breakdown categories
    # Collision vs Mechanical vs Other
    # Sauber / Alpine have higher mechanical risk; Haas / Magnussen have higher collision risk
    base_mech = 0.40 * (2.0 - reliability_coeff)
    base_coll = 0.45 * crash_coeff * (1.2 if circuit_type == "street_circuit" else 1.0)
    
    total_breakdown = base_mech + base_coll + 0.15
    mech_pct = base_mech / total_breakdown
    coll_pct = base_coll / total_breakdown
    other_pct = 0.15 / total_breakdown
    
    # 6. Risk Level classification
    if dnf_prob < 0.06:
      risk_level = "LOW"
    elif dnf_prob < 0.12:
      risk_level = "MEDIUM"
    elif dnf_prob < 0.22:
      risk_level = "HIGH"
    else:
      risk_level = "CRITICAL"

    return {
      "driver_id": driver_id,
      "constructor_id": constructor_id,
      "dnf_probability": dnf_prob,
      "risk_level": risk_level,
      "dnf_type_breakdown": {
        "mechanical": round(mech_pct * 100, 1),
        "collision": round(coll_pct * 100, 1),
        "other": round(other_pct * 100, 1)
      },
      "survival_curve": survival_curve
    }

  def train(self, historical_results: List[Dict[str, Any]]):
    """
    Train/update reliability factors based on historical DNF records.
    """
    if len(historical_results) < 5:
      raise ValueError("Insufficient training results (minimum 5 required).")
    
    # Process training records to adjust driver/constructor risk coefficients slightly
    for record in historical_results:
      driver_id = record.get("driver_id", "").upper()
      constructor_id = record.get("constructor_id", "").lower()
      status = record.get("status", "").upper()
      
      if not driver_id or not constructor_id:
        continue
        
      # If they crashed, increase their driver crash factor slightly
      if "COLLISION" in status or "ACCIDENT" in status or "SPUN" in status:
        if driver_id in self.driver_crash_factors:
          self.driver_crash_factors[driver_id] = min(2.5, self.driver_crash_factors[driver_id] + 0.05)
        else:
          self.driver_crash_factors[driver_id] = 1.05
      
      # If they had mechanical DNF, reduce team reliability coefficient slightly
      elif status != "CLASSIFIED" and status != "FINISHED":
        if constructor_id in self.constructor_reliability:
          self.constructor_reliability[constructor_id] = max(0.5, self.constructor_reliability[constructor_id] - 0.02)

