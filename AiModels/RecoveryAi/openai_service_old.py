from openai import OpenAI
from typing import Dict, Any
from config import settings
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import User, UserProfile, IssueSelection, DailyMetric
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
            "avg_stress_level": "N/A"
        }
    
    return {
        "avg_resting_hr": round(sum(m.resting_heart_rate for m in metrics if m.resting_heart_rate) / len([m for m in metrics if m.resting_heart_rate]), 1) if any(m.resting_heart_rate for m in metrics) else "N/A",
        "avg_hrv": round(sum(m.hrv for m in metrics if m.hrv) / len([m for m in metrics if m.hrv]), 1) if any(m.hrv for m in metrics) else "N/A",
        "avg_sleep_quality": round(sum(m.sleep_quality_score for m in metrics if m.sleep_quality_score) / len([m for m in metrics if m.sleep_quality_score]), 1) if any(m.sleep_quality_score for m in metrics) else "N/A",
        "avg_sleep_hours": round(sum(m.sleep_hours for m in metrics if m.sleep_hours) / len([m for m in metrics if m.sleep_hours]), 1) if any(m.sleep_hours for m in metrics) else "N/A",
        "avg_stress_level": round(sum(m.stress_level for m in metrics if m.stress_level) / len([m for m in metrics if m.stress_level]), 1) if any(m.stress_level for m in metrics) else "N/A"
    }

def calculate_age(date_of_birth: datetime) -> int:
    """Calculate age from date of birth"""
    today = datetime.today()
    return today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))

def generate_temporary_plan(
    db: Session,
    user: User,
    profile: UserProfile,
    issue: IssueSelection
) -> Dict[str, Any]:
    """Generate temporary recovery plan using OpenAI"""
    
    age = calculate_age(profile.date_of_birth)
    metrics = get_user_metrics_summary(db, user.user_id)
    
    prompt = f"""You are a certified recovery specialist and healthcare advisor. Generate a safe, evidence-based temporary recovery plan for the following situation.

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
- Height: {profile.height_cm} cm
- Weight: {profile.weight_kg} kg

HEALTH BACKGROUND:
- Existing Health Concerns: {', '.join(profile.health_concerns) if profile.health_concerns else 'None'}
- Current Medications: {profile.medications or 'None'}
- Known Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}
- Dietary Restrictions: {', '.join(profile.dietary_restrictions) if profile.dietary_restrictions else 'None'}

PHYSICAL STATUS:
- Mobility Level: {profile.mobility_level}
- Daily Activity Level: {profile.daily_activity_level}
- Physical Limitations: {', '.join(profile.physical_limitations) if profile.physical_limitations else 'None'}
- Current Pain Level: {profile.current_pain_level}/10

RECOVERY CONTEXT:
- Primary Recovery Goal: {profile.primary_goal}
- Main Concerns: {', '.join(profile.concern_areas) if profile.concern_areas else 'General recovery'}

RECENT PHYSIOLOGICAL DATA (Last 7 Days Average):
- Resting Heart Rate: {metrics['avg_resting_hr']} BPM
- Heart Rate Variability: {metrics['avg_hrv']} ms
- Sleep Quality: {metrics['avg_sleep_quality']}/100
- Average Sleep: {metrics['avg_sleep_hours']} hours
- Stress Level: {metrics['avg_stress_level']}/100

Generate a temporary recovery plan (3-7 days) with:
1. Estimated recovery duration (realistic timeframe in days)
2. Day-by-day recovery protocol with specific, actionable steps
3. REST recommendations (how much, when, positioning)
4. ACTIVITY modifications (what to avoid, what's safe)
5. SYMPTOM management techniques (ice/heat, breathing, gentle movements)
6. PAIN management strategies (natural, evidence-based)
7. SLEEP optimization tips specific to their condition
8. NUTRITION recommendations (anti-inflammatory foods, hydration)
9. WARNING SIGNS that require immediate medical attention
10. When to seek professional medical help
11. Progress indicators (how to know it's working)

IMPORTANT SAFETY CONSIDERATIONS:
- Consider their existing health conditions and medications
- Respect their physical limitations and mobility level
- Provide modifications for different pain levels
- Flag any contraindications based on their profile
- Never recommend anything that could worsen their condition
- If this is a serious medical issue, strongly recommend professional consultation

Format the response as JSON with this exact structure:
{{
  "plan_duration_days": number,
  "plan_title": "string",
  "safety_note": "string",
  "requires_medical_attention": boolean,
  "medical_attention_reason": "string or null",
  "daily_plan": [
    {{
      "day": number,
      "title": "string",
      "morning_routine": ["string"],
      "afternoon_activities": ["string"],
      "evening_routine": ["string"],
      "symptom_management": "string",
      "what_to_avoid": ["string"],
      "progress_indicators": "string"
    }}
  ],
  "rest_guidelines": {{
    "recommended_hours": "string",
    "optimal_positions": ["string"],
    "frequency": "string"
  }},
  "nutrition_support": {{
    "foods_to_include": ["string"],
    "foods_to_avoid": ["string"],
    "hydration_goal": "string",
    "supplements_consider": ["string"]
  }},
  "pain_management": {{
    "techniques": ["string"],
    "when_to_use": "string",
    "contraindications": ["string"]
  }},
  "warning_signs": ["string"],
  "seek_professional_help_if": "string",
  "expected_improvement_timeline": "string"
}}"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a certified recovery specialist. Always respond with valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=3000
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
    issue: IssueSelection
) -> Dict[str, Any]:
    """Generate permanent recovery plan using OpenAI"""
    
    age = calculate_age(profile.date_of_birth)
    metrics = get_user_metrics_summary(db, user.user_id)
    
    prompt = f"""You are a certified recovery specialist and healthcare advisor. Generate a comprehensive, evidence-based permanent recovery plan for long-term healing and rehabilitation.

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
- Height: {profile.height_cm} cm
- Weight: {profile.weight_kg} kg

HEALTH BACKGROUND:
- Existing Health Concerns: {', '.join(profile.health_concerns) if profile.health_concerns else 'None'}
- Current Medications: {profile.medications or 'None'}
- Known Allergies: {', '.join(profile.allergies) if profile.allergies else 'None'}
- Dietary Restrictions: {', '.join(profile.dietary_restrictions) if profile.dietary_restrictions else 'None'}

PHYSICAL STATUS:
- Mobility Level: {profile.mobility_level}
- Daily Activity Level: {profile.daily_activity_level}
- Physical Limitations: {', '.join(profile.physical_limitations) if profile.physical_limitations else 'None'}
- Current Pain Level: {profile.current_pain_level}/10

RECOVERY CONTEXT:
- Primary Recovery Goal: {profile.primary_goal}
- Main Concerns: {', '.join(profile.concern_areas) if profile.concern_areas else 'General recovery'}

RECENT PHYSIOLOGICAL DATA (Last 7 Days Average):
- Resting Heart Rate: {metrics['avg_resting_hr']} BPM
- Heart Rate Variability: {metrics['avg_hrv']} ms
- Sleep Quality: {metrics['avg_sleep_quality']}/100
- Average Sleep: {metrics['avg_sleep_hours']} hours
- Stress Level: {metrics['avg_stress_level']}/100

Generate a comprehensive permanent recovery plan (4-12 weeks) with:
1. Total program duration based on issue severity
2. Distinct recovery PHASES (e.g., Acute, Subacute, Rehabilitation, Maintenance)
3. Weekly progression with gradual intensity increases
4. Detailed daily protocols for each week
5. Progressive exercise/activity recommendations (with modifications)
6. Comprehensive nutrition and supplementation guide
7. Sleep optimization protocol
8. Stress management techniques (if applicable)
9. Pain tracking and management strategies
10. Milestone checkpoints with expected progress markers
11. Metrics to monitor (what to track daily/weekly)
12. Recovery acceleration techniques
13. Injury/condition prevention strategies for long-term
14. When to progress to next phase (criteria)
15. Red flags requiring medical consultation
16. Maintenance plan after recovery completion

CRITICAL CONSIDERATIONS:
- Must be safe for their existing health conditions
- Account for medication interactions
- Respect physical limitations with appropriate modifications
- Provide pain-level-based activity adjustments
- Include contraindications clearly
- Progressive overload that's safe and evidence-based
- Realistic timelines based on condition severity
- If this is a serious medical condition, emphasize working alongside medical professionals

Respond with valid JSON only."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a certified recovery specialist. Always respond with valid JSON only."},
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
