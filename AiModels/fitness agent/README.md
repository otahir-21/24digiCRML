# AI Fitness Coach App

A Streamlit-based fitness coaching application that uses OpenAI's GPT to provide personalized training advice for running, swimming, and strength training.

## Features

- **Profile Setup**: Input basic health data (age, weight, height, fitness level)
- **Goal Setting**: Set specific goals for running, swimming, or strength training
- **AI Coaching**: Get personalized training plans and advice
- **Progress Tracking**: Log workouts and track progress over time
- **Multi-Sport Support**: Specialized coaching for running, swimming, and strength training

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

3. Run the Streamlit app:
```bash
streamlit run app.py
```

## Usage

1. **Profile Setup**: Enter your basic health information
2. **Goal Setting**: Choose your sport and set a specific goal
3. **Get Coaching**: Navigate to your sport's coaching section for personalized advice
4. **Track Progress**: Log your workouts and monitor improvement

## Supported Goals

### Running
- Complete 5K, 10K, half marathon, or marathon
- Improve race times
- Build endurance

### Swimming  
- Learn proper technique
- Swim longer distances
- Prepare for competition
- Master all four strokes

### Strength Training
- Build muscle mass
- Increase strength
- Prepare for powerlifting
- Improve functional fitness

## Requirements

- Python 3.8+
- OpenAI API key
- Internet connection for AI coaching responses