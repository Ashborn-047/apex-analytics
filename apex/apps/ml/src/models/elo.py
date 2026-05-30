import pandas as pd
from typing import Dict, List, Tuple

class EloRatingSystem:
    """
    Elo Rating System for F1 Drivers.
    Dynamically calculates ratings based on head-to-head race finishes,
    adjusted for constructor (car) performance ratings.
    """
    def __init__(self, base_k: float = 32.0, base_rating: float = 1500.0):
        self.base_k = base_k
        self.base_rating = base_rating
        self.driver_ratings: Dict[str, float] = {}
        self.constructor_ratings: Dict[str, float] = {}

    def get_driver_rating(self, driver_name: str) -> float:
        return self.driver_ratings.get(driver_name, self.base_rating)

    def get_expected_score(self, rating_a: float, rating_b: float) -> float:
        """
        Calculate expected score of driver A against driver B.
        """
        return 1.0 / (1.0 + 10.0 ** ((rating_b - rating_a) / 400.0))

    def update_ratings(self, race_results: List[Tuple[str, str, int]]) -> Dict[str, float]:
        """
        Processes a list of race finishes for head-to-head updates.
        Args:
            race_results: A list of tuples containing (driver_name, constructor_name, finish_position)
        Returns:
            Dict mapping driver_name to updated Elo rating.
        """
        df = pd.DataFrame(race_results, columns=['driver', 'constructor', 'position']).sort_values('position')
        
        # Calculate pairwise updates for all driver head-to-head matchups in the session
        num_drivers = len(df)
        if num_drivers < 2:
            return self.driver_ratings

        updates = {row['driver']: 0.0 for _, row in df.iterrows()}
        
        for i in range(num_drivers):
            for j in range(i + 1, num_drivers):
                driver_i = df.iloc[i]['driver']
                driver_j = df.iloc[j]['driver']
                
                pos_i = df.iloc[i]['position']
                pos_j = df.iloc[j]['position']
                
                # Retrieve current Elo ratings
                rating_i = self.get_driver_rating(driver_i)
                rating_j = self.get_driver_rating(driver_j)
                
                # Calculate expectations
                exp_i = self.get_expected_score(rating_i, rating_j)
                exp_j = 1.0 - exp_i
                
                # Determine outcome (1.0 = win, 0.0 = loss, 0.5 = draw)
                if pos_i < pos_j:
                    score_i, score_j = 1.0, 0.0
                elif pos_i > pos_j:
                    score_i, score_j = 0.0, 1.0
                else:
                    score_i, score_j = 0.5, 0.5
                
                # Scale K based on relative ranking or DNF rates in future improvements
                k = self.base_k / (num_drivers - 1)  # Normalize across field size
                
                updates[driver_i] += k * (score_i - exp_i)
                updates[driver_j] += k * (score_j - exp_j)

        # Apply updates
        for driver, delta in updates.items():
            self.driver_ratings[driver] = self.get_driver_rating(driver) + delta

        return self.driver_ratings
