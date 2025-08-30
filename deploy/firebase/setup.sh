#!/bin/bash

# Claude Usage Monitor PWA - Complete Setup Script
# This script prepares the app for all 3 testing scenarios
# Run with: bash setup.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# App info
APP_NAME="Claude Usage Monitor PWA"
VERSION="2.0.0"

echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  🚀 ${APP_NAME} - Complete Setup Script v${VERSION}${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
}

# Function to print subsection headers
print_subsection() {
    echo -e "\n${YELLOW}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}│  $1${NC}"
    echo -e "${YELLOW}└─────────────────────────────────────────────────────────────────┘${NC}"
}

# Function to wait for user input
wait_for_user() {
    echo -e "\n${GREEN}Press ENTER to continue...${NC}"
    read -r
}

# Function to create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo -e "${GREEN}✓ Created directory: $1${NC}"
    fi
}

# Check if we're in the right directory
if [ ! -f "index.html" ] || [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the claude-usage-web-app directory${NC}"
    echo -e "${RED}   Expected files: index.html, manifest.json${NC}"
    exit 1
fi

print_section "📋 PRE-SETUP VALIDATION"

# Check dependencies
echo "Checking dependencies..."
MISSING_DEPS=()

if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    MISSING_DEPS+=("python")
fi

if ! command -v git &> /dev/null; then
    MISSING_DEPS+=("git")
fi

if ! command -v zip &> /dev/null; then
    MISSING_DEPS+=("zip")
fi

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All dependencies are installed${NC}"
else
    echo -e "${RED}❌ Missing dependencies: ${MISSING_DEPS[*]}${NC}"
    echo -e "${YELLOW}   Install with: pkg install python git zip${NC}"
    exit 1
fi

# Validate file structure
echo ""
echo "Validating file structure..."
REQUIRED_FILES=(
    "index.html"
    "manifest.json"
    "service-worker.js"
    "css/main.css"
    "css/animations.css"
    "css/auth.css"
    "css/responsive.css"
    "js/config.js"
    "js/utils.js"
    "js/storage.js"
    "js/auth/google-auth.js"
    "js/auth/manual-auth.js"
    "js/auth/auth-manager.js"
    "js/data-collector.js"
    "js/charts.js"
    "js/theme.js"
    "js/dashboard.js"
    "js/app.js"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required files are present${NC}"
else
    echo -e "${RED}❌ Missing files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo -e "${RED}   - $file${NC}"
    done
    exit 1
fi

wait_for_user

print_section "🔑 GOOGLE OAUTH CONFIGURATION"

echo -e "${YELLOW}IMPORTANT: You need to set up Google OAuth for authentication to work.${NC}"
echo -e "${YELLOW}Follow these steps EXACTLY:${NC}"
echo ""

print_subsection "Step 1: Create Google Cloud Project"

cat << 'EOF'
1. Open https://console.cloud.google.com in your browser
2. Click "Select a project" dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "Claude Usage Monitor"
5. Leave organization field blank (unless you have one)
6. Click "CREATE"
7. Wait for project creation, then click "SELECT PROJECT"
EOF

wait_for_user

print_subsection "Step 2: Enable Google Sign-In API"

cat << 'EOF'
1. In the left sidebar, click "APIs & Services" → "Library"
2. Search for "Google Sign-In API" or "Google Identity Services API"
3. Click on "Google Sign-In API"
4. Click "ENABLE" button
5. Wait for activation (may take a few seconds)
EOF

wait_for_user

print_subsection "Step 3: Configure OAuth Consent Screen"

cat << 'EOF'
1. In left sidebar: "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Click "CREATE"
4. Fill out REQUIRED fields:
   - App name: "Claude Usage Monitor"
   - User support email: YOUR_EMAIL@gmail.com
   - Developer contact email: YOUR_EMAIL@gmail.com
5. Click "SAVE AND CONTINUE"
6. Skip "Scopes" → Click "SAVE AND CONTINUE"
7. Skip "Test users" → Click "SAVE AND CONTINUE"
8. Review and click "BACK TO DASHBOARD"
EOF

wait_for_user

print_subsection "Step 4: Create OAuth 2.0 Credentials"

cat << 'EOF'
1. In left sidebar: "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Name: "Claude Usage Monitor Web Client"
5. Authorized JavaScript origins - ADD THESE EXACTLY:
   - http://localhost:8080
   - http://127.0.0.1:8080
   - https://YOUR-USERNAME.github.io
   - https://your-project-id.web.app (if using Firebase)
6. Authorized redirect URIs - ADD THESE EXACTLY:
   - http://localhost:8080/
   - https://YOUR-USERNAME.github.io/claude-usage-web-app/
7. Click "CREATE"
EOF

wait_for_user

print_subsection "Step 5: Copy Client ID"

cat << 'EOF'
1. After creating credentials, a popup shows your Client ID
2. Copy the "Client ID" (starts with numbers, ends with .apps.googleusercontent.com)
3. Click "OK"

IMPORTANT: You can always find this later at:
"APIs & Services" → "Credentials" → Click your OAuth client name
EOF

echo -e "\n${GREEN}📝 PASTE YOUR GOOGLE CLIENT ID HERE:${NC}"
echo -e "${YELLOW}(Press ENTER to skip if you'll do this manually later)${NC}"
read -p "Client ID: " GOOGLE_CLIENT_ID

if [ -n "$GOOGLE_CLIENT_ID" ]; then
    echo -e "\n${GREEN}✓ Updating config.js with your Client ID...${NC}"
    
    # Update the Google Client ID in config.js
    if [ -f "js/config.js" ]; then
        # Create backup
        cp js/config.js js/config.js.backup
        
        # Replace the placeholder client ID
        sed -i "s/clientId: '1087230260509-r1j2htthp0itr9nvnqkjhch7d7h68kh6.apps.googleusercontent.com'/clientId: '$GOOGLE_CLIENT_ID'/g" js/config.js
        
        echo -e "${GREEN}✓ Client ID updated in js/config.js${NC}"
        echo -e "${YELLOW}  Backup saved as js/config.js.backup${NC}"
    else
        echo -e "${RED}❌ js/config.js not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Client ID not provided. You'll need to update js/config.js manually.${NC}"
    echo -e "${YELLOW}   Find line 31: clientId: 'YOUR_CLIENT_ID_HERE'${NC}"
fi

wait_for_user

print_section "📁 PREPARING DEPLOYMENT FILES"

# Create deployment directories
create_dir "deploy"
create_dir "deploy/github"
create_dir "deploy/firebase"

echo -e "\n${GREEN}✓ Deployment directories created${NC}"

print_section "🖥️  METHOD 1: LOCAL TESTING SETUP"

print_subsection "Local Server Configuration"

# Create local server script
cat > run-local.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Claude Usage Monitor PWA Local Server..."
echo ""
echo "📍 Server will run at:"
echo "   http://localhost:8080"
echo "   http://127.0.0.1:8080"
echo ""
echo "📱 For Samsung S23 Ultra testing:"
echo "   Set browser to 412x915 resolution"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Check for Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Using Python 2..."
    python -m SimpleHTTPServer 8080
else
    echo "❌ Python not found. Please install Python."
    exit 1
fi
EOF

chmod +x run-local.sh

# Create testing checklist
cat > LOCAL_TESTING.md << 'EOF'
# LOCAL TESTING CHECKLIST

## 🚀 Start Server
```bash
bash run-local.sh
```

## 🌐 Open in Browser
- http://localhost:8080
- http://127.0.0.1:8080

## ✅ Test Checklist

### Authentication
- [ ] Google Sign-In button loads
- [ ] Manual login form works
- [ ] Password toggle works
- [ ] Remember me persists data
- [ ] Both methods switch to dashboard

### Dashboard
- [ ] User profile displays
- [ ] Stats show animated numbers
- [ ] Chart renders with data
- [ ] Progress bars animate
- [ ] Theme toggle works (Auto→Light→Dark)

### Real-time Updates
- [ ] Numbers update every 3 seconds
- [ ] Fade animations work
- [ ] Updates pause when tab hidden
- [ ] Refresh indicator appears

### PWA Features
- [ ] Install prompt appears
- [ ] App works offline
- [ ] Service worker caches resources
- [ ] Responsive design works

## 🔧 Developer Tools Commands
```javascript
// Test offline mode
navigator.serviceWorker.ready.then(() => console.log('SW ready'));

// Test storage
console.log('Storage:', window.storageManager?.getStorageStats());

// Test auth
console.log('Auth:', window.authManager?.isSignedIn());
```
EOF

echo -e "${GREEN}✓ Local testing files created:${NC}"
echo -e "  📄 run-local.sh - Start local server"
echo -e "  📄 LOCAL_TESTING.md - Testing checklist"

wait_for_user

print_section "🐙 METHOD 2: GITHUB PAGES SETUP"

print_subsection "Git Repository Configuration"

# Copy files to GitHub deployment folder
echo "Preparing GitHub deployment..."
cp -r * deploy/github/ 2>/dev/null || true

# Create GitHub deployment script
cat > deploy-github.sh << 'EOF'
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
EOF

chmod +x deploy-github.sh

echo -e "${GREEN}✓ GitHub deployment ready:${NC}"
echo -e "  📄 deploy-github.sh - Run to push to GitHub"

wait_for_user

print_section "🔥 METHOD 3: FIREBASE HOSTING SETUP"

print_subsection "Firebase Files Preparation"

# Create clean Firebase deployment
echo "Preparing Firebase deployment files..."

# Copy all files except git and development files
rsync -av --exclude='.git' --exclude='*.backup' --exclude='deploy' --exclude='*.sh' --exclude='*.md' . deploy/firebase/

# Create Firebase deployment zip
cd deploy/firebase
zip -r ../claude-usage-monitor-firebase.zip . -q
cd ../..

# Create Firebase instructions
cat > FIREBASE_DEPLOY.md << 'EOF'
# 🔥 FIREBASE HOSTING DEPLOYMENT

## Option 1: Manual Console Upload

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com
2. Click "Add project" or "Create a project"
3. Project name: "Claude Usage Monitor"
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Set up Hosting
1. In left sidebar, click "Hosting"
2. Click "Get started"
3. Skip CLI installation steps
4. Click "Continue to console"

### Step 3: Upload Files
1. Click "Add another site" (if first time) or "Add site"
2. Site name: "claude-usage-monitor" (or your preference)
3. Click "Add site"
4. Click "Deploy to Firebase Hosting"
5. Drag and drop the entire `deploy/firebase/` folder
6. Click "Deploy"

### Step 4: Configure Domain (Optional)
1. Click "Add custom domain"
2. Enter your domain name
3. Follow DNS setup instructions

## Option 2: Firebase CLI (Advanced)

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Login and Deploy
```bash
cd deploy/firebase
firebase login
firebase init hosting
firebase deploy
```

## 🔗 Your Firebase URLs
- Default: https://your-project-id.web.app
- Custom: https://your-project-id.firebaseapp.com

## 🔑 Update Google OAuth
Add these URLs to Google Cloud Console:
- https://your-project-id.web.app
- https://your-project-id.firebaseapp.com

## ✅ Test Firebase Deployment
1. Open your Firebase URL
2. Test Google Sign-In
3. Verify offline functionality
4. Check PWA installation
EOF

# Create Firebase config template
cat > deploy/firebase/firebase-config-template.js << 'EOF'
// Firebase Configuration (Optional)
// Uncomment and configure if you want to use Firebase services

/*
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
const app = initializeApp(firebaseConfig);
*/
EOF

echo -e "${GREEN}✓ Firebase deployment ready:${NC}"
echo -e "  📁 deploy/firebase/ - Clean deployment files"
echo -e "  📦 deploy/claude-usage-monitor-firebase.zip - Upload package"
echo -e "  📄 FIREBASE_DEPLOY.md - Deployment instructions"

wait_for_user

print_section "🎯 DEPLOYMENT SUMMARY & NEXT STEPS"

echo -e "${GREEN}🎉 Setup complete! All deployment methods are ready.${NC}"
echo ""

print_subsection "📂 Generated Files"
cat << EOF
✅ Local Testing:
   📄 run-local.sh - Start development server
   📄 LOCAL_TESTING.md - Testing checklist

✅ GitHub Pages:
   📄 deploy-github.sh - Push and deploy to GitHub
   📁 deploy/github/ - GitHub deployment files

✅ Firebase Hosting:
   📁 deploy/firebase/ - Clean Firebase files
   📦 deploy/claude-usage-monitor-firebase.zip - Upload package
   📄 FIREBASE_DEPLOY.md - Detailed instructions
EOF

print_subsection "🚀 Quick Start Commands"
cat << EOF
# 🖥️  LOCAL TESTING
bash run-local.sh

# 🐙 GITHUB PAGES  
bash deploy-github.sh

# 🔥 FIREBASE HOSTING
# Upload deploy/claude-usage-monitor-firebase.zip to Firebase Console
cat FIREBASE_DEPLOY.md
EOF

print_subsection "🔑 Google OAuth URLs to Add"
echo -e "${YELLOW}Add these to your Google Cloud Console OAuth settings:${NC}"
cat << EOF

📍 JavaScript Origins:
   http://localhost:8080
   http://127.0.0.1:8080
   https://YOUR-GITHUB-USERNAME.github.io
   https://your-firebase-project.web.app

📍 Redirect URIs:
   http://localhost:8080/
   https://YOUR-GITHUB-USERNAME.github.io/claude-usage-web-app/
   https://your-firebase-project.web.app/
EOF

print_subsection "⚠️  Important Notes"
cat << EOF
1. 🔑 Update Google Client ID in js/config.js if not done during setup
2. 🌐 Test each deployment method thoroughly
3. 📱 Test on actual Samsung S23 Ultra if possible
4. 🔒 Verify HTTPS works for Google Sign-In on deployed versions
5. 📊 All data is currently simulated - integrate real APIs as needed
EOF

print_subsection "🆘 Troubleshooting"
cat << EOF
❌ Google Sign-In not working:
   - Check Client ID in js/config.js
   - Verify authorized origins in Google Cloud Console
   - Ensure HTTPS for production deployments

❌ PWA not installing:
   - Check manifest.json is accessible
   - Verify service-worker.js is loading
   - Test on HTTPS (required for PWA)

❌ Animations not working:
   - Check CSS files are loading
   - Verify !important declarations in animations.css
   - Test in different browsers

🔧 Debug Commands:
   console.log('Auth:', window.authManager?.isSignedIn());
   console.log('Storage:', window.storageManager?.getStorageStats());
   navigator.serviceWorker.ready.then(console.log);
EOF

echo ""
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  🎯 Setup Complete! Choose your deployment method and test!${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Final file permissions
chmod +x *.sh 2>/dev/null || true

echo -e "${GREEN}✅ All setup files are ready to use!${NC}"