import random
import numpy as np
from datetime import datetime, timedelta
import json

class WearableSimulator:
    """Simulates data from popular fitness wearables like Apple Watch, Fitbit, Garmin"""
    
    def __init__(self):
        self.device_types = [
            "Apple Watch Series 9",
            "Fitbit Charge 6",
            "Garmin Forerunner 955",
            "Samsung Galaxy Watch 6",
            "Polar Vantage V3"
        ]
        
    def simulate_daily_activity(self, user_profile=None, date=None):
        """Simulate a full day of activity data"""
        if date is None:
            date = datetime.now().date()
        
        # Base values influenced by user fitness level
        fitness_multiplier = self.get_fitness_multiplier(user_profile)
        
        # Generate realistic daily metrics
        steps = random.randint(3000, 15000) * fitness_multiplier
        calories_burned = random.randint(1800, 3500) * fitness_multiplier
        active_minutes = random.randint(30, 180) * fitness_multiplier
        
        # Heart rate data
        resting_hr = random.randint(45, 80)
        max_hr = random.randint(160, 200)
        avg_hr = random.randint(resting_hr + 20, max_hr - 20)
        
        # Sleep data
        sleep_hours = random.uniform(6.0, 9.5)
        deep_sleep = sleep_hours * random.uniform(0.15, 0.25)
        rem_sleep = sleep_hours * random.uniform(0.20, 0.30)
        light_sleep = sleep_hours - deep_sleep - rem_sleep
        
        return {
            'date': date.isoformat(),
            'device': random.choice(self.device_types),
            'steps': int(steps),
            'calories_burned': int(calories_burned),
            'active_minutes': int(active_minutes),
            'distance_km': round(steps * 0.0008, 2),  # Rough conversion
            'heart_rate': {
                'resting': resting_hr,
                'average': avg_hr,
                'maximum': max_hr
            },
            'sleep': {
                'total_hours': round(sleep_hours, 1),
                'deep_sleep': round(deep_sleep, 1),
                'rem_sleep': round(rem_sleep, 1),
                'light_sleep': round(light_sleep, 1),
                'sleep_score': random.randint(65, 95)
            },
            'zones': {
                'fat_burn': random.randint(10, 60),
                'cardio': random.randint(5, 45),
                'peak': random.randint(0, 30)
            }
        }
    
    def simulate_workout_session(self, activity_type, duration_minutes, user_profile=None):
        """Simulate detailed workout session data"""
        fitness_multiplier = self.get_fitness_multiplier(user_profile)
        
        base_data = {
            'timestamp': datetime.now().isoformat(),
            'activity_type': activity_type,
            'duration_minutes': duration_minutes,
            'device': random.choice(self.device_types)
        }
        
        if activity_type == "Running":
            pace_base = random.uniform(5.0, 8.0)  # min/km
            distance = duration_minutes / pace_base
            
            workout_data = {
                **base_data,
                'distance_km': round(distance, 2),
                'average_pace': round(pace_base, 2),
                'calories_burned': int(duration_minutes * random.uniform(8, 15) * fitness_multiplier),
                'average_heart_rate': random.randint(140, 180),
                'max_heart_rate': random.randint(170, 200),
                'elevation_gain': random.randint(0, 200),
                'cadence': random.randint(160, 190),
                'splits': self.generate_running_splits(distance, pace_base),
                'heart_rate_zones': {
                    'zone_1': random.randint(5, 15),
                    'zone_2': random.randint(10, 30),
                    'zone_3': random.randint(10, 25),
                    'zone_4': random.randint(0, 20),
                    'zone_5': random.randint(0, 10)
                }
            }
            
        elif activity_type == "Swimming":
            distance = random.uniform(800, 2000)  # meters
            pace_per_100m = random.uniform(1.5, 3.0)  # min per 100m
            
            workout_data = {
                **base_data,
                'distance_m': int(distance),
                'average_pace_per_100m': round(pace_per_100m, 2),
                'calories_burned': int(duration_minutes * random.uniform(6, 12) * fitness_multiplier),
                'stroke_count': random.randint(1200, 2500),
                'pool_length': random.choice([25, 50]),
                'strokes': {
                    'freestyle': random.randint(60, 90),
                    'backstroke': random.randint(0, 30),
                    'breaststroke': random.randint(0, 20),
                    'butterfly': random.randint(0, 10)
                },
                'swolf_score': random.randint(35, 55)
            }
            
        elif activity_type == "Strength Training":
            workout_data = {
                **base_data,
                'calories_burned': int(duration_minutes * random.uniform(4, 8) * fitness_multiplier),
                'average_heart_rate': random.randint(100, 150),
                'max_heart_rate': random.randint(140, 180),
                'sets_completed': random.randint(12, 25),
                'estimated_volume': random.randint(3000, 8000),  # kg lifted
                'rest_periods': random.randint(8, 20),
                'muscle_groups': random.sample([
                    'chest', 'back', 'shoulders', 'biceps', 'triceps', 
                    'quads', 'hamstrings', 'glutes', 'core'
                ], random.randint(2, 5))
            }
        
        else:  # Generic workout
            workout_data = {
                **base_data,
                'calories_burned': int(duration_minutes * random.uniform(5, 10) * fitness_multiplier),
                'average_heart_rate': random.randint(120, 160),
                'max_heart_rate': random.randint(150, 185)
            }
        
        return workout_data
    
    def generate_running_splits(self, distance_km, average_pace):
        """Generate realistic split times for running"""
        splits = []
        km_count = int(distance_km)
        
        for i in range(km_count):
            # Add some variation to pace
            split_pace = average_pace + random.uniform(-0.3, 0.3)
            splits.append({
                'km': i + 1,
                'pace_min_per_km': round(split_pace, 2),
                'time_minutes': round(split_pace, 2)
            })
        
        # Add partial last kilometer if needed
        if distance_km > km_count:
            remaining_distance = distance_km - km_count
            split_pace = average_pace + random.uniform(-0.2, 0.2)
            splits.append({
                'km': f"{km_count + 1} (partial)",
                'pace_min_per_km': round(split_pace, 2),
                'time_minutes': round(split_pace * remaining_distance, 2)
            })
        
        return splits
    
    def get_fitness_multiplier(self, user_profile):
        """Adjust metrics based on user fitness level"""
        if not user_profile:
            return 1.0
        
        fitness_level = user_profile.get('fitness_level', 'Intermediate')
        multipliers = {
            'Beginner': 0.7,
            'Intermediate': 1.0,
            'Advanced': 1.3,
            'Elite': 1.6
        }
        return multipliers.get(fitness_level, 1.0)
    
    def simulate_historical_data(self, days=30, user_profile=None):
        """Generate historical daily activity data"""
        historical_data = []
        
        for i in range(days):
            date = datetime.now().date() - timedelta(days=days-i-1)
            daily_data = self.simulate_daily_activity(user_profile, date)
            
            # Add some workout sessions randomly
            if random.random() > 0.6:  # 40% chance of workout
                activity = random.choice(["Running", "Swimming", "Strength Training", "Cycling"])
                duration = random.randint(30, 90)
                workout = self.simulate_workout_session(activity, duration, user_profile)
                daily_data['workout'] = workout
            
            historical_data.append(daily_data)
        
        return historical_data
    
    def get_realtime_metrics(self):
        """Simulate real-time metrics for current activity"""
        return {
            'current_heart_rate': random.randint(65, 180),
            'calories_today': random.randint(1200, 2800),
            'steps_today': random.randint(2000, 12000),
            'active_minutes_today': random.randint(15, 120),
            'current_pace': round(random.uniform(4.5, 8.0), 2),  # if running
            'battery_level': random.randint(20, 100),
            'last_sync': datetime.now().isoformat()
        }