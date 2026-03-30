"""
Fitness API for Flutter — FastAPI + Firebase ID token + Firestore + OpenAI.
Separate from RecoveryAI; deploy as its own App Runner service.
"""
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from auth_firebase import require_firebase_user
from coach_service import chat_coach, generate_daily_workout, generate_workout_plan
from config import get_settings, test_bearer_effective
from firebase_app import firestore_available, init_firebase
from store import get_user_state, merge_goals, merge_profile


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase()
    yield


app = FastAPI(
    title="Fitness API",
    description="REST API for AI fitness coach (Flutter). Use Firebase ID token as Bearer.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---


class ProfileBody(BaseModel):
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    fitness_level: Optional[str] = None
    sex: Optional[str] = None


class GoalsBody(BaseModel):
    goals: Optional[str] = None
    sport_preference: Optional[str] = None


class PlanBody(BaseModel):
    sport: str = Field(..., examples=["running"])
    goal: str = Field(..., examples=["complete a half marathon"])
    weeks: int = Field(4, ge=1, le=52)
    level: str = Field("beginner", examples=["beginner", "intermediate", "advanced"])


class DailyWorkoutBody(BaseModel):
    sport: str = "running"
    duration_minutes: int = Field(30, ge=10, le=180)
    difficulty: str = "intermediate"


class ChatBody(BaseModel):
    message: str
    context: str = ""


def _context_from_user(uid: str) -> str:
    state = get_user_state(uid)
    parts = []
    if state.get("profile"):
        parts.append(f"User profile: {state['profile']}")
    if state.get("goals"):
        parts.append(f"User goals: {state['goals']}")
    return "\n".join(parts) if parts else ""


# --- Routes ---


@app.get("/health")
def health():
    s = get_settings()
    return {
        "status": "ok",
        "service": "fitness-api",
        "environment": (s.FITNESS_API_ENV or "development").strip().lower(),
        "firebase_initialized": init_firebase(),
        "firestore": firestore_available(),
        "openai_configured": bool(s.OPENAI_API_KEY),
        "test_bearer_auth_enabled": test_bearer_effective(),
    }


@app.get("/me")
def me(user: dict = Depends(require_firebase_user)):
    uid = user["uid"]
    state = get_user_state(uid)
    return {
        "uid": uid,
        "email": user.get("email"),
        "profile": state.get("profile"),
        "goals": state.get("goals"),
        "updated_at": state.get("updated_at"),
    }


@app.put("/profile")
def put_profile(body: ProfileBody, user: dict = Depends(require_firebase_user)):
    if not firestore_available():
        raise HTTPException(status_code=503, detail="Firestore not configured")
    try:
        merged = merge_profile(user["uid"], body.model_dump(exclude_none=True))
        return {"profile": merged}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.put("/goals")
def put_goals(body: GoalsBody, user: dict = Depends(require_firebase_user)):
    if not firestore_available():
        raise HTTPException(status_code=503, detail="Firestore not configured")
    try:
        merged = merge_goals(user["uid"], body.model_dump(exclude_none=True))
        return {"goals": merged}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/plans/generate")
def post_plan(body: PlanBody, user: dict = Depends(require_firebase_user)):
    text = generate_workout_plan(
        sport=body.sport,
        goal=body.goal,
        weeks=body.weeks,
        level=body.level,
    )
    return {"plan_text": text, "uid": user["uid"]}


@app.post("/workouts/daily")
def post_daily(body: DailyWorkoutBody, user: dict = Depends(require_firebase_user)):
    text = generate_daily_workout(
        sport=body.sport,
        duration_minutes=body.duration_minutes,
        difficulty=body.difficulty,
    )
    return {"workout_text": text, "uid": user["uid"]}


@app.post("/coach/chat")
def post_chat(body: ChatBody, user: dict = Depends(require_firebase_user)):
    ctx = body.context.strip() or _context_from_user(user["uid"])
    reply = chat_coach(body.message, ctx)
    return {"reply": reply, "uid": user["uid"]}
