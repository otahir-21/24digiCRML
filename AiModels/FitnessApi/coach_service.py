"""OpenAI fitness coach — same behaviour as Streamlit fitness_app.py."""
import os
from openai import OpenAI

from config import get_settings


def _client() -> OpenAI:
    key = get_settings().OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
    if not key:
        raise ValueError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=key)


def _model() -> str:
    return get_settings().OPENAI_MODEL


def chat_coach(message: str, context: str = "") -> str:
    try:
        prompt = f"""
        You are an expert AI fitness coach with knowledge in running, swimming, and strength training.
        You provide personalized, evidence-based fitness advice.

        Context: {context}
        User message: "{message}"

        Provide helpful, specific, and actionable fitness advice. Be encouraging but professional.
        """
        client = _client()
        response = client.chat.completions.create(
            model=_model(),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        return f"Sorry, I'm having trouble connecting. Error: {str(e)}"


def generate_workout_plan(sport: str, goal: str, weeks: int, level: str) -> str:
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
        client = _client()
        response = client.chat.completions.create(
            model=_model(),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        return f"Error generating plan: {str(e)}"


def generate_daily_workout(sport: str, duration_minutes: int, difficulty: str) -> str:
    try:
        prompt = f"""
        Create a {duration_minutes}-minute {sport} workout for {difficulty} level.

        Include:
        1. Warm-up (5-10 minutes)
        2. Main workout with specific exercises, sets, reps
        3. Cool-down (5-10 minutes)
        4. Key coaching tips

        Make it detailed and actionable.
        """
        client = _client()
        response = client.chat.completions.create(
            model=_model(),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        return f"Error generating workout: {str(e)}"
