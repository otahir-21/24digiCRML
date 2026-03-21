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
    page_title="AI Fitness Coach",
    page_icon="💪",
    layout="wide"
)

# Clean, minimal CSS
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
    
    .chat-container {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 1rem;
        margin: 1rem 0;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .user-message {
        background: #667eea;
        color: white;
        padding: 0.8rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        text-align: right;
        margin-left: 20%;
    }
    
    .ai-message {
        background: white;
        padding: 0.8rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border-left: 3px solid #667eea;
        margin-right: 20%;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'user_profile' not in st.session_state:
    st.session_state.user_profile = {}
if 'workouts' not in st.session_state:
    st.session_state.workouts = []

# Data management functions
def save_workout(workout_data):
    workout_data['date'] = datetime.now().isoformat()
    st.session_state.workouts.append(workout_data)

def simulate_wearable_data():
    return {
        'steps': random.randint(5000, 15000),
        'calories': random.randint(1800, 2800),
        'heart_rate': random.randint(65, 85),
        'sleep_hours': round(random.uniform(6.5, 9.0), 1),
        'active_minutes': random.randint(30, 120)
    }

# AI Functions
def get_ai_response(message, context=""):
    try:
        prompt = f"""
        You are an expert AI fitness coach with knowledge in running, swimming, and strength training.
        You provide personalized, evidence-based fitness advice.
        
        Context: {context}
        User message: "{message}"
        
        Provide helpful, specific, and actionable fitness advice. Be encouraging but professional.
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
        Create a {weeks}-week {sport} training plan for someone who wants to {goal}.
        Fitness level: {level}
        
        Structure the plan with:
        1. Weekly training schedule
        2. Progressive difficulty over {weeks} weeks
        3. Specific exercises and workouts
        4. Recovery guidelines
        5. Key milestones
        
        Make it practical and easy to follow.
        """
        
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error generating plan: {str(e)}"

def generate_daily_workout(sport, duration, difficulty):
    try:
        prompt = f"""
        Create a {duration}-minute {sport} workout for {difficulty} level.
        
        Include:
        1. Warm-up (5-10 minutes)
        2. Main workout with specific exercises, sets, reps
        3. Cool-down (5-10 minutes)
        4. Key coaching tips
        
        Make it detailed and actionable.
        """
        
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error generating workout: {str(e)}"

def main():
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🏆 AI Fitness Coach</h1>
        <p>Personalized Training Plans • Interactive Coaching • Progress Tracking</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Main navigation
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "🏠 Dashboard",
        "📋 Training Plans", 
        "🏋️ Daily Workouts",
        "💬 AI Coach Chat",
        "📊 Progress & Data"
    ])
    
    with tab1:
        dashboard_tab()
    
    with tab2:
        training_plans_tab()
    
    with tab3:
        daily_workouts_tab()
    
    with tab4:
        ai_chat_tab()
    
    with tab5:
        progress_tab()

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
            <div class="metric-number">{wearable_data['heart_rate']}</div>
            <div>Resting HR</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{len(st.session_state.workouts)}</div>
            <div>Total Workouts</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Quick profile setup
    st.subheader("👤 Your Profile")
    
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
        
        primary_sport = st.selectbox("Primary Focus", 
            ["Running", "Swimming", "Strength Training", "Mixed"],
            index=0 if 'primary_sport' not in st.session_state.user_profile else
            ["Running", "Swimming", "Strength Training", "Mixed"].index(
                st.session_state.user_profile.get('primary_sport', 'Mixed')))
        
        goal = st.selectbox("Main Goal", [
            "Lose weight", "Build muscle", "Improve endurance", 
            "General fitness", "Competition prep"
        ], index=0 if 'goal' not in st.session_state.user_profile else
        ["Lose weight", "Build muscle", "Improve endurance", 
         "General fitness", "Competition prep"].index(
            st.session_state.user_profile.get('goal', 'General fitness')))
    
    if st.button("💾 Save Profile", type="primary"):
        st.session_state.user_profile = {
            'age': age,
            'weight': weight,
            'height': height,
            'fitness_level': fitness_level,
            'primary_sport': primary_sport,
            'goal': goal
        }
        st.success("✅ Profile saved!")

def training_plans_tab():
    st.header("📋 AI Training Plan Generator")
    
    if not st.session_state.user_profile:
        st.warning("⚠️ Please complete your profile in the Dashboard first!")
        return
    
    # Plan parameters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        sport = st.selectbox("Training Focus:", ["Running", "Swimming", "Strength Training"])
        weeks = st.slider("Plan Duration (weeks):", 4, 16, 8)
    
    with col2:
        goal = st.selectbox("Specific Goal:", [
            "Build endurance",
            "Increase strength", 
            "Lose weight",
            "Improve technique",
            "Race preparation",
            "General fitness"
        ])
    
    with col3:
        level = st.session_state.user_profile.get('fitness_level', 'Intermediate')
        st.write(f"**Your Level:** {level}")
        sessions_per_week = st.slider("Sessions per week:", 2, 6, 4)
    
    if st.button("🚀 Generate Training Plan", type="primary"):
        with st.spinner("🧠 AI is creating your personalized training plan..."):
            plan = generate_workout_plan(sport, goal, weeks, level)
            
            st.markdown(f"""
            <div class="fitness-card">
                <h2>🏆 Your {weeks}-Week {sport} Training Plan</h2>
                <p><strong>Goal:</strong> {goal} | <strong>Level:</strong> {level}</p>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(plan)
            
            if st.button("💾 Save Plan"):
                # Save to session state
                st.session_state.current_plan = {
                    'sport': sport,
                    'goal': goal,
                    'weeks': weeks,
                    'plan': plan,
                    'created': datetime.now().isoformat()
                }
                st.success("✅ Training plan saved!")
                st.balloons()

def daily_workouts_tab():
    st.header("🏋️ Daily Workout Generator")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        sport = st.selectbox("Workout Type:", ["Running", "Swimming", "Strength Training", "Cross-training"])
        duration = st.slider("Duration (minutes):", 15, 90, 45)
    
    with col2:
        difficulty = st.selectbox("Difficulty:", ["Beginner", "Intermediate", "Advanced"])
        focus = st.selectbox("Focus Area:", ["Full Body", "Upper Body", "Lower Body", "Cardio", "Flexibility"])
    
    with col3:
        equipment = st.multiselect("Available Equipment:", [
            "Gym access", "Dumbbells", "Resistance bands", 
            "Pool", "Track", "Bodyweight only"
        ], default=["Bodyweight only"])
    
    if st.button("🔥 Generate Today's Workout", type="primary"):
        with st.spinner("🎯 Creating your personalized workout..."):
            workout = generate_daily_workout(sport, duration, difficulty)
            
            st.markdown(f"""
            <div class="fitness-card">
                <h2>💪 Today's {sport} Workout</h2>
                <p><strong>Duration:</strong> {duration} minutes | <strong>Level:</strong> {difficulty}</p>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(workout)
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button("✅ Mark as Completed", type="primary"):
                    workout_data = {
                        'sport': sport,
                        'duration': duration,
                        'difficulty': difficulty,
                        'focus': focus,
                        'completed': True
                    }
                    save_workout(workout_data)
                    st.success("🎉 Great job! Workout completed!")
                    st.balloons()
            
            with col2:
                if st.button("📝 Save for Later"):
                    workout_data = {
                        'sport': sport,
                        'duration': duration,
                        'difficulty': difficulty,
                        'focus': focus,
                        'workout_plan': workout,
                        'completed': False
                    }
                    save_workout(workout_data)
                    st.success("💾 Workout saved!")

def ai_chat_tab():
    st.header("💬 AI Fitness Coach Chat")
    
    # Chat interface
    st.subheader("Ask your AI fitness coach anything!")
    
    # Display chat history
    if st.session_state.chat_history:
        st.markdown('<div class="chat-container">', unsafe_allow_html=True)
        for chat in st.session_state.chat_history:
            st.markdown(f'<div class="user-message"><strong>You:</strong> {chat["user"]}</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="ai-message"><strong>AI Coach:</strong> {chat["ai"]}</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Quick questions
    st.subheader("💡 Quick Questions")
    quick_questions = [
        "What should I eat before a workout?",
        "How can I improve my running form?",
        "I'm feeling sore, should I rest?",
        "How do I prevent workout injuries?",
        "What's the best warmup routine?",
        "How often should I strength train?"
    ]
    
    cols = st.columns(3)
    for i, question in enumerate(quick_questions):
        with cols[i % 3]:
            if st.button(question, key=f"q_{i}"):
                handle_chat(question)
    
    # Manual input
    user_message = st.text_area("Ask your question:", 
                               placeholder="Ask about workouts, nutrition, technique, recovery...",
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
    # Prepare context from user profile
    context = ""
    if st.session_state.user_profile:
        profile = st.session_state.user_profile
        context = f"""
        User profile: {profile.get('fitness_level', 'Unknown')} level, 
        focuses on {profile.get('primary_sport', 'mixed training')}, 
        goal: {profile.get('goal', 'general fitness')}
        """
    
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

def progress_tab():
    st.header("📊 Progress & Wearable Data")
    
    # Wearable data simulation
    st.subheader("⌚ Today's Activity")
    wearable_data = simulate_wearable_data()
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Steps", f"{wearable_data['steps']:,}", "↗️ +1,200 from yesterday")
        st.metric("Active Minutes", wearable_data['active_minutes'], "↗️ +15 from yesterday")
    
    with col2:
        st.metric("Calories Burned", f"{wearable_data['calories']:,}", "↗️ +150 from yesterday")
        st.metric("Sleep", f"{wearable_data['sleep_hours']}h", "↗️ +0.5h from yesterday")
    
    with col3:
        st.metric("Resting Heart Rate", f"{wearable_data['heart_rate']} bpm", "↘️ -2 from yesterday")
        bmi = 22.5  # Sample BMI
        st.metric("BMI", f"{bmi}", "Normal range")
    
    # Workout history
    if st.session_state.workouts:
        st.subheader("📈 Workout History")
        
        # Create DataFrame for analysis
        df = pd.DataFrame(st.session_state.workouts)
        df['date'] = pd.to_datetime(df['date'])
        
        # Workouts by sport
        if len(df) > 0:
            sport_counts = df['sport'].value_counts()
            
            col1, col2 = st.columns(2)
            
            with col1:
                fig = px.pie(values=sport_counts.values, names=sport_counts.index, 
                           title="Workouts by Sport")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                # Recent workouts timeline
                recent_df = df.tail(10).copy()
                fig = px.bar(recent_df, x='date', y='duration', 
                           title="Recent Workout Durations", color='sport')
                st.plotly_chart(fig, use_container_width=True)
        
        # Show recent workouts
        st.subheader("Recent Workouts")
        for workout in reversed(st.session_state.workouts[-5:]):  # Last 5 workouts
            date = datetime.fromisoformat(workout['date']).strftime("%Y-%m-%d %H:%M")
            status = "✅ Completed" if workout.get('completed') else "📝 Saved"
            st.write(f"**{date}** - {workout['sport']} ({workout['duration']}min) - {status}")
    
    else:
        st.info("📝 No workout history yet. Complete some workouts to see your progress!")
    
    # Weekly trend simulation
    st.subheader("📈 Weekly Activity Trend")
    
    # Generate sample weekly data
    dates = [datetime.now().date() - timedelta(days=i) for i in range(6, -1, -1)]
    steps_data = [random.randint(5000, 15000) for _ in range(7)]
    calories_data = [random.randint(1800, 2800) for _ in range(7)]
    
    weekly_df = pd.DataFrame({
        'Date': dates,
        'Steps': steps_data,
        'Calories': calories_data
    })
    
    col1, col2 = st.columns(2)
    
    with col1:
        fig = px.line(weekly_df, x='Date', y='Steps', title="Daily Steps (Last 7 Days)")
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        fig = px.line(weekly_df, x='Date', y='Calories', title="Daily Calories (Last 7 Days)")
        st.plotly_chart(fig, use_container_width=True)

if __name__ == "__main__":
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        st.error("""
        🚫 **OpenAI API Key Required**
        
        Please create a `.env` file in this folder with:
        ```
        OPENAI_API_KEY=your_api_key_here
        ```
        """)
        st.stop()
    
    main()