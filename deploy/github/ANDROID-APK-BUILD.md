# 📱 Android APK Build Instructions
## Convert Claude Usage Monitor PWA to Android App

### 🎯 Overview
This guide provides multiple methods to convert your PWA into a native Android APK that can be installed on Android devices without needing Google Play Store.

---

## 📋 Prerequisites

- Your PWA deployed and accessible via HTTPS URL
- Android device for testing (optional but recommended)
- One of the following build methods

---

## 🔧 METHOD 1: PWABuilder (Microsoft) - RECOMMENDED

### Step 1: Deploy Your PWA
First, deploy your PWA using one of the deployment methods:
- **GitHub Pages**: `https://YOUR-USERNAME.github.io/claude-usage-web-app/`
- **Firebase**: `https://YOUR-PROJECT.web.app/`

### Step 2: Generate APK with PWABuilder
1. 🌐 Go to: https://www.pwabuilder.com/
2. 📝 Enter your PWA URL (from Step 1)
3. 🔍 Click "Start" - PWABuilder will analyze your PWA
4. 📊 Review the analysis results
5. 🤖 Click "Package For Stores" → "Android"
6. ⚙️ Configure Android settings:
   ```
   Package ID: com.claude.usagemonitor
   App Name: Claude Usage Monitor
   Launcher Name: Claude Usage
   Theme Color: #3498DB
   Background Color: #FFFFFF
   Start URL: / (default)
   Display Mode: standalone
   Orientation: portrait
   ```
7. 🔧 Advanced Options:
   - **Signing Key**: Generate new key or upload existing
   - **Icons**: Upload custom icons (optional)
   - **Splash Screen**: Configure loading screen
8. 📦 Click "Generate Package"
9. ⏳ Wait for build completion (2-5 minutes)
10. ⬇️ Download the generated APK file

---

## 🔧 METHOD 2: Bubblewrap (Google) - Advanced

### Prerequisites
- Node.js installed
- Java JDK 8+ installed
- Android SDK installed

### Step 1: Install Bubblewrap
```bash
npm install -g @bubblewrap/cli
```

### Step 2: Initialize Project
```bash
# Create new directory for APK project
mkdir claude-usage-apk
cd claude-usage-apk

# Initialize with your PWA URL
bubblewrap init --manifest https://YOUR-DOMAIN.com/manifest.json
```

### Step 3: Configure APK Settings
Edit the generated `twa-manifest.json`:
```json
{
  "packageId": "com.claude.usagemonitor",
  "host": "YOUR-DOMAIN.com",
  "name": "Claude Usage Monitor",
  "launcherName": "Claude Usage",
  "display": "standalone",
  "orientation": "default",
  "themeColor": "#3498DB",
  "backgroundColor": "#FFFFFF",
  "startUrl": "/",
  "iconUrl": "https://YOUR-DOMAIN.com/icons/icon-512x512.png",
  "shortcuts": []
}
```

### Step 4: Build APK
```bash
# Build the APK
bubblewrap build

# The APK will be generated in:
# app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 METHOD 3: TWA Generator (Samsung Internet)

### Step 1: Use Online Generator
1. 🌐 Go to: https://developers.samsung.com/internet/android/twa
2. 📝 Fill in PWA details:
   ```
   App Name: Claude Usage Monitor
   Package Name: com.claude.usagemonitor
   PWA URL: https://YOUR-DOMAIN.com/
   Icon URL: https://YOUR-DOMAIN.com/icons/icon-192x192.png
   Theme Color: #3498DB
   Background Color: #FFFFFF
   ```
3. 📦 Click "Generate APK"
4. ⬇️ Download the generated APK

---

## 🔧 METHOD 4: Android Studio (Manual)

### Prerequisites
- Android Studio installed
- Basic Android development knowledge

### Step 1: Create New Project
1. Open Android Studio
2. Create new project → "Empty Activity"
3. Configure:
   ```
   Name: Claude Usage Monitor
   Package: com.claude.usagemonitor
   Language: Java/Kotlin
   Minimum SDK: API 21 (Android 5.0)
   ```

### Step 2: Configure WebView
Add to `app/build.gradle`:
```gradle
android {
    useLibrary 'org.apache.http.legacy'
}

dependencies {
    implementation 'androidx.browser:browser:1.5.0'
}
```

### Step 3: Add TWA Activity
Use the provided `android-build-config.gradle` as reference.

### Step 4: Build APK
```bash
./gradlew assembleRelease
```

---

## 🔑 Google OAuth Domain Configuration

After deploying your PWA and before building the APK, update your Google Cloud Console:

### For GitHub Pages:
```
Authorized JavaScript origins:
- https://YOUR-USERNAME.github.io

Authorized redirect URIs:
- https://YOUR-USERNAME.github.io/claude-usage-web-app/
```

### For Firebase:
```
Authorized JavaScript origins:
- https://YOUR-PROJECT.web.app
- https://YOUR-PROJECT.firebaseapp.com

Authorized redirect URIs:
- https://YOUR-PROJECT.web.app/
- https://YOUR-PROJECT.firebaseapp.com/
```

### For Custom Domain:
```
Authorized JavaScript origins:
- https://your-custom-domain.com

Authorized redirect URIs:
- https://your-custom-domain.com/
```

---

## 📱 APK Installation & Testing

### Install APK on Android Device

#### Method 1: Direct Install
1. Download APK to your Android device
2. Open file manager → find APK file
3. Tap APK file → "Install"
4. If blocked: Settings → Security → "Unknown sources" → Enable
5. Try installing again

#### Method 2: ADB Install
```bash
# Connect Android device via USB (Developer mode enabled)
adb install claude-usage-monitor.apk
```

### Testing Checklist
- [ ] App launches successfully
- [ ] Google Sign-In works
- [ ] Dashboard loads with data
- [ ] Charts render correctly
- [ ] Theme switching works
- [ ] Offline mode functions
- [ ] Data persists after app restart
- [ ] Animations are smooth
- [ ] Samsung S23 Ultra optimizations active

---

## 🔧 Troubleshooting

### Common Issues

#### APK Won't Install
- Enable "Unknown sources" in Android settings
- Check Android version compatibility (min API 21)
- Clear Google Play Protect cache

#### OAuth Not Working
- Verify HTTPS deployment URL
- Check Google Cloud Console domain configuration
- Ensure manifest.json start_url matches deployment

#### App Crashes on Launch
- Check PWA manifest.json validity
- Verify all assets are accessible via HTTPS
- Test PWA in mobile browser first

#### Performance Issues
- Enable hardware acceleration in APK
- Optimize image sizes and caching
- Test on target device specifications

---

## 📦 APK Signing & Distribution

### Sign APK for Distribution
```bash
# Generate keystore (one-time)
keytool -genkey -v -keystore claude-usage-monitor.keystore -alias claude-key -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore claude-usage-monitor.keystore app-release-unsigned.apk claude-key

# Align APK
zipalign -v 4 app-release-unsigned.apk claude-usage-monitor-signed.apk
```

### Distribution Options
1. **Direct sharing**: Send APK file directly
2. **GitHub Releases**: Upload to repository releases
3. **Firebase App Distribution**: Beta testing platform
4. **Google Play Store**: Full store submission (requires additional steps)

---

## 🎯 Samsung S23 Ultra Optimizations

Your PWA includes specific optimizations for Samsung S23 Ultra:
- **Resolution**: 412x915px viewport detection
- **120Hz Display**: Faster animations and updates
- **Performance**: Optimized update intervals
- **Gestures**: Enhanced touch response

These optimizations will be included in the generated APK automatically.

---

## ⚡ Quick Start Commands

```bash
# 1. Start local testing (port 8081)
python3 -m http.server 8081

# 2. Deploy to GitHub Pages
./deploy-github.sh

# 3. Deploy to Firebase
./deploy-firebase.sh

# 4. Generate APK (after deployment)
# Visit: https://www.pwabuilder.com/
# Enter your deployed URL and follow the wizard

# 5. Install APK on Android
adb install claude-usage-monitor.apk
```

---

## 📞 Support & Updates

- **PWA Updates**: Automatic via service worker
- **APK Updates**: Regenerate and redistribute APK
- **Testing**: Use browser dev tools with device simulation
- **Issues**: Check browser console for errors

Your Claude Usage Monitor PWA is now ready to be converted into a native Android app! 🚀