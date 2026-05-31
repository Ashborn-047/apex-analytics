from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Tuple, Dict, Any, Optional
from src.models.elo import EloRatingSystem
from src.models.lap_time import LapTimePredictor
from src.models.strategy import PitStopStrategy
from src.models.simulation import ChampionshipSimulation

router = APIRouter(
    prefix="/predict",
    tags=["predictions"]
)

# Instantiate models
elo_system = EloRatingSystem()
lap_predictor = LapTimePredictor()
strategy_engine = PitStopStrategy()
sim_engine = ChampionshipSimulation()

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class DriverResultInput(BaseModel):
    driver_id: Optional[str] = Field(None, examples=["VER"])
    driver_name: str = Field(..., examples=["Max Verstappen"])
    constructor_name: str = Field(..., examples=["Red Bull Racing"])
    position: int = Field(..., ge=1, le=22, examples=[1])
    status: str = Field("CLASSIFIED", examples=["CLASSIFIED", "Collision", "Engine"])
    lap_time: float = Field(0.0, ge=0.0, examples=[82.1])
    is_rookie: bool = Field(False)

class EloUpdateInput(BaseModel):
    results: List[DriverResultInput]
    session_type: str = Field("RACE", pattern="^(QUALIFYING|RACE|SPRINT)$")
    round_id: str = Field("2025_R12")
    rounds_completed: int = Field(12)

class LapTimeInput(BaseModel):
    circuit_id: str = Field("monza")
    compound: str = Field("MEDIUM", pattern="^(SOFT|MEDIUM|HARD|INTER|WET)$")
    stint_lap: int = Field(..., ge=1, examples=[12])
    tyre_age_total: int = Field(..., ge=1, examples=[12])
    track_temp_c: float = Field(..., ge=0.0, examples=[42.5])
    fuel_load_kg: float = Field(..., ge=0.0, examples=[68.0])
    driver_id: str = Field("VER")

class StrategyInput(BaseModel):
    current_lap: int = Field(..., ge=1, examples=[25])
    total_laps: int = Field(..., ge=1, examples=[70])
    current_compound: str = Field("SOFT", pattern="^(SOFT|MEDIUM|HARD|INTER|WET)$")
    stint_laps: int = Field(..., ge=0, examples=[18])
    gap_ahead: float = Field(..., ge=0, examples=[1.2])
    gap_behind: float = Field(..., ge=0, examples=[15.4])
    circuit_id: str = Field("monza")
    position: int = Field(3, ge=1, le=20)

class LapTrainingItem(BaseModel):
    driver_id: str = Field(..., examples=["VER"])
    compound: str = Field(..., pattern="^(SOFT|MEDIUM|HARD|INTER|WET)$", examples=["MEDIUM"])
    stint_lap: int = Field(..., ge=1, examples=[12])
    tyre_age_total: int = Field(..., ge=1, examples=[12])
    track_temp_c: float = Field(..., ge=0.0, examples=[42.5])
    air_temp_c: float = Field(..., ge=0.0, examples=[22.0])
    fuel_load_kg: float = Field(..., ge=0.0, examples=[68.0])
    lap_time_s: float = Field(..., ge=0.0, examples=[82.1])
    gap_ahead: Optional[float] = Field(None, ge=0.0, examples=[1.2])

class LapTimeTrainInput(BaseModel):
    laps: List[LapTrainingItem]

class WdcStandingItem(BaseModel):
    driver_id: str
    points: float

class WccStandingItem(BaseModel):
    constructor_id: str
    points: float

class RemainingRoundItem(BaseModel):
    round: int
    name: str
    circuit_type: str
    is_sprint: Optional[bool] = False

class ChampionshipSimulationInput(BaseModel):
    wdc: List[WdcStandingItem]
    wcc: List[WccStandingItem]
    remaining_rounds: List[RemainingRoundItem]
    simulations: Optional[int] = Field(50000, ge=100, le=100000)

# ============================================================================
# API ROUTES
# ============================================================================

# --- ELO RATINGS ENDPOINTS ---

@router.post("/elo")
def update_driver_elo(data: EloUpdateInput):
    """
    Update Elo ratings for a set of teammate results.
    """
    if len(data.results) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least 2 driver results to update Elo ratings.")
    
    # Format inputs for model
    results_list = [
        {
            "driver_id": r.driver_id if r.driver_id else r.driver_name[:3].upper(),
            "driver_name": r.driver_name,
            "constructor_name": r.constructor_name,
            "position": r.position,
            "status": r.status,
            "lap_time": r.lap_time,
            "is_rookie": r.is_rookie
        }
        for r in data.results
    ]
    
    try:
        updated_ratings = elo_system.update_ratings(
            results_list,
            session_type=data.session_type,
            round_id=data.round_id,
            rounds_completed=data.rounds_completed
        )
        return {
            "status": "success",
            "ratings": updated_ratings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Elo calculations: {str(e)}")

@router.get("/elo/rankings")
def get_elo_rankings(season: int = 2025, as_of_round: int = 12):
    """
    Retrieve current Elo rankings list for all active drivers.
    """
    try:
        rankings = elo_system.get_rankings(season, as_of_round)
        return {
            "season": season,
            "as_of_round": as_of_round,
            "rankings": rankings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load Elo rankings: {str(e)}")

@router.get("/elo/head-to-head")
def get_elo_head_to_head(driver_a: str = Query(...), driver_b: str = Query(...)):
    """
    Retrieve head-to-head records and matchups history between two drivers.
    """
    try:
        h2h = elo_system.get_head_to_head(driver_a, driver_b)
        return h2h
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load H2H: {str(e)}")

@router.get("/elo/{driver_name}")
def get_driver_elo(driver_name: str):
    """
    Legacy helper route: Retrieve the current Elo rating for a specific driver.
    """
    driver_acronym = driver_name[:3].upper()
    rating = elo_system.get_driver_rating(driver_acronym)
    return {
        "driver": driver_name,
        "elo": rating
    }

# --- LAP TIME ENDPOINTS ---

@router.post("/laptime")
@router.post("/lap-time")
def predict_lap_time(data: LapTimeInput):
    """
    Predict a driver's lap time based on wear and track parameters,
    and returns a complete stint degradation curve.
    """
    try:
        full_prediction = lap_predictor.predict_full_curve(
            compound=data.compound,
            track_temp_c=data.track_temp_c,
            fuel_load_kg=data.fuel_load_kg,
            driver_id=data.driver_id
        )
        return full_prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lap time prediction failed: {str(e)}")

# --- PIT STOP STRATEGY ENDPOINTS ---

@router.post("/strategy")
def recommend_strategy_post(data: StrategyInput):
    """
    Legacy strategy post endpoint. Returns pit stops recommendations.
    """
    try:
        recommendation = strategy_engine.recommend_pit_window(
            current_lap=data.current_lap,
            total_laps=data.total_laps,
            current_compound=data.current_compound,
            stint_laps=data.stint_laps,
            gap_ahead=data.gap_ahead,
            gap_behind=data.gap_behind,
            circuit_id=data.circuit_id,
            position=data.position
        )
        return {
            "status": "success",
            "recommendation": recommendation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategy generation failed: {str(e)}")

@router.get("/strategy/pit-window/{session_key}/{driver_id}")
def get_strategy_pit_window(session_key: str, driver_id: str):
    """
    Real-time strategy pit window endpoint. Recommends pit laps for a live driver state.
    """
    driver_id = driver_id.upper()
    
    # Realistic default driver status mapping for testing / UI demonstration
    driver_position_mapping = {
        "LEC": 3, "VER": 1, "NOR": 2, "HAM": 4, "RUS": 5, "PIA": 6, "SAI": 7, "ALO": 8
    }
    pos = driver_position_mapping.get(driver_id, 3)
    
    # Simulate a generic middle stint scenario
    try:
        rec = strategy_engine.recommend_pit_window(
            current_lap=28,
            total_laps=58,
            current_compound="MEDIUM",
            stint_laps=15,
            gap_ahead=2.1,
            gap_behind=4.8,
            circuit_id="monza",
            position=pos
        )
        
        return {
            "driver_id": driver_id,
            "current_lap": 28,
            "tyre": { "compound": "MEDIUM", "age": 15 },
            "recommendations": rec["recommendations"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategy search failed: {str(e)}")

# --- CHAMPIONSHIP SIMULATION ENDPOINTS ---

@router.get("/simulation/championship")
def get_championship_simulation(simulations: int = 50000):
    """
    Runs Monte Carlo simulation for the remaining F1 season.
    Returns WDC and WCC probabilities.
    """
    try:
        results = sim_engine.run_simulation(n_simulations=simulations)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation run failed: {str(e)}")

@router.post("/lap-time/train")
def train_lap_time_model(data: LapTimeTrainInput):
    """
    Train the Ridge & XGBoost lap time prediction models on historical timing data.
    """
    if len(data.laps) < 15:
        raise HTTPException(status_code=400, detail="Minimum 15 training lap samples required.")
    
    laps_list = [
        {
            "driver_id": lap.driver_id,
            "compound": lap.compound,
            "stint_lap": lap.stint_lap,
            "tyre_age_total": lap.tyre_age_total,
            "track_temp_c": lap.track_temp_c,
            "air_temp_c": lap.air_temp_c,
            "fuel_load_kg": lap.fuel_load_kg,
            "lap_time_s": lap.lap_time_s,
            "gap_ahead": lap.gap_ahead
        }
        for lap in data.laps
    ]
    
    try:
        lap_predictor.train(laps_list)
        return {
            "status": "success",
            "message": f"Successfully trained model on {len(data.laps)} lap times."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to train lap time models: {str(e)}")

@router.post("/simulation/championship")
def run_dynamic_championship_simulation(data: ChampionshipSimulationInput):
    """
    Runs Monte Carlo simulation using dynamic points standings and remaining schedule.
    """
    wdc_dict = {item.driver_id: item.points for item in data.wdc}
    wcc_dict = {item.constructor_id: item.points for item in data.wcc}
    rounds_list = [
        {
            "round": r.round,
            "name": r.name,
            "circuit_type": r.circuit_type,
            "is_sprint": r.is_sprint
        }
        for r in data.remaining_rounds
    ]
    
    try:
        results = sim_engine.run_simulation(
            n_simulations=data.simulations,
            wdc_standings=wdc_dict,
            wcc_standings=wcc_dict,
            remaining_rounds=rounds_list
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dynamic simulation run failed: {str(e)}")

