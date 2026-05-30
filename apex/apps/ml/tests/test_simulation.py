import pytest
from src.models.simulation import ChampionshipSimulation

def test_championship_simulation_initialization():
    sim = ChampionshipSimulation()
    assert sim.wdc_standings["VER"] == 287
    assert sim.wcc_standings["mclaren"] == 403
    assert len(sim.remaining_rounds) == 12

def test_mathematical_elimination_check():
    sim = ChampionshipSimulation()
    # Runs 100 simulations to get results
    res = sim.run_simulation(n_simulations=100)
    
    # Verify metadata
    assert res["as_of_round"] == 12
    assert res["total_rounds"] == 24
    assert res["simulations_run"] == 100
    
    # Check driver structures
    drivers_list = res["wdc"]
    assert len(drivers_list) > 0
    
    # Max points leader has as of R12: 287. Max remaining rounds: 12. Max points/round: 26. Max sprint points: 24.
    # Max achievable points is current + 336.
    # Verstappen has 287 + 336 = 623.
    ver_driver = next(d for d in drivers_list if d["driver_id"] == "VER")
    assert ver_driver["max_possible_points"] == 623
    assert not ver_driver["eliminated"]
    
    # Drivers with very low starting points (e.g. ZHO: 0 points)
    # ZHO max possible points = 0 + 336 = 336.
    # Leader VER currently has 287 points, which is less than 336, so ZHO is not mathematically eliminated yet.
    # But let's verify someone whose max possible is less than current leader points if we manually set standings.
    sim.wdc_standings = {"VER": 400, "ZHO": 10}
    res_custom = sim.run_simulation(n_simulations=10)
    zho_driver = next(d for d in res_custom["wdc"] if d["driver_id"] == "ZHO")
    assert zho_driver["max_possible_points"] == 10 + 336 # 346
    # 346 is less than leader's starting points (400), so ZHO must be marked as eliminated!
    assert zho_driver["eliminated"]

def test_wdc_wcc_probabilities_distribution():
    sim = ChampionshipSimulation()
    # Run a small batch of 1000 simulations
    res = sim.run_simulation(n_simulations=1000)
    
    # Probabilities should sum to 1.0 (approximately due to float calculations)
    sum_wdc_probs = sum(d["championship_probability"] for d in res["wdc"])
    assert pytest.approx(sum_wdc_probs) == 1.0
    
    sum_wcc_probs = sum(c["championship_probability"] for c in res["wcc"])
    assert pytest.approx(sum_wcc_probs) == 1.0
    
    # Top drivers/teams in standings should have higher probabilities
    ver_prob = next(d["championship_probability"] for d in res["wdc"] if d["driver_id"] == "VER")
    nor_prob = next(d["championship_probability"] for d in res["wdc"] if d["driver_id"] == "NOR")
    zho_prob = next(d["championship_probability"] for d in res["wdc"] if d["driver_id"] == "ZHO")
    
    assert ver_prob > zho_prob
    assert nor_prob > zho_prob
    
    # Constructor checks
    mcl_prob = next(c["championship_probability"] for c in res["wcc"] if c["constructor_id"] == "mclaren")
    sauber_prob = next(c["championship_probability"] for c in res["wcc"] if c["constructor_id"] == "sauber")
    assert mcl_prob > sauber_prob
