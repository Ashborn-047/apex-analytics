import pytest
import numpy as np
from src.models.lap_time import LapTimePredictor

def test_lap_time_predictor_initialization():
    pred = LapTimePredictor()
    assert not pred.is_trained
    assert pred.fuel_penalty_s_per_kg == 0.03
    assert pred.dirty_air_penalty_s == 0.3

def test_lap_time_analytic_prediction_fallback():
    pred = LapTimePredictor()
    # Test fallback predictions for dry compounds
    time_soft = pred.predict(tyre_age=1, track_temp=40.0, fuel_load=68.0, compound="SOFT")
    time_medium = pred.predict(tyre_age=1, track_temp=40.0, fuel_load=68.0, compound="MEDIUM")
    time_hard = pred.predict(tyre_age=1, track_temp=40.0, fuel_load=68.0, compound="HARD")
    
    # Soft should be faster than Medium, which is faster than Hard
    assert time_soft < time_medium < time_hard
    
    # Fuel load addition: higher fuel should mean slower lap time
    time_low_fuel = pred.predict(tyre_age=1, track_temp=40.0, fuel_load=10.0, compound="MEDIUM")
    time_high_fuel = pred.predict(tyre_age=1, track_temp=40.0, fuel_load=100.0, compound="MEDIUM")
    assert time_low_fuel < time_high_fuel
    # Exact fuel delta should be 90 * 0.03 = 2.7s
    assert pytest.approx(time_high_fuel - time_low_fuel) == 2.7

def test_cliff_detection_algorithm():
    pred = LapTimePredictor()
    
    # Stint lap times with a sharp cliff starting at lap 12
    # Baseline laps (1 to 11) have very small linear degradation
    laps_1_to_11 = [80.0 + 0.05 * i for i in range(11)]
    # Cliff starts: lap 12 is +0.5s, lap 13 is +1.0s, etc.
    cliff_laps = [laps_1_to_11[-1] + 0.5 * i for i in range(1, 10)]
    lap_times = laps_1_to_11 + cliff_laps
    
    cliff_lap = pred.detect_cliff(lap_times, window=3)
    assert cliff_lap == 12

def test_predict_full_curve():
    pred = LapTimePredictor()
    res = pred.predict_full_curve(compound="MEDIUM", track_temp_c=42.5, fuel_load_kg=68.0)
    
    assert res["compound"] == "MEDIUM"
    assert res["circuit_id"] == "monza"
    assert len(res["degradation_curve"]) == 40
    # Verify first stint lap predicted lap time matches the main output
    assert res["degradation_curve"][0]["predicted_s"] == res["predicted_lap_time_s"]
    assert res["cliff_lap"] in [23, 24] # Medium cliff shifted by VER tyre management factor (0.82)
