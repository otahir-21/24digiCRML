from datetime import datetime, timedelta
from typing import Optional
import json
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import random
import hashlib
from config import settings
from models import User, get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ---------------------------------------------------------------------------
# Firebase Auth (Option 1: single login = Firebase; map to SQL User)
# ---------------------------------------------------------------------------

_firebase_app = None

def _get_firebase_app():
    """Lazy-init Firebase Admin SDK. Uses FIREBASE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    try:
        import firebase_admin
        from firebase_admin import credentials
        cred = None
        if settings.FIREBASE_CREDENTIALS_JSON and settings.FIREBASE_CREDENTIALS_JSON.strip():
            cred = credentials.Certificate(json.loads(settings.FIREBASE_CREDENTIALS_JSON))
        elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
        if cred is None:
            return None
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception:
        return None

def verify_firebase_token(id_token: str) -> Optional[dict]:
    """Verify Firebase ID token; return decoded claims (uid, email, etc.) or None."""
    app = _get_firebase_app()
    if app is None:
        return None
    try:
        import firebase_admin.auth
        decoded = firebase_admin.auth.verify_id_token(id_token)
        return decoded
    except Exception:
        return None

def get_or_create_user_from_firebase(decoded: dict, db: Session) -> User:
    """Find or create User by Firebase UID; set email from token if present."""
    uid = decoded.get("uid")
    if not uid:
        raise ValueError("Firebase token missing uid")
    user = db.query(User).filter(User.firebase_uid == uid).first()
    if user:
        # Optionally update email from token if it changed
        if decoded.get("email") and user.email != decoded.get("email"):
            user.email = decoded.get("email")
            db.commit()
            db.refresh(user)
        return user
    email = decoded.get("email") or None
    user = User(firebase_uid=uid, email=email, verified=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_or_create_user_by_firebase_uid(firebase_uid: str, db: Session) -> User:
    """Find or create User by Firebase UID only (e.g. for test token)."""
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if user:
        return user
    user = User(firebase_uid=firebase_uid, verified=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

async def get_current_user_firebase(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Authenticate using Firebase ID token or RecoveryAI JWT (Bearer)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Use Firebase ID token or test token from POST /auth/test-token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = credentials.credentials
    if not token:
        raise credentials_exception
    # 1) Try Firebase ID token (phone/email auth in app)
    decoded = verify_firebase_token(token)
    if decoded:
        try:
            return get_or_create_user_from_firebase(decoded, db)
        except ValueError:
            raise credentials_exception
    # 2) Fallback: our own JWT (e.g. from /auth/test-token or legacy OTP flow)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user = db.query(User).filter(User.user_id == int(user_id)).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

def generate_otp() -> str:
    """Generate a 4-digit OTP"""
    return str(random.randint(1000, 9999))

def hash_otp(otp: str) -> str:
    """Hash OTP for secure storage"""
    return hashlib.sha256(otp.encode()).hexdigest()

def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    """Verify OTP against hash"""
    return hash_otp(plain_otp) == hashed_otp

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.user_id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def send_otp_email(email: str, otp: str):
    """Send OTP via email (implement with your email provider)"""
    # TODO: Implement actual email sending
    print(f"Sending OTP {otp} to email {email}")
    # Example with SMTP:
    # import smtplib
    # from email.mime.text import MIMEText
    # msg = MIMEText(f"Your OTP is: {otp}")
    # msg['Subject'] = 'Your Recovery App OTP'
    # msg['From'] = settings.SMTP_USER
    # msg['To'] = email
    # with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
    #     server.starttls()
    #     server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    #     server.send_message(msg)

def send_otp_sms(mobile: str, otp: str):
    """Send OTP via SMS (implement with Twilio or other provider)"""
    # TODO: Implement actual SMS sending
    print(f"Sending OTP {otp} to mobile {mobile}")
    # Example with Twilio:
    # from twilio.rest import Client
    # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    # message = client.messages.create(
    #     body=f"Your Recovery App OTP is: {otp}",
    #     from_=settings.TWILIO_PHONE_NUMBER,
    #     to=mobile
    # )
