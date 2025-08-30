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
