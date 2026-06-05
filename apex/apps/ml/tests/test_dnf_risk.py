import pytest
from src.models.dnf_risk import DNFRiskPredictor

def test_dnf_risk_initialization():
  model = DNFRiskPredictor()
  assert model.constructor_reliability["red_bull"] == 1.0
  assert model.driver_crash_factors["ALO"] == 0.75
  assert model.driver_crash_factors["SAR"] == 1.8

def test_calculate_risk_basic():
  model = DNFRiskPredictor()
  res = model.calculate_risk(
    driver_id="VER",
    constructor_id="red_bull",
    circuit_type="high_speed",
    total_laps=53,
    grid_position=1
  )
  
  assert res["driver_id"] == "VER"
  assert "dnf_probability" in res
  assert "risk_level" in res
  assert "dnf_type_breakdown" in res
  assert "survival_curve" in res
  assert len(res["survival_curve"]) == 53
  
  # Check survival curve monotonicity
  for i in range(1, len(res["survival_curve"])):
    assert res["survival_curve"][i]["survival_probability"] <= res["survival_curve"][i-1]["survival_probability"]

def test_constructor_reliability_impact():
  model = DNFRiskPredictor()
  
  rb_res = model.calculate_risk("VER", "red_bull", "high_speed", 53, 5)
  sauber_res = model.calculate_risk("BOT", "sauber", "high_speed", 53, 5)
  
  # Sauber is less reliable -> higher DNF probability
  assert rb_res["dnf_probability"] < sauber_res["dnf_probability"]
  assert rb_res["dnf_type_breakdown"]["mechanical"] < sauber_res["dnf_type_breakdown"]["mechanical"]

def test_driver_crash_impact():
  model = DNFRiskPredictor()
  
  alonso_res = model.calculate_risk("ALO", "aston_martin", "high_speed", 53, 5)
  sargeant_res = model.calculate_risk("SAR", "williams", "high_speed", 53, 5)
  
  # Sargeant crashes more -> higher DNF probability and collision risk
  assert alonso_res["dnf_probability"] < sargeant_res["dnf_probability"]
  assert alonso_res["dnf_type_breakdown"]["collision"] < sargeant_res["dnf_type_breakdown"]["collision"]

def test_circuit_type_impact():
  model = DNFRiskPredictor()
  
  street_res = model.calculate_risk("VER", "red_bull", "street_circuit", 53, 5)
  speed_res = model.calculate_risk("VER", "red_bull", "high_speed", 53, 5)
  
  # Street circuit -> higher DNF risk
  assert street_res["dnf_probability"] > speed_res["dnf_probability"]

def test_grid_position_impact():
  model = DNFRiskPredictor()
  
  p1_res = model.calculate_risk("VER", "red_bull", "high_speed", 53, 1)
  p20_res = model.calculate_risk("VER", "red_bull", "high_speed", 53, 20)
  
  # Back of grid has higher lap 1 collision risk
  assert p1_res["dnf_probability"] < p20_res["dnf_probability"]

def test_dnf_risk_training():
  model = DNFRiskPredictor()
  
  # Verify crash factors change after training
  original_factor = model.driver_crash_factors["VER"]
  
  # Train with collision DNF records for VER
  dummy_history = [
    {"driver_id": "VER", "constructor_id": "red_bull", "status": "Collision"},
    {"driver_id": "VER", "constructor_id": "red_bull", "status": "Spun Off"},
    {"driver_id": "VER", "constructor_id": "red_bull", "status": "Accident"},
    {"driver_id": "VER", "constructor_id": "red_bull", "status": "Collision"},
    {"driver_id": "VER", "constructor_id": "red_bull", "status": "Accident"}
  ]
  
  model.train(dummy_history)
  
  assert model.driver_crash_factors["VER"] > original_factor
