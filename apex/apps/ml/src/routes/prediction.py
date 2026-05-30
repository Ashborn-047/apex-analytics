from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Tuple, Dict, Any, Optional
from src.models.elo import EloRatingSystem
from src.models.lap_time import LapTimePredictor
from src.models.strategy import PitStopStrategy

router = APIRouter(
    prefix="/predict",
    tags=["predictions"]
)

# Instantiate models
elo_system = EloRatingSystem()
lap_predictor = LapTimePredictor()
strategy_engine = PitStopStrategy()

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class DriverResultInput(BaseModel):
    driver_name: str = Field(..., examples=["Max Verstappen"])
    constructor_name: str = Field(..., examples=["Red Bull Racing"])
    position: int = Field(..., ge=1, le=20, examples=[1])

class EloUpdateInput(BaseModel):
    results: List[DriverResultInput]

class LapTimeInput(BaseModel):
    tyre_age: int = Field(..., ge=0, examples=[5])
    track_temp: float = Field(..., ge=0, examples=[38.5])
    fuel_load: float = Field(..., ge=0, examples=[50.0])
    compound: str = Field(..., regex="^(SOFT|MEDIUM|HARD|INTERMEDIATE|WET)$", examples=["MEDIUM"])

class StrategyInput(BaseModel):
    current_lap: int = Field(..., ge=1, examples=[25])
    total_laps: int = Field(..., ge=1, examples=[70])
    current_compound: str = Field(..., regex="^(SOFT|MEDIUM|HARD|INTERMEDIATE|WET)$", examples=["SOFT"])
    stint_laps: int = Field(..., ge=0, examples=[18])
    gap_ahead: float = Field(..., ge=0, examples=[1.2])
    gap_behind: float = Field(..., ge=0, examples=[15.4])

# ============================================================================
# API ROUTES
# ============================================================================

@router.post("/elo")
def update_driver_elo(data: EloUpdateInput):
    """
    Update Elo ratings for a set of race results.
    """
    if len(data.results) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least 2 driver results to update Elo ratings.")
    
    # Format inputs for model
    results_list = [(r.driver_name, r.constructor_name, r.position) for r in data.results]
    
    try:
        updated_ratings = elo_system.update_ratings(results_list)
        return {
            "status": "success",
            "ratings": updated_ratings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Elo calculations: {str(e)}")

@router.get("/elo/{driver_name}")
def get_driver_elo(driver_name: str):
    """
    Retrieve the current Elo rating for a specific driver.
    """
    rating = elo_system.get_driver_rating(driver_name)
    return {
        "driver": driver_name,
        "elo": rating
    }

@router.post("/laptime")
def predict_lap_time(data: LapTimeInput):
    """
    Predict a driver's lap time based on wear and track parameters.
    """
    try:
        predicted_time = lap_predictor.predict(
            tyre_age=data.tyre_age,
            track_temp=data.track_temp,
            fuel_load=data.fuel_load,
            compound=data.compound
        )
        return {
            "predicted_laptime_sec": round(predicted_time, 3),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lap time prediction failed: {str(e)}")

@router.post("/strategy")
def recommend_strategy(data: StrategyInput):
    """
    Generate real-time pit strategy recommendations.
    """
    try:
        recommendation = strategy_engine.recommend_pit_window(
            current_lap=data.current_lap,
            total_laps=data.total_laps,
            current_compound=data.current_compound,
            stint_laps=data.stint_laps,
            gap_ahead=data.gap_ahead,
            gap_behind=data.gap_behind
        )
        return {
            "status": "success",
            "recommendation": recommendation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategy generation failed: {str(e)}")
