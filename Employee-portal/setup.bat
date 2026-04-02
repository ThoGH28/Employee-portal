@echo off
REM Quick setup script for local development on Windows

echo ==================================
echo Employee Portal Setup Script
echo ==================================

REM Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Python version OK
echo.

REM Create virtual environment
echo Creating virtual environment...
if exist venv (
    echo Virtual environment already exists. Skipping...
) else (
    python -m venv venv
    echo Virtual environment created
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Virtual environment activated
echo.

REM Install dependencies
echo Installing dependencies...
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo Dependencies installed
echo.

REM Create .env file
echo Setting up environment...
if exist .env (
    echo .env file already exists. Skipping...
) else (
    copy .env.example .env
    echo Created .env file (please update with your configuration)
)
echo.

REM Run migrations
echo Running migrations...
python manage.py migrate
echo Migrations completed
echo.

REM Create superuser
echo Creating superuser...
echo Please enter superuser credentials:
python manage.py createsuperuser
echo.

REM Collect static files
echo Collecting static files...
python manage.py collectstatic --noinput
echo Static files collected
echo.

REM Create required directories
echo Creating required directories...
mkdir logs
mkdir media\documents
mkdir vector_db
echo Directories created
echo.

echo ==================================
echo Setup completed successfully!
echo ==================================
echo.
echo Next steps:
echo 1. Update .env with your OpenAI API key and other settings
echo 2. Run: python manage.py runserver
echo 3. Access: http://localhost:8000/admin
echo.
echo For Docker setup, run:
echo docker-compose up -d
echo.
pause
