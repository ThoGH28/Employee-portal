#!/bin/bash

# Employee Portal Frontend - Setup Script

echo "🚀 Employee Portal Frontend Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Start development server: npm run dev"
    echo "  2. Open http://localhost:5173 in your browser"
    echo "  3. Login with: demo@example.com / demo123"
    echo ""
    echo "Available commands:"
    echo "  npm run dev         - Start development server"
    echo "  npm run build       - Build for production"
    echo "  npm run preview     - Preview production build"
    echo "  npm run lint        - Run ESLint"
    echo "  npm run type-check  - Check TypeScript"
    echo ""
    echo "Documentation:"
    echo "  - README.md          - Quick start guide"
    echo "  - ARCHITECTURE.md    - Architecture details"
    echo "  - FRONTEND_DEV_GUIDE.md - Development guide"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
