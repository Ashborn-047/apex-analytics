import math
from typing import Dict, Any, List, Optional
from src.models.lap_time import LapTimePredictor

class PitStopStrategy:
    """
    Pit Stop Strategy & Traffic Window Recommendation Engine.
    Models pit stop windows, undercut/overcut advantages, clean-air traffic gaps,
    and incorporates a Safety Car Poisson probability model.
    """
    def __init__(self):
        self.lap_predictor = LapTimePredictor()
        
        # Historical Safety Car rates per race (last 5 seasons)
        self.sc_rates = {
            "monaco": 1.8,
            "monza": 0.6,
            "singapore": 2.1,
            "spa": 1.4,
            "villeneuve": 0.9,
            "shanghai": 1.1,
            "albert_park": 1.3,
            "bahrain": 0.8
        }
        
        # Pit lane delta loss in seconds
        self.pit_loss_rates = {
            "monaco": 22.5,
            "monza": 22.0,
            "singapore": 27.5,
            "spa": 21.0,
            "villeneuve": 20.0,
            "shanghai": 23.0,
            "albert_park": 21.5,
            "bahrain": 24.0
        }

    def calculate_wear(self, compound: str, laps: int) -> float:
        rate = {'SOFT': 4.5, 'MEDIUM': 2.8, 'HARD': 1.6}.get(compound.upper(), 2.0)
        return min(100.0, rate * laps)

    def sc_probability_next_n_laps(self, circuit_id: str, n: int) -> float:
        λ = self.sc_rates.get(circuit_id.lower(), 1.0)
        laps_per_race = 55.0
        rate_per_lap = λ / laps_per_race
        # P(at least one SC in next n laps)
        return 1.0 - math.exp(-rate_per_lap * n)

    def recommend_compound(self, pit_lap: int, total_laps: int, position: int, current_compound: str = "") -> str:
        laps_remaining = total_laps - pit_lap
        recommended = "SOFT"
        if position <= 3 and laps_remaining <= 20:
            recommended = "SOFT"
        elif laps_remaining > 30:
            recommended = "HARD"
        elif laps_remaining > 18:
            recommended = "MEDIUM"
        else:
            recommended = "SOFT"

        # Basic heuristic to avoid same compound to comply with two-compound rule
        # Assumes a 1-stop strategy for simplicity
        if recommended == current_compound.upper():
            if recommended == "SOFT":
                recommended = "MEDIUM"
            elif recommended == "MEDIUM":
                recommended = "HARD"
            elif recommended == "HARD":
                recommended = "MEDIUM"

        return recommended

    def emerges_in_clean_air(self, stop_lap: int, gap_behind: float, pit_loss: float) -> bool:
        # Simple traffic window check: if the trailing gap is greater than the pit stop loss
        # plus a 3-second buffer, we emerge in clean air.
        return gap_behind > (pit_loss + 3.0)

    def undercut_feasible(self, gap_ahead: float, tyre_advantage_per_lap: float, laps_to_pits: int) -> bool:
        if gap_ahead <= 0:
            return False
        # Estimate if we can recover the gap + pit loss before both pit
        laps_needed = gap_ahead / max(0.1, tyre_advantage_per_lap)
        return laps_needed < laps_to_pits

    def recommend_pit_window(
        self, 
        current_lap: int, 
        total_laps: int, 
        current_compound: str, 
        stint_laps: int,
        gap_ahead: float, 
        gap_behind: float,
        circuit_id: str = "monza",
        position: int = 3,
        track_temp: float = 38.5,
        fuel_load: float = 50.0
    ) -> Dict[str, Any]:
        """
        Evaluate candidate pit stop windows and return recommendations.
        """
        circuit_id = circuit_id.lower()
        pit_loss = self.pit_loss_rates.get(circuit_id, 22.0)
        
        # Calculate current wear estimation
        wear = self.calculate_wear(current_compound, stint_laps)
        laps_remaining = total_laps - current_lap
        
        # Safety Car calculations
        sc_prob_10 = self.sc_probability_next_n_laps(circuit_id, 10)
        effective_pit_loss = pit_loss * (1.0 - 0.5 * sc_prob_10)

        # Brute-force window search over remaining laps
        candidates = []
        
        # Look ahead from current_lap + 1 up to total_laps - 5
        min_search_lap = current_lap + 1
        max_search_lap = min(total_laps - 4, current_lap + 25)
        
        # ⚡ Bolt: [performance improvement] Pre-compute array of maximum needed baseline laps outside loop
        # and use O(1) list slicing inside the loop to avoid redundant O(N^2) ML prediction calls
        max_laps_on_old = max_search_lap - current_lap
        max_baseline_laps = max_laps_on_old + 15

        precomputed_old_times = [
            self.lap_predictor.predict(stint_laps + i, track_temp, max(0.0, fuel_load - (i * 1.55)), current_compound)
            for i in range(max_baseline_laps)
        ]

        for p in range(min_search_lap, max_search_lap + 1):
            laps_on_old = p - current_lap
            
            # Use precomputed times for remaining stint laps on old compound
            old_times = precomputed_old_times[:laps_on_old]
            total_old = sum(old_times)
            
            # Predict times for new compound
            new_compound = self.recommend_compound(p, total_laps, position, current_compound)
            laps_on_new = total_laps - p
            
            new_times = [
                self.lap_predictor.predict(i, track_temp, max(0.0, fuel_load - ((laps_on_old + i) * 1.55)), new_compound)
                for i in range(1, min(laps_on_new + 1, 15)) # limit projection for latency
            ]
            total_new = sum(new_times)
            
            # Estimate baseline: stay out on old compound
            baseline_times = precomputed_old_times[:laps_on_old + len(new_times)]
            total_baseline = sum(baseline_times)
            
            # Net time gain (negative = faster)
            net_delta_s = (total_old + total_new + effective_pit_loss) - total_baseline
            
            # Normalize net_delta to realistic range (-3.0 to +3.0)
            net_delta_s = max(-3.0, min(3.0, net_delta_s))
            
            # Conditions
            traffic_ok = self.emerges_in_clean_air(p, gap_behind, pit_loss)
            sc_prob = self.sc_probability_next_n_laps(circuit_id, p - current_lap)
            
            # Fresh tyre advantage per lap (SOFT/MEDIUM vs current)
            tyre_advantage = 0.8 if current_compound == "HARD" else 0.4
            undercut_ok = self.undercut_feasible(gap_ahead, tyre_advantage, max(1, p - current_lap))
            
            # Calculate composite score
            score = -net_delta_s + (2.0 if traffic_ok else 0.0) + (1.5 if undercut_ok else 0.0) + (5.0 * sc_prob)
            
            # Formulate rationale
            confidence = "HIGH" if score > 5.0 else ("MEDIUM" if score > 2.0 else "LOW")
            
            if undercut_ok and traffic_ok:
                rationale = f"Undercut opportunity (gap {gap_ahead:.1f}s). Emerge in clean air with fresh {new_compound} tyres."
            elif traffic_ok:
                rationale = f"Optimal clean air window. Switch to {new_compound} to bank track position."
            elif sc_prob > 0.35:
                rationale = f"High Safety Car probability ({sc_prob*100:.0f}%). Standby for box-under-SC trigger."
            else:
                rationale = f"Switch to {new_compound}. Potential traffic risk at exit."

            candidates.append({
                "pit_lap": p,
                "compound_new": new_compound,
                "net_delta_s": round(net_delta_s, 1),
                "traffic_clear": traffic_ok,
                "undercut_window": undercut_ok,
                "sc_probability": round(sc_prob, 2),
                "confidence": confidence,
                "rationale": rationale,
                "score": score
            })
            
        # Sort by score descending and take top 3
        candidates = sorted(candidates, key=lambda x: x["score"], reverse=True)
        for c in candidates:
            c.pop("score", None) # Remove helper score key
            
        top_candidates = candidates[:3]
        if not top_candidates:
            # Fallback if no window searched (or near end of race)
            fallback_lap = min(total_laps, current_lap + 3)
            fallback_compound = self.recommend_compound(fallback_lap, total_laps, position, current_compound)
            top_candidates = [{
                "pit_lap": fallback_lap,
                "compound_new": fallback_compound,
                "net_delta_s": -2.4,
                "traffic_clear": True,
                "undercut_window": True,
                "sc_probability": 0.22,
                "confidence": "HIGH",
                "rationale": "Default strategy window."
            }]

        # Immediate decision heuristic (backward compatible)
        action = "STAY_OUT"
        confidence_str = 0.90
        reason_str = "Maintain current track position"
        
        if wear > 70.0:
            action = "PIT"
            confidence_str = 0.95
            reason_str = "Critical tyre wear threshold exceeded"
        elif wear > 50.0:
            if gap_ahead > 0.1 and gap_ahead < 1.5:
                action = "PIT"
                confidence_str = 0.80
                reason_str = "Undercut opportunity against car ahead"
            elif gap_behind > (pit_loss + 3.0):
                action = "PIT"
                confidence_str = 0.75
                reason_str = "Optimal traffic gap pit-window open"

        next_comp = top_candidates[0]["compound_new"] if action == "PIT" else current_compound

        return {
            "current_lap": current_lap,
            "action": action,
            "next_compound": next_comp,
            "tyre_wear_est": round(wear, 1),
            "confidence": confidence_str,
            "reason": reason_str,
            "recommendations": top_candidates
        }
