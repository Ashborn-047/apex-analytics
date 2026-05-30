import numpy as np
from typing import Dict, Any, List

class PitStopStrategy:
    """
    Pit Stop Strategy Recommendation Engine.
    Models pit windows and tyre compound paths using wear coefficients
    and gap analysis.
    """
    def __init__(self):
        # Average wear coefficient per lap for different dry tyre compounds (in %)
        self.wear_rates = {
            'SOFT': 4.5,
            'MEDIUM': 2.8,
            'HARD': 1.6
        }
        self.pit_loss_seconds = 22.0  # Time lost in pit lane (entry + stop + exit delta)

    def calculate_wear(self, compound: str, laps: int) -> float:
        """
        Estimate tyre wear percentage based on compound and stint laps.
        """
        rate = self.wear_rates.get(compound.upper(), 2.0)
        return min(100.0, rate * laps)

    def recommend_pit_window(
        self, 
        current_lap: int, 
        total_laps: int, 
        current_compound: str, 
        stint_laps: int,
        gap_ahead: float, 
        gap_behind: float
    ) -> Dict[str, Any]:
        """
        Determine if the driver should pit or stay out, and suggest the next tyre.
        """
        wear = self.calculate_wear(current_compound, stint_laps)
        laps_remaining = total_laps - current_lap
        
        # Decide next tyre based on laps remaining
        if laps_remaining <= 15:
            next_compound = 'SOFT'
        elif laps_remaining <= 35:
            next_compound = 'MEDIUM'
        else:
            next_compound = 'HARD'

        # Basic decision heuristic:
        # Pit if tyre wear is high (>65%) or if there's a clear window in traffic
        action = "STAY_OUT"
        confidence = 0.9

        if wear > 70.0:
            action = "PIT"
            confidence = 0.95
        elif wear > 50.0:
            # Undercut opportunity: if we are within 1.5s of the car ahead,
            # pitting early can yield a performance advantage on fresh tyres
            if gap_ahead > 0.1 and gap_ahead < 1.5:
                action = "PIT"
                confidence = 0.8
            # Traffic check: check if pitting puts us in a clean window
            # (e.g. we emerge in a gap larger than 5 seconds)
            elif gap_behind > 22.0:
                action = "PIT"
                confidence = 0.75

        # If we have very few laps remaining, don't pit unless forced by flat/extreme wear
        if laps_remaining <= 3 and wear < 90.0:
            action = "STAY_OUT"
            confidence = 0.99

        return {
            "current_lap": current_lap,
            "action": action,
            "next_compound": next_compound if action == "PIT" else current_compound,
            "tyre_wear_est": wear,
            "confidence": confidence,
            "reason": (
                "Critical tyre wear threshold exceeded" if wear > 70.0 else
                "Undercut opportunity against car ahead" if action == "PIT" and gap_ahead < 1.5 else
                "Optimal traffic gap pit-window open" if action == "PIT" else
                "Maintain current track position"
            )
        }
