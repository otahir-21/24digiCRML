from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

Base = declarative_base()

class SubscriptionType(str, enum.Enum):
    TEMPORARY = "temporary"
    PERMANENT = "permanent"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PAYMENT_FAILED = "payment_failed"

class PlanStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    PAUSED = "paused"

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, nullable=True, index=True)  # Firebase Auth UID; links to Firebase user
    email = Column(String, unique=True, nullable=True, index=True)
    mobile_number = Column(String, unique=True, nullable=True, index=True)
    otp_hash = Column(String, nullable=True)
    otp_attempts = Column(Integer, default=0)
    otp_created_at = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    subscriptions = relationship("Subscription", back_populates="user")
    plans = relationship("RecoveryPlan", back_populates="user")
    daily_metrics = relationship("DailyMetric", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    full_name = Column(String(100))
    date_of_birth = Column(DateTime)
    height_cm = Column(Float)
    weight_kg = Column(Float)
    gender = Column(String(20))
    
    # Health information
    health_concerns = Column(JSON)  # List of concerns
    medications = Column(Text)
    allergies = Column(JSON)
    dietary_restrictions = Column(JSON)
    
    # Activity information
    mobility_level = Column(String(50))
    daily_activity_level = Column(String(50))
    physical_limitations = Column(JSON)
    
    # Recovery goals
    primary_goal = Column(String(100))
    current_pain_level = Column(Integer)
    concern_areas = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="profile")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    subscription_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    plan_type = Column(Enum(SubscriptionType))
    stripe_subscription_id = Column(String, unique=True)
    stripe_customer_id = Column(String)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    amount = Column(Float)
    currency = Column(String, default="AED")
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")

class IssueSelection(Base):
    __tablename__ = "issue_selections"
    
    selection_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    category = Column(String(50))  # sport/medical/psychological
    issue_type = Column(String(100))
    affected_areas = Column(JSON)
    onset_time = Column(String(50))
    severity_level = Column(Integer)
    additional_answers = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    plans = relationship("RecoveryPlan", back_populates="issue_selection")

class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"
    
    plan_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    subscription_id = Column(Integer, ForeignKey("subscriptions.subscription_id"))
    issue_selection_id = Column(Integer, ForeignKey("issue_selections.selection_id"))
    category = Column(String(50))
    plan_type = Column(String(20))  # temp/permanent
    plan_json = Column(JSON)
    duration_days = Column(Integer)
    status = Column(Enum(PlanStatus), default=PlanStatus.ACTIVE)
    completion_percentage = Column(Float, default=0.0)
    
    # NEW: Final completion summary
    completion_summary = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="plans")
    issue_selection = relationship("IssueSelection", back_populates="plans")
    checkins = relationship("DailyCheckin", back_populates="plan")

class DailyCheckin(Base):
    __tablename__ = "daily_checkins"
    
    checkin_id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("recovery_plans.plan_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    date = Column(DateTime)
    day_number = Column(Integer)
    activities_completed = Column(JSON)
    pain_level = Column(Integer)
    notes = Column(Text)
    how_feeling = Column(String(20))  # better/same/worse
    
    # NEW: Energy level and mood tracking
    energy_level = Column(Integer, nullable=True)  # 1-10
    mood = Column(String(50), nullable=True)  # great/good/okay/poor/bad
    sleep_quality = Column(Integer, nullable=True)  # 1-10
    
    # NEW: AI-generated daily summary
    daily_summary = Column(JSON, nullable=True)
    
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    plan = relationship("RecoveryPlan", back_populates="checkins")

class DailyMetric(Base):
    __tablename__ = "daily_metrics"
    
    metric_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    date = Column(DateTime)
    heart_rate_avg = Column(Float, nullable=True)
    heart_rate_min = Column(Float, nullable=True)
    heart_rate_max = Column(Float, nullable=True)
    resting_heart_rate = Column(Float, nullable=True)
    hrv = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    sleep_hours = Column(Float, nullable=True)
    sleep_deep_hours = Column(Float, nullable=True)
    sleep_light_hours = Column(Float, nullable=True)
    sleep_rem_hours = Column(Float, nullable=True)
    sleep_quality_score = Column(Float, nullable=True)
    steps = Column(Integer, nullable=True)
    active_minutes = Column(Integer, nullable=True)
    stress_level = Column(Float, nullable=True)
    respiratory_rate = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    hydration_ml = Column(Float, nullable=True)
    data_source = Column(String(50))  # smartwatch/manual
    synced_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="daily_metrics")

class SmartwatchConnection(Base):
    __tablename__ = "smartwatch_connections"
    
    connection_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    device_type = Column(String(50))
    device_id = Column(String(100))
    connected_at = Column(DateTime, default=datetime.utcnow)
    last_sync = Column(DateTime, nullable=True)
    sync_enabled = Column(Boolean, default=True)

# Database setup
def get_database():
    from config import settings
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal

def get_db():
    db = get_database()()
    try:
        yield db
    finally:
        db.close()
