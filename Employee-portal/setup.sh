#!/bin/bash
# Quick setup script for local development

set -e

echo "=================================="
echo "Employee Portal Setup Script"
echo "=================================="

# Check for Python 3.12+
echo "Checking Python version..."
python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.12"

if (( $(echo "$python_version < $required_version" | bc -l) )); then
    echo "Error: Python $required_version or higher is required. Found: $python_version"
    exit 1
fi
echo "✓ Python version OK: $python_version"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists. Skipping..."
else
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate || . venv/Scripts/activate 2>/dev/null
echo "✓ Virtual environment activated"

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Create .env file
echo ""
echo "Setting up environment..."
if [ -f ".env" ]; then
    echo ".env file already exists. Skipping..."
else
    cp .env.example .env
    echo "✓ Created .env file (please update with your configuration)"
fi

# Run migrations
echo ""
echo "Running migrations..."
python manage.py migrate
echo "✓ Migrations completed"

# Create superuser
echo ""
echo "Creating superuser..."
echo "Please enter superuser credentials:"
python manage.py createsuperuser

# Collect static files
echo ""
echo "Collecting static files..."
python manage.py collectstatic --noinput
echo "✓ Static files collected"

# Create required directories
echo ""
echo "Creating required directories..."
mkdir -p logs media/documents vector_db
echo "✓ Directories created"

echo ""
echo "=================================="
echo "Setup completed successfully!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Update .env with your OpenAI API key and other settings"
echo "2. Run: python manage.py runserver"
echo "3. Access: http://localhost:8000/admin"
echo ""
echo "For Docker setup, run:"
echo "docker-compose up -d"
