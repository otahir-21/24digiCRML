import streamlit as st
import openai
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="AI Fitness Coach",
    page_icon="💪",
    layout="wide"
)

class FitnessCoach:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
    def get_coaching_response(self, user_data, goal, activity_type, current_stats=None):
        prompt = f"""
        You are an expert fitness coach specializing in {activity_type}. 
        
        User Information:
        - Age: {user_data.get('age')}
        - Weight: {user_data.get('weight')} kg
        - Height: {user_data.get('height')} cm
        - Fitness Level: {user_data.get('fitness_level')}
        - Goal: {goal}
        - Activity Focus: {activity_type}
        
        Current Performance: {current_stats if current_stats else 'No previous data'}
        
        Provide personalized coaching advice including:
        1. Weekly training plan
        2. Specific techniques to improve
        3. Nutrition recommendations
        4. Recovery strategies
        5. Progress milestones
        
        Keep response practical and motivating.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error getting coaching advice: {str(e)}"

def init_session_state():
    if 'user_data' not in st.session_state:
        st.session_state.user_data = {}
    if 'goals' not in st.session_state:
        st.session_state.goals = {}
    if 'progress_data' not in st.session_state:
        st.session_state.progress_data = {}
    if 'coach' not in st.session_state:
        st.session_state.coach = FitnessCoach()

def main():
    init_session_state()
    
    st.title("🏃‍♂️ AI Fitness Coach")
    st.markdown("Your personal AI coach for Running, Swimming, and Strength Training")
    
    # Sidebar for navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.selectbox("Choose a section:", [
        "Profile Setup", 
        "Goal Setting", 
        "Running Coach", 
        "Swimming Coach", 
        "Strength Training Coach",
        "Progress Tracking"
    ])
    
    if page == "Profile Setup":
        profile_setup()
    elif page == "Goal Setting":
        goal_setting()
    elif page == "Running Coach":
        coaching_interface("Running")
    elif page == "Swimming Coach":
        coaching_interface("Swimming")
    elif page == "Strength Training Coach":
        coaching_interface("Strength Training")
    elif page == "Progress Tracking":
        progress_tracking()

def profile_setup():
    st.header("👤 Profile Setup")
    
    col1, col2 = st.columns(2)
    
    with col1:
        age = st.number_input("Age", min_value=16, max_value=80, value=25)
        weight = st.number_input("Weight (kg)", min_value=40, max_value=200, value=70)
        height = st.number_input("Height (cm)", min_value=140, max_value=220, value=170)
    
    with col2:
        fitness_level = st.selectbox("Fitness Level", [
            "Beginner", "Intermediate", "Advanced", "Elite"
        ])
        
        injuries = st.text_area("Any injuries or health conditions?", 
                               placeholder="Describe any limitations...")
        
        experience = st.multiselect("Experience with:", [
            "Running", "Swimming", "Weight Training", "Cardio", "Yoga"
        ])
    
    if st.button("Save Profile"):
        st.session_state.user_data = {
            'age': age,
            'weight': weight,
            'height': height,
            'fitness_level': fitness_level,
            'injuries': injuries,
            'experience': experience
        }
        st.success("Profile saved successfully!")

def goal_setting():
    st.header("🎯 Goal Setting")
    
    if not st.session_state.user_data:
        st.warning("Please complete your profile setup first!")
        return
    
    activity = st.selectbox("Choose your primary focus:", [
        "Running", "Swimming", "Strength Training"
    ])
    
    goals = {
        "Running": [
            "Complete a 5K race",
            "Complete a 10K race", 
            "Complete a half marathon",
            "Complete a marathon",
            "Improve my 5K time",
            "Build running endurance"
        ],
        "Swimming": [
            "Learn proper swimming technique",
            "Swim 1000m continuously",
            "Compete in local swim meet",
            "Become a competitive swimmer",
            "Master all four strokes",
            "Improve swimming speed"
        ],
        "Strength Training": [
            "Build muscle mass",
            "Increase overall strength",
            "Prepare for powerlifting competition",
            "Improve functional fitness",
            "Lose weight and tone up",
            "Achieve specific lift goals"
        ]
    }
    
    selected_goal = st.selectbox(f"Your {activity} goal:", goals[activity])
    
    timeline = st.selectbox("Timeline to achieve goal:", [
        "3 months", "6 months", "1 year", "2+ years"
    ])
    
    if st.button("Set Goal"):
        st.session_state.goals = {
            'activity': activity,
            'goal': selected_goal,
            'timeline': timeline,
            'set_date': datetime.now().strftime('%Y-%m-%d')
        }
        st.success(f"Goal set: {selected_goal} in {timeline}")

def coaching_interface(activity_type):
    st.header(f"🏊‍♀️ {activity_type} Coach" if activity_type == "Swimming" 
              else f"🏃‍♂️ {activity_type} Coach" if activity_type == "Running"
              else f"💪 {activity_type} Coach")
    
    if not st.session_state.user_data:
        st.warning("Please complete your profile setup first!")
        return
    
    if not st.session_state.goals or st.session_state.goals.get('activity') != activity_type:
        st.warning(f"Please set a {activity_type} goal first!")
        return
    
    # Current performance input
    st.subheader("Current Performance")
    current_stats = get_current_stats(activity_type)
    
    if st.button(f"Get {activity_type} Coaching Advice"):
        with st.spinner("Getting personalized coaching advice..."):
            advice = st.session_state.coach.get_coaching_response(
                st.session_state.user_data,
                st.session_state.goals['goal'],
                activity_type,
                current_stats
            )
            st.markdown("### Your Personalized Coaching Plan")
            st.markdown(advice)

def get_current_stats(activity_type):
    if activity_type == "Running":
        col1, col2 = st.columns(2)
        with col1:
            distance = st.number_input("Last run distance (km)", min_value=0.0, value=5.0, step=0.1)
            time = st.number_input("Time (minutes)", min_value=0, value=30)
        with col2:
            weekly_distance = st.number_input("Weekly distance (km)", min_value=0.0, value=20.0, step=1.0)
            runs_per_week = st.number_input("Runs per week", min_value=0, value=3)
        
        return f"Last run: {distance}km in {time} minutes, Weekly: {weekly_distance}km in {runs_per_week} runs"
    
    elif activity_type == "Swimming":
        col1, col2 = st.columns(2)
        with col1:
            distance = st.number_input("Last swim distance (m)", min_value=0, value=1000, step=50)
            time = st.number_input("Time (minutes)", min_value=0, value=40)
        with col2:
            stroke = st.selectbox("Primary stroke", ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"])
            sessions_per_week = st.number_input("Sessions per week", min_value=0, value=2)
        
        return f"Last swim: {distance}m in {time} minutes ({stroke}), {sessions_per_week} sessions/week"
    
    else:  # Strength Training
        col1, col2 = st.columns(2)
        with col1:
            bench_press = st.number_input("Bench Press (kg)", min_value=0, value=60)
            squat = st.number_input("Squat (kg)", min_value=0, value=80)
        with col2:
            deadlift = st.number_input("Deadlift (kg)", min_value=0, value=100)
            sessions_per_week = st.number_input("Sessions per week", min_value=0, value=3)
        
        return f"Bench: {bench_press}kg, Squat: {squat}kg, Deadlift: {deadlift}kg, {sessions_per_week} sessions/week"

def progress_tracking():
    st.header("📈 Progress Tracking")
    
    if not st.session_state.goals:
        st.warning("Please set a goal first!")
        return
    
    st.subheader("Your Current Goal")
    goal_info = st.session_state.goals
    st.info(f"**Goal:** {goal_info['goal']}\n**Timeline:** {goal_info['timeline']}\n**Activity:** {goal_info['activity']}")
    
    # Simple progress input
    st.subheader("Log Today's Workout")
    
    date = st.date_input("Date", datetime.now())
    activity = goal_info['activity']
    
    if activity == "Running":
        distance = st.number_input("Distance (km)", min_value=0.0, step=0.1)
        time = st.number_input("Time (minutes)", min_value=0)
        notes = st.text_area("Notes")
        
        if st.button("Log Workout"):
            # In a real app, you'd save this to a database
            st.success("Workout logged successfully!")
    
    elif activity == "Swimming":
        distance = st.number_input("Distance (m)", min_value=0, step=50)
        time = st.number_input("Time (minutes)", min_value=0)
        stroke = st.selectbox("Primary stroke", ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"])
        notes = st.text_area("Notes")
        
        if st.button("Log Workout"):
            st.success("Workout logged successfully!")
    
    else:  # Strength Training
        exercise = st.selectbox("Exercise", ["Bench Press", "Squat", "Deadlift", "Other"])
        weight = st.number_input("Weight (kg)", min_value=0)
        reps = st.number_input("Reps", min_value=0)
        sets = st.number_input("Sets", min_value=0)
        notes = st.text_area("Notes")
        
        if st.button("Log Workout"):
            st.success("Workout logged successfully!")

if __name__ == "__main__":
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        st.error("Please set your OPENAI_API_KEY in a .env file")
        st.stop()
    
    main()