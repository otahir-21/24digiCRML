import streamlit as st
import openai
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from data_manager import DataManager
from wearable_simulator import WearableSimulator
import json
import time

load_dotenv()

st.set_page_config(
    page_title="AI Fitness Coach Pro",
    page_icon="💪",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Enhanced Custom CSS
st.markdown("""
<style>
    /* Hide sidebar */
    .css-1d391kg {display: none}
    
    /* Main container styling */
    .main .block-container {
        padding-top: 2rem;
        padding-left: 2rem;
        padding-right: 2rem;
    }
    
    /* Navigation tabs */
    .nav-tabs {
        display: flex;
        justify-content: center;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .nav-tab {
        background: rgba(255,255,255,0.1);
        color: white;
        padding: 12px 24px;
        margin: 0 8px;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        font-weight: 500;
        border: 2px solid transparent;
    }
    
    .nav-tab:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-2px);
    }
    
    .nav-tab.active {
        background: white;
        color: #667eea;
        border: 2px solid #667eea;
        transform: scale(1.05);
    }
    
    /* Main header */
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 20px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }
    
    /* Card styling */
    .fitness-card {
        background: white;
        padding: 1.5rem;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        border-left: 5px solid #667eea;
        margin: 1rem 0;
        transition: transform 0.3s ease;
    }
    
    .fitness-card:hover {
        transform: translateY(-5px);
    }
    
    .wearable-card {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        padding: 1.5rem;
        border-radius: 15px;
        color: white;
        margin: 1rem 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .metric-big {
        font-size: 2.5rem;
        font-weight: bold;
        color: #667eea;
        text-align: center;
        margin: 0.5rem 0;
    }
    
    .metric-label {
        text-align: center;
        color: #666;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    /* Coaching response */
    .coaching-panel {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 20px;
        color: white;
        margin: 2rem 0;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    
    /* Buttons */
    .stButton > button {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 12px 24px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    }
    
    /* Real-time indicator */
    .live-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        background: #00ff00;
        border-radius: 50%;
        animation: pulse 2s infinite;
        margin-right: 8px;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
    }
    
    /* Device status */
    .device-status {
        background: rgba(255,255,255,0.1);
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class EnhancedFitnessCoach:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.data_manager = DataManager()
        self.wearable = WearableSimulator()
        
    def get_enhanced_coaching_response(self, user_data, goal, activity_type, current_stats=None, wearable_data=None):
        wearable_context = ""
        if wearable_data:
            wearable_context = f"""
            
            WEARABLE DEVICE DATA:
            • Daily Steps: {wearable_data.get('steps', 0):,}
            • Calories Burned: {wearable_data.get('calories_burned', 0):,}
            • Active Minutes: {wearable_data.get('active_minutes', 0)}
            • Resting HR: {wearable_data.get('heart_rate', {}).get('resting', 0)} bpm
            • Average HR: {wearable_data.get('heart_rate', {}).get('average', 0)} bpm
            • Sleep Score: {wearable_data.get('sleep', {}).get('sleep_score', 0)}/100
            • Sleep Hours: {wearable_data.get('sleep', {}).get('total_hours', 0)}h
            """
        
        prompt = f"""
        You are a world-class fitness coach with access to advanced wearable technology data.
        
        ATHLETE PROFILE:
        • Age: {user_data.get('age')} | Weight: {user_data.get('weight')}kg | Height: {user_data.get('height')}cm
        • Fitness Level: {user_data.get('fitness_level')}
        • Goal: {goal}
        • Sport Focus: {activity_type}
        
        CURRENT PERFORMANCE: {current_stats if current_stats else 'Assessment needed'}
        
        {wearable_context}
        
        Based on this comprehensive data, provide expert coaching structured as:
        
        ## 🎯 DATA ANALYSIS
        [Analyze wearable metrics and performance correlation]
        
        ## 📋 PERSONALIZED TRAINING PLAN
        [Weekly structure with specific targets]
        
        ## 💓 HEART RATE TRAINING
        [Zone-specific recommendations based on current HR data]
        
        ## 😴 RECOVERY OPTIMIZATION
        [Sleep and recovery strategies based on current patterns]
        
        ## 📊 PERFORMANCE TARGETS
        [Specific metrics to improve based on wearable data]
        
        ## ⚡ IMMEDIATE ACTION ITEMS
        [3 specific things to focus on this week]
        
        Make it actionable and data-driven!
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
            return f"🚫 **Coaching Service Error**: {str(e)}"

def init_session_state():
    if 'user_id' not in st.session_state:
        st.session_state.user_id = "user_001"
    if 'data_manager' not in st.session_state:
        st.session_state.data_manager = DataManager()
    if 'coach' not in st.session_state:
        st.session_state.coach = EnhancedFitnessCoach()
    if 'wearable' not in st.session_state:
        st.session_state.wearable = WearableSimulator()
    if 'current_page' not in st.session_state:
        st.session_state.current_page = "Dashboard"

def create_navigation():
    """Create horizontal navigation tabs"""
    pages = [
        ("🏠 Dashboard", "Dashboard"),
        ("⌚ Wearable Data", "Wearable"),
        ("👤 Profile", "Profile"),
        ("🎯 Goals", "Goals"),
        ("🏃‍♂️ Running", "Running"),
        ("🏊‍♀️ Swimming", "Swimming"),
        ("💪 Strength", "Strength"),
        ("📈 Analytics", "Analytics")
    ]
    
    # Create navigation HTML
    nav_html = '<div class="nav-tabs">'
    for display_name, page_name in pages:
        active_class = "active" if st.session_state.current_page == page_name else ""
        nav_html += f'<div class="nav-tab {active_class}" onclick="window.location.reload()">{display_name}</div>'
    nav_html += '</div>'
    
    st.markdown(nav_html, unsafe_allow_html=True)
    
    # Navigation selection
    col1, col2, col3, col4 = st.columns(4)
    cols = [col1, col2, col3, col4]
    
    for i, (display_name, page_name) in enumerate(pages):
        with cols[i % 4]:
            if st.button(display_name.replace("🏠 ", "").replace("⌚ ", "").replace("👤 ", "").replace("🎯 ", "").replace("🏃‍♂️ ", "").replace("🏊‍♀️ ", "").replace("💪 ", "").replace("📈 ", ""), key=f"nav_{page_name}"):
                st.session_state.current_page = page_name
                st.rerun()

def main():
    init_session_state()
    
    # Main header
    st.markdown("""
    <div class="main-header">
        <h1>🏆 AI Fitness Coach Pro</h1>
        <p>Elite Personal Training with Advanced Wearable Integration</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation
    create_navigation()
    
    # Route to pages
    if st.session_state.current_page == "Dashboard":
        dashboard_page()
    elif st.session_state.current_page == "Wearable":
        wearable_data_page()
    elif st.session_state.current_page == "Profile":
        profile_page()
    elif st.session_state.current_page == "Goals":
        goals_page()
    elif st.session_state.current_page == "Running":
        coaching_page("Running")
    elif st.session_state.current_page == "Swimming":
        coaching_page("Swimming")
    elif st.session_state.current_page == "Strength":
        coaching_page("Strength Training")
    elif st.session_state.current_page == "Analytics":
        analytics_page()

def dashboard_page():
    st.header("🏠 Dashboard Overview")
    
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    if not user_profile:
        st.warning("⚠️ Complete your profile setup to unlock the full dashboard!")
        return
    
    # Real-time metrics from wearable
    col1, col2, col3 = st.columns(3)
    
    # Simulate real-time data
    realtime_data = st.session_state.wearable.get_realtime_metrics()
    daily_data = st.session_state.wearable.simulate_daily_activity(user_profile)
    
    with col1:
        st.markdown(f"""
        <div class="fitness-card">
            <div class="metric-big">{realtime_data['steps_today']:,}</div>
            <div class="metric-label">Steps Today</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="fitness-card">
            <div class="metric-big">{realtime_data['calories_today']:,}</div>
            <div class="metric-label">Calories Burned</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="fitness-card">
            <div class="metric-big">{realtime_data['current_heart_rate']}</div>
            <div class="metric-label">Current HR (bpm)</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Goals progress
    user_goals = st.session_state.data_manager.load_user_goals(st.session_state.user_id)
    if user_goals:
        st.markdown(f"""
        <div class="fitness-card">
            <h3>🎯 Current Goal</h3>
            <p><strong>{user_goals['goal']}</strong></p>
            <p>🏃‍♂️ Focus: {user_goals['activity']} | ⏰ Timeline: {user_goals['timeline']}</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Quick workout logger
    st.subheader("⚡ Quick Workout Log")
    quick_log_workout()

def wearable_data_page():
    st.header("⌚ Wearable Device Data")
    
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    
    # Device connection status
    devices = [
        "Apple Watch Series 9",
        "Fitbit Charge 6", 
        "Garmin Forerunner 955",
        "Samsung Galaxy Watch 6"
    ]
    
    selected_device = st.selectbox("🔗 Connected Device:", devices)
    
    # Live connection indicator
    st.markdown(f"""
    <div class="wearable-card">
        <h3><span class="live-indicator"></span>Device Status: Connected</h3>
        <div class="device-status">
            <p><strong>Device:</strong> {selected_device}</p>
            <p><strong>Battery:</strong> {st.session_state.wearable.get_realtime_metrics()['battery_level']}%</p>
            <p><strong>Last Sync:</strong> Just now</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Real-time metrics
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📊 Today's Activity")
        daily_data = st.session_state.wearable.simulate_daily_activity(user_profile)
        
        metrics_html = f"""
        <div class="fitness-card">
            <h4>Activity Summary</h4>
            <p>📍 Steps: <strong>{daily_data['steps']:,}</strong></p>
            <p>🔥 Calories: <strong>{daily_data['calories_burned']:,}</strong></p>
            <p>⏱️ Active Minutes: <strong>{daily_data['active_minutes']}</strong></p>
            <p>📏 Distance: <strong>{daily_data['distance_km']} km</strong></p>
        </div>
        """
        st.markdown(metrics_html, unsafe_allow_html=True)
        
        # Heart Rate Zones
        st.subheader("💓 Heart Rate Zones")
        zones_data = daily_data['zones']
        
        fig = go.Figure(data=[
            go.Bar(
                x=['Fat Burn', 'Cardio', 'Peak'],
                y=[zones_data['fat_burn'], zones_data['cardio'], zones_data['peak']],
                marker_color=['#FFA500', '#FF6B6B', '#FF0000']
            )
        ])
        fig.update_layout(title="Time in Heart Rate Zones (minutes)", height=400)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("😴 Sleep Analysis")
        sleep_data = daily_data['sleep']
        
        sleep_html = f"""
        <div class="fitness-card">
            <h4>Sleep Quality</h4>
            <p>🛌 Total Sleep: <strong>{sleep_data['total_hours']} hours</strong></p>
            <p>🌙 Deep Sleep: <strong>{sleep_data['deep_sleep']} hours</strong></p>
            <p>🧠 REM Sleep: <strong>{sleep_data['rem_sleep']} hours</strong></p>
            <p>💤 Light Sleep: <strong>{sleep_data['light_sleep']} hours</strong></p>
            <p>⭐ Sleep Score: <strong>{sleep_data['sleep_score']}/100</strong></p>
        </div>
        """
        st.markdown(sleep_html, unsafe_allow_html=True)
        
        # Sleep stages pie chart
        fig = go.Figure(data=[go.Pie(
            labels=['Deep Sleep', 'REM Sleep', 'Light Sleep'],
            values=[sleep_data['deep_sleep'], sleep_data['rem_sleep'], sleep_data['light_sleep']],
            hole=.3,
            marker_colors=['#4CAF50', '#2196F3', '#FFC107']
        )])
        fig.update_layout(title="Sleep Stages Distribution", height=400)
        st.plotly_chart(fig, use_container_width=True)
    
    # Historical data
    if st.button("📈 Load Historical Data (30 days)"):
        with st.spinner("Fetching wearable data..."):
            historical_data = st.session_state.wearable.simulate_historical_data(30, user_profile)
            
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'])
            
            # Steps trend
            fig = px.line(df, x='date', y='steps', title="Daily Steps Trend (30 days)")
            st.plotly_chart(fig, use_container_width=True)
            
            # Activity correlation
            col3, col4 = st.columns(2)
            with col3:
                fig = px.scatter(df, x='steps', y='calories_burned', 
                               title="Steps vs Calories Correlation")
                st.plotly_chart(fig, use_container_width=True)
            
            with col4:
                fig = px.bar(df.tail(7), x='date', y='active_minutes', 
                           title="Active Minutes (Last 7 days)")
                st.plotly_chart(fig, use_container_width=True)

def coaching_page(activity_type):
    icon = "🏊‍♀️" if activity_type == "Swimming" else "🏃‍♂️" if activity_type == "Running" else "💪"
    st.header(f"{icon} {activity_type} Coaching")
    
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    user_goals = st.session_state.data_manager.load_user_goals(st.session_state.user_id)
    
    if not user_profile:
        st.warning("⚠️ Complete your profile first!")
        return
    
    if not user_goals or user_goals.get('activity') != activity_type:
        st.warning(f"⚠️ Set a {activity_type} goal first!")
        return
    
    # Get wearable data for coaching
    daily_data = st.session_state.wearable.simulate_daily_activity(user_profile)
    
    # Performance input
    current_stats = get_performance_input(activity_type)
    
    if st.button(f"🚀 Get AI Coaching Plan", type="primary"):
        with st.spinner("🧠 Analyzing wearable data and generating coaching plan..."):
            # Simulate getting a recent workout
            if st.button("📲 Sync Recent Workout", help="Fetch latest workout from wearable"):
                workout_data = st.session_state.wearable.simulate_workout_session(
                    activity_type, 45, user_profile
                )
                st.success("✅ Workout data synced!")
                st.json(workout_data)
            
            coaching_advice = st.session_state.coach.get_enhanced_coaching_response(
                user_profile,
                user_goals['goal'],
                activity_type,
                current_stats,
                daily_data
            )
            
            st.markdown(f"""
            <div class="coaching-panel">
                <h2>🏆 Your AI Coaching Plan - {activity_type}</h2>
                <p><em>Based on your wearable data and performance metrics</em></p>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(coaching_advice)

def get_performance_input(activity_type):
    if activity_type == "Running":
        col1, col2 = st.columns(2)
        with col1:
            distance = st.number_input("Recent distance (km)", 0.0, 50.0, 5.0, 0.1)
            time = st.number_input("Time (minutes)", 0, 300, 30)
        with col2:
            effort = st.slider("Perceived effort (1-10)", 1, 10, 7)
            frequency = st.number_input("Runs per week", 0, 10, 3)
        
        return f"Recent: {distance}km in {time}min, RPE: {effort}/10, Frequency: {frequency}/week"
    
    elif activity_type == "Swimming":
        col1, col2 = st.columns(2)
        with col1:
            distance = st.number_input("Distance (m)", 0, 5000, 1000, 50)
            time = st.number_input("Time (minutes)", 0, 120, 40)
        with col2:
            stroke = st.selectbox("Primary stroke", ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"])
            frequency = st.number_input("Sessions per week", 0, 7, 2)
        
        return f"Recent: {distance}m in {time}min ({stroke}), Frequency: {frequency}/week"
    
    else:  # Strength Training
        col1, col2 = st.columns(2)
        with col1:
            bench = st.number_input("Bench Press (kg)", 0, 300, 60)
            squat = st.number_input("Squat (kg)", 0, 400, 80)
        with col2:
            deadlift = st.number_input("Deadlift (kg)", 0, 500, 100)
            frequency = st.number_input("Sessions per week", 0, 7, 3)
        
        return f"Lifts: Bench {bench}kg, Squat {squat}kg, DL {deadlift}kg, Frequency: {frequency}/week"

def quick_log_workout():
    with st.form("quick_workout"):
        col1, col2, col3 = st.columns(3)
        
        with col1:
            activity = st.selectbox("Activity", ["Running", "Swimming", "Strength Training"])
            duration = st.number_input("Duration (min)", 5, 300, 30)
        
        with col2:
            intensity = st.slider("Intensity (1-10)", 1, 10, 5)
            notes = st.text_input("Quick notes")
        
        with col3:
            st.write("")  # Spacing
            st.write("")  # Spacing
            submitted = st.form_submit_button("💾 Log Workout", type="primary")
        
        if submitted:
            workout_data = {
                'activity': activity,
                'duration': duration,
                'intensity': intensity,
                'notes': notes,
                'date': datetime.now().date().isoformat()
            }
            st.session_state.data_manager.save_workout(st.session_state.user_id, workout_data)
            st.success("✅ Workout logged!")
            time.sleep(1)
            st.rerun()

def profile_page():
    st.header("👤 Profile Management")
    
    existing_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    
    with st.form("profile_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Basic Info")
            age = st.number_input("Age", 16, 80, existing_profile.get('age', 25))
            weight = st.number_input("Weight (kg)", 40, 200, existing_profile.get('weight', 70))
            height = st.number_input("Height (cm)", 140, 220, existing_profile.get('height', 170))
        
        with col2:
            st.subheader("Fitness Profile")
            fitness_level = st.selectbox("Fitness Level", 
                ["Beginner", "Intermediate", "Advanced", "Elite"],
                index=["Beginner", "Intermediate", "Advanced", "Elite"].index(
                    existing_profile.get('fitness_level', 'Beginner')))
            
            experience = st.multiselect("Experience", 
                ["Running", "Swimming", "Weight Training", "Cycling", "Yoga"],
                default=existing_profile.get('experience', []))
        
        injuries = st.text_area("Injuries/Limitations", 
                               value=existing_profile.get('injuries', ''))
        
        submitted = st.form_submit_button("💾 Save Profile", type="primary")
        
        if submitted:
            profile_data = {
                'age': age, 'weight': weight, 'height': height,
                'fitness_level': fitness_level, 'experience': experience,
                'injuries': injuries
            }
            st.session_state.data_manager.save_user_profile(st.session_state.user_id, profile_data)
            st.success("✅ Profile saved!")
            st.balloons()

def goals_page():
    st.header("🎯 Goal Management")
    
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    if not user_profile:
        st.warning("⚠️ Complete your profile first!")
        return
    
    existing_goals = st.session_state.data_manager.load_user_goals(st.session_state.user_id)
    
    with st.form("goals_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            activity = st.selectbox("Primary Focus", 
                ["Running", "Swimming", "Strength Training"])
            
            goals_map = {
                "Running": ["Complete 5K race", "Complete 10K race", "Half marathon", "Marathon", "Improve 5K time"],
                "Swimming": ["Learn technique", "Swim 1000m", "Master all strokes", "Compete locally", "Improve speed"],
                "Strength Training": ["Build muscle", "Increase bench press", "Squat bodyweight", "Powerlifting prep", "Functional fitness"]
            }
            
            goal = st.selectbox("Specific Goal", goals_map[activity])
        
        with col2:
            timeline = st.selectbox("Timeline", ["3 months", "6 months", "1 year", "2+ years"])
            motivation = st.text_area("Why is this important?")
        
        submitted = st.form_submit_button("🎯 Set Goal", type="primary")
        
        if submitted:
            goals_data = {
                'activity': activity, 'goal': goal, 'timeline': timeline,
                'motivation': motivation, 'set_date': datetime.now().isoformat()
            }
            st.session_state.data_manager.save_user_goals(st.session_state.user_id, goals_data)
            st.success("✅ Goal set!")
            st.balloons()

def analytics_page():
    st.header("📈 Performance Analytics")
    
    workouts = st.session_state.data_manager.load_workouts(st.session_state.user_id)
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    
    if not workouts and user_profile:
        # Generate some sample wearable data for demonstration
        st.info("📊 Generating sample analytics from wearable data...")
        
        historical_data = st.session_state.wearable.simulate_historical_data(30, user_profile)
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        
        col1, col2 = st.columns(2)
        
        with col1:
            fig = px.line(df, x='date', y='steps', title="Daily Steps Trend")
            st.plotly_chart(fig, use_container_width=True)
            
            fig = px.bar(df.tail(7), x='date', y='calories_burned', title="Weekly Calories")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            fig = px.line(df, x='date', y='active_minutes', title="Active Minutes Trend")
            st.plotly_chart(fig, use_container_width=True)
            
            # Heart rate analysis
            hr_data = [d['heart_rate']['average'] for d in historical_data]
            fig = go.Figure(data=go.Scatter(x=df['date'], y=hr_data, mode='lines+markers'))
            fig.update_layout(title="Average Heart Rate Trend", xaxis_title="Date", yaxis_title="HR (bpm)")
            st.plotly_chart(fig, use_container_width=True)
        
        return
    
    if not workouts:
        st.warning("📊 No workout data available for analysis.")
        return
    
    # Regular workout analytics would go here
    st.info("📊 Workout analytics coming soon...")

if __name__ == "__main__":
    if not os.getenv('OPENAI_API_KEY'):
        st.error("🚫 **OpenAI API Key Required**\n\nPlease set your OPENAI_API_KEY in the .env file")
        st.stop()
    
    main()