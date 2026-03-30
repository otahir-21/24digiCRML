from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# Enums
class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class MobilityLevel(str, Enum):
    FULLY_MOBILE = "Fully Mobile"
    LIMITED_MOBILITY = "Limited Mobility"
    RESTRICTED_MOBILITY = "Restricted Mobility"
    WHEELCHAIR_USER = "Wheelchair User"
    BEDRIDDEN = "Bedridden/Recovering from Surgery"

class ActivityLevel(str, Enum):
    SEDENTARY = "Sedentary"
    LIGHT = "Light Activity"
    MODERATE = "Moderate Activity"
    ACTIVE = "Active"

class Category(str, Enum):
    SPORT = "sport"
    MEDICAL = "medical"
    PSYCHOLOGICAL = "psychological"

class PlanType(str, Enum):
    TEMPORARY = "temporary"
    PERMANENT = "permanent"

class SubscriptionPlanType(str, Enum):
    TEMPORARY = "temporary"
    PERMANENT = "permanent"

class Mood(str, Enum):
    GREAT = "great"
    GOOD = "good"
    OKAY = "okay"
    POOR = "poor"
    BAD = "bad"

class HowFeeling(str, Enum):
    BETTER = "better"
    SAME = "same"
    WORSE = "worse"

# Authentication Schemas
class AuthRequest(BaseModel):
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    
    @validator('mobile_number')
    def validate_mobile(cls, v, values):
        if not values.get('email') and not v:
            raise ValueError('Either email or mobile_number is required')
        return v

class OTPVerifyRequest(BaseModel):
    identifier: str  # email or mobile
    otp: str = Field(..., min_length=4, max_length=4)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool

# Profile Schemas
class ProfileCreate(BaseModel):
    full_name: str = Field(..., max_length=100)
    date_of_birth: date
    height_cm: float = Field(..., ge=50, le=250)
    weight_kg: float = Field(..., ge=20, le=300)
    gender: Gender
    health_concerns: List[str] = []
    medications: Optional[str] = None
    allergies: List[str] = []
    dietary_restrictions: List[str] = []
    mobility_level: MobilityLevel
    daily_activity_level: ActivityLevel
    physical_limitations: List[str] = []
    primary_goal: str
    current_pain_level: int = Field(..., ge=0, le=10)
    concern_areas: List[str] = []

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    gender: Optional[Gender] = None
    health_concerns: Optional[List[str]] = None
    medications: Optional[str] = None
    allergies: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    mobility_level: Optional[MobilityLevel] = None
    daily_activity_level: Optional[ActivityLevel] = None
    physical_limitations: Optional[List[str]] = None
    primary_goal: Optional[str] = None
    current_pain_level: Optional[int] = None
    concern_areas: Optional[List[str]] = None

class ProfileResponse(BaseModel):
    user_id: int
    full_name: str
    age: int
    date_of_birth: date
    height_cm: float
    weight_kg: float
    gender: str
    health_concerns: List[str]
    medications: Optional[str]
    allergies: List[str]
    dietary_restrictions: List[str]
    mobility_level: str
    daily_activity_level: str
    physical_limitations: List[str]
    primary_goal: str
    current_pain_level: int
    concern_areas: List[str]
    
    class Config:
        from_attributes = True

# Subscription Schemas
class SubscriptionCreateRequest(BaseModel):
    plan_type: SubscriptionPlanType
    payment_method_id: str

class SubscriptionResponse(BaseModel):
    subscription_id: int
    plan_type: str
    status: str
    amount: float
    currency: str
    current_period_start: datetime
    current_period_end: datetime
    
    class Config:
        from_attributes = True

# Issue Selection Schemas
class IssueSelectionCreate(BaseModel):
    category: Category
    issue_type: str
    affected_areas: List[str] = []
    onset_time: str
    severity_level: int = Field(..., ge=1, le=10)
    additional_answers: Dict[str, Any] = {}

class IssueSelectionResponse(BaseModel):
    selection_id: int
    category: str
    issue_type: str
    affected_areas: List[str]
    onset_time: str
    severity_level: int
    additional_answers: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Recovery Plan Schemas
class RecoveryPlanCreate(BaseModel):
    issue_selection_id: int
    plan_type: PlanType
    duration_days: Optional[int] = None  # Optional - will auto-determine if not provided

class RecoveryPlanResponse(BaseModel):
    plan_id: int
    category: str
    plan_type: str
    plan_json: Dict[str, Any]
    duration_days: int
    status: str
    completion_percentage: float
    completion_summary: Optional[Dict[str, Any]] = None  # NEW: Final summary
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Daily Checkin Schemas - ENHANCED
class DailyCheckinCreate(BaseModel):
    plan_id: int
    day_number: int
    activities_completed: Dict[str, bool]
    pain_level: int = Field(..., ge=0, le=10)
    how_feeling: HowFeeling
    energy_level: int = Field(..., ge=1, le=10)  # NEW
    mood: Mood  # NEW
    sleep_quality: int = Field(..., ge=1, le=10)  # NEW
    notes: Optional[str] = None

class DailyCheckinResponse(BaseModel):
    checkin_id: int
    plan_id: int
    date: datetime
    day_number: int
    activities_completed: Dict[str, bool]
    pain_level: int
    how_feeling: str
    energy_level: Optional[int]  # NEW
    mood: Optional[str]  # NEW
    sleep_quality: Optional[int]  # NEW
    notes: Optional[str]
    daily_summary: Optional[Dict[str, Any]] = None  # NEW: AI-generated summary
    
    class Config:
        from_attributes = True

# Daily Metrics Schemas
class DailyMetricCreate(BaseModel):
    date: date
    heart_rate_avg: Optional[float] = None
    heart_rate_min: Optional[float] = None
    heart_rate_max: Optional[float] = None
    resting_heart_rate: Optional[float] = None
    hrv: Optional[float] = None
    spo2: Optional[float] = None
    sleep_hours: Optional[float] = None
    sleep_deep_hours: Optional[float] = None
    sleep_light_hours: Optional[float] = None
    sleep_rem_hours: Optional[float] = None
    sleep_quality_score: Optional[float] = None
    steps: Optional[int] = None
    active_minutes: Optional[int] = None
    stress_level: Optional[float] = None
    respiratory_rate: Optional[float] = None
    temperature: Optional[float] = None
    hydration_ml: Optional[float] = None
    data_source: str = "manual"

class DailyMetricResponse(BaseModel):
    metric_id: int
    date: datetime
    heart_rate_avg: Optional[float]
    resting_heart_rate: Optional[float]
    hrv: Optional[float]
    sleep_hours: Optional[float]
    sleep_quality_score: Optional[float]
    steps: Optional[int]
    stress_level: Optional[float]
    data_source: str
    
    class Config:
        from_attributes = True

# Smartwatch Connection Schemas
class SmartwatchConnectionCreate(BaseModel):
    device_type: str
    device_id: str

class SmartwatchConnectionResponse(BaseModel):
    connection_id: int
    device_type: str
    connected_at: datetime
    last_sync: Optional[datetime]
    sync_enabled: bool
    
    class Config:
        from_attributes = True

# NEW: Plan Summary Request/Response
class PlanSummaryRequest(BaseModel):
    plan_id: int

class PlanSummaryResponse(BaseModel):
    plan_id: int
    summary_type: str  # "completion" or "progress"
    summary_data: Dict[str, Any]
    generated_at: datetime
