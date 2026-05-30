import pytest
from src.models.strategy import PitStopStrategy

def test_pit_strategy_initialization():
    strat = PitStopStrategy()
    assert "monza" in strat.sc_rates
    assert "monaco" in strat.pit_loss_rates

def test_sc_probability_poisson():
    strat = PitStopStrategy()
    
    # 0 laps ahead should yield 0 SC probability
    assert strat.sc_probability_next_n_laps("monza", 0) == 0.0
    
    # More laps should yield higher probability
    p_5 = strat.sc_probability_next_n_laps("monza", 5)
    p_15 = strat.sc_probability_next_n_laps("monza", 15)
    assert 0.0 < p_5 < p_15 < 1.0
    
    # Track with higher incident rate (Monaco) should have higher probability than Monza
    p_monza = strat.sc_probability_next_n_laps("monza", 10)
    p_monaco = strat.sc_probability_next_n_laps("monaco", 10)
    assert p_monaco > p_monza

def test_recommend_compound():
    strat = PitStopStrategy()
    # Fighting for lead with <20 laps should recommend SOFT
    assert strat.recommend_compound(pit_lap=40, total_laps=58, position=2) == "SOFT"
    # Long stint remaining should recommend HARD
    assert strat.recommend_compound(pit_lap=10, total_laps=58, position=5) == "HARD"
    # Mid-range stint remaining should recommend MEDIUM
    assert strat.recommend_compound(pit_lap=30, total_laps=58, position=5) == "MEDIUM"

def test_emerges_in_clean_air():
    strat = PitStopStrategy()
    pit_loss = 22.0
    # Clean air exit: gap behind is larger than pit loss + 3s buffer (25s)
    assert strat.emerges_in_clean_air(stop_lap=20, gap_behind=30.0, pit_loss=pit_loss)
    # Traffic risk: gap behind is less than pit loss + 3s
    assert not strat.emerges_in_clean_air(stop_lap=20, gap_behind=23.0, pit_loss=pit_loss)

def test_undercut_feasibility():
    strat = PitStopStrategy()
    # If gap is small (1.2s) and tyre advantage is high (0.8s/lap), undercut is feasible in 3 laps
    assert strat.undercut_feasible(gap_ahead=1.2, tyre_advantage_per_lap=0.8, laps_to_pits=3)
    # If gap is huge (10s) and tyre advantage is tiny (0.1s/lap), undercut is not feasible in 3 laps
    assert not strat.undercut_feasible(gap_ahead=10.0, tyre_advantage_per_lap=0.1, laps_to_pits=3)

def test_recommend_pit_window():
    strat = PitStopStrategy()
    res = strat.recommend_pit_window(
        current_lap=28,
        total_laps=58,
        current_compound="MEDIUM",
        stint_laps=15,
        gap_ahead=2.1,
        gap_behind=4.8,
        circuit_id="monza",
        position=3
    )
    
    assert res["current_lap"] == 28
    # Wear estimate: Medium is 2.8% per lap. 15 laps * 2.8% = 42%
    assert res["tyre_wear_est"] == 42.0
    
    # Recommendations should contain top candidates
    assert len(res["recommendations"]) > 0
    best_candidate = res["recommendations"][0]
    assert best_candidate["pit_lap"] > 28
    assert "net_delta_s" in best_candidate
    assert "compound_new" in best_candidate
    assert "rationale" in best_candidate
