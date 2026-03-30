from openai import OpenAI
from typing import Dict, Any, List
from config import settings
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import User, UserProfile, IssueSelection, DailyMetric, DailyCheckin, RecoveryPlan
import json

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def get_user_metrics_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """Get 7-day average of user metrics"""
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    metrics = db.query(DailyMetric).filter(
        DailyMetric.user_id == user_id,
        DailyMetric.date >= seven_days_ago
    ).all()
    
    if not metrics:
        return {
            "avg_resting_hr": "N/A",
            "avg_hrv": "N/A",
            "avg_sleep_quality": "N/A",
            "avg_sleep_hours": "N/A",
            "avg_stress_level": "N/A",
            "avg_steps": "N/A"
        }
    
    return {
        "avg_resting_hr": round(sum(m.resting_heart_rate for m in metrics if m.resting_heart_rate) / len([m for m in metrics if m.resting_heart_rate]), 1) if any(m.resting_heart_rate for m in metrics) else "N/A",
        "avg_hrv": round(sum(m.hrv for m in metrics if m.hrv) / len([m for m in metrics if m.hrv]), 1) if any(m.hrv for m in metrics) else "N/A",
        "avg_sleep_quality": round(sum(m.sleep_quality_score for m in metrics if m.sleep_quality_score) / len([m for m in metrics if m.sleep_quality_score]), 1) if any(m.sleep_quality_score for m in metrics) else "N/A",
        "avg_sleep_hours": round(sum(m.sleep_hours for m in metrics if m.sleep_hours) / len([m for m in metrics if m.sleep_hours]), 1) if any(m.sleep_hours for m in metrics) else "N/A",
        "avg_stress_level": round(sum(m.stress_level for m in metrics if m.stress_level) / len([m for m in metrics if m.stress_level]), 1) if any(m.stress_level for m in metrics) else "N/A",
        "avg_steps": round(sum(m.steps for m in metrics if m.steps) / len([m for m in metrics if m.steps])) if any(m.steps for m in metrics) else "N/A"
    }

def calculate_age(date_of_birth: datetime) -> int:
    """Calculate age from date of birth"""
    today = datetime.today()
    return today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))

def generate_temporary_plan(
    db: Session,
    user: User,
    profile: UserProfile,
    issue: IssueSelection,
    duration_days: int = None
) -> Dict[str, Any]:
    """Generate dynamic temporary recovery plan using OpenAI - 3-7 days with daily themes"""
    
    age = calculate_age(profile.date_of_birth)
    metrics = get_user_metrics_summary(db, user.user_id)
    
    # Auto-determine duration if not provided
    if duration_days is None:
        if issue.severity_level >= 7:
            duration_days = 7
        elif issue.severity_level >= 5:
            duration_days = 5
        else:
            duration_days = 3
    
    prompt = f"""You are a certified recovery specialist and healthcare advisor. Generate a comprehensive, evidence-based TEMPORARY recovery plan.

ISSUE SELECTED:
Category: {issue.category}
Issue Type: {issue.issue_type}
Affected Areas: {', '.join(issue.affected_areas) if issue.affected_areas else 'Not specified'}
Onset: {issue.onset_time}
Severity: {issue.severity_level}/10
Additional Details: {json.dumps(issue.additional_answers)}

USER PROFILE:
- Name: {profile.full_name}
- Age: {age}
- Gender: {profile.gender}
- Height: {profile.height_cm} cm, Weight: {profile.weight_kg} kg
- BMI: {round(profile.weight_kg / ((profile.height_cm/100) ** 2), 1)}

HEALTH BACKGROUND:
- Health Concerns: {', '.join(profile.health_concerns) if profile.health_concerns else 'None'}
- Current Medications: {profile.medications or 'None'}
- Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}
- Dietary Restrictions: {', '.join(profile.dietary_restrictions) if profile.dietary_restrictions else 'None'}

PHYSICAL STATUS:
- Mobility Level: {profile.mobility_level}
- Activity Level: {profile.daily_activity_level}
- Physical Limitations: {', '.join(profile.physical_limitations) if profile.physical_limitations else 'None'}
- Current Pain: {profile.current_pain_level}/10

RECOVERY GOALS:
- Primary Goal: {profile.primary_goal}
- Concern Areas: {', '.join(profile.concern_areas) if profile.concern_areas else 'General recovery'}

RECENT METRICS (7-day average):
- Resting HR: {metrics['avg_resting_hr']} BPM
- HRV: {metrics['avg_hrv']} ms
- Sleep Quality: {metrics['avg_sleep_quality']}/100
- Sleep Duration: {metrics['avg_sleep_hours']} hours
- Stress Level: {metrics['avg_stress_level']}/100
- Daily Steps: {metrics['avg_steps']}

TASK: Create a {duration_days}-day temporary recovery plan with DYNAMIC daily programs.

CRITICAL REQUIREMENTS:
1. Each day must include ALL of these themed sections:
   - EXERCISES: Specific gentle movements, stretches, or therapeutic exercises (with reps/duration/modifications)
   - PRACTICES: Mind-body techniques, breathing exercises, meditation, visualization
   - RECOVERY FOODS: Specific anti-inflammatory foods, meals, snacks with benefits
   - RECOVERY DRINKS: Hydration strategies, herbal teas, smoothies, their benefits
   - ADDITIONAL IDEAS: Lifestyle adjustments, sleep positioning, stress management, environment setup

2. Make it PROGRESSIVE: Each day should build on the previous, gradually increasing activity/intensity if appropriate
3. Be SPECIFIC: Don't say "light exercise" - specify "10 gentle arm circles, 5 shoulder rolls"
4. Consider SAFETY: Account for their limitations, pain level, health conditions
5. Include CONTRAINDICATIONS: What to absolutely avoid
6. Provide MODIFICATIONS: Options for different pain/mobility levels

RESPONSE FORMAT (JSON ONLY):
{{
  "plan_title": "Descriptive title for this recovery plan",
  "plan_duration_days": {duration_days},
  "safety_alert": "Any critical safety warnings",
  "requires_medical_attention": boolean,
  "medical_attention_reason": "string or null",
  "overall_strategy": "2-3 sentences describing the recovery approach",
  
  "daily_programs": [
    {{
      "day": 1,
      "day_title": "Focus of this day (e.g., 'Acute Pain Management & Rest')",
      "daily_goal": "What to accomplish today",
      
      "exercises": [
        {{
          "name": "Exercise name",
          "description": "How to perform it",
          "duration_or_reps": "e.g., '10 reps' or '5 minutes'",
          "frequency": "e.g., '3 times daily'",
          "modifications": ["easier option", "harder option"],
          "benefits": "Why this exercise helps"
        }}
      ],
      
      "practices": [
        {{
          "name": "Practice name",
          "description": "How to do it",
          "duration": "How long",
          "when_to_do": "Best time of day",
          "benefits": "How it helps recovery"
        }}
      ],
      
      "recovery_foods": [
        {{
          "food_item": "Specific food",
          "portion": "How much",
          "timing": "When to eat",
          "benefits": "Why it helps",
          "preparation_tip": "Optional cooking/prep suggestion"
        }}
      ],
      
      "recovery_drinks": [
        {{
          "drink_name": "Name of drink",
          "ingredients": ["list", "of", "ingredients"],
          "timing": "When to drink",
          "benefits": "How it aids recovery"
        }}
      ],
      
      "additional_ideas": [
        {{
          "category": "e.g., 'Sleep Optimization', 'Stress Management', 'Environment'",
          "suggestion": "Specific actionable tip",
          "why_it_helps": "Explanation"
        }}
      ],
      
      "what_to_avoid_today": ["specific things to not do"],
      "pain_management_focus": "Key pain management strategy for this day",
      "success_indicators": ["signs that today went well"]
    }}
  ],
  
  "nutrition_guidelines": {{
    "general_principles": ["principle 1", "principle 2"],
    "foods_to_emphasize": ["food 1", "food 2"],
    "foods_to_minimize": ["food 1", "food 2"],
    "hydration_target": "e.g., '2-3 liters daily'"
  }},
  
  "warning_signs": ["sign 1", "sign 2"],
  "seek_help_immediately_if": "Conditions requiring urgent care",
  "progress_tracking": {{
    "metrics_to_monitor": ["pain level", "mobility", "etc"],
    "expected_improvements": "What to expect by end of plan"
  }}
}}

Remember: This is TEMPORARY care. Focus on immediate relief, protection, and starting the healing process. Be conservative but effective."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a certified recovery specialist. Always respond with valid JSON only. Be specific, actionable, and safety-focused."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=4000
    )
    
    content = response.choices[0].message.content.strip()
    # Remove markdown code blocks if present
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    
    plan_data = json.loads(content.strip())
    return plan_data

def generate_permanent_plan(
    db: Session,
    user: User,
    profile: UserProfile,
    issue: IssueSelection,
    duration_days: int = None
) -> Dict[str, Any]:
    """Generate comprehensive permanent recovery plan - 4-12 weeks with weekly/daily themes"""
    
    age = calculate_age(profile.date_of_birth)
    metrics = get_user_metrics_summary(db, user.user_id)
    
    # Auto-determine duration if not provided (in days)
    if duration_days is None:
        if issue.severity_level >= 8:
            duration_days = 84  # 12 weeks
        elif issue.severity_level >= 6:
            duration_days = 56  # 8 weeks
        else:
            duration_days = 28  # 4 weeks
    
    # Convert to weeks for easier planning
    duration_weeks = duration_days // 7
    
    prompt = f"""You are a certified recovery specialist and healthcare advisor. Generate a comprehensive, evidence-based PERMANENT recovery plan.

ISSUE SELECTED:
Category: {issue.category}
Issue Type: {issue.issue_type}
Affected Areas: {', '.join(issue.affected_areas) if issue.affected_areas else 'Not specified'}
Onset: {issue.onset_time}
Severity: {issue.severity_level}/10
Additional Details: {json.dumps(issue.additional_answers)}

USER PROFILE:
- Name: {profile.full_name}
- Age: {age}
- Gender: {profile.gender}
- Height: {profile.height_cm} cm, Weight: {profile.weight_kg} kg
- BMI: {round(profile.weight_kg / ((profile.height_cm/100) ** 2), 1)}

HEALTH BACKGROUND:
- Health Concerns: {', '.join(profile.health_concerns) if profile.health_concerns else 'None'}
- Current Medications: {profile.medications or 'None'}
- Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}
- Dietary Restrictions: {', '.join(profile.dietary_restrictions) if profile.dietary_restrictions else 'None'}

PHYSICAL STATUS:
- Mobility Level: {profile.mobility_level}
- Activity Level: {profile.daily_activity_level}
- Physical Limitations: {', '.join(profile.physical_limitations) if profile.physical_limitations else 'None'}
- Current Pain: {profile.current_pain_level}/10

RECOVERY GOALS:
- Primary Goal: {profile.primary_goal}
- Concern Areas: {', '.join(profile.concern_areas) if profile.concern_areas else 'General recovery'}

RECENT METRICS (7-day average):
- Resting HR: {metrics['avg_resting_hr']} BPM
- HRV: {metrics['avg_hrv']} ms
- Sleep Quality: {metrics['avg_sleep_quality']}/100
- Sleep Duration: {metrics['avg_sleep_hours']} hours
- Stress Level: {metrics['avg_stress_level']}/100
- Daily Steps: {metrics['avg_steps']}

TASK: Create a {duration_weeks}-week ({duration_days}-day) permanent recovery plan with DYNAMIC daily programs.

CRITICAL REQUIREMENTS:
1. Organize into PHASES (e.g., Acute/Protection, Rehabilitation, Strengthening, Return to Activity)
2. Each WEEK gets a weekly overview with goals
3. Provide REPRESENTATIVE DAYS for each week (e.g., Day 1, 4, 7 of each week) showing the progression
4. Each day includes ALL themed sections: EXERCISES, PRACTICES, RECOVERY FOODS, RECOVERY DRINKS, ADDITIONAL IDEAS
5. Show PROGRESSIVE OVERLOAD: Gradual increases in difficulty/intensity week by week
6. Be SPECIFIC with exercises (sets, reps, duration, modifications)
7. Consider their LIMITATIONS and provide safe progressions
8. Include milestone checkpoints

RESPONSE FORMAT (JSON ONLY):
{{
  "plan_title": "Comprehensive recovery plan title",
  "plan_duration_days": {duration_days},
  "plan_duration_weeks": {duration_weeks},
  "safety_alert": "Critical safety information",
  "requires_medical_supervision": boolean,
  "medical_supervision_reason": "string or null",
  "overall_strategy": "3-4 sentences on the complete recovery approach",
  
  "recovery_phases": [
    {{
      "phase_number": 1,
      "phase_name": "e.g., 'Acute Phase - Protection & Pain Management'",
      "phase_duration_weeks": 2,
      "phase_goals": ["goal 1", "goal 2"],
      "key_focus_areas": ["focus 1", "focus 2"]
    }}
  ],
  
  "weekly_programs": [
    {{
      "week_number": 1,
      "phase": "Which phase this week belongs to",
      "week_title": "Focus for this week",
      "week_goals": ["what to accomplish this week"],
      "intensity_level": "low/moderate/high",
      "
_progression_note": "How this week builds on previous",
      
      "representative_days": [
        {{
          "day_of_week": "Day 1 (Monday example)",
          "day_number_in_plan": 1,
          "daily_theme": "e.g., 'Gentle Introduction'",
          
          "exercises": [
            {{
              "name": "Exercise name",
              "description": "Detailed how-to",
              "sets_and_reps": "e.g., '3 sets of 10'",
              "rest_between_sets": "e.g., '60 seconds'",
              "frequency": "How often in the day",
              "progression_note": "How this evolves over weeks",
              "modifications": {{
                "easier": "If pain is high",
                "harder": "If feeling strong"
              }},
              "benefits": "Why this exercise",
              "form_tips": "Key technique points"
            }}
          ],
          
          "practices": [
            {{
              "name": "Practice name",
              "description": "How to perform",
              "duration": "How long",
              "frequency": "How often",
              "benefits": "Recovery benefits",
              "progression": "How it changes over weeks"
            }}
          ],
          
          "recovery_foods": [
            {{
              "meal_time": "breakfast/lunch/dinner/snack",
              "food_items": ["item 1", "item 2"],
              "portion_guidance": "How much",
              "benefits": "Nutritional support provided",
              "recipe_tip": "Optional preparation suggestion"
            }}
          ],
          
          "recovery_drinks": [
            {{
              "drink_name": "Name",
              "ingredients": ["ingredient list"],
              "timing": "When to consume",
              "benefits": "How it supports recovery",
              "recipe": "How to make"
            }}
          ],
          
          "additional_ideas": [
            {{
              "category": "Sleep/Stress/Lifestyle/Environment",
              "suggestion": "Specific actionable tip",
              "implementation": "How to do it",
              "benefits": "Why it helps"
            }}
          ],
          
          "daily_dos_and_donts": {{
            "do": ["action 1", "action 2"],
            "dont": ["avoid 1", "avoid 2"]
          }}
        }}
      ]
    }}
  ],
  
  "comprehensive_nutrition_plan": {{
    "daily_calorie_guidance": "Recommended range",
    "macronutrient_targets": {{
      "protein_grams": "range",
      "carbs_grams": "range",
      "fats_grams": "range"
    }},
    "anti_inflammatory_foods": ["food 1", "food 2"],
    "foods_to_avoid": ["food 1", "food 2"],
    "supplementation_considerations": ["supplement 1 with dosage", "supplement 2"],
    "hydration_protocol": "Detailed water intake plan"
  }},
  
  "milestone_checkpoints": [
    {{
      "week": 2,
      "expected_progress": "What should be achieved",
      "assessment_criteria": ["measure 1", "measure 2"],
      "decision_point": "When to progress or modify"
    }}
  ],
  
  "metrics_to_track": {{
    "daily": ["pain level", "sleep quality", "energy"],
    "weekly": ["range of motion", "strength", "function"]
  }},
  
  "warning_signs": ["sign 1 requiring attention", "sign 2"],
  "seek_professional_help_if": "Conditions requiring medical consultation",
  
  "post_recovery_maintenance": {{
    "ongoing_exercises": ["exercise to continue"],
    "frequency": "How often after plan completes",
    "prevention_strategies": ["how to avoid re-injury"],
    "long_term_lifestyle_changes": ["sustainable habit 1", "habit 2"]
  }}
}}

Remember: This is PERMANENT/LONG-TERM recovery. Focus on complete healing, strengthening, function restoration, and injury prevention. Be progressive but patient."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a certified recovery specialist. Always respond with valid JSON only. Be specific, progressive, and comprehensive."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=8000
    )
    
    content = response.choices[0].message.content.strip()
    # Remove markdown code blocks if present
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    
    plan_data = json.loads(content.strip())
    return plan_data

def generate_daily_summary(
    db: Session,
    user: User,
    profile: UserProfile,
    plan: RecoveryPlan,
    checkin: DailyCheckin,
    day_metrics: DailyMetric = None
) -> Dict[str, Any]:
    """Generate AI summary of daily check-in progress"""
    
    # Get the planned activities for this day from the plan
    plan_day_data = None
    if plan.plan_type == "temporary":
        daily_programs = plan.plan_json.get("daily_programs", [])
        plan_day_data = next((d for d in daily_programs if d.get("day") == checkin.day_number), None)
    else:
        # For permanent plans, find the right week and day
        weekly_programs = plan.plan_json.get("weekly_programs", [])
        week_num = (checkin.day_number - 1) // 7 + 1
        week_data = next((w for w in weekly_programs if w.get("week_number") == week_num), None)
        if week_data:
            plan_day_data = week_data.get("representative_days", [{}])[0]
    
    planned_activities = json.dumps(plan_day_data) if plan_day_data else "No specific plan data available"
    
    prompt = f"""You are a recovery coach. Analyze this user's daily check-in and provide encouraging, insightful feedback.

USER: {profile.full_name}, Age {calculate_age(profile.date_of_birth)}
RECOVERY PLAN: {plan.plan_json.get('plan_title', 'Recovery Plan')}
DAY: {checkin.day_number} of {plan.duration_days}

TODAY'S PLANNED ACTIVITIES:
{planned_activities}

ACTUAL CHECK-IN DATA:
- Activities Completed: {json.dumps(checkin.activities_completed)}
- Pain Level: {checkin.pain_level}/10
- How Feeling: {checkin.how_feeling}
- Energy Level: {checkin.energy_level}/10 
- Mood: {checkin.mood}
- Sleep Quality: {checkin.sleep_quality}/10
- Notes: {checkin.notes or 'None provided'}

{"BIOMETRIC DATA TODAY:" if day_metrics else ""}
{f'''- Heart Rate: {day_metrics.resting_heart_rate} BPM
- HRV: {day_metrics.hrv} ms  
- Sleep: {day_metrics.sleep_hours} hours
- Steps: {day_metrics.steps}
- Stress Level: {day_metrics.stress_level}/100''' if day_metrics else ''}

Provide a supportive, personalized daily summary as JSON:
{{
  "overall_assessment": "2-3 sentence assessment of today's progress",
  "highlights": ["positive thing 1", "positive thing 2"],
  "concerns": ["concern 1 if any", "concern 2"] or [],
  "completion_rate": percentage (0-100),
  "pain_trend": "improving/stable/worsening",
  "energy_mood_assessment": "Brief comment on mental/emotional state",
  "recommendations_for_tomorrow": ["suggestion 1", "suggestion 2"],
  "encouragement": "Motivational message for the user",
  "red_flags": [] or ["flag if concerning symptoms"]
}}

Be warm, specific, and actionable."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a supportive recovery coach. Respond with JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=600
    )
    
    content = response.choices[0].message.content.strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    
    return json.loads(content.strip())

def generate_completion_summary(
    db: Session,
    user: User,
    profile: UserProfile,
    plan: RecoveryPlan,
    all_checkins: List[DailyCheckin]
) -> Dict[str, Any]:
    """Generate comprehensive summary when recovery plan is completed"""
    
    # Gather all check-in data
    checkin_summary = []
    for checkin in all_checkins:
        checkin_summary.append({
            "day": checkin.day_number,
            "pain_level": checkin.pain_level,
            "how_feeling": checkin.how_feeling,
            "energy_level": checkin.energy_level,
            "mood": checkin.mood,
            "sleep_quality": checkin.sleep_quality,
            "completion": checkin.activities_completed
        })
    
    # Get metrics during the plan period
    metrics_during_plan = db.query(DailyMetric).filter(
        DailyMetric.user_id == user.user_id,
        DailyMetric.date >= plan.started_at,
        DailyMetric.date <= datetime.utcnow()
    ).all()
    
    metrics_summary = {
        "avg_resting_hr": round(sum(m.resting_heart_rate for m in metrics_during_plan if m.resting_heart_rate) / len([m for m in metrics_during_plan if m.resting_heart_rate]), 1) if any(m.resting_heart_rate for m in metrics_during_plan) else "N/A",
        "avg_hrv": round(sum(m.hrv for m in metrics_during_plan if m.hrv) / len([m for m in metrics_during_plan if m.hrv]), 1) if any(m.hrv for m in metrics_during_plan) else "N/A",
        "avg_sleep": round(sum(m.sleep_hours for m in metrics_during_plan if m.sleep_hours) / len([m for m in metrics_during_plan if m.sleep_hours]), 1) if any(m.sleep_hours for m in metrics_during_plan) else "N/A",
        "avg_steps": round(sum(m.steps for m in metrics_during_plan if m.steps) / len([m for m in metrics_during_plan if m.steps])) if any(m.steps for m in metrics_during_plan) else "N/A"
    }
    
    prompt = f"""You are a recovery specialist. Provide a comprehensive final summary of this completed recovery journey.

USER: {profile.full_name}, Age {calculate_age(profile.date_of_birth)}
PLAN: {plan.plan_json.get('plan_title', 'Recovery Plan')}
TYPE: {plan.plan_type.title()}
DURATION: {plan.duration_days} days
ORIGINAL ISSUE: {plan.category}

DAILY CHECK-IN HISTORY:
{json.dumps(checkin_summary, indent=2)}

BIOMETRIC AVERAGES DURING PLAN:
- Resting HR: {metrics_summary['avg_resting_hr']} BPM
- HRV: {metrics_summary['avg_hrv']} ms
- Sleep: {metrics_summary['avg_sleep']} hours
- Steps: {metrics_summary['avg_steps']}

Generate a comprehensive completion report as JSON:
{{
  "journey_summary": "3-4 sentence overview of the entire recovery journey",
  
  "progress_analysis": {{
    "pain_progression": "How pain changed over time",
    "energy_mood_trends": "Mental and emotional journey",
    "physical_improvements": "Observable physical progress",
    "adherence_rate": "How consistently they followed the plan (%)"
  }},
  
  "key_achievements": ["achievement 1", "achievement 2", "achievement 3"],
  
  "challenges_overcome": ["challenge 1 they faced and conquered", "challenge 2"],
  
  "biometric_insights": {{
    "heart_health": "Commentary on HR/HRV trends",
    "sleep_recovery": "Sleep quality observations",
    "activity_levels": "Movement and activity progression"
  }},
  
  "strongest_days": [
    {{
      "day": number,
      "reason": "why this day stood out"
    }}
  ],
  
  "difficult_days": [
    {{
      "day": number,
      "challenge": "what made it hard",
      "how_they_overcame": "their resilience"
    }}
  ],
  
  "recovery_score": {{
    "overall": number (0-100),
    "pain_improvement": number (0-100),
    "consistency": number (0-100),
    "physical_function": number (0-100)
  }},
  
  "next_steps": {{
    "current_status": "Where they are now",
    "recommendations": ["next step 1", "next step 2"],
    "maintenance_plan": "How to maintain progress",
    "when_to_seek_further_help": "Guidance on continued care if needed"
  }},
  
  "celebration_message": "Warm, personalized congratulatory message",
  
  "lessons_learned": ["insight 1", "insight 2"],
  
  "red_flags_to_monitor": [] or ["ongoing concern to watch"]
}}

Be thorough, encouraging, and data-driven. Celebrate their commitment."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a compassionate recovery specialist. Provide detailed, encouraging analysis. Respond with JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.4,
        max_tokens=2000
    )
    
    content = response.choices[0].message.content.strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    
    return json.loads(content.strip())
