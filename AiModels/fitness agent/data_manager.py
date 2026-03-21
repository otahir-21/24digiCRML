import json
import os
from datetime import datetime, timedelta
import pandas as pd

class DataManager:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.ensure_data_dir()
        
    def ensure_data_dir(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def save_user_profile(self, user_id, profile_data):
        file_path = os.path.join(self.data_dir, f"profile_{user_id}.json")
        profile_data['last_updated'] = datetime.now().isoformat()
        with open(file_path, 'w') as f:
            json.dump(profile_data, f, indent=2)
    
    def load_user_profile(self, user_id):
        file_path = os.path.join(self.data_dir, f"profile_{user_id}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return {}
    
    def save_user_goals(self, user_id, goals_data):
        file_path = os.path.join(self.data_dir, f"goals_{user_id}.json")
        goals_data['last_updated'] = datetime.now().isoformat()
        with open(file_path, 'w') as f:
            json.dump(goals_data, f, indent=2)
    
    def load_user_goals(self, user_id):
        file_path = os.path.join(self.data_dir, f"goals_{user_id}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return {}
    
    def save_workout(self, user_id, workout_data):
        file_path = os.path.join(self.data_dir, f"workouts_{user_id}.json")
        
        workouts = []
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                workouts = json.load(f)
        
        workout_data['id'] = len(workouts) + 1
        workout_data['logged_at'] = datetime.now().isoformat()
        workouts.append(workout_data)
        
        with open(file_path, 'w') as f:
            json.dump(workouts, f, indent=2)
    
    def load_workouts(self, user_id):
        file_path = os.path.join(self.data_dir, f"workouts_{user_id}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return []
    
    def get_workout_stats(self, user_id, activity_type=None, days=30):
        workouts = self.load_workouts(user_id)
        if not workouts:
            return {}
        
        df = pd.DataFrame(workouts)
        df['date'] = pd.to_datetime(df['date'])
        
        # Filter by activity type if specified
        if activity_type:
            df = df[df['activity'] == activity_type]
        
        # Filter by days
        cutoff_date = datetime.now() - timedelta(days=days)
        df = df[df['date'] >= cutoff_date]
        
        if df.empty:
            return {}
        
        stats = {
            'total_workouts': len(df),
            'avg_per_week': len(df) * 7 / days if days > 0 else 0,
            'recent_workouts': df.tail(10).to_dict('records')
        }
        
        # Activity-specific stats
        if activity_type == 'Running':
            if 'distance' in df.columns:
                stats['total_distance'] = df['distance'].sum()
                stats['avg_distance'] = df['distance'].mean()
                stats['best_distance'] = df['distance'].max()
            if 'time' in df.columns and 'distance' in df.columns:
                df['pace'] = df['time'] / df['distance']  # min/km
                stats['avg_pace'] = df['pace'].mean()
                stats['best_pace'] = df['pace'].min()
        
        elif activity_type == 'Swimming':
            if 'distance' in df.columns:
                stats['total_distance'] = df['distance'].sum()
                stats['avg_distance'] = df['distance'].mean()
                stats['best_distance'] = df['distance'].max()
        
        elif activity_type == 'Strength Training':
            if 'weight' in df.columns:
                stats['max_weight'] = df['weight'].max()
                stats['avg_weight'] = df['weight'].mean()
            if 'volume' in df.columns:  # weight * reps * sets
                stats['total_volume'] = df['volume'].sum()
        
        return stats
    
    def get_progress_data(self, user_id, activity_type, metric='distance'):
        workouts = self.load_workouts(user_id)
        if not workouts:
            return pd.DataFrame()
        
        df = pd.DataFrame(workouts)
        df['date'] = pd.to_datetime(df['date'])
        df = df[df['activity'] == activity_type]
        
        if df.empty or metric not in df.columns:
            return pd.DataFrame()
        
        df = df.sort_values('date')
        return df[['date', metric]].dropna()