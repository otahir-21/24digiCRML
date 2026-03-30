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

# Load environment variables
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="AI Fitness Coach",
    page_icon="💪",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .coach-card {
        background: white;
        padding: 1.5rem;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        margin: 1rem 0;
        border-left: 5px solid #667eea;
        transition: transform 0.3s ease;
    }
    
    .coach-card:hover {
        transform: translateY(-5px);
    }
    
    .coach-card.selected {
        border-left: 5px solid #28a745;
        background: linear-gradient(135deg, #f8fffa 0%, #e8f5e8 100%);
    }
    
    .chat-message {
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 10px;
    }
    
    .user-message {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: right;
        margin-left: 20%;
    }
    
    .coach-message {
        background: #f8f9fa;
        border-left: 4px solid #667eea;
        margin-right: 20%;
    }
    
    .plan-section {
        background: white;
        padding: 1.5rem;
        border-radius: 15px;
        margin: 1rem 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
        margin: 0.5rem 0;
    }
    
    .metric-number {
        font-size: 2rem;
        font-weight: bold;
        color: #667eea;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
def init_session_state():
    if 'selected_coach' not in st.session_state:
        st.session_state.selected_coach = None
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    if 'user_profile' not in st.session_state:
        st.session_state.user_profile = {}

# Coach data
COACHES = {
    "mike": {
        "name": "Coach Mike 💪",
        "specialty": "Motivation & Mental Toughness",
        "personality": "High-energy, motivational, pushes you to exceed limits",
        "description": "Former Marine drill instructor turned personal trainer. Believes in pushing through barriers.",
        "best_for": ["Strength Training", "Running"]
    },
    "sarah": {
        "name": "Dr. Sarah 🔬",
        "specialty": "Sports Science & Data Analysis", 
        "personality": "Analytical, evidence-based, methodical",
        "description": "Sports scientist with PhD in Exercise Physiology. Uses cutting-edge research.",
        "best_for": ["Swimming", "Running", "Strength Training"]
    },
    "liu": {
        "name": "Master Liu 🧘‍♂️",
        "specialty": "Mind-Body Connection & Recovery",
        "personality": "Calm, philosophical, focuses on balance",
        "description": "Former Olympic swimmer turned mindfulness coach. Trains mind and body together.",
        "best_for": ["Swimming", "Running"]
    },
    "carlos": {
        "name": "Carlos 'Champion' 🏆",
        "specialty": "Elite Performance & Competition",
        "personality": "Competitive, strategic, winner-focused",
        "description": "Former Olympic coach with 15+ gold medals. Turns athletes into champions.",
        "best_for": ["Running", "Swimming", "Strength Training"]
    },
    "fiona": {
        "name": "Fiona Functional 🤸‍♀️",
        "specialty": "Functional Fitness & Injury Prevention",
        "personality": "Practical, safety-focused, movement-oriented", 
        "description": "Physical therapist turned trainer. Focuses on movement quality and health.",
        "best_for": ["Strength Training", "Running"]
    }
}

# Simple data simulator
def simulate_wearable_data():
    return {
        'steps': random.randint(5000, 15000),
        'calories': random.randint(1800, 2800),
        'heart_rate': random.randint(60, 85),
        'sleep_score': random.randint(70, 95),
        'active_minutes': random.randint(30, 120)
    }

# OpenAI integration
def get_coach_response(message, coach_id, context=""):
    try:
        coach = COACHES.get(coach_id, COACHES["mike"])
        
        prompt = f"""
        You are {coach['name']}, a {coach['specialty']} expert.
        Your personality: {coach['personality']}
        
        Context: {context}
        
        User message: "{message}"
        
        Respond as {coach['name']} would, staying in character. Be helpful, motivational, and provide specific advice.
        Keep responses conversational but informative. Include emojis that match your personality.
        """
        
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.8
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Sorry, I'm having trouble connecting right now. Error: {str(e)}"

def generate_fitness_plan(sport, goal, duration_weeks, coach_id):
    try:
        coach = COACHES.get(coach_id, COACHES["mike"])
        
        prompt = f"""
        You are {coach['name']}, creating a {duration_weeks}-week {sport} training plan.
        
        Goal: {goal}
        Your approach: {coach['personality']}
        
        Create a structured plan with:
        1. Weekly schedule (which days, what type of training)
        2. Progressive intensity over {duration_weeks} weeks
        3. Key exercises/workouts
        4. Recovery recommendations
        5. Nutrition tips
        6. Progress milestones
        
        Format as clear sections with specific guidance in your {coach['name']} coaching style.
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

def generate_daily_workout(sport, difficulty, coach_id):
    try:
        coach = COACHES.get(coach_id, COACHES["mike"])
        
        prompt = f"""
        You are {coach['name']}, creating today's {sport} workout.
        Difficulty: {difficulty}
        Your style: {coach['personality']}
        
        Create a detailed workout with:
        1. Warm-up (5-10 minutes)
        2. Main workout with specific exercises, sets, reps, or duration
        3. Cool-down (5-10 minutes)
        4. Coaching tips in your style
        
        Make it specific to {sport} and {difficulty} level.
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
    init_session_state()
    
    # Header
    st.markdown("""
    <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                padding: 2rem; border-radius: 20px; color: white; margin-bottom: 2rem;">
        <h1>🏆 Interactive AI Fitness Coach</h1>
        <p>Choose Your Coach • Get Personalized Plans • Interactive Training</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "🎭 Coach Selection", 
        "📋 Fitness Planner", 
        "💬 Interactive Chat", 
        "🏋️‍♂️ Daily Workouts",
        "⌚ Wearable Data"
    ])
    
    with tab1:
        coach_selection_tab()
    
    with tab2:
        fitness_planner_tab()
    
    with tab3:
        interactive_chat_tab()
    
    with tab4:
        daily_workouts_tab()
    
    with tab5:
        wearable_data_tab()

def coach_selection_tab():
    st.header("🎭 Choose Your Perfect Coach")
    
    # Show current coach if selected
    if st.session_state.selected_coach:
        current_coach = COACHES[st.session_state.selected_coach]
        st.success(f"Current Coach: {current_coach['name']} - {current_coach['specialty']}")
    
    # Display coaches
    for coach_id, coach_data in COACHES.items():
        is_selected = st.session_state.selected_coach == coach_id
        card_class = "coach-card selected" if is_selected else "coach-card"
        
        st.markdown(f"""
        <div class="{card_class}">
            <h3>{coach_data['name']}</h3>
            <p><strong>Specialty:</strong> {coach_data['specialty']}</p>
            <p><strong>Personality:</strong> {coach_data['personality']}</p>
            <p><strong>Best for:</strong> {', '.join(coach_data['best_for'])}</p>
            <p><em>{coach_data['description']}</em></p>
        </div>
        """, unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button(f"Select {coach_data['name']}", key=f"select_{coach_id}",
                        type="primary" if not is_selected else "secondary"):
                st.session_state.selected_coach = coach_id
                st.success(f"🎉 {coach_data['name']} is now your coach!")
                st.rerun()
        
        with col2:
            if st.button(f"Chat Preview", key=f"preview_{coach_id}"):
                preview_response = get_coach_response(
                    "Hi coach! Tell me about your training philosophy in one sentence.",
                    coach_id
                )
                st.info(f"**{coach_data['name']} says:** {preview_response}")

def fitness_planner_tab():
    st.header("📋 AI Fitness Plan Generator")
    
    if not st.session_state.selected_coach:
        st.warning("⚠️ Please select a coach first!")
        return
    
    current_coach = COACHES[st.session_state.selected_coach]
    st.success(f"🎯 Creating plan with {current_coach['name']}")
    
    # Plan parameters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        sport = st.selectbox("Primary Sport:", ["Running", "Swimming", "Strength Training"])
        duration = st.slider("Plan Duration (weeks):", 4, 16, 8)
    
    with col2:
        goal = st.selectbox("Primary Goal:", [
            "Lose weight and get fit",
            "Build muscle and strength", 
            "Improve endurance",
            "Train for competition",
            "General fitness"
        ])
    
    with col3:
        sessions_per_week = st.slider("Sessions per week:", 2, 6, 3)
        experience = st.selectbox("Experience Level:", ["Beginner", "Intermediate", "Advanced"])
    
    if st.button("🚀 Generate My Plan", type="primary"):
        with st.spinner(f"🧠 {current_coach['name']} is creating your plan..."):
            plan = generate_fitness_plan(sport, goal, duration, st.session_state.selected_coach)
            
            st.markdown(f"""
            <div class="plan-section">
                <h2>🏆 Your Personalized {duration}-Week {sport} Plan</h2>
                <p><em>Created by {current_coach['name']}</em></p>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(plan)
            
            if st.button("💾 Save Plan"):
                st.success("✅ Plan saved!")
                st.balloons()

def interactive_chat_tab():
    st.header("💬 Interactive Coaching Chat")
    
    if not st.session_state.selected_coach:
        st.warning("⚠️ Please select a coach first!")
        return
    
    current_coach = COACHES[st.session_state.selected_coach]
    st.info(f"🤝 Chatting with {current_coach['name']}")
    
    # Display chat history
    chat_container = st.container()
    
    with chat_container:
        # Welcome message if no chat history
        if not st.session_state.chat_history:
            welcome_msg = f"Hello! I'm {current_coach['name']}, your {current_coach['specialty']} coach. How can I help you today?"
            st.markdown(f"""
            <div class="chat-message coach-message">
                <strong>{current_coach['name']}:</strong><br>
                {welcome_msg}
            </div>
            """, unsafe_allow_html=True)
        
        # Display chat history
        for chat in st.session_state.chat_history:
            # User message
            st.markdown(f"""
            <div class="chat-message user-message">
                <strong>You:</strong><br>
                {chat['user']}
            </div>
            """, unsafe_allow_html=True)
            
            # Coach response
            st.markdown(f"""
            <div class="chat-message coach-message">
                <strong>{current_coach['name']}:</strong><br>
                {chat['coach']}
            </div>
            """, unsafe_allow_html=True)
    
    # Quick questions
    st.subheader("💡 Quick Questions")
    quick_questions = [
        "What should I focus on this week?",
        "How can I improve my form?",
        "I'm feeling tired, should I rest?",
        "Can you motivate me for today's workout?",
        "How do I prevent injuries?",
        "What's a good warmup routine?"
    ]
    
    cols = st.columns(3)
    for i, question in enumerate(quick_questions):
        with cols[i % 3]:
            if st.button(question, key=f"quick_{i}"):
                handle_chat_message(question)
    
    # Chat input
    st.subheader("💭 Ask Your Coach")
    user_message = st.text_area("Type your message:", 
                               placeholder="Ask about workouts, nutrition, motivation...",
                               height=100)
    
    col1, col2 = st.columns([3, 1])
    with col1:
        if st.button("Send Message", type="primary", disabled=not user_message):
            handle_chat_message(user_message)
    
    with col2:
        if st.button("Clear Chat"):
            st.session_state.chat_history = []
            st.rerun()

def handle_chat_message(message):
    if not message.strip():
        return
    
    # Get coach response
    with st.spinner("🤔 Coach is thinking..."):
        response = get_coach_response(message, st.session_state.selected_coach)
    
    # Add to chat history
    st.session_state.chat_history.append({
        'user': message,
        'coach': response,
        'timestamp': datetime.now().isoformat()
    })
    
    st.rerun()

def daily_workouts_tab():
    st.header("🏋️‍♂️ Daily Workout Generator")
    
    if not st.session_state.selected_coach:
        st.warning("⚠️ Please select a coach first!")
        return
    
    current_coach = COACHES[st.session_state.selected_coach]
    st.success(f"💪 {current_coach['name']} will create your workout")
    
    # Workout parameters
    col1, col2 = st.columns(2)
    
    with col1:
        sport = st.selectbox("Workout Type:", ["Running", "Swimming", "Strength Training"])
        difficulty = st.selectbox("Difficulty:", ["Beginner", "Intermediate", "Advanced"])
    
    with col2:
        duration = st.slider("Duration (minutes):", 15, 90, 45)
        focus = st.selectbox("Focus:", ["Full Body", "Upper Body", "Lower Body", "Cardio"])
    
    if st.button("🔥 Generate Today's Workout", type="primary"):
        with st.spinner(f"🎯 {current_coach['name']} is designing your workout..."):
            workout = generate_daily_workout(sport, difficulty, st.session_state.selected_coach)
            
            st.markdown(f"""
            <div class="plan-section">
                <h2>💪 Today's {sport} Workout</h2>
                <p><em>Created by {current_coach['name']} | {difficulty} Level | {duration} minutes</em></p>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(workout)
            
            if st.button("✅ Mark as Completed"):
                st.success("🎉 Great job! Workout completed!")
                st.balloons()

def wearable_data_tab():
    st.header("⌚ Wearable Device Data")
    
    # Simulate wearable data
    data = simulate_wearable_data()
    
    st.subheader("📊 Today's Metrics")
    
    # Display metrics
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{data['steps']:,}</div>
            <div>Steps</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{data['calories']:,}</div>
            <div>Calories</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{data['heart_rate']}</div>
            <div>Resting HR</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{data['sleep_score']}</div>
            <div>Sleep Score</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col5:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">{data['active_minutes']}</div>
            <div>Active Min</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Generate sample chart data
    st.subheader("📈 Weekly Trends")
    
    # Sample data for charts
    dates = [datetime.now().date() - timedelta(days=i) for i in range(7, 0, -1)]
    steps_data = [random.randint(5000, 15000) for _ in range(7)]
    
    df = pd.DataFrame({
        'Date': dates,
        'Steps': steps_data
    })
    
    fig = px.line(df, x='Date', y='Steps', title="Daily Steps (Last 7 Days)")
    st.plotly_chart(fig, use_container_width=True)
    
    # Integration with coaching
    if st.session_state.selected_coach:
        if st.button("📊 Analyze Data with Coach", type="primary"):
            current_coach = COACHES[st.session_state.selected_coach]
            
            with st.spinner(f"🤔 {current_coach['name']} is analyzing your data..."):
                analysis_message = f"Based on my wearable data (steps: {data['steps']}, calories: {data['calories']}, sleep score: {data['sleep_score']}), what should I focus on today?"
                
                analysis = get_coach_response(analysis_message, st.session_state.selected_coach)
                
                st.markdown(f"""
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 1.5rem; border-radius: 15px; margin: 1rem 0;">
                    <h4>🎯 {current_coach['name']}'s Data Analysis</h4>
                    <p>{analysis}</p>
                </div>
                """, unsafe_allow_html=True)

if __name__ == "__main__":
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        st.error("""
        🚫 **OpenAI API Key Required**
        
        Please create a `.env` file with your OpenAI API key:
        ```
        OPENAI_API_KEY=your_api_key_here
        ```
        """)
        st.stop()
    
    main()