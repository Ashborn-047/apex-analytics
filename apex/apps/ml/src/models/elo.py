import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional

import json
import os
import pathlib

class EloRatingSystem:
    """
    Teammate-Weighted Elo Rating System for F1 Drivers.
    Isolates driver skill from car performance using same-car matchups,
    continuous qualifying outcomes, K-factor scheduling, and DNF classification.
    """
    def __init__(self, base_rating: float = 1500.0):
        self.base_rating = base_rating
        self.history: Dict[str, Dict[str, float]] = {}
        
        self.state_file = pathlib.Path(__file__).parent.parent.parent / "data" / "elo_state.json"
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Will be populated dynamically or from disk
        self.ratings: Dict[str, float] = {}
        self.uncertainties: Dict[str, float] = {}
        self.recent_deltas: Dict[str, List[float]] = {}
        self.h2h_records: Dict[Tuple[str, str], Dict[str, int]] = {}
        self.matchups_history: List[Dict[str, Any]] = []

        # Driver metadata mapping (Can remain as lookup fallback)
        self.driver_names = {
            "ANT": "Kimi Antonelli", "VER": "Max Verstappen", "NOR": "Lando Norris",
            "LEC": "Charles Leclerc", "HAM": "Lewis Hamilton", "RUS": "George Russell",
            "PIA": "Oscar Piastri", "SAI": "Carlos Sainz", "ALO": "Fernando Alonso",
            "PER": "Sergio Perez", "STR": "Lance Stroll", "GAS": "Pierre Gasly",
            "OCO": "Esteban Ocon", "ALB": "Alexander Albon", "SAR": "Logan Sargeant",
            "TSU": "Yuki Tsunoda", "RIC": "Daniel Ricciardo", "HUL": "Nico Hulkenberg",
            "MAG": "Kevin Magnussen", "BOT": "Valtteri Bottas", "ZHO": "Guanyu Zhou"
        }
        
        self.teams = {
            "VER": "Red Bull Racing", "PER": "Red Bull Racing",
            "NOR": "McLaren", "PIA": "McLaren",
            "LEC": "Ferrari", "HAM": "Ferrari",
            "RUS": "Mercedes", "ANT": "Mercedes",
            "ALO": "Aston Martin", "STR": "Aston Martin",
            "GAS": "Alpine", "OCO": "Alpine",
            "ALB": "Williams", "SAI": "Williams", "SAR": "Williams",
            "TSU": "RB", "RIC": "RB",
            "HUL": "Haas", "MAG": "Haas",
            "BOT": "Kick Sauber", "ZHO": "Kick Sauber"
        }

        self.team_colors = {
            "Red Bull Racing": "#1e3a8a", "McLaren": "#ea580c", "Ferrari": "#dc2626",
            "Mercedes": "#047857", "Aston Martin": "#065f46", "Alpine": "#2563eb",
            "Williams": "#0284c7", "RB": "#4f46e5", "Haas": "#475569", "Kick Sauber": "#16a34a"
        }

        self.nationalities = {
            "ANT": "🇮🇹", "VER": "🇳🇱", "NOR": "🇬🇧", "LEC": "🇲🇨", "HAM": "🇬🇧", "RUS": "🇬🇧",
            "PIA": "🇦🇺", "SAI": "🇪🇸", "ALO": "🇪🇸", "PER": "🇲🇽", "STR": "🇨🇦", "GAS": "🇫🇷",
            "OCO": "🇫🇷", "ALB": "🇹🇭", "SAR": "🇺🇸", "TSU": "🇯🇵", "RIC": "🇦🇺", "HUL": "🇩🇪",
            "MAG": "🇩🇰", "BOT": "🇫🇮", "ZHO": "🇨🇳"
        }

        self.load_state()

    def save_state(self):
        state = {
            "ratings": self.ratings,
            "uncertainties": self.uncertainties,
            "recent_deltas": self.recent_deltas,
            "h2h_records": {f"{k[0]}-{k[1]}": v for k, v in self.h2h_records.items()},
            "matchups_history": self.matchups_history,
            "history": self.history
        }
        with open(self.state_file, "w") as f:
            json.dump(state, f)

    def load_state(self):
        if self.state_file.exists():
            with open(self.state_file, "r") as f:
                state = json.load(f)
            self.ratings = state.get("ratings", {})
            self.uncertainties = state.get("uncertainties", {})
            self.recent_deltas = state.get("recent_deltas", {})
            self.history = state.get("history", {})
            
            raw_h2h = state.get("h2h_records", {})
            self.h2h_records = {tuple(k.split("-")): v for k, v in raw_h2h.items()}
            self.matchups_history = state.get("matchups_history", [])

    def get_driver_rating(self, driver_id: str) -> float:
        return self.ratings.get(driver_id, self.base_rating)

    def get_expected_score(self, rating_a: float, rating_b: float) -> float:
        return 1.0 / (1.0 + 10.0 ** ((rating_b - rating_a) / 400.0))

    def k_factor(self, session_type: str, rounds_completed: int, is_rookie: bool = False) -> float:
        base = {"QUALIFYING": 32.0, "RACE": 40.0, "SPRINT": 20.0}.get(session_type.upper(), 32.0)
        decay = max(0.6, 1.0 - 0.015 * rounds_completed)
        multiplier = 1.3 if is_rookie and rounds_completed <= 6 else 1.0
        return base * decay * multiplier

    def classify_dnf(self, status: str) -> str:
        mechanical_codes = {"Engine", "Gearbox", "Hydraulics", "Power Unit", "Suspension", "Brakes", "Clutch", "Electrical", "Mechanical"}
        if status in mechanical_codes:
            return "MECHANICAL"
        if "Collision" in status or "Accident" in status or "Spun" in status:
            return "DRIVER_ERROR"
        return "CLASSIFIED"

    def get_rankings(self, season: int = 2025, as_of_round: int = 12) -> List[Dict[str, Any]]:
        ratings_to_use = self.ratings
        season_history = {k: v for k, v in self.history.items() if k.startswith(f"{season}_")}
        if season_history:
            best_round_id = None
            best_round_num = -1
            for rid in season_history:
                try:
                    r_num = int(rid.split("_R")[-1])
                    if r_num <= as_of_round and r_num > best_round_num:
                        best_round_num = r_num
                        best_round_id = rid
                except Exception:
                    pass
            if best_round_id:
                ratings_to_use = season_history[best_round_id]

        rankings_list = []
        for d_id, rating in ratings_to_use.items():
            team = self.teams.get(d_id, "Unknown")
            color = self.team_colors.get(team, "#cccccc")
            nationality = self.nationalities.get(d_id, "🏳️")
            
            # Find teammate (restrict to those currently rated to avoid old reserve drivers)
            teammate = None
            for other_id, other_team in self.teams.items():
                if other_team == team and other_id != d_id and other_id in ratings_to_use:
                    teammate = other_id
                    break
            
            h2h = {"wins": 0, "losses": 0, "ties": 0}
            if teammate:
                key = tuple(sorted([d_id, teammate]))
                if key in self.h2h_records:
                    rec = self.h2h_records[key]
                    if key[0] == d_id:
                        h2h = rec
                    else:
                        h2h = {"wins": rec["losses"], "losses": rec["wins"], "ties": rec["ties"]}
            
            total_matches = sum(h2h.values())
            quali_dominance = round((h2h["wins"] / total_matches * 100), 1) if total_matches > 0 else 50.0
            trend = sum(self.recent_deltas.get(d_id, [0.0])[-5:])
            # Elo history for sparkline
            driver_history = []
            season_rounds = sorted(
                [rk for rk in self.history.keys() if rk.startswith(f"{season}_R")],
                key=lambda x: int(x.split("_R")[-1])
            )
            for rk in season_rounds:
                round_num = int(rk.split("_R")[-1])
                if round_num <= as_of_round:
                    driver_history.append({
                        "round": round_num,
                        "elo": round(self.history[rk].get(d_id, rating), 1)
                    })
            if not driver_history:
                driver_history = [{"round": 0, "elo": round(rating, 1)}]

            rankings_list.append({
                "driver_id": d_id,
                "driver_name": self.driver_names.get(d_id, d_id),
                "team": team,
                "team_color": color,
                "nationality_flag": nationality,
                "elo_rating": round(rating, 1),
                "uncertainty": round(self.uncertainties.get(d_id, 20.0), 1),
                "trend_5_rounds": round(trend, 1),
                "h2h_record": h2h,
                "quali_dominance_pct": quali_dominance,
                "history": driver_history
            })
            
        # Sort descending
        return sorted(rankings_list, key=lambda x: x["elo_rating"], reverse=True)

    def get_head_to_head(self, driver_a: str, driver_b: str) -> Dict[str, Any]:
        driver_a = driver_a.upper()
        driver_b = driver_b.upper()
        
        # Filter matchups history
        matchups = [m for m in self.matchups_history if 
                    (m["driver_a"] == driver_a and m["driver_b"] == driver_b) or
                    (m["driver_a"] == driver_b and m["driver_b"] == driver_a)]
        
        formatted_matchups = []
        for m in matchups:
            is_a_first = m["driver_a"] == driver_a
            formatted_matchups.append({
                "round": m["round"],
                "session": m["session"],
                "winner": m["winner"],
                "delta_pct": m["delta_pct"],
                "rating_change_a": m["rating_change_a"] if is_a_first else m["rating_change_b"],
                "rating_change_b": m["rating_change_b"] if is_a_first else m["rating_change_a"]
            })
            
        key = tuple(sorted([driver_a, driver_b]))
        rec = self.h2h_records.get(key, {"wins": 0, "losses": 0, "ties": 0})
        
        # Format summary for driver_a vs driver_b
        if key[0] == driver_a:
            summary = {"a_wins": rec["wins"], "b_wins": rec["losses"], "ties": rec["ties"]}
        else:
            summary = {"a_wins": rec["losses"], "b_wins": rec["wins"], "ties": rec["ties"]}
            
        avg_quali_delta = 0.0
        quali_matchups = [m for m in formatted_matchups if m["session"] == "QUALIFYING"]
        if quali_matchups:
            avg_quali_delta = float(np.mean([abs(m["delta_pct"]) for m in quali_matchups]))

        summary["avg_quali_delta_pct"] = round(avg_quali_delta, 3)
        
        return {
            "driver_a": driver_a,
            "driver_b": driver_b,
            "matchups": formatted_matchups,
            "summary": summary
        }

    def update_ratings(self, results: List[Dict[str, Any]], session_type: str = "RACE", round_id: str = "2025_R12", rounds_completed: int = 12) -> Dict[str, float]:
        """
        results is a list of dicts: [
            {"driver_id": "VER", "constructor_name": "Red Bull Racing", "position": 1, "status": "CLASSIFIED", "lap_time": 82.1, "is_rookie": False},
            ...
        ]
        """
        # Ensure we don't process the same round/session twice
        if any(m.get("round") == round_id and m.get("session") == session_type for m in self.matchups_history):
            return self.ratings

        # Auto-initialize any unknown drivers in the ratings system
        for r in results:
            d_id = r["driver_id"]
            if d_id not in self.ratings:
                self.ratings[d_id] = self.base_rating
            if d_id not in self.uncertainties:
                self.uncertainties[d_id] = 20.0
            if d_id not in self.recent_deltas:
                self.recent_deltas[d_id] = []
            if d_id not in self.driver_names:
                self.driver_names[d_id] = r.get("driver_name", d_id)
            if d_id not in self.teams:
                self.teams[d_id] = r.get("constructor_name", "Unknown")
            if d_id not in self.nationalities:
                self.nationalities[d_id] = "🏳️"
            if r.get("constructor_name", "Unknown") not in self.team_colors:
                self.team_colors[r.get("constructor_name", "Unknown")] = "#cccccc"

        df = pd.DataFrame(results)
        if len(df) < 2:
            return self.ratings

        # Generate pairwise updates for same-car teammates
        updates = {d: 0.0 for d in df["driver_id"]}
        
        # Group by team / constructor to isolate teammate head-to-head
        grouped = df.groupby("constructor_name")
        for const, group in grouped:
            if len(group) < 2:
                continue
            
            # Usually 2 drivers, but handles sub cases too
            drivers_in_team = group.to_dict(orient="records")
            for i in range(len(drivers_in_team)):
                for j in range(i + 1, len(drivers_in_team)):
                    da = drivers_in_team[i]
                    db = drivers_in_team[j]
                    
                    id_a, id_b = da["driver_id"], db["driver_id"]
                    r_a = self.get_driver_rating(id_a)
                    r_b = self.get_driver_rating(id_b)
                    
                    # Expected scores
                    exp_a = self.get_expected_score(r_a, r_b)
                    exp_b = 1.0 - exp_a
                    
                    # Classify DNFs
                    dnf_a = self.classify_dnf(da.get("status", "CLASSIFIED"))
                    dnf_b = self.classify_dnf(db.get("status", "CLASSIFIED"))
                    
                    # Weight selection
                    weight = 1.0
                    if session_type.upper() == "QUALIFYING":
                        weight = 1.00
                    else:
                        # Race scenarios
                        if dnf_a == "MECHANICAL" or dnf_b == "MECHANICAL":
                            weight = 0.20
                        elif dnf_a == "DRIVER_ERROR" or dnf_b == "DRIVER_ERROR":
                            weight = 0.50
                        else:
                            weight = 0.80  # standard race finish (same strategy assumed)
                    
                    # Skip mutual mechanical DNFs
                    if dnf_a == "MECHANICAL" and dnf_b == "MECHANICAL":
                        continue
                        
                    # Calculate actual outcome
                    score_a, score_b = 0.5, 0.5
                    delta_pct = 0.0
                    
                    if session_type.upper() == "QUALIFYING":
                        lap_a = da.get("lap_time", 0.0)
                        lap_b = db.get("lap_time", 0.0)

                        if lap_a > 0 and lap_b > 0:
                            delta_pct = (lap_b - lap_a) / lap_b * 100
                            # Map continuous qualifying outcome via sigmoid
                            score_a = 1.0 / (1.0 + np.exp(-delta_pct * 8.0))
                            score_b = 1.0 - score_a
                        elif lap_a > 0 and lap_b <= 0:
                            score_a, score_b = 1.0, 0.0
                        elif lap_a <= 0 and lap_b > 0:
                            score_a, score_b = 0.0, 1.0
                        else:
                            score_a, score_b = 0.5, 0.5
                    else:
                        # Race points or positions
                        pos_a = da.get("position", 20)
                        pos_b = db.get("position", 20)
                        
                        # Mechanical DNF vs Classified
                        if dnf_a == "MECHANICAL":
                            score_a, score_b = 0.0, 1.0
                        elif dnf_b == "MECHANICAL":
                            score_a, score_b = 1.0, 0.0
                        else:
                            if pos_a < pos_b:
                                score_a, score_b = 1.0, 0.0
                            elif pos_a > pos_b:
                                score_a, score_b = 0.0, 1.0
                                
                    # Calculate K-factor
                    k_a = self.k_factor(session_type, rounds_completed, da.get("is_rookie", False))
                    k_b = self.k_factor(session_type, rounds_completed, db.get("is_rookie", False))
                    
                    # Rating change
                    delta_a = k_a * weight * (score_a - exp_a)
                    delta_b = k_b * weight * (score_b - exp_b)
                    
                    updates[id_a] += delta_a
                    updates[id_b] += delta_b
                    
                    # Update H2H records
                    key = tuple(sorted([id_a, id_b]))
                    if key not in self.h2h_records:
                        self.h2h_records[key] = {"wins": 0, "losses": 0, "ties": 0}
                        
                    if score_a > 0.5:
                        if key[0] == id_a:
                            self.h2h_records[key]["wins"] += 1
                        else:
                            self.h2h_records[key]["losses"] += 1
                    elif score_a < 0.5:
                        if key[0] == id_a:
                            self.h2h_records[key]["losses"] += 1
                        else:
                            self.h2h_records[key]["wins"] += 1
                    else:
                        self.h2h_records[key]["ties"] += 1
                        
                    # Save to matchups history
                    self.matchups_history.append({
                        "round": round_id,
                        "session": session_type,
                        "driver_a": id_a,
                        "driver_b": id_b,
                        "winner": id_a if score_a > 0.5 else (id_b if score_a < 0.5 else "TIE"),
                        "delta_pct": round(delta_pct, 4),
                        "rating_change_a": round(delta_a, 2),
                        "rating_change_b": round(delta_b, 2)
                    })

        # Apply updates and recalculate uncertainty
        for d_id, delta in updates.items():
            old_r = self.ratings[d_id]
            self.ratings[d_id] = old_r + delta
            
            # Record delta for trend
            if d_id not in self.recent_deltas:
                self.recent_deltas[d_id] = []
            self.recent_deltas[d_id].append(delta)
            
            # Uncertainty
            recent = self.recent_deltas[d_id][-10:]
            self.uncertainties[d_id] = max(10.0, float(np.std(recent) * 4.0 if len(recent) > 1 else 20.0))

        # Save snapshot
        self.history[round_id] = self.ratings.copy()
        
        # Save to disk
        self.save_state()

        return self.ratings
