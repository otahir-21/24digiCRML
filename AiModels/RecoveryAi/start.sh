#!/bin/bash

# Quick Start Script for Recovery App Backend

echo "======================================"
echo "Recovery App Backend - Quick Start"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet
echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your:"
    echo "   - OPENAI_API_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_PUBLISHABLE_KEY"
    echo "   - SECRET_KEY (generate a random string)"
    echo ""
    echo "Press Enter to continue (or Ctrl+C to exit and configure .env first)"
    read
else
    echo "✅ .env file found"
fi
echo ""

# Initialize database
echo "🗄️  Initializing database..."
python3 -c "from models import Base, create_engine; from config import settings; engine = create_engine(settings.DATABASE_URL); Base.metadata.create_all(bind=engine); print('✅ Database initialized')"
echo ""

# Start the server
echo "🚀 Starting FastAPI server..."
echo ""
echo "======================================"
echo "Server will be available at:"
echo "  - API: http://localhost:8000"
echo "  - Docs: http://localhost:8000/docs"
echo "  - ReDoc: http://localhost:8000/redoc"
echo "======================================"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 main.py
