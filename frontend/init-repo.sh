#!/bin/bash

# Script to initialize the frontend as a new Git repository
# Usage: ./init-repo.sh [repository-url]

set -e  # Exit on error

echo "🚀 Initializing Fafa Access Frontend Repository"
echo "================================================"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed. Please install Git first."
    exit 1
fi

# Check if already a git repository
if [ -d ".git" ]; then
    echo "⚠️  Warning: This directory is already a Git repository."
    read -p "Do you want to remove the existing .git directory and start fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .git
        echo "✅ Removed existing .git directory"
    else
        echo "❌ Aborted. Keeping existing repository."
        exit 0
    fi
fi

# Initialize Git repository
echo "📦 Initializing Git repository..."
git init
echo "✅ Git repository initialized"

# Create initial commit
echo ""
echo "📝 Creating initial commit..."
git add .
git commit -m "Initial commit: Fafa Access Frontend

- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- React Router for routing
- Recharts for data visualization
- Complete component library
- API service layer
- Development and deployment configurations"

echo "✅ Initial commit created"

# Set default branch to main
git branch -M main
echo "✅ Set default branch to 'main'"

# Get repository URL from argument or prompt user
REPO_URL="$1"
if [ -z "$REPO_URL" ]; then
    echo ""
    echo "📍 Please provide your GitHub repository URL:"
    echo "   Example: https://github.com/username/Fafa-Access-Frontend.git"
    echo "   Or: git@github.com:username/Fafa-Access-Frontend.git"
    read -p "Repository URL: " REPO_URL
fi

# Validate URL
if [ -z "$REPO_URL" ]; then
    echo ""
    echo "⚠️  No repository URL provided. You can add it later with:"
    echo "   git remote add origin YOUR_REPO_URL"
    echo "   git push -u origin main"
else
    # Add remote
    echo ""
    echo "🔗 Adding remote repository..."
    git remote add origin "$REPO_URL"
    echo "✅ Remote 'origin' added: $REPO_URL"
    
    # Offer to push
    echo ""
    read -p "Do you want to push to the remote repository now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "⬆️  Pushing to remote..."
        git push -u origin main
        echo "✅ Successfully pushed to remote repository!"
    else
        echo "⏭️  Skipped pushing. You can push later with:"
        echo "   git push -u origin main"
    fi
fi

echo ""
echo "================================================"
echo "✨ Repository setup complete!"
echo ""
echo "📚 Next Steps:"
echo "   1. Install dependencies: npm install"
echo "   2. Copy .env.example to .env and configure"
echo "   3. Start development server: npm run dev"
echo ""
echo "📖 Documentation:"
echo "   - README.md - Main documentation"
echo "   - CONTRIBUTING.md - Contribution guidelines"
echo "   - DEPLOYMENT.md - Deployment instructions"
echo "   - SETUP_NEW_REPO.md - Repository setup guide"
echo ""
echo "🎉 Happy coding!"
