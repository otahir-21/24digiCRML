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
from interactive_coaches import EnhancedFitnessCoach, CoachPersonalities
import json
import time

load_dotenv()

st.set_page_config(
    page_title="AI Interactive Fitness Coach",
    page_icon="🏆",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Enhanced CSS with coaching interface styles
st.markdown("""
<style>
    /* Hide sidebar */
    .css-1d391kg {display: none}
    
    /* Main styling */
    .main .block-container {
        padding-top: 1rem;
        padding-left: 2rem;
        padding-right: 2rem;
    }
    
    /* Navigation */
    .nav-container {
        display: flex;
        justify-content: center;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .nav-button {
        background: rgba(255,255,255,0.1);
        color: white;
        padding: 12px 20px;
        margin: 0 5px;
        border-radius: 25px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    
    .nav-button:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-2px);
    }
    
    .nav-button.active {
        background: white;
        color: #667eea;
        transform: scale(1.05);
    }
    
    /* Coach cards */
    .coach-card {
        background: white;
        padding: 1.5rem;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        margin: 1rem 0;
        transition: transform 0.3s ease;
        border-left: 5px solid #667eea;
    }
    
    .coach-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }
    
    .coach-card.selected {
        border-left: 5px solid #28a745;
        background: linear-gradient(135deg, #f8fffa 0%, #e8f5e8 100%);
    }
    
    .coach-avatar {
        font-size: 3rem;
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .coach-name {
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .coach-specialty {
        color: #667eea;
        font-weight: 500;
        text-align: center;
        margin-bottom: 1rem;
    }
    
    /* Chat interface */
    .chat-container {
        background: white;
        border-radius: 15px;
        padding: 1rem;
        margin: 1rem 0;
        max-height: 500px;
        overflow-y: auto;
        border: 2px solid #e0e0e0;
    }
    
    .chat-message {
        margin: 1rem 0;
        padding: 1rem;
        border-radius: 10px;
        max-width: 80%;
    }
    
    .user-message {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        margin-left: auto;
        text-align: right;
    }
    
    .coach-message {
        background: #f8f9fa;
        border-left: 4px solid #667eea;
        margin-right: auto;
    }
    
    /* Plan display */
    .plan-section {
        background: white;
        padding: 1.5rem;
        border-radius: 15px;
        margin: 1rem 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .plan-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        text-align: center;
    }
    
    .workout-day {
        background: #f8f9ff;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 8px;
        border-left: 4px solid #667eea;
    }
    
    .progress-indicator {
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
    
    /* Buttons */
    .primary-button {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin: 0.5rem 0;
    }
    
    .primary-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    }
    
    .secondary-button {
        background: white;
        color: #667eea;
        border: 2px solid #667eea;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .secondary-button:hover {
        background: #667eea;
        color: white;
    }
    
    /* Status indicators */
    .status-badge {
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .status-active {
        background: #d4edda;
        color: #155724;
    }
    
    .status-pending {
        background: #fff3cd;
        color: #856404;
    }
    
    .metric-highlight {
        font-size: 2rem;
        font-weight: bold;
        color: #667eea;
        text-align: center;
        margin: 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)

def init_session_state():
    if 'user_id' not in st.session_state:
        st.session_state.user_id = "user_001"
    if 'data_manager' not in st.session_state:
        st.session_state.data_manager = DataManager()
    if 'wearable' not in st.session_state:
        st.session_state.wearable = WearableSimulator()
    if 'interactive_coach' not in st.session_state:
        st.session_state.interactive_coach = EnhancedFitnessCoach(os.getenv('OPENAI_API_KEY'))
    if 'current_page' not in st.session_state:
        st.session_state.current_page = "Coach Selection"
    if 'selected_coach' not in st.session_state:
        st.session_state.selected_coach = None
    if 'current_plan' not in st.session_state:
        st.session_state.current_plan = None
    if 'coaching_context' not in st.session_state:
        st.session_state.coaching_context = {
            'chat_history': [],
            'session_start': datetime.now().isoformat()
        }

def create_navigation():
    """Create navigation system"""
    pages = [
        ("🎭 Coach Selection", "Coach Selection"),
        ("📋 Fitness Planner", "Fitness Planner"),
        ("💬 Interactive Chat", "Interactive Chat"),
        ("🏋️‍♂️ Daily Workouts", "Daily Workouts"),
        ("📈 Progress Review", "Progress Review"),
        ("⌚ Wearable Data", "Wearable Data")
    ]
    
    cols = st.columns(len(pages))
    
    for i, (display_name, page_name) in enumerate(pages):
        with cols[i]:
            if st.button(display_name, key=f"nav_{page_name}", 
                        help=f"Navigate to {display_name}"):
                st.session_state.current_page = page_name
                st.rerun()

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
    
    # Navigation
    create_navigation()
    
    # Show current coach if selected
    if st.session_state.selected_coach:
        coaches = CoachPersonalities.get_coaches()
        coach = coaches[st.session_state.selected_coach]
        st.info(f"🎯 Current Coach: {coach['name']} - {coach['specialty']}")
    
    # Route to pages
    if st.session_state.current_page == "Coach Selection":
        coach_selection_page()
    elif st.session_state.current_page == "Fitness Planner":
        fitness_planner_page()
    elif st.session_state.current_page == "Interactive Chat":
        interactive_chat_page()
    elif st.session_state.current_page == "Daily Workouts":
        daily_workouts_page()
    elif st.session_state.current_page == "Progress Review":
        progress_review_page()
    elif st.session_state.current_page == "Wearable Data":
        wearable_data_page()

def coach_selection_page():
    st.header("🎭 Choose Your Perfect Coach")
    st.write("Each coach has a unique personality and specialization. Choose the one that matches your training style!")
    
    coaches = CoachPersonalities.get_coaches()
    
    # Display coaches in a grid
    cols = st.columns(2)
    
    for i, (coach_id, coach_data) in enumerate(coaches.items()):
        with cols[i % 2]:
            # Check if this coach is selected
            is_selected = st.session_state.selected_coach == coach_id
            card_class = "coach-card selected" if is_selected else "coach-card"
            
            coach_html = f"""
            <div class="{card_class}">
                <div class="coach-avatar">{coach_data['avatar']}</div>
                <div class="coach-name">{coach_data['name']}</div>
                <div class="coach-specialty">{coach_data['specialty']}</div>
                <p><strong>Personality:</strong> {coach_data['personality']}</p>
                <p><strong>Approach:</strong> {coach_data['approach']}</p>
                <p><strong>Best for:</strong> {', '.join(coach_data['best_for'])}</p>
                <p><em>{coach_data['description']}</em></p>
            </div>
            """
            st.markdown(coach_html, unsafe_allow_html=True)
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button(f"Select {coach_data['name']}", key=f"select_{coach_id}",
                           type="primary" if not is_selected else "secondary"):
                    st.session_state.selected_coach = coach_id
                    st.success(f"🎉 {coach_data['name']} is now your coach!")
                    st.rerun()
            
            with col2:
                if st.button(f"Chat Preview", key=f"preview_{coach_id}"):
                    # Quick preview chat
                    preview_response = st.session_state.interactive_coach.interactive_coaching_session(
                        "Hi coach! Tell me about your training philosophy.",
                        {'goal': 'Get to know coach', 'sport': 'General'},
                        coach_id
                    )
                    st.info(f"**{coach_data['name']} says:** {preview_response}")

def fitness_planner_page():
    st.header("📋 AI Fitness Plan Generator")
    
    if not st.session_state.selected_coach:
        st.warning("⚠️ Please select a coach first!")
        return
    
    coaches = CoachPersonalities.get_coaches()
    current_coach = coaches[st.session_state.selected_coach]
    
    st.success(f"🎯 Creating plan with {current_coach['name']}")
    
    # Plan parameters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        sport = st.selectbox("Primary Sport:", ["Running", "Swimming", "Strength Training", "Mixed Training"])
        duration_weeks = st.slider("Plan Duration (weeks):", 4, 24, 12)
    
    with col2:
        goal = st.selectbox("Primary Goal:", [
            "Lose weight and get fit",
            "Build muscle and strength",
            "Improve endurance",
            "Train for competition",
            "Injury recovery and prevention",
            "General fitness maintenance"
        ])
        intensity = st.selectbox("Training Intensity:", ["Beginner", "Intermediate", "Advanced"])
    
    with col3:
        sessions_per_week = st.slider("Sessions per week:", 2, 7, 4)
        include_nutrition = st.checkbox("Include nutrition plan", True)
    
    # Additional preferences
    st.subheader("📝 Additional Preferences")
    special_focus = st.text_area("Any specific areas to focus on or limitations?",
                                placeholder="e.g., knee injury recovery, want to improve speed, prefer morning workouts...")
    
    # Generate plan button
    if st.button("🚀 Generate My Personalized Plan", type="primary"):
        with st.spinner(f"🧠 {current_coach['name']} is analyzing your data and creating your personalized plan..."):
            
            # Get user data
            user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
            wearable_data = st.session_state.wearable.simulate_daily_activity(user_profile)
            
            # Add special preferences to user data
            if user_profile:
                user_profile['special_focus'] = special_focus
                user_profile['sessions_per_week'] = sessions_per_week
                user_profile['intensity_preference'] = intensity
            
            # Generate comprehensive plan
            plan_result = st.session_state.interactive_coach.generate_comprehensive_plan(
                user_data=user_profile or {},
                coach_id=st.session_state.selected_coach,
                sport=sport,
                goal=goal,
                duration_weeks=duration_weeks,
                wearable_data=wearable_data
            )
            
            if plan_result['success']:
                st.session_state.current_plan = plan_result
                display_fitness_plan(plan_result)
            else:
                st.error(f"❌ Error generating plan: {plan_result.get('error', 'Unknown error')}")

def display_fitness_plan(plan_result):
    """Display the generated fitness plan"""
    plan = plan_result['plan']
    
    # Plan header
    if 'plan_overview' in plan:
        overview = plan['plan_overview']
        st.markdown(f"""
        <div class="plan-header">
            <h2>{overview.get('title', 'Your Personalized Fitness Plan')}</h2>
            <p>{overview.get('coach_message', 'Let\'s achieve your goals together!')}</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Key principles
        if 'key_principles' in overview:
            st.subheader("🎯 Key Training Principles")
            for i, principle in enumerate(overview['key_principles'], 1):
                st.write(f"{i}. {principle}")
        
        # Expected outcomes
        if 'expected_outcomes' in overview:
            st.subheader("🏆 Expected Outcomes")
            for outcome in overview['expected_outcomes']:
                st.success(f"✓ {outcome}")
    
    # Weekly structure
    if 'weekly_structure' in plan:
        st.subheader("📅 Training Phases")
        
        structure = plan['weekly_structure']
        phases = [
            ('week_1_4', 'Weeks 1-4'),
            ('week_5_8', 'Weeks 5-8'), 
            ('week_9_12', 'Weeks 9-12')
        ]
        
        for phase_key, phase_name in phases:
            if phase_key in structure:
                phase_data = structure[phase_key]
                
                with st.expander(f"📋 {phase_name}: {phase_data.get('phase', 'Training Phase')}"):
                    st.write(f"**Focus:** {phase_data.get('focus', 'General training')}")
                    st.write(f"**Workouts per week:** {phase_data.get('workouts_per_week', '3-4')}")
                    
                    # Sample week
                    if 'sample_week' in phase_data:
                        st.write("**Sample Week:**")
                        sample_week = phase_data['sample_week']
                        
                        for day, workout in sample_week.items():
                            if isinstance(workout, dict):
                                workout_type = workout.get('type', 'Rest')
                                duration = workout.get('duration', 0)
                                intensity = workout.get('intensity', 'N/A')
                                description = workout.get('description', workout.get('activity', ''))
                                
                                st.markdown(f"""
                                <div class="workout-day">
                                    <strong>{day.title()}:</strong> {workout_type.title()}
                                    {f" ({duration} min)" if duration else ""}
                                    {f" - {intensity.title()} intensity" if intensity != 'N/A' else ""}
                                    <br><small>{description}</small>
                                </div>
                                """, unsafe_allow_html=True)
    
    # Nutrition guidelines
    if 'nutrition_guidelines' in plan:
        nutrition = plan['nutrition_guidelines']
        st.subheader("🥗 Nutrition Guidelines")
        
        col1, col2 = st.columns(2)
        with col1:
            st.write(f"**Daily Calories:** {nutrition.get('daily_calories', 'Calculate based on goals')}")
            if 'macros' in nutrition:
                macros = nutrition['macros']
                st.write(f"**Protein:** {macros.get('protein', 'TBD')}g")
                st.write(f"**Carbs:** {macros.get('carbs', 'TBD')}g")
                st.write(f"**Fats:** {macros.get('fats', 'TBD')}g")
        
        with col2:
            if 'meal_timing' in nutrition:
                st.write("**Meal Timing:**")
                for timing in nutrition['meal_timing']:
                    st.write(f"• {timing}")
            
            st.write(f"**Hydration:** {nutrition.get('hydration', '2-3 liters daily')}")
    
    # Recovery protocol
    if 'recovery_protocol' in plan:
        recovery = plan['recovery_protocol']
        st.subheader("💤 Recovery Protocol")
        
        st.write(f"**Sleep Target:** {recovery.get('sleep_target', '7-9 hours')}")
        st.write(f"**Rest Days:** {recovery.get('rest_days', '2-3 per week')}")
        
        if 'active_recovery' in recovery:
            st.write("**Active Recovery Activities:**")
            for activity in recovery['active_recovery']:
                st.write(f"• {activity}")
    
    # Save plan
    if st.button("💾 Save This Plan", type="primary"):
        # Save plan to data manager
        st.session_state.data_manager.save_user_goals(st.session_state.user_id, {
            'current_plan': plan_result,
            'plan_created': datetime.now().isoformat()
        })
        st.success("✅ Plan saved! You can now access it anytime.")
        st.balloons()

def interactive_chat_page():
    st.header("💬 Interactive Coaching Chat")
    
    if not st.session_state.selected_coach:
        st.warning("⚠️ Please select a coach first!")
        return
    
    coaches = CoachPersonalities.get_coaches()
    current_coach = coaches[st.session_state.selected_coach]
    
    st.info(f"🤝 Chatting with {current_coach['name']} - {current_coach['specialty']}")
    
    # Display chat history
    chat_container = st.container()
    
    with chat_container:
        st.markdown('<div class="chat-container">', unsafe_allow_html=True)
        
        chat_history = st.session_state.coaching_context.get('chat_history', [])
        
        if not chat_history:
            # Welcome message from coach
            welcome_msg = f"Hello! I'm {current_coach['name']}, your {current_coach['specialty']} coach. {current_coach['description'][:100]}... How can I help you today?"
            st.markdown(f"""
            <div class="chat-message coach-message">
                <strong>{current_coach['name']}:</strong><br>
                {welcome_msg}
            </div>
            """, unsafe_allow_html=True)
        
        for chat in chat_history:
            # User message
            st.markdown(f"""
            <div class="chat-message user-message">
                <strong>You:</strong><br>
                {chat.get('user', '')}
            </div>
            """, unsafe_allow_html=True)
            
            # Coach response
            st.markdown(f"""
            <div class="chat-message coach-message">
                <strong>{current_coach['name']}:</strong><br>
                {chat.get('coach', '')}
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Quick question buttons
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
                               placeholder="Ask about workouts, nutrition, motivation, or anything fitness-related...",
                               height=100)
    
    col1, col2 = st.columns([3, 1])
    with col1:
        if st.button("Send Message", type="primary", disabled=not user_message):
            handle_chat_message(user_message)
    
    with col2:
        if st.button("Clear Chat"):
            st.session_state.coaching_context['chat_history'] = []
            st.rerun()

def handle_chat_message(message):
    """Process chat message and get coach response"""
    if not message.strip():
        return
    
    # Prepare context
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    user_goals = st.session_state.data_manager.load_user_goals(st.session_state.user_id)
    
    context = {
        'goal': user_goals.get('goal', 'General fitness') if user_goals else 'General fitness',
        'sport': user_goals.get('activity', 'Mixed') if user_goals else 'Mixed',
        'fitness_level': user_profile.get('fitness_level', 'Intermediate') if user_profile else 'Intermediate',
        'chat_history': st.session_state.coaching_context.get('chat_history', [])
    }
    
    # Get coach response
    with st.spinner("🤔 Coach is thinking..."):
        response = st.session_state.interactive_coach.interactive_coaching_session(
            message, context, st.session_state.selected_coach
        )
    
    # Update chat history
    if 'chat_history' not in st.session_state.coaching_context:
        st.session_state.coaching_context['chat_history'] = []
    
    st.session_state.coaching_context['chat_history'].append({
        'user': message,
        'coach': response,
        'timestamp': datetime.now().isoformat()
    })
    
    st.rerun()

def daily_workouts_page():
    st.header("🏋️‍♂️ Daily Workout Generator")
    
    if not st.session_state.selected_coach:
        st.warning("⚠️ Please select a coach first!")
        return
    
    coaches = CoachPersonalities.get_coaches()
    current_coach = coaches[st.session_state.selected_coach]
    
    st.success(f"💪 {current_coach['name']} will create your workout")
    
    # Workout parameters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        sport = st.selectbox("Workout Type:", ["Running", "Swimming", "Strength Training", "Mixed/Cross-training"])
        duration = st.slider("Duration (minutes):", 15, 120, 45)
    
    with col2:
        difficulty = st.selectbox("Difficulty:", ["Easy", "Moderate", "Hard", "Intense"])
        equipment = st.multiselect("Available Equipment:", 
                                 ["Gym", "Dumbbells", "Resistance Bands", "Pool", "Track", "Bodyweight Only"])
    
    with col3:
        focus_area = st.selectbox("Focus Area:", 
                                ["Full Body", "Upper Body", "Lower Body", "Core", "Cardio", "Flexibility"])
        special_notes = st.text_input("Special requests:", 
                                    placeholder="e.g., avoid jumping, focus on shoulders...")
    
    # Generate workout
    if st.button("🔥 Generate Today's Workout", type="primary"):
        with st.spinner(f"🎯 {current_coach['name']} is designing your workout..."):
            
            user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
            if user_profile:
                user_profile['special_notes'] = special_notes
                user_profile['available_equipment'] = equipment
                user_profile['focus_area'] = focus_area
            
            workout_result = st.session_state.interactive_coach.generate_daily_workout(
                sport=sport,
                coach_id=st.session_state.selected_coach,
                user_data=user_profile or {},
                difficulty=difficulty.lower()
            )
            
            if workout_result['success']:
                display_daily_workout(workout_result['workout'])
            else:
                st.error(f"❌ Error generating workout: {workout_result.get('error', 'Unknown error')}")

def display_daily_workout(workout):
    """Display the generated daily workout"""
    if 'text_workout' in workout:
        # Text-based workout
        st.markdown(workout['text_workout'])
        return
    
    # Structured workout display
    st.markdown(f"""
    <div class="plan-header">
        <h2>{workout.get('workout_title', 'Today\'s Workout')}</h2>
        <p>Duration: {workout.get('duration_minutes', 45)} minutes</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Equipment needed
    if 'equipment_needed' in workout:
        st.subheader("🛠️ Equipment Needed")
        equipment_list = ", ".join(workout['equipment_needed'])
        st.info(f"Equipment: {equipment_list}")
    
    # Warm-up
    if 'warm_up' in workout:
        st.subheader("🔥 Warm-Up")
        warm_up = workout['warm_up']
        st.write(f"Duration: {warm_up.get('duration', 10)} minutes")
        
        for exercise in warm_up.get('exercises', []):
            st.markdown(f"""
            <div class="workout-day">
                <strong>{exercise.get('name', 'Exercise')}:</strong> {exercise.get('duration', '5 minutes')}
                <br><small>{exercise.get('description', '')}</small>
            </div>
            """, unsafe_allow_html=True)
    
    # Main workout
    if 'main_workout' in workout:
        st.subheader("💪 Main Workout")
        main_workout = workout['main_workout']
        
        for workout_set in main_workout.get('sets', []):
            set_num = workout_set.get('set_number', 1)
            st.write(f"**Set {set_num}:**")
            
            for exercise in workout_set.get('exercises', []):
                st.markdown(f"""
                <div class="workout-day">
                    <strong>{exercise.get('name', 'Exercise')}:</strong> 
                    {exercise.get('reps', 'N/A')} reps
                    {f" | Rest: {exercise.get('rest', 'N/A')}" if exercise.get('rest') else ""}
                    <br><small><em>Coaching tip:</em> {exercise.get('notes', 'Focus on good form')}</small>
                </div>
                """, unsafe_allow_html=True)
    
    # Cool down
    if 'cool_down' in workout:
        st.subheader("🧘‍♀️ Cool Down")
        cool_down = workout['cool_down']
        st.write(f"Duration: {cool_down.get('duration', 10)} minutes")
        
        for exercise in cool_down.get('exercises', []):
            st.markdown(f"""
            <div class="workout-day">
                <strong>{exercise.get('name', 'Stretch')}:</strong> {exercise.get('duration', '2 minutes')}
                <br><small>{exercise.get('description', '')}</small>
            </div>
            """, unsafe_allow_html=True)
    
    # Coach notes
    if 'coach_notes' in workout:
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 1rem; border-radius: 10px; margin: 1rem 0;">
            <h4>🎯 Coach's Notes</h4>
            <p>{workout['coach_notes']}</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Log workout button
    if st.button("✅ Mark as Completed", type="primary"):
        workout_log = {
            'date': datetime.now().date().isoformat(),
            'activity': workout.get('workout_title', 'Custom Workout'),
            'duration': workout.get('duration_minutes', 45),
            'type': 'Generated Workout',
            'coach': st.session_state.selected_coach,
            'completed': True
        }
        
        st.session_state.data_manager.save_workout(st.session_state.user_id, workout_log)
        st.success("🎉 Great job! Workout logged successfully!")
        st.balloons()

def progress_review_page():
    st.header("📈 Progress Review & Plan Adjustment")
    
    if not st.session_state.selected_coach:
        st.warning("⚠️ Please select a coach first!")
        return
    
    coaches = CoachPersonalities.get_coaches()
    current_coach = coaches[st.session_state.selected_coach]
    
    # Show current plan status
    if st.session_state.current_plan:
        st.success(f"📋 Active Plan: {st.session_state.current_plan['plan'].get('plan_overview', {}).get('title', 'Custom Plan')}")
        
        # Progress input
        st.subheader("📊 How's Your Progress?")
        
        col1, col2 = st.columns(2)
        with col1:
            workouts_completed = st.slider("Workouts completed this week:", 0, 7, 3)
            energy_level = st.slider("Average energy level (1-10):", 1, 10, 7)
            motivation = st.slider("Motivation level (1-10):", 1, 10, 6)
        
        with col2:
            difficulty_rating = st.slider("How challenging are workouts? (1-10):", 1, 10, 5)
            recovery_quality = st.slider("Recovery quality (1-10):", 1, 10, 7)
            goal_progress = st.slider("Progress toward goal (1-10):", 1, 10, 5)
        
        progress_notes = st.text_area("Additional notes about your progress:",
                                    placeholder="Any challenges, improvements, or questions...")
        
        if st.button("🔄 Get Progress Review & Plan Adjustment", type="primary"):
            with st.spinner(f"🧐 {current_coach['name']} is reviewing your progress..."):
                
                progress_data = {
                    'workouts_completed': workouts_completed,
                    'energy_level': energy_level,
                    'motivation': motivation,
                    'difficulty_rating': difficulty_rating,
                    'recovery_quality': recovery_quality,
                    'goal_progress': goal_progress,
                    'notes': progress_notes,
                    'review_date': datetime.now().isoformat()
                }
                
                adjustment_result = st.session_state.interactive_coach.adjust_plan_based_on_progress(
                    st.session_state.current_plan,
                    progress_data,
                    st.session_state.selected_coach
                )
                
                if adjustment_result['success']:
                    st.markdown(f"""
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                color: white; padding: 1.5rem; border-radius: 15px; margin: 1rem 0;">
                        <h3>🎯 Progress Review by {current_coach['name']}</h3>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    st.markdown(adjustment_result['adjustments'])
                else:
                    st.error(f"❌ Error reviewing progress: {adjustment_result.get('error', 'Unknown error')}")
    
    else:
        st.info("📋 No active plan found. Create a plan first in the Fitness Planner section.")
    
    # Progress visualization
    workouts = st.session_state.data_manager.load_workouts(st.session_state.user_id)
    if workouts:
        st.subheader("📊 Recent Activity")
        
        df = pd.DataFrame(workouts)
        df['date'] = pd.to_datetime(df['date'])
        
        # Recent workouts chart
        recent_workouts = df.tail(14)  # Last 2 weeks
        daily_counts = recent_workouts.groupby(recent_workouts['date'].dt.date).size().reset_index()
        daily_counts.columns = ['Date', 'Workouts']
        
        fig = px.bar(daily_counts, x='Date', y='Workouts', 
                    title="Daily Workouts (Last 2 Weeks)")
        fig.update_traces(marker_color='#667eea')
        st.plotly_chart(fig, use_container_width=True)

def wearable_data_page():
    """Simplified wearable data display for the interactive app"""
    st.header("⌚ Wearable Device Integration")
    
    user_profile = st.session_state.data_manager.load_user_profile(st.session_state.user_id)
    
    # Today's metrics
    daily_data = st.session_state.wearable.simulate_daily_activity(user_profile)
    realtime_data = st.session_state.wearable.get_realtime_metrics()
    
    # Key metrics display
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div style="text-align: center; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div class="metric-highlight">{realtime_data['steps_today']:,}</div>
            <div>Steps Today</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div style="text-align: center; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div class="metric-highlight">{realtime_data['calories_today']:,}</div>
            <div>Calories</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div style="text-align: center; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div class="metric-highlight">{realtime_data['current_heart_rate']}</div>
            <div>Heart Rate</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div style="text-align: center; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div class="metric-highlight">{daily_data['sleep']['sleep_score']}</div>
            <div>Sleep Score</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Integration with coaching
    if st.session_state.selected_coach and st.button("📊 Analyze Data with Coach", type="primary"):
        coaches = CoachPersonalities.get_coaches()
        current_coach = coaches[st.session_state.selected_coach]
        
        with st.spinner(f"🤔 {current_coach['name']} is analyzing your wearable data..."):
            analysis_message = f"Based on my wearable data today (steps: {realtime_data['steps_today']}, calories: {realtime_data['calories_today']}, HR: {realtime_data['current_heart_rate']}, sleep score: {daily_data['sleep']['sleep_score']}), what should I focus on for training and recovery?"
            
            context = {
                'goal': 'Data analysis',
                'sport': 'General',
                'recent_progress': f"Wearable data: {realtime_data['steps_today']} steps, {daily_data['sleep']['sleep_score']} sleep score"
            }
            
            coach_analysis = st.session_state.interactive_coach.interactive_coaching_session(
                analysis_message, context, st.session_state.selected_coach
            )
            
            st.markdown(f"""
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 1.5rem; border-radius: 15px; margin: 1rem 0;">
                <h4>🎯 {current_coach['name']}'s Data Analysis</h4>
                <p>{coach_analysis}</p>
            </div>
            """, unsafe_allow_html=True)

if __name__ == "__main__":
    if not os.getenv('OPENAI_API_KEY'):
        st.error("🚫 **OpenAI API Key Required**\n\nPlease set your OPENAI_API_KEY in the .env file")
        st.stop()
    
    main()