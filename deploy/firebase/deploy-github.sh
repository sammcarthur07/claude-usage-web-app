#!/bin/bash

echo "🐙 Setting up GitHub Pages deployment..."

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
else
    echo "📁 Git repository already exists"
fi

# Get GitHub username
echo ""
read -p "🔑 Enter your GitHub username: " GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

read -p "📦 Enter repository name [claude-usage-web-app]: " REPO_NAME
REPO_NAME=${REPO_NAME:-claude-usage-web-app}

echo ""
echo "📋 Git configuration:"
echo "   Repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "   Live URL: https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
echo ""

read -p "Continue? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Cancelled"
    exit 1
fi

# Configure git if not already done
if ! git config user.name >/dev/null 2>&1; then
    read -p "📝 Enter your Git name: " GIT_NAME
    git config user.name "$GIT_NAME"
fi

if ! git config user.email >/dev/null 2>&1; then
    read -p "📧 Enter your Git email: " GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

# Add all files
echo "📄 Adding files to Git..."
git add .

# Create commit
echo "💾 Creating commit..."
git commit -m "Complete Claude Usage Monitor PWA implementation

🚀 Features:
- Google Sign-In + Manual Authentication  
- Real-time dashboard with 3-second updates
- Offline PWA with service worker caching
- Samsung S23 Ultra optimization (412x915px)
- AES-GCM encrypted secure storage
- CSS animation overrides for Android
- Theme switching (Auto/Light/Dark)
- Chart.js data visualization
- Material Design UI components

🎨 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Set up remote
echo "🔗 Setting up GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Set main branch
git branch -M main

echo ""
echo "🚀 Ready to push to GitHub!"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo "1. Go to https://github.com/new"
echo "2. Create repository: $REPO_NAME"
echo "3. Make it PUBLIC"
echo "4. Do NOT add README, .gitignore, or license"
echo "5. Click 'Create repository'"
echo ""
read -p "✅ Have you created the GitHub repository? (y/N): " REPO_CREATED

if [ "$REPO_CREATED" = "y" ] || [ "$REPO_CREATED" = "Y" ]; then
    echo "📤 Pushing to GitHub..."
    if git push -u origin main; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "🌐 ENABLE GITHUB PAGES:"
        echo "1. Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
        echo "2. Source: 'Deploy from a branch'"
        echo "3. Branch: 'main' / 'root'"
        echo "4. Click 'Save'"
        echo "5. Wait 2-3 minutes for deployment"
        echo ""
        echo "🔗 Your live URL will be:"
        echo "   https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
        echo ""
        echo "🔑 UPDATE GOOGLE OAUTH:"
        echo "Add this URL to your Google Cloud Console:"
        echo "   https://$GITHUB_USERNAME.github.io"
        echo ""
    else
        echo "❌ Failed to push to GitHub"
        echo "💡 Make sure you created the repository and it's public"
    fi
else
    echo "📄 Push command ready. Run when repository is created:"
    echo "   git push -u origin main"
fi
