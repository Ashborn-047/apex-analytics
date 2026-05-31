import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from sklearn.linear_model import Ridge
from sklearn.preprocessing import OneHotEncoder

try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = None

class LapTimePredictor:
    """
    ML Model to predict lap times and tyre degradation curves.
    Applies hardcoded physical fuel load offsets (-0.03s/kg) and
    detects tyre degradation cliffs via a 2-sigma rolling standard deviation deviation.
    """
    def __init__(self):
        self.ridge_model = Ridge(alpha=10.0)
        self.xgb_model = None
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.is_trained = False
        self.features = ['stint_lap', 'tyre_age_total', 'track_temp_c', 'air_temp_c']
        
        # Pre-fit encoder categories to support dry compounds
        self.encoder.fit([['SOFT'], ['MEDIUM'], ['HARD'], ['INTER'], ['WET']])
        
        # Physics-based constants
        self.fuel_penalty_s_per_kg = 0.03
        self.dirty_air_penalty_s = 0.3
        
        # Monza base lap times & degradation parameters for dry compounds (Analytical fallback)
        self.fallback_curves = {
            "SOFT": {
                "base_time": 80.8,
                "b1": 0.08, "b2": 0.015,
                "cliff_lap": 12, "cliff_severity": 0.28,
                "ci_width": 0.35
            },
            "MEDIUM": {
                "base_time": 81.65,
                "b1": 0.04, "b2": 0.005,
                "cliff_lap": 19, "cliff_severity": 0.18,
                "ci_width": 0.25
            },
            "HARD": {
                "base_time": 82.35,
                "b1": 0.02, "b2": 0.002,
                "cliff_lap": 28, "cliff_severity": 0.09,
                "ci_width": 0.20
            }
        }

    def detect_cliff(self, lap_times: List[float], window: int = 3) -> Optional[int]:
        if len(lap_times) < 8:
            return None
        deltas = np.diff(lap_times)
        rolling_mean = pd.Series(deltas).rolling(window).mean().values
        
        # Cliff = first lap where rolling degradation exceeds 2σ of baseline (first 6 laps)
        baseline = rolling_mean[window-1:window+5]
        if len(baseline) == 0:
            return None
        baseline_mean = np.mean(baseline)
        baseline_std = max(0.07, np.std(baseline))
        
        cliff_candidates = np.where(rolling_mean[window+5:] > baseline_mean + 2.0 * baseline_std)[0]
        if len(cliff_candidates) > 0:
            return int(cliff_candidates[0] + window + 5 + 2) # 1-indexed lap index
        return None

    def preprocess_features(self, df: pd.DataFrame, training: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        numeric_features = df[self.features].values
        compounds = df[['compound']].values
        encoded_compounds = self.encoder.transform(compounds)
        x = np.hstack([numeric_features, encoded_compounds])
        
        # Apply fuel load offset for training targets
        y = None
        if 'lap_time_s' in df.columns:
            # y_adjusted = raw_lap_time - fuel_load * 0.03
            y = df['lap_time_s'].values - (df['fuel_load_kg'].values * self.fuel_penalty_s_per_kg)
            
            # Apply dirty air traffic correction (-0.3s before training if gap_ahead < 1.5s)
            if 'gap_ahead' in df.columns:
                traffic_mask = df['gap_ahead'].values < 1.5
                y[traffic_mask] -= self.dirty_air_penalty_s
                
        return x, y

    def train(self, historical_laps: List[Dict[str, Any]]):
        if len(historical_laps) < 15:
            raise ValueError("Insufficient data points to train model (minimum 15 required).")
            
        df = pd.DataFrame(historical_laps)
        
        # Ensure fallback fields exist and handle None values
        if 'air_temp_c' not in df.columns:
            df['air_temp_c'] = 22.0
        else:
            df['air_temp_c'] = df['air_temp_c'].fillna(22.0)

        if 'gap_ahead' not in df.columns:
            df['gap_ahead'] = 5.0
        else:
            df['gap_ahead'] = df['gap_ahead'].fillna(5.0)
            
        x, y = self.preprocess_features(df, training=True)
        
        # Train Ridge model
        self.ridge_model.fit(x, y)
        
        # Train XGBoost model if available
        if XGBRegressor is not None:
            self.xgb_model = XGBRegressor(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.1,
                objective="reg:squarederror"
            )
            self.xgb_model.fit(x, y)
            
        self.is_trained = True

    def predict(self, tyre_age: int, track_temp: float, fuel_load: float, compound: str) -> float:
        """
        Calculates predicted lap time in seconds for a specific query.
        """
        compound = compound.upper()
        
        # Falling back to analytical model if not trained or if compound not in trained set
        if not self.is_trained:
            params = self.fallback_curves.get(compound, self.fallback_curves["MEDIUM"])
            base = params["base_time"]
            n = tyre_age
            
            # T(n) = base + b1*n + b2*n^2 + cliff(n)
            degrade = params["b1"] * n + params["b2"] * (n ** 2)
            cliff_lap = params["cliff_lap"]
            if n > cliff_lap:
                degrade += params["cliff_severity"] * (n - cliff_lap)
                
            # Add fuel load effect back: T_raw = T_adjusted + fuel_load * 0.03
            fuel_penalty = fuel_load * self.fuel_penalty_s_per_kg
            return base + degrade + fuel_penalty

        input_data = pd.DataFrame([{
            'stint_lap': tyre_age,
            'tyre_age_total': tyre_age,
            'track_temp_c': track_temp,
            'air_temp_c': 22.0,
            'compound': compound,
            'fuel_load_kg': fuel_load
        }])
        
        x, _ = self.preprocess_features(input_data, training=False)
        
        if self.xgb_model is not None:
            pred_adjusted = self.xgb_model.predict(x)[0]
        else:
            pred_adjusted = self.ridge_model.predict(x)[0]
            
        # Add fuel effect back
        return float(pred_adjusted + (fuel_load * self.fuel_penalty_s_per_kg))

    def predict_full_curve(self, compound: str, track_temp_c: float, fuel_load_kg: float, driver_id: str = "VER") -> Dict[str, Any]:
        """
        Predicts a full 25-lap stint degradation curve and reports cliff metrics.
        """
        compound = compound.upper()
        curve = []
        
        # Calculate times for laps 1 through 25
        for lap in range(1, 26):
            # Decrease fuel load dynamically over the stint (~1.55kg fuel burned per lap)
            current_fuel = max(0.0, fuel_load_kg - (lap - 1) * 1.55)
            lap_time = self.predict(tyre_age=lap, track_temp=track_temp_c, fuel_load=current_fuel, compound=compound)
            curve.append({
                "stint_lap": lap,
                "predicted_s": round(lap_time, 3)
            })
            
        times = [pt["predicted_s"] for pt in curve]
        cliff_lap = self.detect_cliff(times)
        
        # Confidence interval sizing
        params = self.fallback_curves.get(compound, self.fallback_curves["MEDIUM"])
        ci_width = params["ci_width"]
        
        predicted_lap_time = times[0]
        
        return {
            "predicted_lap_time_s": round(predicted_lap_time, 3),
            "confidence_interval": [round(predicted_lap_time - ci_width, 3), round(predicted_lap_time + ci_width, 3)],
            "degradation_curve": curve,
            "cliff_lap": cliff_lap or params["cliff_lap"],
            "cliff_severity_s_per_lap": params["cliff_severity"],
            "compound": compound,
            "circuit_id": "monza"
        }
