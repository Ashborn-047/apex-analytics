import pytest
from src.models.qualifying import QualifyingPredictor

def test_qualifying_initialization():
  model = QualifyingPredictor()
  assert model.is_trained is False
  assert model.model is None
  assert model.constructor_quali_base["red_bull"] == 2.5
  assert model.track_base_times["monza"] == 80.0

def test_predict_qualifying_basic():
  model = QualifyingPredictor()
  res = model.predict_qualifying(
    driver_id="VER",
    constructor_id="red_bull",
    circuit_id="monza",
    circuit_type="high_speed",
    track_temp_c=30.0,
    air_temp_c=22.0
  )
  
  assert res["driver_id"] == "VER"
  assert res["constructor_id"] == "red_bull"
  assert "predicted_position" in res
  assert "expected_position" in res
  assert "expected_lap_time_s" in res
  assert "q3_probability" in res
  assert "pole_probability" in res
  
  # For VER in Red Bull, predicted position should be low
  assert res["expected_position"] < 3.0
  assert res["predicted_position"] in range(1, 4)
  assert res["q3_probability"] > 0.8
  assert res["pole_probability"] > 0.2

def test_track_temp_impact():
  model = QualifyingPredictor()
  
  # Optimal temp (30°C)
  opt_res = model.predict_qualifying("VER", "red_bull", "monza", "high_speed", 30.0, 22.0)
  # Extremely high temp (45°C)
  hot_res = model.predict_qualifying("VER", "red_bull", "monza", "high_speed", 45.0, 32.0)
  
  # Extreme heat should degrade qualifying lap times
  assert opt_res["expected_lap_time_s"] < hot_res["expected_lap_time_s"]

def test_qualifying_training():
  model = QualifyingPredictor()
  
  dummy_history = [
    {
      "constructor_quali_base": 2.5,
      "driver_offset": -1.8,
      "track_temp_c": 30.0,
      "air_temp_c": 22.0,
      "qualifying_position": 1
    }
  ] * 10
  
  model.train(dummy_history)
  assert model.is_trained is True
