import pytest
from src.models.race_outcome import RaceOutcomePredictor

def test_race_outcome_initialization():
  model = RaceOutcomePredictor()
  assert model.is_trained is False
  assert model.model is None
  assert model.points_table[1] == 25
  assert model.points_table[10] == 1

def test_calculate_outcome_basic():
  model = RaceOutcomePredictor()
  res = model.calculate_outcome(
    grid_position=1,
    driver_elo=1800.0,
    driver_form=85.0,
    teammate_elo=1750.0,
    circuit_type="high_speed",
    constructor_affinity=1.0
  )
  
  assert "expected_position" in res
  assert "predicted_position" in res
  assert "podium_probability" in res
  assert "points_expected" in res
  assert "position_probabilities" in res
  
  # For starting P1, expected position should be low (e.g., around 1-3)
  assert res["expected_position"] < 3.0
  assert res["predicted_position"] in range(1, 4)
  assert res["podium_probability"] > 0.5
  assert res["points_expected"] > 10.0
  assert len(res["position_probabilities"]) == 10

def test_calculate_outcome_elo_and_form_influence():
  model = RaceOutcomePredictor()
  
  # High Elo, high Form driver starting P5
  best_res = model.calculate_outcome(
    grid_position=5,
    driver_elo=1900.0,
    driver_form=95.0,
    teammate_elo=1700.0,
    circuit_type="high_speed",
    constructor_affinity=1.0
  )
  
  # Low Elo, low Form driver starting P5
  worst_res = model.calculate_outcome(
    grid_position=5,
    driver_elo=1500.0,
    driver_form=60.0,
    teammate_elo=1700.0,
    circuit_type="high_speed",
    constructor_affinity=1.0
  )
  
  assert best_res["expected_position"] < worst_res["expected_position"]
  assert best_res["podium_probability"] > worst_res["podium_probability"]
  assert best_res["points_expected"] > worst_res["points_expected"]

def test_race_outcome_training():
  model = RaceOutcomePredictor()
  
  dummy_history = [
    {
      "grid_position": 1,
      "driver_elo": 1800.0,
      "driver_form": 85.0,
      "teammate_elo": 1750.0,
      "constructor_affinity": 1.0,
      "finish_position": 1
    }
  ] * 10 # 10 records to satisfy length requirement
  
  model.train(dummy_history)
  assert model.is_trained is True
