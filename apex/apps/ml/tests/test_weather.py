import pytest
from src.models.weather import WeatherImpactModel

def test_weather_impact_initialization():
  model = WeatherImpactModel()
  # Verify wet skill multipliers of top wet-weather drivers
  assert model.wet_weather_multipliers["HAM"] == 1.09
  assert model.wet_weather_multipliers["VER"] == 1.08
  assert model.wet_weather_multipliers["SAR"] == 0.85

def test_temperature_and_wind_deltas():
  model = WeatherImpactModel()
  
  # Perfect conditions (optimal temp, no wind, no rain)
  dry_res = model.calculate_impact(
    track_temp_c=32.0,
    air_temp_c=25.0,
    humidity=45.0,
    rain_probability=0.0,
    wind_speed_kmh=10.0
  )
  assert dry_res["lap_time_delta_s"] == 0.0
  assert dry_res["compound_recommendation"] == "MEDIUM"
  assert dry_res["risk_assessment"] == "SAFE"

  # Extreme hot track temp (50°C) with high wind
  hot_res = model.calculate_impact(
    track_temp_c=50.0,
    air_temp_c=32.0,
    humidity=40.0,
    rain_probability=0.0,
    wind_speed_kmh=35.0
  )
  # Temp loss: (50 - 38) * 0.04 = 0.48s
  # Wind loss: (35 - 15) * 0.015 = 0.3s
  # Total delta = 0.78s
  assert hot_res["lap_time_delta_s"] == 0.78
  assert hot_res["details"]["temperature_impact_s"] == 0.48
  assert hot_res["details"]["wind_drag_impact_s"] == 0.30

def test_rain_crossover_tyres():
  model = WeatherImpactModel()
  
  # Intermediate rain probability (40%)
  inter_res = model.calculate_impact(
    track_temp_c=25.0,
    air_temp_c=20.0,
    humidity=75.0,
    rain_probability=0.40,
    wind_speed_kmh=10.0
  )
  assert inter_res["compound_recommendation"] == "INTER"
  assert inter_res["risk_assessment"] == "CAUTION"
  assert inter_res["switch_probability"] > 0.50

  # Heavy rain probability (80%)
  wet_res = model.calculate_impact(
    track_temp_c=20.0,
    air_temp_c=18.0,
    humidity=90.0,
    rain_probability=0.80,
    wind_speed_kmh=10.0
  )
  assert wet_res["compound_recommendation"] == "WET"
  assert wet_res["risk_assessment"] == "DANGEROUS"
  assert wet_res["switch_probability"] == 0.95

def test_driver_wet_rankings():
  model = WeatherImpactModel()
  rankings = model.get_wet_rankings()
  
  assert len(rankings) == 20
  # Hamilton should lead wet weather skill rankings
  assert rankings[0]["driver_id"] == "HAM"
  # Coefficients should be sorted descending
  for i in range(len(rankings) - 1):
    assert rankings[i]["wet_coefficient"] >= rankings[i+1]["wet_coefficient"]
    assert rankings[i]["wet_skill_rating"] >= rankings[i+1]["wet_skill_rating"]
