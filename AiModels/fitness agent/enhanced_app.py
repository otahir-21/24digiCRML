import streamlit as st
import openai
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from data_manager import DataManager
import json

load_dotenv()

st.set_page_config(
    page_title="AI Fitness Coach Pro",
    page_icon="💪",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-left: 4px solid #667eea;
    }
    
    .goal-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        margin: 1rem 0;
    }
    
    .workout-card {
        background: #f8f9ff;
        padding: 1rem;
        border-radius: 8px;
        margin: 0.5rem 0;
        border-left: 3px solid #667eea;
    }
    
    .coaching-response {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 10px;
        color: white;
        margin: 1rem 0;
    }
    
    .sidebar .sidebar-content {
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    }
</style>
""", unsafe_allow_html=True)

class EnhancedFitnessCoach:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.data_manager = DataManager()
        
    def get_enhanced_coaching_response(self, user_data, goal, activity_type, current_stats=None, workout_history=None):
        # Enhanced prompt for better fitness-focused responses
        prompt = f"""
        You are a world-class fitness coach with 20+ years of experience specializing in {activity_type}. 
        You've coached Olympic athletes and helped thousands achieve their fitness goals.
        
        ATHLETE PROFILE:
        • Age: {user_data.get('age')} years
        • Weight: {user_data.get('weight')} kg | Height: {user_data.get('height')} cm
        • Current Fitness Level: {user_data.get('fitness_level')}
        • Experience: {user_data.get('experience', 'Not specified')}
        • Injuries/Limitations: {user_data.get('injuries', 'None reported')}
        
        GOAL: {goal}
        SPORT FOCUS: {activity_type}
        
        CURRENT PERFORMANCE: {current_stats if current_stats else 'Baseline assessment needed'}
        
        RECENT TRAINING HISTORY: {workout_history if workout_history else 'No previous training data'}
        
        Provide a comprehensive coaching response structured as follows:
        
        ## 🎯 ASSESSMENT & ANALYSIS
        [Analyze current fitness level and goal alignment]
        
        ## 📅 WEEKLY TRAINING PLAN
        [Specific weekly schedule with sessions, intensity, and duration]
        
        ## 🔧 TECHNIQUE FOCUS
        [Key technique improvements and form cues]
        
        ## 🥗 NUTRITION STRATEGY
        [Specific nutrition recommendations for this goal]
        
        ## 💤 RECOVERY PROTOCOL
        [Sleep, rest days, and recovery methods]
        
        ## 📈 PROGRESS MILESTONES
        [Specific benchmarks and timeline expectations]
        
        ## ⚠️ INJURY PREVENTION
        [Specific exercises and precautions]
        
        ## 🧠 MENTAL GAME
        [Motivation and mindset strategies]
        
        Keep the tone motivational, professional, and specific to {activity_type}.
        Include exact numbers, percentages, and measurable targets.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"🚫 **Coaching Service Temporarily Unavailable**\n\nError: {str(e)}\n\nPlease check your OpenAI API key and try again."

def init_session_state():
    if 'user_id' not in st.session_state:
        st.session_state.user_id = "user_001"  # In a real app, this would be authentication-based
    if 'data_manager' not in st.session_state:
        st.session_state.data_manager = DataManager()
    if 'coach' not in st.session_state:
        st.session_state.coach = EnhancedFitnessCoach()

def main():
    init_session_state()
    
    # Main header
    st.markdown("""
    <div class="main-header">
        <h1>🏆 AI Fitness Coach Pro</h1>
        <p>Your Elite Personal Trainer for Running, Swimming & Strength Training</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Sidebar navigation
    st.sidebar.title("🎯 Navigation")
    
    # Load user data for navigation context
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    user_goals = st.session_state.data_manager.load_user_goals(st.session_state.user_id)
    
    # Show quick stats in sidebar if available
    if user_profile:
        st.sidebar.success(f"👤 {user_profile.get('fitness_level', 'Unknown')} Level")
    if user_goals:
        st.sidebar.info(f"🎯 Goal: {user_goals.get('goal', 'Not set')}")
    
    page = st.sidebar.selectbox("Choose Section:", [
        "🏠 Dashboard",
        "👤 Profile Setup", 
        "🎯 Goal Setting", 
        "🏃‍♂️ Running Coach", 
        "🏊‍♀️ Swimming Coach", 
        "💪 Strength Coach",
        "📈 Progress Analytics",
        "📊 Workout History"
    ])
    
    # Route to appropriate page
    if page == "🏠 Dashboard":
        dashboard()
    elif page == "👤 Profile Setup":
        profile_setup()
    elif page == "🎯 Goal Setting":
        goal_setting()
    elif page == "🏃‍♂️ Running Coach":
        enhanced_coaching_interface("Running")
    elif page == "🏊‍♀️ Swimming Coach":
        enhanced_coaching_interface("Swimming")
    elif page == "💪 Strength Coach":
        enhanced_coaching_interface("Strength Training")
    elif page == "📈 Progress Analytics":
        progress_analytics()
    elif page == "📊 Workout History":
        workout_history()

def dashboard():
    st.header("🏠 Dashboard")
    
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    user_goals = st.session_state.data_manager.load_user_goals(st.session_state.user_id)
    
    if not user_profile:
        st.warning("⚠️ Please complete your profile setup to get started!")
        if st.button("Set Up Profile Now"):
            st.rerun()
        return
    
    # Welcome message
    st.success(f"Welcome back! 👋")
    
    # Current goal display
    if user_goals:
        goal_html = f"""
        <div class="goal-card">
            <h3>🎯 Current Goal</h3>
            <p><strong>{user_goals['goal']}</strong></p>
            <p>📅 Timeline: {user_goals['timeline']}</p>
            <p>🏃‍♂️ Focus: {user_goals['activity']}</p>
        </div>
        """
        st.markdown(goal_html, unsafe_allow_html=True)
    
    # Quick stats
    col1, col2, col3, col4 = st.columns(4)
    
    workouts = st.session_state.data_manager.load_workouts(st.session_state.user_id)
    total_workouts = len(workouts)
    
    # Calculate streak
    streak = calculate_workout_streak(workouts)
    
    with col1:
        st.metric("Total Workouts", total_workouts, delta=None)
    
    with col2:
        st.metric("Current Streak", f"{streak} days", delta=None)
    
    with col3:
        if workouts:
            last_workout = max(workouts, key=lambda x: x['date'])
            days_since = (datetime.now() - datetime.fromisoformat(last_workout['date'])).days
            st.metric("Last Workout", f"{days_since} days ago")
        else:
            st.metric("Last Workout", "Never")
    
    with col4:
        if user_goals:
            goal_start = datetime.fromisoformat(user_goals['set_date'])
            days_on_goal = (datetime.now() - goal_start).days
            st.metric("Days on Goal", days_on_goal)
    
    # Recent activity chart
    if workouts:
        st.subheader("📈 Recent Activity")
        df = pd.DataFrame(workouts)
        df['date'] = pd.to_datetime(df['date'])
        
        # Group by date and count workouts
        daily_counts = df.groupby(df['date'].dt.date).size().reset_index()
        daily_counts.columns = ['Date', 'Workouts']
        
        fig = px.bar(daily_counts.tail(14), x='Date', y='Workouts', 
                    title="Workouts per Day (Last 2 Weeks)")
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)

def calculate_workout_streak(workouts):
    if not workouts:
        return 0
    
    df = pd.DataFrame(workouts)
    df['date'] = pd.to_datetime(df['date']).dt.date
    unique_dates = sorted(df['date'].unique(), reverse=True)
    
    if not unique_dates:
        return 0
    
    streak = 0
    current_date = datetime.now().date()
    
    for workout_date in unique_dates:
        if (current_date - workout_date).days == streak:
            streak += 1
        elif (current_date - workout_date).days == streak + 1:
            streak += 1
        else:
            break
    
    return streak

def profile_setup():
    st.header("👤 Profile Setup")
    
    # Load existing profile
    existing_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Basic Information")
        age = st.number_input("Age", min_value=16, max_value=80, 
                             value=existing_profile.get('age', 25))
        weight = st.number_input("Weight (kg)", min_value=40, max_value=200, 
                                value=existing_profile.get('weight', 70))
        height = st.number_input("Height (cm)", min_value=140, max_value=220, 
                                value=existing_profile.get('height', 170))
        
        # Calculate and display BMI
        if height > 0 and weight > 0:
            bmi = weight / ((height/100) ** 2)
            bmi_category = get_bmi_category(bmi)
            st.info(f"BMI: {bmi:.1f} ({bmi_category})")
    
    with col2:
        st.subheader("Fitness Profile")
        fitness_level = st.selectbox("Current Fitness Level", [
            "Beginner", "Intermediate", "Advanced", "Elite"
        ], index=["Beginner", "Intermediate", "Advanced", "Elite"].index(
            existing_profile.get('fitness_level', 'Beginner')))
        
        experience = st.multiselect("Experience with:", [
            "Running", "Swimming", "Weight Training", "Cardio", "Yoga", "Cycling"
        ], default=existing_profile.get('experience', []))
        
        injuries = st.text_area("Injuries or health conditions:", 
                               value=existing_profile.get('injuries', ''),
                               placeholder="Describe any limitations or past injuries...")
    
    if st.button("💾 Save Profile", type="primary"):
        profile_data = {
            'age': age,
            'weight': weight,
            'height': height,
            'fitness_level': fitness_level,
            'injuries': injuries,
            'experience': experience,
            'bmi': round(bmi, 1) if height > 0 and weight > 0 else None
        }
        st.session_state.data_manager.save_user_profile(st.session_state.user_id, profile_data)
        st.success("✅ Profile saved successfully!")
        st.balloons()

def get_bmi_category(bmi):
    if bmi < 18.5:
        return "Underweight"
    elif bmi < 25:
        return "Normal weight"
    elif bmi < 30:
        return "Overweight"
    else:
        return "Obese"

def goal_setting():
    st.header("🎯 Goal Setting")
    
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    if not user_profile:
        st.warning("⚠️ Please complete your profile setup first!")
        return
    
    # Load existing goals
    existing_goals = st.session_state.data_manager.load_user_goals(st.session_state.user_id)
    
    col1, col2 = st.columns(2)
    
    with col1:
        activity = st.selectbox("Choose your primary focus:", [
            "Running", "Swimming", "Strength Training"
        ], index=0 if not existing_goals else 
        ["Running", "Swimming", "Strength Training"].index(existing_goals.get('activity', 'Running')))
    
    with col2:
        timeline = st.selectbox("Timeline to achieve goal:", [
            "3 months", "6 months", "1 year", "2+ years"
        ], index=0 if not existing_goals else 
        ["3 months", "6 months", "1 year", "2+ years"].index(existing_goals.get('timeline', '3 months')))
    
    goals = {
        "Running": [
            "Complete my first 5K race",
            "Complete a 10K race under 60 minutes", 
            "Complete a half marathon (21K)",
            "Complete a full marathon (42K)",
            "Improve my 5K time by 2 minutes",
            "Run consistently 3x per week",
            "Build base running endurance"
        ],
        "Swimming": [
            "Learn proper freestyle technique",
            "Swim 1000m continuously",
            "Master all four swimming strokes",
            "Compete in a local swim meet",
            "Improve my 100m freestyle time",
            "Build swimming endurance",
            "Become a competitive swimmer"
        ],
        "Strength Training": [
            "Build overall muscle mass",
            "Increase my bench press by 20kg",
            "Squat my bodyweight",
            "Deadlift 1.5x my bodyweight",
            "Compete in powerlifting",
            "Improve functional fitness",
            "Lose fat while gaining muscle"
        ]
    }
    
    selected_goal = st.selectbox(f"Your {activity} goal:", goals[activity],
                                index=0 if not existing_goals else 
                                goals[activity].index(existing_goals.get('goal', goals[activity][0])) 
                                if existing_goals.get('goal') in goals[activity] else 0)
    
    # Goal details
    st.subheader("📋 Goal Details")
    motivation = st.text_area("Why is this goal important to you?", 
                             value=existing_goals.get('motivation', ''),
                             placeholder="Describe your motivation...")
    
    if st.button("🎯 Set Goal", type="primary"):
        goals_data = {
            'activity': activity,
            'goal': selected_goal,
            'timeline': timeline,
            'motivation': motivation,
            'set_date': datetime.now().isoformat(),
            'status': 'active'
        }
        st.session_state.data_manager.save_user_goals(st.session_state.user_id, goals_data)
        st.success(f"✅ Goal set: {selected_goal} in {timeline}")
        st.balloons()

def enhanced_coaching_interface(activity_type):
    icon = "🏊‍♀️" if activity_type == "Swimming" else "🏃‍♂️" if activity_type == "Running" else "💪"
    st.header(f"{icon} {activity_type} Coach")
    
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    user_goals = st.session_state.data_manager.load_user_goals(st.session_state.user_id)
    
    if not user_profile:
        st.warning("⚠️ Please complete your profile setup first!")
        return
    
    if not user_goals or user_goals.get('activity') != activity_type:
        st.warning(f"⚠️ Please set a {activity_type} goal first!")
        return
    
    # Display current goal
    st.markdown(f"""
    <div class="goal-card">
        <h4>🎯 Your Current Goal</h4>
        <p>{user_goals['goal']}</p>
        <small>Timeline: {user_goals['timeline']}</small>
    </div>
    """, unsafe_allow_html=True)
    
    # Current performance input
    st.subheader("📊 Current Performance Assessment")
    current_stats = get_enhanced_current_stats(activity_type)
    
    # Get workout history for context
    workouts = st.session_state.data_manager.load_workouts(st.session_state.user_id)
    recent_workouts = [w for w in workouts if w['activity'] == activity_type][-5:]
    workout_history = f"Recent {activity_type} sessions: {len(recent_workouts)} in last 30 days" if recent_workouts else "No recent training history"
    
    if st.button(f"🎯 Get {activity_type} Coaching Plan", type="primary"):
        with st.spinner("🧠 Analyzing your profile and generating personalized coaching plan..."):
            advice = st.session_state.coach.get_enhanced_coaching_response(
                user_profile,
                user_goals['goal'],
                activity_type,
                current_stats,
                workout_history
            )
            
            st.markdown(f"""
            <div class="coaching-response">
                <h3>🏆 Your Personalized {activity_type} Coaching Plan</h3>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(advice)
            
            # Save coaching session
            coaching_session = {
                'date': datetime.now().isoformat(),
                'activity': activity_type,
                'goal': user_goals['goal'],
                'advice_generated': True
            }
            # In a real app, you'd save this coaching session

def get_enhanced_current_stats(activity_type):
    if activity_type == "Running":
        col1, col2, col3 = st.columns(3)
        with col1:
            distance = st.number_input("Recent run distance (km)", min_value=0.0, value=5.0, step=0.1)
            time = st.number_input("Time (minutes)", min_value=0, value=30)
        with col2:
            weekly_distance = st.number_input("Weekly distance (km)", min_value=0.0, value=20.0, step=1.0)
            runs_per_week = st.number_input("Runs per week", min_value=0, value=3)
        with col3:
            heart_rate = st.number_input("Avg heart rate (bpm)", min_value=0, value=150)
            perceived_effort = st.slider("Effort level (1-10)", 1, 10, 7)
        
        pace = time / distance if distance > 0 else 0
        return f"""
        Recent Performance: {distance}km in {time} min (pace: {pace:.1f} min/km)
        Weekly Volume: {weekly_distance}km across {runs_per_week} sessions
        Intensity: HR {heart_rate}bpm, RPE {perceived_effort}/10
        """
    
    elif activity_type == "Swimming":
        col1, col2, col3 = st.columns(3)
        with col1:
            distance = st.number_input("Recent swim distance (m)", min_value=0, value=1000, step=50)
            time = st.number_input("Time (minutes)", min_value=0, value=40)
        with col2:
            stroke = st.selectbox("Primary stroke", ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"])
            sessions_per_week = st.number_input("Sessions per week", min_value=0, value=2)
        with col3:
            pool_length = st.selectbox("Pool length", ["25m", "50m"])
            technique_rating = st.slider("Technique confidence (1-10)", 1, 10, 5)
        
        pace_per_100m = (time * 100 / distance) if distance > 0 else 0
        return f"""
        Recent Performance: {distance}m in {time} min ({pace_per_100m:.1f} min/100m)
        Primary Stroke: {stroke} in {pool_length} pool
        Training Frequency: {sessions_per_week} sessions/week
        Technique Level: {technique_rating}/10
        """
    
    else:  # Strength Training
        col1, col2, col3 = st.columns(3)
        with col1:
            bench_press = st.number_input("Bench Press 1RM (kg)", min_value=0, value=60)
            squat = st.number_input("Squat 1RM (kg)", min_value=0, value=80)
        with col2:
            deadlift = st.number_input("Deadlift 1RM (kg)", min_value=0, value=100)
            sessions_per_week = st.number_input("Sessions per week", min_value=0, value=3)
        with col3:
            experience_years = st.number_input("Training experience (years)", min_value=0, value=1)
            training_style = st.selectbox("Training style", ["Powerlifting", "Bodybuilding", "CrossFit", "General Fitness"])
        
        return f"""
        Current Lifts: Bench {bench_press}kg, Squat {squat}kg, Deadlift {deadlift}kg
        Training Frequency: {sessions_per_week} sessions/week
        Experience: {experience_years} years ({training_style} focus)
        """

def progress_analytics():
    st.header("📈 Progress Analytics")
    
    workouts = st.session_state.data_manager.load_workouts(st.session_state.user_id)
    if not workouts:
        st.warning("📊 No workout data found. Start logging workouts to see your progress!")
        return
    
    # Activity filter
    activities = list(set([w['activity'] for w in workouts]))
    selected_activity = st.selectbox("Select Activity:", ["All"] + activities)
    
    # Filter workouts
    if selected_activity != "All":
        filtered_workouts = [w for w in workouts if w['activity'] == selected_activity]
    else:
        filtered_workouts = workouts
    
    if not filtered_workouts:
        st.warning(f"No {selected_activity} workouts found.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(filtered_workouts)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Progress charts
    col1, col2 = st.columns(2)
    
    with col1:
        if 'distance' in df.columns:
            fig = px.line(df, x='date', y='distance', 
                         title=f"{selected_activity} Distance Progress",
                         labels={'distance': 'Distance', 'date': 'Date'})
            fig.update_traces(line_color='#667eea')
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        if 'time' in df.columns:
            fig = px.line(df, x='date', y='time', 
                         title=f"{selected_activity} Duration Progress",
                         labels={'time': 'Time (minutes)', 'date': 'Date'})
            fig.update_traces(line_color='#764ba2')
            st.plotly_chart(fig, use_container_width=True)
    
    # Weekly summary
    st.subheader("📅 Weekly Summary")
    df['week'] = df['date'].dt.isocalendar().week
    df['year'] = df['date'].dt.year
    weekly_stats = df.groupby(['year', 'week']).agg({
        'distance': 'sum',
        'time': 'sum',
        'date': 'count'
    }).rename(columns={'date': 'workouts'})
    
    if not weekly_stats.empty:
        fig = px.bar(weekly_stats.reset_index(), 
                    x='week', y='workouts',
                    title="Workouts per Week")
        st.plotly_chart(fig, use_container_width=True)

def workout_history():
    st.header("📊 Workout History")
    
    # Quick workout logger
    with st.expander("➕ Log New Workout"):
        quick_workout_logger()
    
    workouts = st.session_state.data_manager.load_workouts(st.session_state.user_id)
    if not workouts:
        st.info("📝 No workouts logged yet. Use the form above to log your first workout!")
        return
    
    # Display recent workouts
    st.subheader("Recent Workouts")
    
    for workout in sorted(workouts, key=lambda x: x['date'], reverse=True)[:10]:
        workout_card_html = f"""
        <div class="workout-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>{workout['activity']}</strong> - {workout['date'][:10]}
                    <br>
                    <small>{format_workout_details(workout)}</small>
                </div>
                <div style="color: #667eea; font-size: 1.2em;">
                    {'🏃‍♂️' if workout['activity'] == 'Running' else '🏊‍♀️' if workout['activity'] == 'Swimming' else '💪'}
                </div>
            </div>
        </div>
        """
        st.markdown(workout_card_html, unsafe_allow_html=True)

def quick_workout_logger():
    activity = st.selectbox("Activity:", ["Running", "Swimming", "Strength Training"])
    date = st.date_input("Date:", datetime.now())
    
    workout_data = {'activity': activity, 'date': date.isoformat()}
    
    if activity == "Running":
        col1, col2 = st.columns(2)
        with col1:
            distance = st.number_input("Distance (km)", min_value=0.0, step=0.1)
            time = st.number_input("Duration (minutes)", min_value=0)
        with col2:
            notes = st.text_area("Notes")
        
        workout_data.update({'distance': distance, 'time': time, 'notes': notes})
    
    elif activity == "Swimming":
        col1, col2 = st.columns(2)
        with col1:
            distance = st.number_input("Distance (m)", min_value=0, step=50)
            time = st.number_input("Duration (minutes)", min_value=0)
        with col2:
            stroke = st.selectbox("Primary stroke", ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"])
            notes = st.text_area("Notes")
        
        workout_data.update({'distance': distance, 'time': time, 'stroke': stroke, 'notes': notes})
    
    else:  # Strength Training
        col1, col2 = st.columns(2)
        with col1:
            exercise = st.text_input("Main Exercise")
            weight = st.number_input("Weight (kg)", min_value=0)
        with col2:
            reps = st.number_input("Reps", min_value=0)
            sets = st.number_input("Sets", min_value=0)
        
        notes = st.text_area("Notes")
        volume = weight * reps * sets if weight and reps and sets else 0
        
        workout_data.update({
            'exercise': exercise, 'weight': weight, 'reps': reps, 
            'sets': sets, 'volume': volume, 'notes': notes
        })
    
    if st.button("💾 Log Workout", type="primary"):
        st.session_state.data_manager.save_workout(st.session_state.user_id, workout_data)
        st.success("✅ Workout logged successfully!")
        st.rerun()

def format_workout_details(workout):
    if workout['activity'] == 'Running':
        return f"{workout.get('distance', 0)}km in {workout.get('time', 0)} min"
    elif workout['activity'] == 'Swimming':
        return f"{workout.get('distance', 0)}m in {workout.get('time', 0)} min"
    else:
        return f"{workout.get('exercise', 'Exercise')}: {workout.get('sets', 0)}×{workout.get('reps', 0)} @ {workout.get('weight', 0)}kg"

if __name__ == "__main__":
    if not os.getenv('OPENAI_API_KEY'):
        st.error("🚫 **OpenAI API Key Required**\n\nPlease set your OPENAI_API_KEY in the .env file")
        st.code("OPENAI_API_KEY=your_api_key_here")
        st.stop()
    
    main()