#!/bin/bash

echo "🔥 Setting up Firebase Hosting deployment..."

# Create firebase deployment directory
mkdir -p deploy/firebase

# Copy all web files to firebase directory
echo "📁 Copying files to Firebase deployment directory..."
rsync -av --exclude='deploy/' --exclude='.git/' --exclude='node_modules/' . deploy/firebase/

# Create Firebase-specific files
echo "🔧 Creating Firebase configuration..."

# Create firebase.json in the firebase directory
cat > deploy/firebase/firebase.json << 'EOF'
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/*.md",
      "**/deploy/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/service-worker.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      },
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
EOF

# Create .firebaserc
cat > deploy/firebase/.firebaserc << 'EOF'
{
  "projects": {
    "default": "your-project-id-here"
  }
}
EOF

# Create deployment package
echo "📦 Creating Firebase deployment package..."
cd deploy/firebase
zip -r ../firebase-deployment.zip . -x "*.git*" "node_modules/*" "deploy/*"
cd ../..

echo ""
echo "✅ Firebase deployment prepared!"
echo ""
echo "📋 MANUAL FIREBASE SETUP REQUIRED:"
echo ""
echo "1. 🔗 Go to: https://console.firebase.google.com/"
echo "2. ➕ Click 'Add project' or 'Create a project'"
echo "3. 📝 Enter project name: 'claude-usage-monitor'"
echo "4. 🔧 Configure project:"
echo "   - Analytics: Optional (recommended: disable for simplicity)"
echo "   - Click 'Create project'"
echo "5. ⚡ In left sidebar: 'Hosting' → 'Get started'"
echo "6. 📦 Click 'Get started' on Hosting"
echo "7. 💻 Instead of Firebase CLI, choose 'Manual deployment':"
echo "   - Click 'Drag and drop files here'"
echo "   - Upload the entire contents of: deploy/firebase/"
echo "   - OR upload: deploy/firebase-deployment.zip (then extract)"
echo "8. 🚀 Click 'Deploy'"
echo ""
echo "🔑 UPDATE GOOGLE OAUTH after deployment:"
echo "1. Note your Firebase URL (ends with .web.app or .firebaseapp.com)"
echo "2. Add to Google Cloud Console OAuth settings"
echo ""
echo "📄 Files ready for upload:"
echo "   📁 deploy/firebase/ - Upload this entire folder"
echo "   📦 deploy/firebase-deployment.zip - Or upload and extract this"
echo ""

if [ -f "deploy/firebase-deployment.zip" ]; then
    echo "✅ Firebase deployment package created: deploy/firebase-deployment.zip"
else
    echo "❌ Failed to create deployment package"
fi