import pytest
from src.models.driver_form import DriverFormIndex

def test_driver_form_initialization():
  model = DriverFormIndex()
  # Verify starting form index of top drivers
  assert model.form_indices["VER"] == 96.0
  assert model.form_indices["NOR"] == 92.0
  assert model.form_indices["SAR"] == 45.0
  assert len(model.history["VER"]) == 3

def test_get_form_and_trends():
  model = DriverFormIndex()
  
  # Base query
  form_ver = model.get_form("VER")
  assert form_ver["driver_id"] == "VER"
  assert form_ver["form_index"] == 96.0
  assert form_ver["form_trend"] == "IMPROVING" # History defaults are [92.0, 94.0, 96.0]
  assert form_ver["consistency_score"] == 83.7 # Calculated SD offset
  assert form_ver["pace_delta_vs_teammate"] == -0.28 # Verstappen vs Perez

def test_update_form_score():
  model = DriverFormIndex()
  
  # Simulate a bad session for Verstappen
  # Expected finish is 2.2. If he finishes 15th, form index should drop.
  old_index = model.form_indices["VER"]
  bad_lap_times = [88.0, 92.5, 91.0, 95.0, 89.0] # High variance -> low consistency
  
  new_index = model.update_form(
    driver_id="VER",
    lap_times=bad_lap_times,
    qual_pos=12,
    finish_pos=15,
    expected_finish_pos=2.2
  )
  
  # Index should decrease due to EWMA smoothing factor
  assert new_index < old_index
  
  # Trend should shift towards DECLINING
  form_updated = model.get_form("VER")
  assert form_updated["form_trend"] == "DECLINING"

def test_driver_form_rankings():
  model = DriverFormIndex()
  rankings = model.get_rankings()
  
  assert len(rankings) == 20
  # Verstappen should be ranked P1 based on initial form settings
  assert rankings[0]["driver_id"] == "VER"
  # Form indices should be in descending order
  for i in range(len(rankings) - 1):
    assert rankings[i]["form_index"] >= rankings[i+1]["form_index"]
