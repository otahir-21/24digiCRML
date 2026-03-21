import streamlit as st
import openai
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import json
import random

load_dotenv()

st.set_page_config(
    page_title="AI Fitness Coach Pro",
    page_icon="💪",
    layout="wide"
)

# Enhanced CSS
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 15px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .fitness-card {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin: 1rem 0;
        border-left: 4px solid #667eea;
    }
    
    .goal-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
    
    .plan-card {
        background: #f8f9ff;
        padding: 1.5rem;
        border-radius: 10px;
        border-left: 4px solid #28a745;
        margin: 1rem 0;
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
        margin: 0.5rem;
    }
    
    .metric-number {
        font-size: 2rem;
        font-weight: bold;
        color: #667eea;
    }
    
    .progress-bar {
        width: 100%;
        height: 20px;
        background: #e0e0e0;
        border-radius: 10px;
        overflow: hidden;
        margin: 1rem 0;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
    }
    
    .workout-log {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin: 0.5rem 0;
        border-left: 3px solid #667eea;
    }
    
    .ai-message {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 3px solid #667eea;
    }
    
    .user-message {
        background: #667eea;
        color: white;
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        text-align: right;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'user_profile' not in st.session_state:
    st.session_state.user_profile = {}
if 'current_plan' not in st.session_state:
    st.session_state.current_plan = None
if 'workouts' not in st.session_state:
    st.session_state.workouts = []
if 'goals' not in st.session_state:
    st.session_state.goals = {}
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

# Activity-specific goals
ACTIVITY_GOALS = {
    "Running": {
        "Distance Goals": [
            "Complete first 5K run",
            "Run 10K without stopping",
            "Complete a half marathon (21K)",
            "Complete a full marathon (42K)",
            "Run 50K total distance per week"
        ],
        "Speed Goals": [
            "5K under 30 minutes",
            "5K under 25 minutes", 
            "5K under 20 minutes",
            "10K under 60 minutes",
            "10K under 45 minutes"
        ],
        "Endurance Goals": [
            "Run for 30 minutes continuously",
            "Run for 60 minutes continuously",
            "Run 3 times per week for 1 month",
            "Run 5 times per week consistently",
            "Complete a running streak (30 days)"
        ]
    },
    "Swimming": {
        "Distance Goals": [
            "Swim 500m without stopping",
            "Swim 1000m continuously", 
            "Swim 1500m continuously",
            "Swim 3000m in one session",
            "Complete a 5K open water swim"
        ],
        "Technique Goals": [
            "Master freestyle breathing",
            "Learn all four swimming strokes",
            "Improve flip turns",
            "Perfect streamline position",
            "Master bilateral breathing"
        ],
        "Speed Goals": [
            "100m freestyle under 2 minutes",
            "100m freestyle under 1:30",
            "500m freestyle under 10 minutes",
            "1000m freestyle under 20 minutes",
            "Complete sprint set (8x50m)"
        ]
    },
    "Strength Training": {
        "Strength Goals": [
            "Bench press bodyweight",
            "Squat 1.5x bodyweight",
            "Deadlift 2x bodyweight",
            "Complete 10 pull-ups",
            "Complete 50 push-ups"
        ],
        "Muscle Building Goals": [
            "Gain 5kg lean muscle mass",
            "Increase arm circumference by 2cm",
            "Increase chest measurement by 3cm",
            "Build visible abs",
            "Achieve V-taper physique"
        ],
        "Performance Goals": [
            "Train 4 times per week consistently",
            "Increase total weekly volume by 20%",
            "Complete advanced compound movements",
            "Achieve muscle-up",
            "Complete powerlifting meet"
        ]
    }
}

# Data management functions
def save_workout(workout_data):
    workout_data['id'] = len(st.session_state.workouts) + 1
    workout_data['date'] = datetime.now().isoformat()
    st.session_state.workouts.append(workout_data)

def simulate_wearable_data():
    return {
        'steps': random.randint(5000, 15000),
        'calories': random.randint(1800, 2800),
        'heart_rate': random.randint(65, 85),
        'sleep_hours': round(random.uniform(6.5, 9.0), 1),
        'active_minutes': random.randint(30, 120),
        'distance_km': round(random.uniform(2.0, 8.0), 2),
        'workout_detected': random.choice([True, False])
    }

def simulate_watch_workout():
    """Simulate automatic workout detection from smartwatch"""
    activities = ["Running", "Swimming", "Strength Training", "Cycling"]
    activity = random.choice(activities)
    
    if activity == "Running":
        return {
            'activity': activity,
            'duration': random.randint(20, 60),
            'distance_km': round(random.uniform(2.0, 10.0), 2),
            'pace_min_km': round(random.uniform(4.5, 7.0), 2),
            'calories': random.randint(200, 600),
            'avg_heart_rate': random.randint(140, 180),
            'auto_detected': True
        }
    elif activity == "Swimming":
        return {
            'activity': activity,
            'duration': random.randint(30, 90),
            'distance_m': random.randint(500, 2000),
            'strokes': random.randint(800, 2500),
            'calories': random.randint(300, 700),
            'avg_heart_rate': random.randint(120, 160),
            'auto_detected': True
        }
    else:  # Strength Training
        return {
            'activity': activity,
            'duration': random.randint(45, 90),
            'calories': random.randint(250, 500),
            'avg_heart_rate': random.randint(100, 140),
            'sets': random.randint(15, 25),
            'auto_detected': True
        }

# AI Functions
def get_ai_response(message, context=""):
    try:
        prompt = f"""
        You are an expert AI fitness coach specializing in running, swimming, and strength training.
        
        Context: {context}
        User message: "{message}"
        
        Provide helpful, specific, and actionable fitness advice. Be encouraging but professional.
        Include specific numbers, techniques, or recommendations when relevant.
        """
        
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Sorry, I'm having trouble connecting. Please check your API key. Error: {str(e)}"

def generate_workout_plan(sport, goal, weeks, level):
    try:
        prompt = f"""
        Create a detailed {weeks}-week {sport} training plan for: "{goal}"
        Fitness level: {level}
        
        Structure the plan with:
        1. Phase breakdown (e.g., weeks 1-4: base building, 5-8: strength, etc.)
        2. Weekly training schedule with specific workouts
        3. Progressive overload strategy
        4. Key exercises and techniques
        5. Recovery and rest recommendations
        6. Milestone checkpoints
        7. Nutrition guidelines
        8. Equipment needed
        
        Make it comprehensive and actionable with specific sets, reps, distances, or times.
        """
        
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error generating plan: {str(e)}"

def generate_daily_workout(sport, duration, difficulty):
    try:
        prompt = f"""
        Create a detailed {duration}-minute {sport} workout for {difficulty} level.
        
        Include:
        1. Warm-up (specific exercises, 5-10 minutes)
        2. Main workout with specific exercises, sets, reps, or distances
        3. Rest periods between sets
        4. Cool-down and stretching (5-10 minutes)
        5. Coaching tips and form cues
        6. Estimated calories burned
        
        Make it detailed and ready to execute.
        """
        
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error generating workout: {str(e)}"

def main():
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🏆 AI Fitness Coach Pro</h1>
        <p>Specific Goals • Smart Tracking • Comprehensive Progress Monitoring</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "🏠 Dashboard",
        "🎯 Goals & Plans",
        "🏋️ Daily Workouts", 
        "📊 Activity Logging",
        "📈 Progress Tracker",
        "💬 AI Coach"
    ])
    
    with tab1:
        dashboard_tab()
    
    with tab2:
        goals_and_plans_tab()
    
    with tab3:
        daily_workouts_tab()
    
    with tab4:
        activity_logging_tab()
    
    with tab5:
        progress_tracker_tab()
    
    with tab6:
        ai_chat_tab()

def dashboard_tab():
    st.header("🏠 Dashboard")
    
    # Quick stats
    wearable_data = simulate_wearable_data()
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{wearable_data['steps']:,}</div>
            <div>Steps Today</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{wearable_data['calories']:,}</div>
            <div>Calories Burned</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{len(st.session_state.workouts)}</div>
            <div>Total Workouts</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        completed_workouts = len([w for w in st.session_state.workouts if w.get('completed')])
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{completed_workouts}</div>
            <div>Completed</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Current goals display
    if st.session_state.goals:
        st.subheader("🎯 Current Goals")
        for activity, goal_data in st.session_state.goals.items():
            goal_type = goal_data['goal_type']
            specific_goal = goal_data['specific_goal']
            target_date = goal_data.get('target_date', 'No deadline set')
            progress = goal_data.get('progress', 0)
            
            st.markdown(f"""
            <div class="goal-card">
                <h4>{activity} - {goal_type}</h4>
                <p><strong>Goal:</strong> {specific_goal}</p>
                <p><strong>Target:</strong> {target_date}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {progress}%"></div>
                </div>
                <small>{progress}% Complete</small>
            </div>
            """, unsafe_allow_html=True)
    
    # Current plan display
    if st.session_state.current_plan:
        st.subheader("📋 Active Training Plan")
        plan = st.session_state.current_plan
        st.markdown(f"""
        <div class="plan-card">
            <h4>{plan['weeks']}-Week {plan['sport']} Plan</h4>
            <p><strong>Goal:</strong> {plan['goal']}</p>
            <p><strong>Created:</strong> {plan['created'][:10]}</p>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("📖 View Full Plan"):
            st.markdown("### Your Training Plan")
            st.markdown(plan['plan'])
    
    # Profile setup
    st.subheader("👤 Profile")
    
    col1, col2 = st.columns(2)
    
    with col1:
        age = st.number_input("Age", 16, 80, st.session_state.user_profile.get('age', 25))
        weight = st.number_input("Weight (kg)", 40, 200, st.session_state.user_profile.get('weight', 70))
        height = st.number_input("Height (cm)", 140, 220, st.session_state.user_profile.get('height', 170))
    
    with col2:
        fitness_level = st.selectbox("Fitness Level", 
            ["Beginner", "Intermediate", "Advanced"],
            index=["Beginner", "Intermediate", "Advanced"].index(
                st.session_state.user_profile.get('fitness_level', 'Intermediate')))
        
        primary_activities = st.multiselect("Primary Activities", 
            ["Running", "Swimming", "Strength Training"],
            default=st.session_state.user_profile.get('primary_activities', []))
        
        weekly_goal = st.slider("Workout sessions per week goal:", 2, 7, 
                               st.session_state.user_profile.get('weekly_goal', 4))
    
    if st.button("💾 Save Profile", type="primary"):
        st.session_state.user_profile = {
            'age': age,
            'weight': weight,
            'height': height,
            'fitness_level': fitness_level,
            'primary_activities': primary_activities,
            'weekly_goal': weekly_goal
        }
        st.success("✅ Profile saved!")

def goals_and_plans_tab():
    st.header("🎯 Specific Goals & Training Plans")
    
    if not st.session_state.user_profile:
        st.warning("⚠️ Please complete your profile in the Dashboard first!")
        return
    
    # Goal setting section
    st.subheader("🎯 Set Activity-Specific Goals")
    
    col1, col2 = st.columns(2)
    
    with col1:
        activity = st.selectbox("Choose Activity:", ["Running", "Swimming", "Strength Training"])
        goal_category = st.selectbox("Goal Category:", list(ACTIVITY_GOALS[activity].keys()))
    
    with col2:
        specific_goal = st.selectbox("Specific Goal:", ACTIVITY_GOALS[activity][goal_category])
        target_date = st.date_input("Target Date:", datetime.now().date() + timedelta(days=90))
    
    if st.button("🎯 Set Goal", type="primary"):
        if activity not in st.session_state.goals:
            st.session_state.goals[activity] = {}
        
        st.session_state.goals[activity] = {
            'goal_type': goal_category,
            'specific_goal': specific_goal,
            'target_date': target_date.isoformat(),
            'progress': 0,
            'set_date': datetime.now().isoformat()
        }
        st.success(f"✅ Goal set for {activity}: {specific_goal}")
        st.rerun()
    
    # Training plan generation
    st.subheader("📋 Generate Training Plan")
    
    if st.session_state.goals:
        available_activities = list(st.session_state.goals.keys())
        selected_activity = st.selectbox("Create plan for:", available_activities)
        
        if selected_activity in st.session_state.goals:
            current_goal = st.session_state.goals[selected_activity]
            
            col1, col2 = st.columns(2)
            with col1:
                weeks = st.slider("Plan Duration (weeks):", 4, 16, 8)
                level = st.session_state.user_profile.get('fitness_level', 'Intermediate')
                st.write(f"**Your Level:** {level}")
            
            with col2:
                st.write(f"**Current Goal:** {current_goal['specific_goal']}")
                sessions_per_week = st.slider("Sessions per week:", 2, 6, 4)
            
            if st.button("🚀 Generate Training Plan", type="primary"):
                with st.spinner("🧠 Creating your personalized training plan..."):
                    plan = generate_workout_plan(
                        selected_activity, 
                        current_goal['specific_goal'], 
                        weeks, 
                        level
                    )
                    
                    st.session_state.current_plan = {
                        'activity': selected_activity,
                        'sport': selected_activity,
                        'goal': current_goal['specific_goal'],
                        'weeks': weeks,
                        'plan': plan,
                        'created': datetime.now().isoformat(),
                        'sessions_per_week': sessions_per_week
                    }
                    
                    st.success("✅ Training plan generated and saved!")
                    st.markdown("### Your Personalized Training Plan")
                    st.markdown(plan)
                    st.balloons()
    
    else:
        st.info("📌 Set a specific goal first to generate a training plan.")

def daily_workouts_tab():
    st.header("🏋️ Daily Workout Generator")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        sport = st.selectbox("Workout Type:", ["Running", "Swimming", "Strength Training"])
        duration = st.slider("Duration (minutes):", 15, 120, 45)
    
    with col2:
        difficulty = st.selectbox("Difficulty:", ["Beginner", "Intermediate", "Advanced"])
        equipment = st.multiselect("Available Equipment:", [
            "Gym access", "Dumbbells", "Resistance bands", 
            "Pool", "Track", "Bodyweight only"
        ], default=["Bodyweight only"])
    
    with col3:
        focus = st.selectbox("Focus Area:", ["Full Body", "Upper Body", "Lower Body", "Cardio", "Flexibility"])
        weather = st.selectbox("Weather/Location:", ["Indoor", "Outdoor (Good)", "Outdoor (Poor)"])
    
    if st.button("🔥 Generate Today's Workout", type="primary"):
        with st.spinner("🎯 Creating your personalized workout..."):
            workout = generate_daily_workout(sport, duration, difficulty)
            
            st.markdown(f"""
            <div class="fitness-card">
                <h2>💪 Today's {sport} Workout</h2>
                <p><strong>Duration:</strong> {duration} minutes | <strong>Level:</strong> {difficulty} | <strong>Focus:</strong> {focus}</p>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(workout)
            
            # Action buttons
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("✅ Mark as Completed", type="primary"):
                    workout_data = {
                        'activity': sport,
                        'duration': duration,
                        'difficulty': difficulty,
                        'focus': focus,
                        'workout_plan': workout[:200] + "...",  # Truncated for storage
                        'completed': True,
                        'type': 'Generated Workout'
                    }
                    save_workout(workout_data)
                    st.success("🎉 Great job! Workout completed!")
                    st.balloons()
            
            with col2:
                if st.button("📝 Log Performance"):
                    st.session_state.temp_workout = {
                        'activity': sport,
                        'duration': duration,
                        'difficulty': difficulty,
                        'workout_plan': workout[:200] + "...",
                        'type': 'Generated Workout'
                    }
                    st.success("📊 Ready to log performance details!")
                    st.rerun()
            
            with col3:
                if st.button("💾 Save for Later"):
                    workout_data = {
                        'activity': sport,
                        'duration': duration,
                        'difficulty': difficulty,
                        'workout_plan': workout,
                        'completed': False,
                        'type': 'Saved Workout'
                    }
                    save_workout(workout_data)
                    st.success("💾 Workout saved for later!")
    
    # Performance logging for generated workout
    if hasattr(st.session_state, 'temp_workout'):
        st.subheader("📊 Log Workout Performance")
        temp_workout = st.session_state.temp_workout
        
        with st.form("performance_form"):
            st.write(f"**Workout:** {temp_workout['activity']} - {temp_workout['duration']} minutes")
            
            if temp_workout['activity'] == "Running":
                distance = st.number_input("Distance covered (km):", 0.0, 50.0, 5.0, 0.1)
                avg_pace = st.number_input("Average pace (min/km):", 3.0, 10.0, 6.0, 0.1)
                heart_rate = st.number_input("Average heart rate:", 60, 200, 140)
                perceived_effort = st.slider("Perceived effort (1-10):", 1, 10, 7)
            
            elif temp_workout['activity'] == "Swimming":
                distance = st.number_input("Distance swum (meters):", 0, 5000, 1000, 50)
                stroke = st.selectbox("Primary stroke:", ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"])
                heart_rate = st.number_input("Average heart rate:", 60, 200, 130)
                perceived_effort = st.slider("Perceived effort (1-10):", 1, 10, 6)
            
            else:  # Strength Training
                weight_lifted = st.number_input("Total weight lifted (kg):", 0, 10000, 1000, 50)
                sets = st.number_input("Total sets completed:", 0, 50, 15)
                reps = st.number_input("Average reps per set:", 0, 30, 10)
                perceived_effort = st.slider("Perceived effort (1-10):", 1, 10, 8)
            
            notes = st.text_area("Workout notes:", placeholder="How did you feel? Any observations?")
            
            if st.form_submit_button("📈 Log Performance", type="primary"):
                performance_data = temp_workout.copy()
                performance_data.update({
                    'completed': True,
                    'notes': notes,
                    'perceived_effort': perceived_effort,
                    'detailed_log': True
                })
                
                if temp_workout['activity'] == "Running":
                    performance_data.update({
                        'distance_km': distance,
                        'avg_pace': avg_pace,
                        'heart_rate': heart_rate
                    })
                elif temp_workout['activity'] == "Swimming":
                    performance_data.update({
                        'distance_m': distance,
                        'stroke': stroke,
                        'heart_rate': heart_rate
                    })
                else:  # Strength Training
                    performance_data.update({
                        'weight_lifted': weight_lifted,
                        'sets': sets,
                        'reps': reps
                    })
                
                save_workout(performance_data)
                del st.session_state.temp_workout
                st.success("🎉 Performance logged successfully!")
                st.rerun()

def activity_logging_tab():
    st.header("📊 Activity Logging")
    
    # Three logging options
    st.subheader("Choose Logging Method:")
    
    tab1, tab2, tab3 = st.tabs(["📱 Manual Entry", "⌚ Watch Data", "✅ Quick Log"])
    
    with tab1:
        manual_logging()
    
    with tab2:
        watch_data_logging()
    
    with tab3:
        quick_logging()
    
    # Recent activities
    if st.session_state.workouts:
        st.subheader("📋 Recent Activities")
        
        # Show last 5 workouts
        recent_workouts = sorted(st.session_state.workouts, 
                               key=lambda x: x['date'], reverse=True)[:5]
        
        for workout in recent_workouts:
            date = datetime.fromisoformat(workout['date']).strftime("%Y-%m-%d %H:%M")
            status = "✅ Completed" if workout.get('completed') else "📝 Logged"
            
            st.markdown(f"""
            <div class="workout-log">
                <strong>{date}</strong> - {workout['activity']} 
                ({workout.get('duration', 'N/A')} min) - {status}
                <br><small>{workout.get('notes', 'No notes')}</small>
            </div>
            """, unsafe_allow_html=True)

def manual_logging():
    st.write("📝 Manually enter your workout details")
    
    with st.form("manual_workout"):
        col1, col2 = st.columns(2)
        
        with col1:
            activity = st.selectbox("Activity:", ["Running", "Swimming", "Strength Training", "Cycling", "Other"])
            date = st.date_input("Date:", datetime.now().date())
            duration = st.number_input("Duration (minutes):", 5, 300, 45)
        
        with col2:
            intensity = st.selectbox("Intensity:", ["Light", "Moderate", "Hard", "Very Hard"])
            calories = st.number_input("Calories burned (optional):", 0, 2000, 0)
            heart_rate = st.number_input("Average heart rate (optional):", 0, 200, 0)
        
        # Activity-specific fields
        if activity == "Running":
            distance = st.number_input("Distance (km):", 0.0, 50.0, 0.0, 0.1)
            pace = st.number_input("Average pace (min/km):", 0.0, 15.0, 0.0, 0.1)
        
        elif activity == "Swimming":
            distance = st.number_input("Distance (meters):", 0, 5000, 0, 50)
            stroke = st.selectbox("Primary stroke:", ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"])
        
        elif activity == "Strength Training":
            exercises = st.text_input("Main exercises:", placeholder="e.g., Bench press, Squats, Deadlifts")
            weight = st.number_input("Average weight used (kg):", 0, 500, 0)
        
        notes = st.text_area("Notes:", placeholder="How did you feel? Any observations?")
        
        if st.form_submit_button("📊 Log Workout", type="primary"):
            workout_data = {
                'activity': activity,
                'duration': duration,
                'intensity': intensity,
                'notes': notes,
                'completed': True,
                'type': 'Manual Entry',
                'date': datetime.combine(date, datetime.now().time()).isoformat()
            }
            
            # Add activity-specific data
            if activity == "Running" and distance > 0:
                workout_data.update({'distance_km': distance, 'avg_pace': pace})
            elif activity == "Swimming" and distance > 0:
                workout_data.update({'distance_m': distance, 'stroke': stroke})
            elif activity == "Strength Training":
                workout_data.update({'exercises': exercises, 'avg_weight': weight})
            
            if calories > 0:
                workout_data['calories'] = calories
            if heart_rate > 0:
                workout_data['heart_rate'] = heart_rate
            
            # Remove the manual date override, let save_workout handle it
            del workout_data['date']
            save_workout(workout_data)
            
            st.success("✅ Workout logged successfully!")
            st.rerun()

def watch_data_logging():
    st.write("⌚ Import data from your smartwatch or fitness tracker")
    
    # Simulate watch connection
    watch_connected = st.checkbox("📱 Connect to fitness device", help="Simulated connection")
    
    if watch_connected:
        st.success("✅ Connected to fitness device")
        
        # Show available data
        wearable_data = simulate_wearable_data()
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.write("**Today's Activity:**")
            st.write(f"• Steps: {wearable_data['steps']:,}")
            st.write(f"• Distance: {wearable_data['distance_km']} km")
            st.write(f"• Calories: {wearable_data['calories']:,}")
            st.write(f"• Active minutes: {wearable_data['active_minutes']}")
        
        with col2:
            st.write("**Detected Workouts:**")
            if wearable_data['workout_detected']:
                detected_workout = simulate_watch_workout()
                
                st.write(f"🏃‍♂️ **{detected_workout['activity']}**")
                st.write(f"⏱️ Duration: {detected_workout['duration']} min")
                if 'distance_km' in detected_workout:
                    st.write(f"📏 Distance: {detected_workout['distance_km']} km")
                if 'distance_m' in detected_workout:
                    st.write(f"📏 Distance: {detected_workout['distance_m']} m")
                st.write(f"🔥 Calories: {detected_workout['calories']}")
                st.write(f"💓 Avg HR: {detected_workout['avg_heart_rate']} bpm")
                
                if st.button("📥 Import Workout", type="primary"):
                    detected_workout['type'] = 'Watch Import'
                    detected_workout['completed'] = True
                    save_workout(detected_workout)
                    st.success("✅ Workout imported from watch!")
                    st.rerun()
            else:
                st.write("No workouts detected today")
                st.button("🔄 Refresh", help="Check for new workouts")
    
    else:
        st.info("📱 Enable device connection to import workout data automatically")

def quick_logging():
    st.write("⚡ Quick workout completion logging")
    
    # Predefined quick activities
    quick_activities = [
        {"name": "30min Run", "activity": "Running", "duration": 30},
        {"name": "45min Swim", "activity": "Swimming", "duration": 45},
        {"name": "60min Gym", "activity": "Strength Training", "duration": 60},
        {"name": "20min HIIT", "activity": "HIIT", "duration": 20},
        {"name": "15min Stretch", "activity": "Flexibility", "duration": 15}
    ]
    
    st.write("**Quick Activities:**")
    cols = st.columns(len(quick_activities))
    
    for i, activity in enumerate(quick_activities):
        with cols[i]:
            if st.button(f"✅ {activity['name']}", key=f"quick_{i}"):
                workout_data = {
                    'activity': activity['activity'],
                    'duration': activity['duration'],
                    'completed': True,
                    'type': 'Quick Log',
                    'intensity': 'Moderate'
                }
                save_workout(workout_data)
                st.success(f"✅ {activity['name']} logged!")
                st.rerun()

def progress_tracker_tab():
    st.header("📈 Progress Tracker")
    
    if not st.session_state.workouts:
        st.info("📊 No workout data yet. Start logging activities to see your progress!")
        return
    
    # Goal progress
    if st.session_state.goals:
        st.subheader("🎯 Goal Progress")
        
        for activity, goal_data in st.session_state.goals.items():
            # Calculate progress based on activity
            workouts = [w for w in st.session_state.workouts if w['activity'] == activity]
            
            if workouts:
                # Simple progress calculation
                days_since_goal = (datetime.now() - datetime.fromisoformat(goal_data['set_date'])).days
                target_days = (datetime.fromisoformat(goal_data['target_date']) - datetime.fromisoformat(goal_data['set_date'])).days
                
                if target_days > 0:
                    time_progress = min(100, (days_since_goal / target_days) * 100)
                    workout_count = len(workouts)
                    
                    # Update progress in session state
                    st.session_state.goals[activity]['progress'] = min(100, time_progress + (workout_count * 5))
                
                progress = st.session_state.goals[activity]['progress']
                
                st.markdown(f"""
                <div class="goal-card">
                    <h4>{activity}: {goal_data['specific_goal']}</h4>
                    <p>Target Date: {goal_data['target_date']}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {progress}%"></div>
                    </div>
                    <p>{progress:.1f}% Complete • {len(workouts)} workouts logged</p>
                </div>
                """, unsafe_allow_html=True)
    
    # Activity statistics
    st.subheader("📊 Activity Statistics")
    
    df = pd.DataFrame(st.session_state.workouts)
    df['date'] = pd.to_datetime(df['date'])
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        total_workouts = len(df)
        completed_workouts = len(df[df['completed'] == True])
        st.metric("Total Workouts", total_workouts)
        st.metric("Completed", completed_workouts, f"{(completed_workouts/max(total_workouts,1)*100):.0f}%")
    
    with col2:
        total_duration = df['duration'].sum()
        avg_duration = df['duration'].mean()
        st.metric("Total Duration", f"{total_duration} min", f"{total_duration/60:.1f} hours")
        st.metric("Avg Duration", f"{avg_duration:.0f} min")
    
    with col3:
        this_week = df[df['date'] >= datetime.now() - timedelta(days=7)]
        week_count = len(this_week)
        week_target = st.session_state.user_profile.get('weekly_goal', 4)
        st.metric("This Week", week_count, f"Target: {week_target}")
        
        streak = calculate_streak()
        st.metric("Current Streak", f"{streak} days")
    
    # Charts
    col1, col2 = st.columns(2)
    
    with col1:
        # Activity distribution
        activity_counts = df['activity'].value_counts()
        fig = px.pie(values=activity_counts.values, names=activity_counts.index, 
                    title="Workout Distribution by Activity")
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Weekly activity
        df['week'] = df['date'].dt.isocalendar().week
        weekly_counts = df.groupby('week').size()
        
        fig = px.bar(x=weekly_counts.index, y=weekly_counts.values, 
                    title="Workouts per Week")
        st.plotly_chart(fig, use_container_width=True)
    
    # Performance trends
    if len(df) > 1:
        st.subheader("📈 Performance Trends")
        
        # Duration over time
        fig = px.line(df, x='date', y='duration', title="Workout Duration Over Time")
        st.plotly_chart(fig, use_container_width=True)
        
        # Activity-specific metrics
        for activity in df['activity'].unique():
            activity_df = df[df['activity'] == activity].copy()
            
            if len(activity_df) > 1:
                st.write(f"**{activity} Progress:**")
                
                if activity == "Running" and 'distance_km' in activity_df.columns:
                    fig = px.line(activity_df, x='date', y='distance_km', 
                                 title=f"{activity} - Distance Progress")
                    st.plotly_chart(fig, use_container_width=True)
                
                elif activity == "Swimming" and 'distance_m' in activity_df.columns:
                    fig = px.line(activity_df, x='date', y='distance_m', 
                                 title=f"{activity} - Distance Progress")
                    st.plotly_chart(fig, use_container_width=True)

def calculate_streak():
    """Calculate current workout streak in days"""
    if not st.session_state.workouts:
        return 0
    
    df = pd.DataFrame(st.session_state.workouts)
    df['date'] = pd.to_datetime(df['date']).dt.date
    
    # Get unique workout dates, sorted descending
    workout_dates = sorted(df['date'].unique(), reverse=True)
    
    if not workout_dates:
        return 0
    
    # Check if there's a workout today or yesterday
    today = datetime.now().date()
    if workout_dates[0] not in [today, today - timedelta(days=1)]:
        return 0
    
    # Count consecutive days
    streak = 0
    current_date = today
    
    for workout_date in workout_dates:
        if workout_date == current_date or workout_date == current_date - timedelta(days=1):
            streak += 1
            current_date = workout_date - timedelta(days=1)
        else:
            break
    
    return streak

def ai_chat_tab():
    st.header("💬 AI Fitness Coach")
    
    # Display chat history
    if st.session_state.chat_history:
        for chat in st.session_state.chat_history:
            st.markdown(f'<div class="user-message"><strong>You:</strong> {chat["user"]}</div>', 
                       unsafe_allow_html=True)
            st.markdown(f'<div class="ai-message"><strong>AI Coach:</strong> {chat["ai"]}</div>', 
                       unsafe_allow_html=True)
    
    # Quick questions
    st.subheader("💡 Quick Questions")
    quick_questions = [
        "How can I improve my running endurance?",
        "What's the best recovery strategy?", 
        "How should I progress my strength training?",
        "What should I eat before/after workouts?",
        "How can I prevent workout injuries?",
        "I'm plateauing, what should I change?"
    ]
    
    cols = st.columns(3)
    for i, question in enumerate(quick_questions):
        with cols[i % 3]:
            if st.button(question, key=f"chat_q_{i}"):
                handle_chat(question)
    
    # Chat input
    user_message = st.text_area("Ask your AI coach:", 
                               placeholder="Ask about training, nutrition, recovery, goals...",
                               height=100)
    
    col1, col2 = st.columns([3, 1])
    with col1:
        if st.button("Send Message", type="primary", disabled=not user_message):
            handle_chat(user_message)
    
    with col2:
        if st.button("Clear Chat"):
            st.session_state.chat_history = []
            st.rerun()

def handle_chat(message):
    # Prepare context
    context_parts = []
    
    if st.session_state.user_profile:
        profile = st.session_state.user_profile
        context_parts.append(f"User: {profile.get('fitness_level')} level, focuses on {profile.get('primary_activities', [])}")
    
    if st.session_state.goals:
        goals_text = "; ".join([f"{k}: {v['specific_goal']}" for k, v in st.session_state.goals.items()])
        context_parts.append(f"Current goals: {goals_text}")
    
    if st.session_state.workouts:
        recent_workouts = len([w for w in st.session_state.workouts[-7:] if w.get('completed')])
        context_parts.append(f"Recent activity: {recent_workouts} workouts in last 7 entries")
    
    context = ". ".join(context_parts)
    
    # Get AI response
    with st.spinner("🤔 AI is thinking..."):
        ai_response = get_ai_response(message, context)
    
    # Add to chat history
    st.session_state.chat_history.append({
        'user': message,
        'ai': ai_response,
        'timestamp': datetime.now().isoformat()
    })
    
    st.rerun()

if __name__ == "__main__":
    if not os.getenv('OPENAI_API_KEY'):
        st.error("""
        🚫 **OpenAI API Key Required**
        
        Please create a `.env` file with:
        ```
        OPENAI_API_KEY=your_api_key_here
        ```
        """)
        st.stop()
    
    main()