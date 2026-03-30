#!/usr/bin/env python3
"""
Recovery App Backend - System Diagnostic Tool
Run this to check if everything is set up correctly
"""

import sys
import os
import subprocess
import importlib.util
from pathlib import Path

def print_header(text):
    """Print a section header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def print_check(passed, message):
    """Print check result"""
    status = "✅" if passed else "❌"
    print(f"{status} {message}")
    return passed

def check_python_version():
    """Check Python version"""
    print_header("1. Python Version Check")
    version = sys.version_info
    required = (3, 8)
    
    print(f"Current Python version: {version.major}.{version.minor}.{version.micro}")
    passed = version >= required
    print_check(passed, f"Python {required[0]}.{required[1]}+ required")
    return passed

def check_files():
    """Check if all required files exist"""
    print_header("2. Required Files Check")
    
    required_files = [
        'main.py',
        'models.py',
        'schemas.py',
        'auth.py',
        'openai_service.py',
        'stripe_service.py',
        'config.py',
        'requirements.txt',
        '.env'
    ]
    
    all_exist = True
    for file in required_files:
        exists = os.path.exists(file)
        all_exist = all_exist and exists
        print_check(exists, f"Found {file}")
    
    if not os.path.exists('.env'):
        print("\n⚠️  .env file not found!")
        print("   Run: cp .env.example .env")
        print("   Then edit .env with your API keys")
    
    return all_exist

def check_env_variables():
    """Check environment variables"""
    print_header("3. Environment Variables Check")
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        required_vars = {
            'SECRET_KEY': 'JWT secret key',
            'OPENAI_API_KEY': 'OpenAI API key',
            'STRIPE_SECRET_KEY': 'Stripe secret key',
        }
        
        all_set = True
        for var, description in required_vars.items():
            value = os.getenv(var)
            is_set = value and value != f"your-{var.lower().replace('_', '-')}-here"
            all_set = all_set and is_set
            
            if is_set:
                # Show partial key for security
                display_value = value[:15] + "..." if len(value) > 15 else value
                print_check(True, f"{description}: {display_value}")
            else:
                print_check(False, f"{description}: NOT SET")
        
        if not all_set:
            print("\n⚠️  Some environment variables are missing!")
            print("   Edit .env file and add your API keys")
        
        return all_set
    except ImportError:
        print_check(False, "python-dotenv not installed")
        return False

def check_dependencies():
    """Check if required packages are installed"""
    print_header("4. Dependencies Check")
    
    required_packages = {
        'fastapi': 'FastAPI framework',
        'uvicorn': 'ASGI server',
        'sqlalchemy': 'Database ORM',
        'pydantic': 'Data validation',
        'openai': 'OpenAI API',
        'stripe': 'Stripe API',
        'jose': 'JWT handling',
        'passlib': 'Password hashing',
    }
    
    all_installed = True
    for package, description in required_packages.items():
        spec = importlib.util.find_spec(package)
        installed = spec is not None
        all_installed = all_installed and installed
        print_check(installed, f"{description} ({package})")
    
    if not all_installed:
        print("\n⚠️  Some dependencies are missing!")
        print("   Run: pip install -r requirements.txt")
    
    return all_installed

def check_database():
    """Check database connectivity"""
    print_header("5. Database Check")
    
    try:
        from sqlalchemy import create_engine
        from config import settings
        
        print(f"Database URL: {settings.DATABASE_URL}")
        
        # Try to create engine
        engine = create_engine(settings.DATABASE_URL)
        print_check(True, "Database engine created successfully")
        
        # Check if database file exists (for SQLite)
        if 'sqlite' in settings.DATABASE_URL:
            db_file = settings.DATABASE_URL.replace('sqlite:///', '')
            if os.path.exists(db_file):
                print_check(True, f"Database file exists: {db_file}")
                # Get file size
                size = os.path.getsize(db_file)
                print(f"   Database size: {size:,} bytes")
            else:
                print_check(True, "Database will be created on first run")
        
        return True
    except Exception as e:
        print_check(False, f"Database check failed: {str(e)}")
        return False

def check_openai():
    """Check OpenAI API connectivity"""
    print_header("6. OpenAI API Check")
    
    try:
        import openai
        from config import settings
        
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.startswith('your-'):
            print_check(False, "OpenAI API key not configured")
            return False
        
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Try a simple API call
        print("Testing OpenAI API connection...")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Say 'OK' if you can read this."}],
            max_tokens=10
        )
        
        if response.choices[0].message.content:
            print_check(True, "OpenAI API is working")
            print(f"   Model: gpt-4o")
            print(f"   Response: {response.choices[0].message.content}")
            return True
        else:
            print_check(False, "OpenAI API returned empty response")
            return False
            
    except Exception as e:
        print_check(False, f"OpenAI API check failed: {str(e)}")
        print("   Make sure OPENAI_API_KEY is set correctly in .env")
        return False

def check_stripe():
    """Check Stripe API connectivity"""
    print_header("7. Stripe API Check")
    
    try:
        import stripe
        from config import settings
        
        if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY.startswith('your-'):
            print_check(False, "Stripe secret key not configured")
            return False
        
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Check if it's test mode
        is_test = settings.STRIPE_SECRET_KEY.startswith('sk_test_')
        print_check(is_test, f"Using Stripe {'TEST' if is_test else 'LIVE'} mode")
        
        if not is_test:
            print("   ⚠️  WARNING: You're using LIVE mode!")
            print("   For testing, use test keys (sk_test_...)")
        
        # Try to retrieve account info
        print("Testing Stripe API connection...")
        account = stripe.Account.retrieve()
        
        print_check(True, "Stripe API is working")
        print(f"   Account: {account.id}")
        print(f"   Country: {account.country}")
        return True
        
    except Exception as e:
        print_check(False, f"Stripe API check failed: {str(e)}")
        print("   Make sure STRIPE_SECRET_KEY is set correctly in .env")
        return False

def check_server():
    """Check if server can start"""
    print_header("8. Server Startup Check")
    
    try:
        # Try to import main
        import main
        print_check(True, "main.py imports successfully")
        
        # Check if FastAPI app is created
        if hasattr(main, 'app'):
            print_check(True, "FastAPI app is created")
            
            # Count routes
            route_count = len(main.app.routes)
            print(f"   Total routes: {route_count}")
            
            return True
        else:
            print_check(False, "FastAPI app not found in main.py")
            return False
            
    except Exception as e:
        print_check(False, f"Server check failed: {str(e)}")
        return False

def check_port():
    """Check if port 8000 is available"""
    print_header("9. Port Availability Check")
    
    import socket
    
    port = 8000
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('0.0.0.0', port))
        sock.close()
        print_check(True, f"Port {port} is available")
        return True
    except OSError:
        print_check(False, f"Port {port} is already in use")
        print(f"   Try: uvicorn main:app --port 8001")
        return False

def print_summary(results):
    """Print diagnostic summary"""
    print_header("Diagnostic Summary")
    
    total = len(results)
    passed = sum(results.values())
    percentage = (passed / total) * 100
    
    print(f"\nTests Passed: {passed}/{total} ({percentage:.0f}%)")
    print("\nResults by category:")
    
    categories = {
        'Python Version': results.get('python', False),
        'Required Files': results.get('files', False),
        'Environment Variables': results.get('env', False),
        'Dependencies': results.get('deps', False),
        'Database': results.get('db', False),
        'OpenAI API': results.get('openai', False),
        'Stripe API': results.get('stripe', False),
        'Server Setup': results.get('server', False),
        'Port Availability': results.get('port', False),
    }
    
    for category, passed in categories.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {category}")
    
    print("\n" + "=" * 60)
    
    if passed == total:
        print("\n🎉 All checks passed! Your backend is ready to run!")
        print("\nNext steps:")
        print("  1. Start server: python main.py")
        print("  2. Open browser: http://localhost:8000/docs")
        print("  3. Run tests: python test_api.py")
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        print("\nCommon solutions:")
        print("  • Missing files: Extract recovery-app-backend.tar.gz")
        print("  • Missing .env: Run 'cp .env.example .env' and edit it")
        print("  • Missing dependencies: Run 'pip install -r requirements.txt'")
        print("  • API key errors: Check your .env file for correct keys")

def main():
    """Run all diagnostics"""
    print("\n" + "🏥 Recovery App Backend - System Diagnostic Tool" )
    print("This will check if your backend is set up correctly\n")
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    results = {}
    
    # Run all checks
    results['python'] = check_python_version()
    results['files'] = check_files()
    results['env'] = check_env_variables()
    results['deps'] = check_dependencies()
    results['db'] = check_database()
    
    # Only check APIs if basic setup is done
    if results['env'] and results['deps']:
        results['openai'] = check_openai()
        results['stripe'] = check_stripe()
    else:
        print("\n⚠️  Skipping API checks (fix basic setup first)")
        results['openai'] = False
        results['stripe'] = False
    
    results['server'] = check_server()
    results['port'] = check_port()
    
    # Print summary
    print_summary(results)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Diagnostic interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
