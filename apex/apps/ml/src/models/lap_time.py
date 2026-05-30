import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.linear_model import Ridge
from sklearn.preprocessing import OneHotEncoder

class LapTimePredictor:
    """
    ML Model to predict lap times based on track conditions, tyre age,
    and compound choice. Utilizes Ridge regression with one-hot encoded compound features.
    """
    def __init__(self):
        self.model = Ridge(alpha=1.0)
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.is_trained = False
        self.features = ['tyre_age', 'track_temp', 'fuel_load']

    def preprocess_data(self, df: pd.DataFrame, training: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extract features and encode categorical variables.
        """
        # Ensure correct column formats
        numeric_features = df[self.features].values
        
        compounds = df[['compound']].values
        if training:
            encoded_compounds = self.encoder.fit_transform(compounds)
        else:
            encoded_compounds = self.encoder.transform(compounds)

        x = np.hstack([numeric_features, encoded_compounds])
        y = df['lap_time'].values if 'lap_time' in df.columns else None
        
        return x, y

    def train(self, historical_laps: List[Dict[str, Any]]):
        """
        Train the Ridge regression model using historical lap data.
        """
        if len(historical_laps) < 10:
            raise ValueError("Insufficient data points to train model (minimum 10 required).")

        df = pd.DataFrame(historical_laps)
        x, y = self.preprocess_data(df, training=True)
        self.model.fit(x, y)
        self.is_trained = True

    def predict(self, tyre_age: int, track_temp: float, fuel_load: float, compound: str) -> float:
        """
        Predict lap time in seconds for a specific set of parameters.
        """
        if not self.is_trained:
            # Simple baseline calculation if model is not trained yet (Montreal average baseline ~75s)
            baseline = 75.0
            compound_modifiers = {'SOFT': -0.8, 'MEDIUM': 0.0, 'HARD': 0.8, 'INTERMEDIATE': 4.5, 'WET': 9.0}
            modifier = compound_modifiers.get(compound.upper(), 0.0)
            return baseline + modifier + (tyre_age * 0.08) - (fuel_load * 0.03)

        input_data = pd.DataFrame([{
            'tyre_age': tyre_age,
            'track_temp': track_temp,
            'fuel_load': fuel_load,
            'compound': compound
        }])
        
        x, _ = self.preprocess_data(input_data, training=False)
        prediction = self.model.predict(x)
        return float(prediction[0])
