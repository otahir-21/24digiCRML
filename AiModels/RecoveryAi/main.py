from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import models
import schemas
import auth
import openai_service
import stripe_service
from config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Enhanced Recovery Plan App API",
    description="Backend API for Recovery Plan Application with AI-Powered Dynamic Plans and Summaries",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
def startup():
    from sqlalchemy import create_engine, text
    engine = create_engine(settings.DATABASE_URL)
    models.Base.metadata.create_all(bind=engine)
    # Add firebase_uid to existing DBs (e.g. SQLite) if missing
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128)"))
            conn.commit()
    except Exception:
        pass

# ==================== AUTHENTICATION ROUTES ====================

@app.post("/auth/signup-login", response_model=dict)
def signup_or_login(
    request: schemas.AuthRequest,
    db: Session = Depends(models.get_db)
):
    """Sign up or login with email/mobile and send OTP"""
    
    identifier = request.email or request.mobile_number
    
    # Check if user exists
    if request.email:
        user = db.query(models.User).filter(models.User.email == request.email).first()
    else:
        user = db.query(models.User).filter(models.User.mobile_number == request.mobile_number).first()
    
    # Create user if doesn't exist
    if not user:
        user = models.User(
            email=request.email,
            mobile_number=request.mobile_number
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Generate and store OTP
    otp = auth.generate_otp()
    user.otp_hash = auth.hash_otp(otp)
    user.otp_attempts = 0
    user.otp_created_at = datetime.utcnow()
    db.commit()
    
    # Send OTP
    if request.email:
        auth.send_otp_email(request.email, otp)
    else:
        auth.send_otp_sms(request.mobile_number, otp)
    
    return {
        "message": "OTP sent successfully",
        "identifier": identifier,
        "expires_in_minutes": settings.OTP_EXPIRY_MINUTES
    }

@app.post("/auth/verify-otp", response_model=schemas.TokenResponse)
def verify_otp(
    request: schemas.OTPVerifyRequest,
    db: Session = Depends(models.get_db)
):
    """Verify OTP and return JWT token"""
    
    # Find user by identifier
    user = db.query(models.User).filter(
        (models.User.email == request.identifier) | 
        (models.User.mobile_number == request.identifier)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check OTP attempts
    if user.otp_attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Maximum OTP attempts exceeded. Please request a new OTP.")
    
    # Check OTP expiry
    if datetime.utcnow() - user.otp_created_at > timedelta(minutes=settings.OTP_EXPIRY_MINUTES):
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Verify OTP
    if not auth.verify_otp(request.otp, user.otp_hash):
        user.otp_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Mark user as verified
    user.verified = True
    user.otp_hash = None
    user.otp_attempts = 0
    db.commit()
    
    # Check if user has profile (new user or returning)
    is_new_user = db.query(models.UserProfile).filter(models.UserProfile.user_id == user.user_id).first() is None
    
    # Create JWT token
    access_token = auth.create_access_token(data={"sub": str(user.user_id)})
    
    return schemas.TokenResponse(
        access_token=access_token,
        is_new_user=is_new_user
    )

@app.post("/auth/resend-otp")
def resend_otp(
    identifier: str,
    db: Session = Depends(models.get_db)
):
    """Resend OTP"""
    
    user = db.query(models.User).filter(
        (models.User.email == identifier) | 
        (models.User.mobile_number == identifier)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate new OTP
    otp = auth.generate_otp()
    user.otp_hash = auth.hash_otp(otp)
    user.otp_attempts = 0
    user.otp_created_at = datetime.utcnow()
    db.commit()
    
    # Send OTP
    if user.email:
        auth.send_otp_email(user.email, otp)
    else:
        auth.send_otp_sms(user.mobile_number, otp)
    
    return {"message": "OTP resent successfully"}


# --------------------- Test token (for Postman / testing when app uses Firebase Phone Auth) ---------------------

@app.post("/auth/test-token")
async def get_test_token(
    request: Request,
    db: Session = Depends(models.get_db)
):
    """
    Get a Bearer token for testing (e.g. Postman) when your app uses Firebase Phone Auth.
    Requires RECOVERY_AI_TEST_SECRET in .env and header X-Test-Secret.
    Body: { "firebase_uid": "<uid-from-firebase>" }.
    Returns JWT you can use as Authorization: Bearer <access_token>.
    """
    if not settings.RECOVERY_AI_TEST_SECRET:
        raise HTTPException(status_code=503, detail="Test token is disabled (RECOVERY_AI_TEST_SECRET not set)")
    secret = request.headers.get("X-Test-Secret")
    if secret != settings.RECOVERY_AI_TEST_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Test-Secret")
    body = await request.json() if request.body else {}
    if not body or not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="JSON body required: { \"firebase_uid\": \"<uid>\" }")
    firebase_uid = (body.get("firebase_uid") or "").strip()
    if not firebase_uid:
        raise HTTPException(status_code=400, detail="firebase_uid is required")
    user = auth.get_or_create_user_by_firebase_uid(firebase_uid, db)
    access_token = auth.create_access_token(data={"sub": str(user.user_id)})
    return {"access_token": access_token, "token_type": "bearer"}

# ==================== PROFILE ROUTES ====================

@app.post("/profile", response_model=schemas.ProfileResponse)
def create_profile(
    profile_data: schemas.ProfileCreate,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Create user profile (onboarding)"""
    
    # Check if profile already exists
    existing_profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.user_id
    ).first()
    
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")
    
    # Create profile
    profile = models.UserProfile(
        user_id=current_user.user_id,
        **profile_data.dict()
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    # Calculate age
    age = openai_service.calculate_age(profile.date_of_birth)
    
    # Return profile with age
    profile_dict = {
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "age": age,
        "date_of_birth": profile.date_of_birth,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "gender": profile.gender,
        "health_concerns": profile.health_concerns or [],
        "medications": profile.medications,
        "allergies": profile.allergies or [],
        "dietary_restrictions": profile.dietary_restrictions or [],
        "mobility_level": profile.mobility_level,
        "daily_activity_level": profile.daily_activity_level,
        "physical_limitations": profile.physical_limitations or [],
        "primary_goal": profile.primary_goal,
        "current_pain_level": profile.current_pain_level,
        "concern_areas": profile.concern_areas or []
    }
    
    return schemas.ProfileResponse(**profile_dict)

@app.get("/profile", response_model=schemas.ProfileResponse)
def get_profile(
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get user profile"""
    
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.user_id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
    
    age = openai_service.calculate_age(profile.date_of_birth)
    
    profile_dict = {
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "age": age,
        "date_of_birth": profile.date_of_birth,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "gender": profile.gender,
        "health_concerns": profile.health_concerns or [],
        "medications": profile.medications,
        "allergies": profile.allergies or [],
        "dietary_restrictions": profile.dietary_restrictions or [],
        "mobility_level": profile.mobility_level,
        "daily_activity_level": profile.daily_activity_level,
        "physical_limitations": profile.physical_limitations or [],
        "primary_goal": profile.primary_goal,
        "current_pain_level": profile.current_pain_level,
        "concern_areas": profile.concern_areas or []
    }
    
    return schemas.ProfileResponse(**profile_dict)

@app.put("/profile", response_model=schemas.ProfileResponse)
def update_profile(
    profile_update: schemas.ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Update user profile"""
    
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.user_id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update fields
    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    
    age = openai_service.calculate_age(profile.date_of_birth)
    
    profile_dict = {
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "age": age,
        "date_of_birth": profile.date_of_birth,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "gender": profile.gender,
        "health_concerns": profile.health_concerns or [],
        "medications": profile.medications,
        "allergies": profile.allergies or [],
        "dietary_restrictions": profile.dietary_restrictions or [],
        "mobility_level": profile.mobility_level,
        "daily_activity_level": profile.daily_activity_level,
        "physical_limitations": profile.physical_limitations or [],
        "primary_goal": profile.primary_goal,
        "current_pain_level": profile.current_pain_level,
        "concern_areas": profile.concern_areas or []
    }
    
    return schemas.ProfileResponse(**profile_dict)

# ==================== SUBSCRIPTION ROUTES ====================

@app.post("/subscriptions", response_model=schemas.SubscriptionResponse)
def create_subscription(
    subscription_data: schemas.SubscriptionCreateRequest,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Create subscription using Stripe"""
    
    # Check if profile exists
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.user_id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=400, detail="Please create your profile first")
    
    # Check for active subscription
    active_sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.user_id,
        models.Subscription.status == models.SubscriptionStatus.ACTIVE
    ).first()
    
    if active_sub:
        raise HTTPException(status_code=400, detail="You already have an active subscription")
    
    # Create Stripe subscription
    email = current_user.email or f"{current_user.mobile_number}@temp.com"
    
    # TEMPORARY: Mock Stripe for testing (REMOVE IN PRODUCTION)
    import time
    stripe_result = {
        "subscription_id": f"sub_test_{int(time.time())}",
        "customer_id": f"cus_test_{current_user.user_id}",
        "amount": 20.0 if subscription_data.plan_type.value == "permanent" else 10.0,
        "current_period_start": int(datetime.utcnow().timestamp()),
        "current_period_end": int((datetime.utcnow() + timedelta(days=30)).timestamp())
    }
    print(f"[MOCK STRIPE] Created subscription for user {current_user.user_id}: {subscription_data.plan_type.value} plan")
    
    
    # Save subscription to database
    subscription = models.Subscription(
        user_id=current_user.user_id,
        plan_type=models.SubscriptionType[subscription_data.plan_type.value.upper()],
        stripe_subscription_id=stripe_result["subscription_id"],
        stripe_customer_id=stripe_result["customer_id"],
        status=models.SubscriptionStatus.ACTIVE,
        amount=stripe_result["amount"],
        currency="AED",
        current_period_start=datetime.fromtimestamp(stripe_result["current_period_start"]),
        current_period_end=datetime.fromtimestamp(stripe_result["current_period_end"])
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    return schemas.SubscriptionResponse(
        subscription_id=subscription.subscription_id,
        plan_type=subscription.plan_type.value,
        status=subscription.status.value,
        amount=subscription.amount,
        currency=subscription.currency,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end
    )

@app.get("/subscriptions/current", response_model=Optional[schemas.SubscriptionResponse])
def get_current_subscription(
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get user's current active subscription"""
    
    subscription = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.user_id,
        models.Subscription.status == models.SubscriptionStatus.ACTIVE
    ).order_by(models.Subscription.created_at.desc()).first()
    
    if not subscription:
        return None
    
    return schemas.SubscriptionResponse(
        subscription_id=subscription.subscription_id,
        plan_type=subscription.plan_type.value,
        status=subscription.status.value,
        amount=subscription.amount,
        currency=subscription.currency,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end
    )

@app.post("/subscriptions/{subscription_id}/cancel")
def cancel_subscription(
    subscription_id: int,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Cancel subscription"""
    
    subscription = db.query(models.Subscription).filter(
        models.Subscription.subscription_id == subscription_id,
        models.Subscription.user_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Cancel in Stripe
    try:
        stripe_service.cancel_subscription(subscription.stripe_subscription_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Update in database
    subscription.status = models.SubscriptionStatus.CANCELLED
    subscription.cancelled_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Subscription cancelled successfully"}

# ==================== ISSUE SELECTION ROUTES ====================

@app.post("/issues", response_model=schemas.IssueSelectionResponse)
def create_issue_selection(
    issue_data: schemas.IssueSelectionCreate,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Create issue selection"""
    
    issue = models.IssueSelection(
        user_id=current_user.user_id,
        **issue_data.dict()
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    
    return schemas.IssueSelectionResponse(
        selection_id=issue.selection_id,
        category=issue.category,
        issue_type=issue.issue_type,
        affected_areas=issue.affected_areas,
        onset_time=issue.onset_time,
        severity_level=issue.severity_level,
        additional_answers=issue.additional_answers,
        created_at=issue.created_at
    )

# Continue in next part...
# ==================== RECOVERY PLAN ROUTES (ENHANCED) ====================

@app.post("/plans", response_model=schemas.RecoveryPlanResponse)
def create_recovery_plan(
    plan_request: schemas.RecoveryPlanCreate,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """
    Generate AI-powered recovery plan (temporary or permanent)
    NEW: Duration can be specified or auto-determined based on severity
    """
    
    # Verify user has profile
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.user_id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=400, detail="Please create your profile first")
    
    # Verify user has active subscription
    active_subscription = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.user_id,
        models.Subscription.status == models.SubscriptionStatus.ACTIVE
    ).first()
    
    if not active_subscription:
        raise HTTPException(status_code=403, detail="Active subscription required to generate recovery plans")
    
    # Check if subscription type matches plan type
    if plan_request.plan_type.value == "permanent" and active_subscription.plan_type != models.SubscriptionType.PERMANENT:
        raise HTTPException(
            status_code=403, 
            detail="Permanent recovery plans require a Permanent subscription (20 AED/month)"
        )
    
    # Get issue selection
    issue = db.query(models.IssueSelection).filter(
        models.IssueSelection.selection_id == plan_request.issue_selection_id,
        models.IssueSelection.user_id == current_user.user_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue selection not found")
    
    # Generate plan using OpenAI
    try:
        if plan_request.plan_type == schemas.PlanType.TEMPORARY:
            plan_json = openai_service.generate_temporary_plan(
                db=db,
                user=current_user,
                profile=profile,
                issue=issue,
                duration_days=plan_request.duration_days
            )
        else:
            plan_json = openai_service.generate_permanent_plan(
                db=db,
                user=current_user,
                profile=profile,
                issue=issue,
                duration_days=plan_request.duration_days
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate plan: {str(e)}")
    
    # Save plan to database
    recovery_plan = models.RecoveryPlan(
        user_id=current_user.user_id,
        subscription_id=active_subscription.subscription_id,
        issue_selection_id=issue.selection_id,
        category=issue.category,
        plan_type=plan_request.plan_type.value,
        plan_json=plan_json,
        duration_days=plan_json.get("plan_duration_days", plan_request.duration_days or 7),
        status=models.PlanStatus.ACTIVE,
        started_at=datetime.utcnow()
    )
    db.add(recovery_plan)
    db.commit()
    db.refresh(recovery_plan)
    
    return schemas.RecoveryPlanResponse(
        plan_id=recovery_plan.plan_id,
        category=recovery_plan.category,
        plan_type=recovery_plan.plan_type,
        plan_json=recovery_plan.plan_json,
        duration_days=recovery_plan.duration_days,
        status=recovery_plan.status.value,
        completion_percentage=recovery_plan.completion_percentage,
        completion_summary=recovery_plan.completion_summary,
        created_at=recovery_plan.created_at,
        started_at=recovery_plan.started_at,
        completed_at=recovery_plan.completed_at
    )

@app.get("/plans/{plan_id}", response_model=schemas.RecoveryPlanResponse)
def get_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get recovery plan by ID"""
    
    plan = db.query(models.RecoveryPlan).filter(
        models.RecoveryPlan.plan_id == plan_id,
        models.RecoveryPlan.user_id == current_user.user_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return schemas.RecoveryPlanResponse(
        plan_id=plan.plan_id,
        category=plan.category,
        plan_type=plan.plan_type,
        plan_json=plan.plan_json,
        duration_days=plan.duration_days,
        status=plan.status.value,
        completion_percentage=plan.completion_percentage,
        completion_summary=plan.completion_summary,
        created_at=plan.created_at,
        started_at=plan.started_at,
        completed_at=plan.completed_at
    )

@app.get("/plans", response_model=List[schemas.RecoveryPlanResponse])
def get_all_plans(
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get all user's recovery plans"""
    
    plans = db.query(models.RecoveryPlan).filter(
        models.RecoveryPlan.user_id == current_user.user_id
    ).order_by(models.RecoveryPlan.created_at.desc()).all()
    
    return [
        schemas.RecoveryPlanResponse(
            plan_id=plan.plan_id,
            category=plan.category,
            plan_type=plan.plan_type,
            plan_json=plan.plan_json,
            duration_days=plan.duration_days,
            status=plan.status.value,
            completion_percentage=plan.completion_percentage,
            completion_summary=plan.completion_summary,
            created_at=plan.created_at,
            started_at=plan.started_at,
            completed_at=plan.completed_at
        ) for plan in plans
    ]

# ==================== DAILY CHECKIN ROUTES (ENHANCED) ====================

@app.post("/checkins", response_model=schemas.DailyCheckinResponse)
def create_checkin(
    checkin_data: schemas.DailyCheckinCreate,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """
    Create daily check-in with AI-generated summary
    NEW: Includes energy, mood, sleep quality tracking and generates daily summary
    """
    
    # Verify plan belongs to user
    plan = db.query(models.RecoveryPlan).filter(
        models.RecoveryPlan.plan_id == checkin_data.plan_id,
        models.RecoveryPlan.user_id == current_user.user_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get user profile for summary generation
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == current_user.user_id
    ).first()
    
    # Create check-in
    checkin = models.DailyCheckin(
        user_id=current_user.user_id,
        date=datetime.utcnow(),
        **checkin_data.dict()
    )
    db.add(checkin)
    db.flush()  # Get the checkin_id before generating summary
    
    # Get today's metrics if available
    today = datetime.utcnow().date()
    day_metrics = db.query(models.DailyMetric).filter(
        models.DailyMetric.user_id == current_user.user_id,
        models.DailyMetric.date >= datetime.combine(today, datetime.min.time())
    ).first()
    
    # Generate AI daily summary
    try:
        daily_summary = openai_service.generate_daily_summary(
            db=db,
            user=current_user,
            profile=profile,
            plan=plan,
            checkin=checkin,
            day_metrics=day_metrics
        )
        checkin.daily_summary = daily_summary
    except Exception as e:
        # If summary generation fails, continue without it
        print(f"Failed to generate daily summary: {str(e)}")
        checkin.daily_summary = {"error": "Summary generation failed", "message": str(e)}
    
    # Update plan completion percentage
    total_checkins = db.query(models.DailyCheckin).filter(
        models.DailyCheckin.plan_id == checkin_data.plan_id
    ).count() + 1
    
    plan.completion_percentage = min((total_checkins / plan.duration_days) * 100, 100)
    
    # Check if plan is now complete
    if plan.completion_percentage >= 100 and plan.status != models.PlanStatus.COMPLETED:
        plan.status = models.PlanStatus.COMPLETED
        plan.completed_at = datetime.utcnow()
        
        # Generate completion summary
        all_checkins = db.query(models.DailyCheckin).filter(
            models.DailyCheckin.plan_id == plan.plan_id
        ).order_by(models.DailyCheckin.day_number).all()
        
        try:
            completion_summary = openai_service.generate_completion_summary(
                db=db,
                user=current_user,
                profile=profile,
                plan=plan,
                all_checkins=all_checkins
            )
            plan.completion_summary = completion_summary
        except Exception as e:
            print(f"Failed to generate completion summary: {str(e)}")
            plan.completion_summary = {"error": "Summary generation failed"}
    
    db.commit()
    db.refresh(checkin)
    
    return schemas.DailyCheckinResponse(
        checkin_id=checkin.checkin_id,
        plan_id=checkin.plan_id,
        date=checkin.date,
        day_number=checkin.day_number,
        activities_completed=checkin.activities_completed,
        pain_level=checkin.pain_level,
        how_feeling=checkin.how_feeling,
        energy_level=checkin.energy_level,
        mood=checkin.mood,
        sleep_quality=checkin.sleep_quality,
        notes=checkin.notes,
        daily_summary=checkin.daily_summary
    )

@app.get("/checkins/plan/{plan_id}", response_model=List[schemas.DailyCheckinResponse])
def get_plan_checkins(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get all check-ins for a plan with their daily summaries"""
    
    checkins = db.query(models.DailyCheckin).filter(
        models.DailyCheckin.plan_id == plan_id,
        models.DailyCheckin.user_id == current_user.user_id
    ).order_by(models.DailyCheckin.day_number).all()
    
    return [
        schemas.DailyCheckinResponse(
            checkin_id=c.checkin_id,
            plan_id=c.plan_id,
            date=c.date,
            day_number=c.day_number,
            activities_completed=c.activities_completed,
            pain_level=c.pain_level,
            how_feeling=c.how_feeling,
            energy_level=c.energy_level,
            mood=c.mood,
            sleep_quality=c.sleep_quality,
            notes=c.notes,
            daily_summary=c.daily_summary
        ) for c in checkins
    ]

@app.get("/checkins/{checkin_id}/summary")
def get_checkin_summary(
    checkin_id: int,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get just the daily summary for a specific check-in"""
    
    checkin = db.query(models.DailyCheckin).filter(
        models.DailyCheckin.checkin_id == checkin_id,
        models.DailyCheckin.user_id == current_user.user_id
    ).first()
    
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    return {
        "checkin_id": checkin.checkin_id,
        "day_number": checkin.day_number,
        "daily_summary": checkin.daily_summary or {"message": "No summary available"}
    }

# ==================== PLAN SUMMARY ROUTES (NEW) ====================

@app.get("/plans/{plan_id}/completion-summary")
def get_completion_summary(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get the completion summary for a finished plan"""
    
    plan = db.query(models.RecoveryPlan).filter(
        models.RecoveryPlan.plan_id == plan_id,
        models.RecoveryPlan.user_id == current_user.user_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan.status != models.PlanStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Plan is not yet completed")
    
    if not plan.completion_summary:
        # Generate it if not exists
        profile = db.query(models.UserProfile).filter(
            models.UserProfile.user_id == current_user.user_id
        ).first()
        
        all_checkins = db.query(models.DailyCheckin).filter(
            models.DailyCheckin.plan_id == plan.plan_id
        ).order_by(models.DailyCheckin.day_number).all()
        
        try:
            completion_summary = openai_service.generate_completion_summary(
                db=db,
                user=current_user,
                profile=profile,
                plan=plan,
                all_checkins=all_checkins
            )
            plan.completion_summary = completion_summary
            db.commit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")
    
    return {
        "plan_id": plan.plan_id,
        "plan_title": plan.plan_json.get("plan_title", "Recovery Plan"),
        "completed_at": plan.completed_at,
        "completion_summary": plan.completion_summary
    }

@app.get("/plans/{plan_id}/progress-summary")
def get_progress_summary(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get a progress summary for an active plan"""
    
    plan = db.query(models.RecoveryPlan).filter(
        models.RecoveryPlan.plan_id == plan_id,
        models.RecoveryPlan.user_id == current_user.user_id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get all check-ins so far
    checkins = db.query(models.DailyCheckin).filter(
        models.DailyCheckin.plan_id == plan.plan_id
    ).order_by(models.DailyCheckin.day_number).all()
    
    if not checkins:
        return {
            "plan_id": plan.plan_id,
            "message": "No check-ins yet. Start your first day to see progress!"
        }
    
    # Calculate progress metrics
    total_days = len(checkins)
    avg_pain = sum(c.pain_level for c in checkins) / total_days
    avg_energy = sum(c.energy_level for c in checkins if c.energy_level) / len([c for c in checkins if c.energy_level]) if any(c.energy_level for c in checkins) else 0
    
    feeling_better_count = len([c for c in checkins if c.how_feeling == "better"])
    feeling_same_count = len([c for c in checkins if c.how_feeling == "same"])
    feeling_worse_count = len([c for c in checkins if c.how_feeling == "worse"])
    
    return {
        "plan_id": plan.plan_id,
        "plan_title": plan.plan_json.get("plan_title", "Recovery Plan"),
        "days_completed": total_days,
        "days_remaining": plan.duration_days - total_days,
        "completion_percentage": plan.completion_percentage,
        "metrics": {
            "average_pain_level": round(avg_pain, 1),
            "average_energy_level": round(avg_energy, 1),
            "feeling_trend": {
                "better": feeling_better_count,
                "same": feeling_same_count,
                "worse": feeling_worse_count
            }
        },
        "recent_summaries": [
            {
                "day": c.day_number,
                "summary": c.daily_summary
            } for c in checkins[-3:]  # Last 3 days
        ]
    }

# Continue in Part 3...
# ==================== DAILY METRICS ROUTES ====================

@app.post("/metrics", response_model=schemas.DailyMetricResponse)
def create_or_update_metric(
    metric_data: schemas.DailyMetricCreate,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Create or update daily metric"""
    
    # Check if metric exists for this date
    existing_metric = db.query(models.DailyMetric).filter(
        models.DailyMetric.user_id == current_user.user_id,
        models.DailyMetric.date == metric_data.date
    ).first()
    
    if existing_metric:
        # Update existing
        for field, value in metric_data.dict(exclude_unset=True).items():
            if field != 'date':
                setattr(existing_metric, field, value)
        existing_metric.synced_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_metric)
        metric = existing_metric
    else:
        # Create new
        metric = models.DailyMetric(
            user_id=current_user.user_id,
            **metric_data.dict()
        )
        db.add(metric)
        db.commit()
        db.refresh(metric)
    
    return schemas.DailyMetricResponse(
        metric_id=metric.metric_id,
        date=metric.date,
        heart_rate_avg=metric.heart_rate_avg,
        resting_heart_rate=metric.resting_heart_rate,
        hrv=metric.hrv,
        sleep_hours=metric.sleep_hours,
        sleep_quality_score=metric.sleep_quality_score,
        steps=metric.steps,
        stress_level=metric.stress_level,
        data_source=metric.data_source
    )

@app.get("/metrics", response_model=List[schemas.DailyMetricResponse])
def get_metrics(
    days: int = 30,
    current_user: models.User = Depends(auth.get_current_user_firebase),
    db: Session = Depends(models.get_db)
):
    """Get user's daily metrics"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    metrics = db.query(models.DailyMetric).filter(
        models.DailyMetric.user_id == current_user.user_id,
        models.DailyMetric.date >= start_date
    ).order_by(models.DailyMetric.date.desc()).all()
    
    return [
        schemas.DailyMetricResponse(
            metric_id=m.metric_id,
            date=m.date,
            heart_rate_avg=m.heart_rate_avg,
            resting_heart_rate=m.resting_heart_rate,
            hrv=m.hrv,
            sleep_hours=m.sleep_hours,
            sleep_quality_score=m.sleep_quality_score,
            steps=m.steps,
            stress_level=m.stress_level,
            data_source=m.data_source
        ) for m in metrics
    ]

# ==================== WEBHOOK ROUTES ====================

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(models.get_db)):
    """Handle Stripe webhooks"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event_data = stripe_service.handle_webhook_event(payload, sig_header)
        
        # Update subscription status based on event
        if event_data["event"] == "payment_failed":
            subscription_id = event_data["data"]["subscription"]
            sub = db.query(models.Subscription).filter(
                models.Subscription.stripe_subscription_id == subscription_id
            ).first()
            if sub:
                sub.status = models.SubscriptionStatus.PAYMENT_FAILED
                db.commit()
        
        elif event_data["event"] == "subscription_deleted":
            subscription_id = event_data["data"]["id"]
            sub = db.query(models.Subscription).filter(
                models.Subscription.stripe_subscription_id == subscription_id
            ).first()
            if sub:
                sub.status = models.SubscriptionStatus.EXPIRED
                db.commit()
        
        return {"status": "success"}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "features": {
            "dynamic_plans": True,
            "daily_summaries": True,
            "completion_summaries": True,
            "enhanced_tracking": True
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Enhanced Recovery Plan API v2.0",
        "documentation": "/docs",
        "health": "/health",
        "features": [
            "Dynamic temporary plans (3-7 days) with daily themes",
            "Comprehensive permanent plans (4-12 weeks) with weekly progressions",
            "AI-generated daily summaries after each check-in",
            "Complete journey summaries upon plan completion",
            "Enhanced tracking: energy, mood, sleep quality",
            "Theme-based daily programs: exercises, practices, foods, drinks, lifestyle"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)