import openai
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any

class InteractiveCoach:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.conversation_history = []
        
    def generate_plan(self, user_data, coach_type, sport, goal, wearable_data=None):
        """Generate a comprehensive fitness plan based on coach type and user data"""
        pass
    
    def chat_with_coach(self, message, context):
        """Interactive chat with the selected coach"""
        pass

class CoachPersonalities:
    """Different coach personalities with unique approaches"""
    
    @staticmethod
    def get_coaches():
        return {
            "motivational_mike": {
                "name": "Coach Mike 💪",
                "specialty": "Motivation & Mental Toughness",
                "personality": "High-energy, motivational, pushes you to exceed limits",
                "approach": "Intense training with positive reinforcement",
                "best_for": ["Strength Training", "Running"],
                "avatar": "💪",
                "description": "Former Marine drill instructor turned personal trainer. Believes in pushing through barriers and achieving the impossible."
            },
            "scientific_sarah": {
                "name": "Dr. Sarah 🔬",
                "specialty": "Sports Science & Data Analysis",
                "personality": "Analytical, evidence-based, methodical",
                "approach": "Data-driven training with scientific principles",
                "best_for": ["Swimming", "Running", "Strength Training"],
                "avatar": "🔬",
                "description": "Sports scientist with PhD in Exercise Physiology. Uses cutting-edge research to optimize your training."
            },
            "zen_master_liu": {
                "name": "Master Liu 🧘‍♂️",
                "specialty": "Mind-Body Connection & Recovery",
                "personality": "Calm, philosophical, focuses on balance",
                "approach": "Holistic training emphasizing recovery and mental health",
                "best_for": ["Swimming", "Running"],
                "avatar": "🧘‍♂️",
                "description": "Former Olympic swimmer turned mindfulness coach. Believes in training the mind alongside the body."
            },
            "champion_carlos": {
                "name": "Carlos 'The Champion' 🏆",
                "specialty": "Elite Performance & Competition",
                "personality": "Competitive, strategic, winner-focused",
                "approach": "Elite-level training with competition focus",
                "best_for": ["Running", "Swimming", "Strength Training"],
                "avatar": "🏆",
                "description": "Former Olympic coach with 15+ gold medals. Specializes in turning athletes into champions."
            },
            "functional_fiona": {
                "name": "Fiona Functional 🤸‍♀️",
                "specialty": "Functional Fitness & Injury Prevention",
                "personality": "Practical, safety-focused, movement-oriented",
                "approach": "Functional movements with injury prevention focus",
                "best_for": ["Strength Training", "Running"],
                "avatar": "🤸‍♀️",
                "description": "Physical therapist turned trainer. Focuses on movement quality and long-term health."
            }
        }

class EnhancedFitnessCoach(InteractiveCoach):
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.coaches = CoachPersonalities.get_coaches()
        
    def generate_comprehensive_plan(self, user_data: Dict, coach_id: str, sport: str, goal: str, 
                                   duration_weeks: int = 12, wearable_data: Dict = None) -> Dict:
        """Generate a comprehensive, structured fitness plan"""
        
        coach = self.coaches.get(coach_id, self.coaches["motivational_mike"])
        
        # Enhanced prompt for plan generation
        plan_prompt = f"""
        You are {coach['name']}, a {coach['specialty']} expert.
        Personality: {coach['personality']}
        Approach: {coach['approach']}
        
        ATHLETE PROFILE:
        • Age: {user_data.get('age')} | Weight: {user_data.get('weight')}kg | Height: {user_data.get('height')}cm
        • Fitness Level: {user_data.get('fitness_level')}
        • Experience: {user_data.get('experience', [])}
        • Injuries/Limitations: {user_data.get('injuries', 'None')}
        
        WEARABLE DATA:
        {self._format_wearable_data(wearable_data) if wearable_data else "No recent data available"}
        
        GOAL: {goal} (Sport: {sport})
        PLAN DURATION: {duration_weeks} weeks
        
        Create a comprehensive {duration_weeks}-week training plan in JSON format with this exact structure:
        
        {{
            "plan_overview": {{
                "title": "Personalized plan title",
                "coach_message": "Personal message from you as {coach['name']} in your coaching style",
                "key_principles": ["principle1", "principle2", "principle3"],
                "expected_outcomes": ["outcome1", "outcome2", "outcome3"]
            }},
            "weekly_structure": {{
                "week_1_4": {{
                    "phase": "Foundation/Base Building",
                    "focus": "Primary focus area",
                    "workouts_per_week": 3-5,
                    "sample_week": {{
                        "monday": {{"type": "workout_type", "duration": 45, "intensity": "moderate", "description": "detailed workout"}},
                        "tuesday": {{"type": "recovery", "activity": "rest or light activity"}},
                        "wednesday": {{"type": "workout_type", "duration": 60, "intensity": "high", "description": "detailed workout"}},
                        "thursday": {{"type": "recovery", "activity": "rest or cross-training"}},
                        "friday": {{"type": "workout_type", "duration": 30, "intensity": "low", "description": "detailed workout"}},
                        "saturday": {{"type": "workout_type", "duration": 90, "intensity": "moderate", "description": "detailed workout"}},
                        "sunday": {{"type": "recovery", "activity": "complete rest"}}
                    }}
                }},
                "week_5_8": {{
                    "phase": "Build/Strength Development",
                    "focus": "Progression focus",
                    "workouts_per_week": 4-6,
                    "sample_week": "similar structure with increased intensity"
                }},
                "week_9_12": {{
                    "phase": "Peak/Competition Prep",
                    "focus": "Peak performance",
                    "workouts_per_week": 4-5,
                    "sample_week": "similar structure with sport-specific focus"
                }}
            }},
            "nutrition_guidelines": {{
                "daily_calories": "estimated range",
                "macros": {{"protein": "grams", "carbs": "grams", "fats": "grams"}},
                "meal_timing": ["pre-workout", "post-workout", "general"],
                "hydration": "daily water intake recommendation",
                "supplements": ["supplement1", "supplement2"]
            }},
            "recovery_protocol": {{
                "sleep_target": "7-9 hours",
                "rest_days": "2-3 per week",
                "active_recovery": ["activity1", "activity2"],
                "injury_prevention": ["exercise1", "exercise2", "exercise3"]
            }},
            "progress_tracking": {{
                "weekly_assessments": ["metric1", "metric2", "metric3"],
                "milestone_tests": {{
                    "week_4": "assessment description",
                    "week_8": "assessment description",
                    "week_12": "final assessment"
                }},
                "key_metrics": ["distance", "time", "strength", "technique"]
            }},
            "motivation_strategy": {{
                "mindset_focus": "Primary mental approach",
                "weekly_challenges": ["challenge1", "challenge2"],
                "reward_system": "How to celebrate progress",
                "obstacle_management": "How to handle setbacks"
            }}
        }}
        
        Make it specific to {sport} and in your {coach['name']} coaching style. Include specific exercises, rep ranges, distances, and times where applicable.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",  # Using GPT-4 for better structured responses
                messages=[{"role": "user", "content": plan_prompt}],
                max_tokens=2500,
                temperature=0.7
            )
            
            plan_text = response.choices[0].message.content
            
            # Try to parse JSON, fallback to text if needed
            try:
                plan_json = json.loads(plan_text)
                return {
                    "success": True,
                    "plan": plan_json,
                    "coach_id": coach_id,
                    "generated_at": datetime.now().isoformat()
                }
            except json.JSONDecodeError:
                # If JSON parsing fails, return structured text
                return {
                    "success": True,
                    "plan": {"text_plan": plan_text},
                    "coach_id": coach_id,
                    "generated_at": datetime.now().isoformat()
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "plan": None
            }
    
    def interactive_coaching_session(self, user_message: str, context: Dict, coach_id: str) -> str:
        """Interactive coaching conversation"""
        
        coach = self.coaches.get(coach_id, self.coaches["motivational_mike"])
        
        # Build conversation context
        conversation_context = f"""
        You are {coach['name']}, a {coach['specialty']} expert.
        Your personality: {coach['personality']}
        Your approach: {coach['approach']}
        
        ATHLETE CONTEXT:
        • Current Goal: {context.get('goal', 'Not specified')}
        • Sport Focus: {context.get('sport', 'General fitness')}
        • Fitness Level: {context.get('fitness_level', 'Intermediate')}
        • Recent Progress: {context.get('recent_progress', 'No recent data')}
        
        CONVERSATION HISTORY:
        {self._format_conversation_history(context.get('chat_history', []))}
        
        USER MESSAGE: "{user_message}"
        
        Respond as {coach['name']} would, staying in character. Be helpful, motivational, and provide specific advice.
        Keep responses conversational but informative. Include emojis that match your personality.
        If asked about workouts, provide specific exercises, sets, reps, or distances.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": conversation_context}],
                max_tokens=800,
                temperature=0.8
            )
            
            coach_response = response.choices[0].message.content
            
            # Add to conversation history
            if 'chat_history' not in context:
                context['chat_history'] = []
            
            context['chat_history'].append({
                'timestamp': datetime.now().isoformat(),
                'user': user_message,
                'coach': coach_response
            })
            
            return coach_response
            
        except Exception as e:
            return f"Sorry, I'm having trouble connecting right now. Error: {str(e)}"
    
    def generate_daily_workout(self, sport: str, coach_id: str, user_data: Dict, 
                              difficulty: str = "moderate") -> Dict:
        """Generate a specific daily workout"""
        
        coach = self.coaches.get(coach_id, self.coaches["motivational_mike"])
        
        workout_prompt = f"""
        You are {coach['name']} creating today's {sport} workout.
        Athlete level: {user_data.get('fitness_level', 'Intermediate')}
        Difficulty requested: {difficulty}
        
        Create a detailed workout in JSON format:
        {{
            "workout_title": "Creative workout name",
            "duration_minutes": 45-90,
            "equipment_needed": ["item1", "item2"],
            "warm_up": {{
                "duration": 10,
                "exercises": [
                    {{"name": "exercise", "duration": "5 minutes", "description": "how to perform"}}
                ]
            }},
            "main_workout": {{
                "sets": [
                    {{
                        "set_number": 1,
                        "exercises": [
                            {{"name": "exercise", "reps": "10-12", "rest": "60 seconds", "notes": "coaching tips"}}
                        ]
                    }}
                ]
            }},
            "cool_down": {{
                "duration": 10,
                "exercises": [
                    {{"name": "stretch", "duration": "2 minutes", "description": "how to perform"}}
                ]
            }},
            "coach_notes": "Motivational message and key focus points from {coach['name']}"
        }}
        
        Make it specific to {sport} and appropriate for {difficulty} difficulty.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": workout_prompt}],
                max_tokens=1500,
                temperature=0.7
            )
            
            workout_text = response.choices[0].message.content
            
            try:
                workout_json = json.loads(workout_text)
                return {"success": True, "workout": workout_json}
            except json.JSONDecodeError:
                return {"success": True, "workout": {"text_workout": workout_text}}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def adjust_plan_based_on_progress(self, current_plan: Dict, progress_data: Dict, 
                                     coach_id: str) -> Dict:
        """Adjust training plan based on progress"""
        
        coach = self.coaches.get(coach_id, self.coaches["motivational_mike"])
        
        adjustment_prompt = f"""
        You are {coach['name']} reviewing and adjusting a training plan.
        
        CURRENT PLAN SUMMARY: {json.dumps(current_plan.get('plan_overview', {}), indent=2)}
        
        PROGRESS DATA: {json.dumps(progress_data, indent=2)}
        
        Based on the progress, suggest specific adjustments:
        1. What's working well?
        2. What needs to change?
        3. Specific modifications to intensity, volume, or frequency
        4. New goals or milestones
        5. Motivational message about progress
        
        Respond in your {coach['name']} coaching style.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": adjustment_prompt}],
                max_tokens=1000,
                temperature=0.7
            )
            
            return {
                "success": True,
                "adjustments": response.choices[0].message.content,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _format_wearable_data(self, wearable_data: Dict) -> str:
        """Format wearable data for prompt inclusion"""
        if not wearable_data:
            return "No wearable data available"
        
        return f"""
        Daily Activity: {wearable_data.get('steps', 0):,} steps, {wearable_data.get('calories_burned', 0)} calories
        Heart Rate: Resting {wearable_data.get('heart_rate', {}).get('resting', 'N/A')} bpm, 
                   Average {wearable_data.get('heart_rate', {}).get('average', 'N/A')} bpm
        Sleep: {wearable_data.get('sleep', {}).get('total_hours', 'N/A')} hours 
               (Score: {wearable_data.get('sleep', {}).get('sleep_score', 'N/A')}/100)
        Active Minutes: {wearable_data.get('active_minutes', 0)} minutes
        """
    
    def _format_conversation_history(self, chat_history: List) -> str:
        """Format chat history for context"""
        if not chat_history:
            return "No previous conversation"
        
        formatted = []
        for chat in chat_history[-3:]:  # Last 3 exchanges for context
            formatted.append(f"User: {chat.get('user', '')}")
            formatted.append(f"Coach: {chat.get('coach', '')}")
        
        return "\n".join(formatted)