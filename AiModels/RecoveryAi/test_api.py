"""
Simple test script to verify API is working
Run this after starting the server
"""

import requests
import json
from datetime import date

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    print("✅ Health check passed")
    return response.json()

def test_authentication():
    """Test authentication flow"""
    print("\nTesting authentication...")
    
    # Sign up
    response = requests.post(
        f"{BASE_URL}/auth/signup-login",
        json={"email": "test@example.com"}
    )
    assert response.status_code == 200
    print("✅ Signup successful")
    
    # Get OTP from console
    print("⚠️  Check console output for OTP")
    otp = input("Enter OTP: ")
    
    # Verify OTP
    response = requests.post(
        f"{BASE_URL}/auth/verify-otp",
        json={"identifier": "test@example.com", "otp": otp}
    )
    assert response.status_code == 200
    data = response.json()
    print("✅ OTP verification successful")
    
    return data["access_token"], data["is_new_user"]

def test_profile_creation(token):
    """Test profile creation"""
    print("\nTesting profile creation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    profile_data = {
        "full_name": "Test User",
        "date_of_birth": "1990-01-01",
        "height_cm": 170.0,
        "weight_kg": 70.0,
        "gender": "Male",
        "health_concerns": ["Back Pain"],
        "medications": "None",
        "allergies": [],
        "dietary_restrictions": [],
        "mobility_level": "Fully Mobile",
        "daily_activity_level": "Moderate Activity",
        "physical_limitations": [],
        "primary_goal": "Improve Sleep Quality",
        "current_pain_level": 5,
        "concern_areas": ["Sleep Issues"]
    }
    
    response = requests.post(
        f"{BASE_URL}/profile",
        headers=headers,
        json=profile_data
    )
    
    if response.status_code == 400 and "already exists" in response.text:
        print("ℹ️  Profile already exists, skipping creation")
        response = requests.get(f"{BASE_URL}/profile", headers=headers)
    
    assert response.status_code == 200
    print("✅ Profile creation/retrieval successful")
    return response.json()

def test_issue_selection(token):
    """Test issue selection"""
    print("\nTesting issue selection...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    issue_data = {
        "category": "sport",
        "issue_type": "Muscle Soreness",
        "affected_areas": ["Legs"],
        "onset_time": "1-2 days ago",
        "severity_level": 6,
        "additional_answers": {}
    }
    
    response = requests.post(
        f"{BASE_URL}/issues",
        headers=headers,
        json=issue_data
    )
    assert response.status_code == 200
    print("✅ Issue selection successful")
    return response.json()

def test_metrics(token):
    """Test daily metrics"""
    print("\nTesting daily metrics...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    metrics_data = {
        "date": str(date.today()),
        "heart_rate_avg": 72.5,
        "resting_heart_rate": 65.0,
        "hrv": 45.5,
        "sleep_hours": 7.5,
        "sleep_quality_score": 75.0,
        "steps": 8500,
        "stress_level": 45.0,
        "data_source": "manual"
    }
    
    response = requests.post(
        f"{BASE_URL}/metrics",
        headers=headers,
        json=metrics_data
    )
    assert response.status_code == 200
    print("✅ Metrics creation successful")
    return response.json()

def main():
    """Run all tests"""
    print("=" * 50)
    print("Recovery App Backend - Test Suite")
    print("=" * 50)
    
    try:
        # Test health check
        health = test_health_check()
        print(f"Server status: {health['status']}")
        
        # Test authentication
        token, is_new_user = test_authentication()
        print(f"Is new user: {is_new_user}")
        
        # Test profile
        profile = test_profile_creation(token)
        print(f"Profile name: {profile['full_name']}")
        
        # Test issue selection
        issue = test_issue_selection(token)
        print(f"Issue ID: {issue['selection_id']}")
        
        # Test metrics
        metric = test_metrics(token)
        print(f"Metric ID: {metric['metric_id']}")
        
        print("\n" + "=" * 50)
        print("✅ All tests passed!")
        print("=" * 50)
        print("\nNote: To test subscription and plan generation,")
        print("you'll need to configure Stripe and OpenAI in .env")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\nMake sure the server is running at http://localhost:8000")
    input("Press Enter to start tests...")
    main()
