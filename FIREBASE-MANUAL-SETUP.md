# 🔥 Firebase Manual Setup Guide

## **STEP 2: Firebase Project Setup (Web Console)**

### **2.1: Create Firebase Project**
1. **Open browser** and go to: https://console.firebase.google.com/
2. **Sign in** with your Google account
3. **Click "Create a project"**
4. **Project name:** `claude-usage-monitor` (or your preferred name)
5. **Project ID:** Will auto-generate (e.g., `claude-usage-monitor-abc123`)
6. **Analytics:** Enable Google Analytics: **Yes** (recommended)
7. **Analytics account:** Use default or create new
8. **Click "Create project"** - wait for setup to complete
9. **Click "Continue"** when done

### **2.2: Enable Firebase Hosting**
1. **In Firebase Console**, click **"Build"** in left sidebar
2. **Click "Hosting"**  
3. **Click "Get started"**
4. **Follow the setup** (we'll customize this)

### **2.3: Get Your Firebase Config**
1. **In Firebase Console**, click the **gear icon** (Settings)
2. **Click "Project settings"**
3. **Scroll down to "Your apps"**
4. **Click "Add app"** → **Web app** (</> icon)
5. **App nickname:** `Claude Usage Monitor`
6. **Enable "Firebase Hosting"** checkbox
7. **Click "Register app"**
8. **Copy the config** - you'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "claude-usage-monitor.firebaseapp.com", 
  projectId: "claude-usage-monitor",
  storageBucket: "claude-usage-monitor.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

**Save this config - we'll need it!**

---

## **STEP 3: Manual File Upload Method**

### **Method A: Firebase Console Upload (Simplest)**

1. **In Firebase Hosting**, look for file upload area
2. **Drag and drop** OR **click "Upload"**
3. **Select these files from your directory:**

**Essential Files:**
```
✅ index.html           (main app)
✅ manifest.json        (PWA config)  
✅ service-worker.js    (offline support)
✅ styles.css           (themes + animations)
✅ js/ folder           (all JavaScript files)
```

**Optional but Recommended:**
```
✅ icons/ folder        (if you generated icons)
✅ firebase.json        (hosting config)
```

4. **Click "Deploy"** - Firebase will process your files
5. **Get your live URL** - will be like: `https://claude-usage-monitor.web.app/`

### **Method B: GitHub Integration (Advanced)**

1. **In Firebase Hosting** → **Advanced setup**
2. **Connect to GitHub** 
3. **Select repository:** `sammcarthur07/claude-usage-web-app`
4. **Auto-deploy:** Enable for automatic updates
5. **Build settings:** Leave default (static site)

---

## **STEP 4: Test Your Live PWA**

Once deployed, your app will be live at:
```
https://your-project-id.web.app/
# or
https://your-project-id.firebaseapp.com/
```

**Test checklist:**
- [ ] App loads without errors
- [ ] Theme switching works
- [ ] Real-time updates work (every 3 seconds)  
- [ ] PWA install prompt appears
- [ ] Works offline (disconnect internet, refresh)

---

## **Next: Create APK from Your Live PWA**

Once your PWA is live on Firebase, you can:

1. **PWA Builder Method:**
   - Go to: https://www.pwabuilder.com/
   - Enter your Firebase URL
   - Generate Android APK

2. **Manual APK Tools:**
   - Use your `twa-manifest.json` with Android Studio
   - Or use Firebase App Distribution

---

## **Alternative: Direct Upload via Termux**

If you want to try uploading directly from Termux without authentication:

### **Using curl to upload (Advanced)**

```bash
# This requires service account key - more complex
# Better to use web console for first deployment
```

### **Using GitHub Pages as Alternative**

```bash
# Since your code is on GitHub, you can also use GitHub Pages:
# 1. Go to: https://github.com/sammcarthur07/claude-usage-web-app
# 2. Settings → Pages → Deploy from branch: master
# 3. Your PWA will be live at: https://sammcarthur07.github.io/claude-usage-web-app/
```

---

## **Summary: Recommended Path**

1. **Firebase Console** → Create project → Enable hosting
2. **Upload files** via web interface (drag & drop)
3. **Get live URL** → Test PWA functionality  
4. **PWA Builder** → Convert to APK for S23 Ultra
5. **Install APK** on your device

This avoids Termux authentication issues while giving you the same end result!