@echo off
REM Employee Portal Frontend - Setup Script (Windows)

echo 🚀 Employee Portal Frontend Setup
echo ==================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i

echo ✅ Node.js version: %NODE_VERSION%
echo ✅ npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if errorlevel 0 (
    echo ✅ Dependencies installed successfully
    echo.
    echo 🎉 Setup complete!
    echo.
    echo Next steps:
    echo   1. Start development server: npm run dev
    echo   2. Open http://localhost:5173 in your browser
    echo   3. Login with: demo@example.com / demo123
    echo.
    echo Available commands:
    echo   npm run dev         - Start development server
    echo   npm run build       - Build for production
    echo   npm run preview     - Preview production build
    echo   npm run lint        - Run ESLint
    echo   npm run type-check  - Check TypeScript
    echo.
    echo Documentation:
    echo   - README.md          - Quick start guide
    echo   - ARCHITECTURE.md    - Architecture details
    echo   - FRONTEND_DEV_GUIDE.md - Development guide
    echo.
    pause
) else (
    echo ❌ Failed to install dependencies
    exit /b 1
)
