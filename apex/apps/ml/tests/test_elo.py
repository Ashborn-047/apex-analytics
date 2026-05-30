import pytest
from src.models.elo import EloRatingSystem

def test_elo_initial_state():
    sys = EloRatingSystem()
    assert sys.get_driver_rating("VER") == 1847.0
    assert sys.get_driver_rating("NOR") == 1791.0
    assert sys.get_driver_rating("UNKNOWN") == 1500.0

def test_elo_expectation_math():
    sys = EloRatingSystem()
    # If ratings are identical, expected score should be 0.5
    assert pytest.approx(sys.get_expected_score(1500.0, 1500.0)) == 0.5
    # Higher rating should have higher expectation
    assert sys.get_expected_score(1600.0, 1500.0) > 0.5
    assert sys.get_expected_score(1400.0, 1500.0) < 0.5

def test_k_factor_decay():
    sys = EloRatingSystem()
    # K factor should decay over the season
    k_early = sys.k_factor("RACE", rounds_completed=1)
    k_mid = sys.k_factor("RACE", rounds_completed=12)
    k_late = sys.k_factor("RACE", rounds_completed=22)
    assert k_early > k_mid > k_late
    # Check bounds
    assert k_late >= 40.0 * 0.6 # Base RACE is 40.0, min decay is 0.6

def test_k_factor_rookie():
    sys = EloRatingSystem()
    # Rookie should get 1.3x multiplier in first 6 rounds
    k_rookie = sys.k_factor("RACE", rounds_completed=3, is_rookie=True)
    k_normal = sys.k_factor("RACE", rounds_completed=3, is_rookie=False)
    assert pytest.approx(k_rookie) == k_normal * 1.3
    
    # Rookie multiplier expired after round 6
    k_rookie_late = sys.k_factor("RACE", rounds_completed=8, is_rookie=True)
    k_normal_late = sys.k_factor("RACE", rounds_completed=8, is_rookie=False)
    assert k_rookie_late == k_normal_late

def test_dnf_classification():
    sys = EloRatingSystem()
    assert sys.classify_dnf("Engine") == "MECHANICAL"
    assert sys.classify_dnf("Gearbox") == "MECHANICAL"
    assert sys.classify_dnf("Collision") == "DRIVER_ERROR"
    assert sys.classify_dnf("Accident") == "DRIVER_ERROR"
    assert sys.classify_dnf("Finished") == "CLASSIFIED"

def test_elo_update_race():
    sys = EloRatingSystem()
    # Let's override starting ratings for testing
    sys.ratings = {"A": 1600.0, "B": 1500.0}
    sys.teams = {"A": "Red Bull Racing", "B": "Red Bull Racing"}
    
    # Session update (A beats B)
    results = [
        {"driver_id": "A", "constructor_name": "Red Bull Racing", "position": 1, "status": "CLASSIFIED", "is_rookie": False},
        {"driver_id": "B", "constructor_name": "Red Bull Racing", "position": 2, "status": "CLASSIFIED", "is_rookie": False}
    ]
    
    sys.update_ratings(results, session_type="RACE", round_id="2025_R01", rounds_completed=1)
    
    # A beats B, so A's rating should rise, B's should fall
    assert sys.ratings["A"] > 1600.0
    assert sys.ratings["B"] < 1500.0
    
    # Verify conservation of rating delta (equal and opposite if same K/weights)
    delta_a = sys.ratings["A"] - 1600.0
    delta_b = 1500.0 - sys.ratings["B"]
    assert pytest.approx(delta_a) == delta_b

def test_elo_update_qualifying_continuous():
    sys = EloRatingSystem()
    sys.ratings = {"A": 1500.0, "B": 1500.0}
    sys.teams = {"A": "Red Bull Racing", "B": "Red Bull Racing"}
    
    # Case 1: Large qualifying gap delta
    results_large = [
        {"driver_id": "A", "constructor_name": "Red Bull Racing", "position": 1, "status": "CLASSIFIED", "lap_time": 80.0, "is_rookie": False},
        {"driver_id": "B", "constructor_name": "Red Bull Racing", "position": 2, "status": "CLASSIFIED", "lap_time": 82.0, "is_rookie": False} # A is 2.5% faster
    ]
    sys.update_ratings(results_large, session_type="QUALIFYING", round_id="2025_R01", rounds_completed=1)
    rating_a_large = sys.ratings["A"]
    
    # Reset
    sys.ratings = {"A": 1500.0, "B": 1500.0}
    sys.h2h_records = {}
    
    # Case 2: Narrow qualifying gap delta
    results_narrow = [
        {"driver_id": "A", "constructor_name": "Red Bull Racing", "position": 1, "status": "CLASSIFIED", "lap_time": 80.0, "is_rookie": False},
        {"driver_id": "B", "constructor_name": "Red Bull Racing", "position": 2, "status": "CLASSIFIED", "lap_time": 80.1, "is_rookie": False} # A is only 0.125% faster
    ]
    sys.update_ratings(results_narrow, session_type="QUALIFYING", round_id="2025_R01", rounds_completed=1)
    rating_a_narrow = sys.ratings["A"]
    
    # Large gap should yield higher rating increase than narrow gap due to continuous outcomes
    assert rating_a_large > rating_a_narrow

def test_mechanical_dnf_exclusion():
    sys = EloRatingSystem()
    sys.ratings = {"A": 1600.0, "B": 1500.0}
    sys.teams = {"A": "Red Bull Racing", "B": "Red Bull Racing"}
    
    # Mechanical DNF for A should downweight the update significantly (weight = 0.2)
    results = [
        {"driver_id": "A", "constructor_name": "Red Bull Racing", "position": 20, "status": "Engine", "is_rookie": False},
        {"driver_id": "B", "constructor_name": "Red Bull Racing", "position": 2, "status": "CLASSIFIED", "is_rookie": False}
    ]
    
    sys.update_ratings(results, session_type="RACE", round_id="2025_R01", rounds_completed=1)
    
    # Normally, A losing from 1600 to 1500 would drop a lot.
    # With mechanical DNF weight = 0.2, the rating drop should be small.
    delta = 1600.0 - sys.ratings["A"]
    # Max drop for full weight is around K=40 * (0 - Expected) = 40 * -0.64 = -25.6
    # With weight = 0.2, drop is 0.2 * -25.6 = -5.12.
    assert delta < 6.0
