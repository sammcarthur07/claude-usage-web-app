# 📐 **Technical Architecture Plan - Claude Usage Monitor PWA**
## **Version 2.0 - With Google Authentication**

### **🔐 1. AUTHENTICATION ARCHITECTURE (UPDATED)**

#### **A. Google Sign-In (Primary Method)**

##### **Implementation Strategy:**
```javascript
// Google Sign-In JavaScript Client
class GoogleAuthManager {
  constructor() {
    this.clientId = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
    this.scopes = 'profile email';
    this.redirectUri = window.location.origin;
  }
  
  async initGoogleAuth() {
    // Load Google Sign-In library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: true, // Auto-login if previously authenticated
        cancel_on_tap_outside: false
      });
      
      // Render Google Sign-In button
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { 
          theme: 'outline',
          size: 'large',
          width: '100%',
          logo_alignment: 'center',
          text: 'signin_with'
        }
      );
      
      // Check for existing session
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log('User not signed in');
        }
      });
    };
  }
  
  async handleCredentialResponse(response) {
    const credential = response.credential;
    const payload = this.parseJwt(credential);
    
    // Extract user profile
    const userProfile = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified,
      provider: 'google'
    };
    
    // Store securely
    await this.storeGoogleCredentials(userProfile, credential);
    
    // Navigate to dashboard
    this.loginSuccess(userProfile);
  }
  
  parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }
}
```

##### **OAuth Client Setup Requirements:**
```javascript
// Google Cloud Console Configuration
const GOOGLE_OAUTH_CONFIG = {
  // 1. Create project in Google Cloud Console
  projectName: 'Claude Usage Monitor',
  
  // 2. Enable APIs
  requiredAPIs: [
    'Google Sign-In API',
    'Google Identity Services'
  ],
  
  // 3. Configure OAuth consent screen
  consentScreen: {
    appName: 'Claude Usage Monitor',
    supportEmail: 'mcarthur.sp@gmail.com',
    appDomain: 'https://sammcarthur07.github.io',
    authorizedDomains: [
      'sammcarthur07.github.io',
      'claude-usage-monitor.web.app',
      'localhost' // for development
    ],
    scopes: ['email', 'profile', 'openid']
  },
  
  // 4. Create OAuth 2.0 Client ID
  clientCredentials: {
    type: 'Web application',
    name: 'Claude Monitor PWA',
    authorizedJavaScriptOrigins: [
      'https://sammcarthur07.github.io',
      'https://claude-usage-monitor.web.app',
      'http://localhost:8080'
    ],
    authorizedRedirectURIs: [
      'https://sammcarthur07.github.io/claude-usage-web-app',
      'https://claude-usage-monitor.web.app/auth/callback'
    ]
  }
};
```

#### **B. Manual Login (Backup Method)**

```javascript
class ManualAuthManager {
  constructor() {
    this.encryptionKey = null;
  }
  
  async authenticate(email, password) {
    // Validate credentials locally (no server)
    const hashedPassword = await this.hashPassword(password);
    const storedHash = await this.getStoredCredentials(email);
    
    if (hashedPassword === storedHash) {
      const userProfile = {
        id: this.generateUserId(email),
        email: email,
        name: email.split('@')[0],
        picture: null,
        provider: 'manual'
      };
      
      await this.storeManualCredentials(userProfile, hashedPassword);
      return userProfile;
    }
    
    return null;
  }
  
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

#### **C. Unified Authentication Interface**

```javascript
class UnifiedAuthManager {
  constructor() {
    this.googleAuth = new GoogleAuthManager();
    this.manualAuth = new ManualAuthManager();
    this.currentUser = null;
    this.rememberMe = false;
  }
  
  async init() {
    // Check for saved session
    const savedSession = await this.checkSavedSession();
    
    if (savedSession) {
      if (savedSession.provider === 'google') {
        // Re-authenticate with Google silently
        await this.googleAuth.silentSignIn();
      } else {
        // Restore manual session
        this.currentUser = savedSession.user;
        this.navigateToDashboard();
      }
    } else {
      // Show login screen with both options
      this.showLoginScreen();
    }
  }
  
  async checkSavedSession() {
    if (localStorage.getItem('claude_remember_me') === 'true') {
      const encryptedSession = localStorage.getItem('claude_session');
      if (encryptedSession) {
        return await this.decryptSession(encryptedSession);
      }
    }
    return null;
  }
  
  async saveSession(user, rememberMe) {
    if (rememberMe) {
      const encrypted = await this.encryptSession({
        user: user,
        timestamp: Date.now(),
        provider: user.provider
      });
      localStorage.setItem('claude_session', encrypted);
      localStorage.setItem('claude_remember_me', 'true');
    } else {
      sessionStorage.setItem('claude_session', JSON.stringify(user));
    }
  }
}
```

### **🎨 2. UI/UX AUTHENTICATION DESIGN**

#### **Login Screen Layout:**
```html
<!-- Dual Authentication Login Screen -->
<div class="login-container">
  <div class="login-card">
    <div class="app-header">
      <img src="assets/logo.svg" alt="Claude Monitor" />
      <h1>Claude Usage Monitor</h1>
      <p>Track your AI usage & costs</p>
    </div>
    
    <!-- Google Sign-In (Primary) -->
    <div class="auth-section primary">
      <div id="google-signin-button"></div>
      <div class="divider">
        <span>OR</span>
      </div>
    </div>
    
    <!-- Manual Login (Backup) -->
    <div class="auth-section secondary">
      <button class="manual-login-toggle" onclick="toggleManualLogin()">
        Sign in with Email
      </button>
      
      <form id="manual-login-form" class="hidden">
        <input type="email" 
               id="email" 
               placeholder="Email address"
               autocomplete="email" />
        
        <input type="password" 
               id="password" 
               placeholder="Password"
               autocomplete="current-password" />
        
        <div class="remember-me">
          <input type="checkbox" id="remember-me" />
          <label for="remember-me">Remember me</label>
        </div>
        
        <button type="submit" class="login-button">
          Sign In
        </button>
      </form>
    </div>
    
    <!-- Privacy Notice -->
    <div class="privacy-notice">
      <p>Your data is stored locally. No servers involved.</p>
    </div>
  </div>
</div>
```

#### **Dashboard Integration with Google Profile:**
```javascript
class DashboardWithProfile {
  constructor(user) {
    this.user = user;
    this.initializeProfile();
  }
  
  initializeProfile() {
    // Display Google profile data
    if (this.user.provider === 'google') {
      document.getElementById('user-avatar').src = this.user.picture;
      document.getElementById('user-name').textContent = this.user.name;
      document.getElementById('user-email').textContent = this.user.email;
      
      // Add Google badge
      document.getElementById('auth-badge').innerHTML = `
        <span class="google-badge">
          <img src="assets/google-icon.svg" alt="Google" />
          Signed in with Google
        </span>
      `;
    } else {
      // Manual login display
      document.getElementById('user-avatar').src = 'assets/default-avatar.svg';
      document.getElementById('user-name').textContent = this.user.name;
      document.getElementById('user-email').textContent = this.user.email;
    }
  }
  
  renderDashboard() {
    return `
      <header class="dashboard-header">
        <div class="user-profile">
          <img id="user-avatar" class="avatar" />
          <div class="user-info">
            <span id="user-name" class="name"></span>
            <span id="user-email" class="email"></span>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="theme-toggle">🌙</button>
          <button class="refresh-button">🔄</button>
          <button class="logout-button" onclick="logout()">
            Sign Out
          </button>
        </div>
      </header>
      
      <main class="dashboard-content">
        <!-- Usage stats, charts, etc. -->
      </main>
    `;
  }
}
```

### **🔒 3. SECURITY ARCHITECTURE**

#### **Token Storage Strategy:**
```javascript
class SecureTokenStorage {
  constructor() {
    this.storageKey = 'claude_auth_tokens';
    this.encryptionSalt = null;
  }
  
  async storeGoogleToken(idToken, refreshToken = null) {
    const tokenData = {
      idToken: idToken,
      refreshToken: refreshToken,
      timestamp: Date.now(),
      expiresIn: 3600000, // 1 hour
      provider: 'google'
    };
    
    // Encrypt sensitive tokens
    const encrypted = await this.encryptData(tokenData);
    
    // Store in IndexedDB (more secure than localStorage)
    await this.saveToIndexedDB('tokens', encrypted);
    
    // Set expiration timer
    this.setTokenExpiration(tokenData.expiresIn);
  }
  
  async encryptData(data) {
    const key = await this.deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      new TextEncoder().encode(JSON.stringify(data))
    );
    
    return {
      ciphertext: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  }
  
  async deriveKey() {
    // Use PBKDF2 for key derivation
    const salt = this.encryptionSalt || crypto.getRandomValues(new Uint8Array(16));
    const password = this.getUserDeviceId(); // Unique per device
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  getUserDeviceId() {
    // Generate unique device ID
    let deviceId = localStorage.getItem('claude_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('claude_device_id', deviceId);
    }
    return deviceId;
  }
}
```

#### **Security Considerations:**
```javascript
const SECURITY_CONFIG = {
  // Token Security
  tokenStorage: {
    method: 'IndexedDB', // More secure than localStorage
    encryption: 'AES-GCM-256',
    keyDerivation: 'PBKDF2',
    iterations: 100000
  },
  
  // Session Management
  sessionConfig: {
    timeout: 3600000, // 1 hour
    refreshBefore: 300000, // Refresh 5 min before expiry
    maxRefreshAttempts: 3,
    clearOnLogout: true
  },
  
  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://accounts.google.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'https://*.googleusercontent.com', 'data:'],
    'connect-src': ["'self'", 'https://accounts.google.com']
  },
  
  // CORS Configuration
  cors: {
    allowedOrigins: [
      'https://accounts.google.com',
      'https://sammcarthur07.github.io'
    ]
  }
};
```

### **📊 4. USAGE TRACKING ARCHITECTURE (NO API)**

#### **Data Collection Methods (Updated):**

```javascript
class UsageDataCollector {
  constructor(user) {
    this.user = user;
    this.sources = [];
  }
  
  async collectAllSources() {
    const data = {
      webUsage: await this.scrapeWebUsage(),
      codeUsage: await this.parseCodeLogs(),
      manualEntry: await this.getManualEntries(),
      estimated: this.calculateEstimates()
    };
    
    // Store with user context
    await this.storeUsageData(data, this.user);
    
    return data;
  }
  
  async scrapeWebUsage() {
    // Method 1: Browser Extension Message Passing
    return new Promise((resolve) => {
      window.addEventListener('message', (event) => {
        if (event.data.type === 'CLAUDE_USAGE_DATA') {
          resolve(event.data.usage);
        }
      });
      
      // Request data from extension
      window.postMessage({ type: 'REQUEST_CLAUDE_DATA' }, '*');
      
      // Timeout fallback
      setTimeout(() => resolve(null), 5000);
    });
  }
  
  async parseCodeLogs() {
    // Method 2: Parse exported session data
    const fileInput = document.getElementById('log-file-upload');
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const content = await file.text();
      return this.parseSessionLog(content);
    }
    return null;
  }
  
  calculateEstimates() {
    // Method 3: Estimation based on patterns
    const avgConversation = {
      messages: 10,
      tokensPerMessage: 500,
      model: 'sonnet-3.5'
    };
    
    return {
      estimatedTokens: avgConversation.messages * avgConversation.tokensPerMessage,
      estimatedCost: this.calculateCost(avgConversation)
    };
  }
}
```

### **🎯 5. PWA FILE STRUCTURE (UPDATED)**

```
claude-usage-monitor-pwa/
│
├── index.html                    # Single-page PWA shell
├── manifest.json                 # PWA manifest
├── service-worker.js             # Offline functionality
├── robots.txt                    # SEO rules
├── google-site-verification.html # Google verification
│
├── css/
│   ├── main.css                 # Core styles + themes
│   ├── animations.css           # Force animations
│   ├── auth.css                 # Authentication styles
│   └── responsive.css          # S23 Ultra optimization
│
├── js/
│   ├── app.js                   # Main controller
│   ├── auth/
│   │   ├── google-auth.js      # Google Sign-In
│   │   ├── manual-auth.js      # Manual login
│   │   └── auth-manager.js     # Unified auth
│   ├── dashboard.js             # Dashboard with profile
│   ├── data-collector.js        # Usage collection
│   ├── storage.js               # Secure storage
│   ├── charts.js                # Visualizations
│   ├── theme.js                 # Theme system
│   └── utils.js                 # Helpers
│
├── assets/
│   ├── icons/                   # PWA + Google icons
│   ├── images/
│   │   ├── google-signin.svg   # Google button assets
│   │   └── default-avatar.svg  # Fallback avatar
│   └── fonts/                   # Local fonts
│
├── config/
│   ├── google-oauth.json        # OAuth config
│   ├── firebase.json            # Firebase settings
│   └── deploy.json              # Deployment config
│
└── .well-known/
    └── assetlinks.json          # Android app links
```

### **📱 6. SAMSUNG S23 ULTRA OPTIMIZATION**

```css
/* S23 Ultra with Google Sign-In */
@media screen and (width: 412px) and (height: 915px) {
  /* Google Sign-In button optimization */
  #google-signin-button {
    width: 100%;
    height: 56px; /* Touch-friendly */
    margin: 20px 0;
  }
  
  /* Profile display */
  .user-profile {
    display: flex;
    align-items: center;
    padding: 16px;
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin-right: 12px;
  }
  
  /* 120Hz animations */
  * {
    animation-duration: calc(var(--duration) / 2) !important;
  }
}
```

### **🚀 7. DEPLOYMENT CONFIGURATION**

#### **GitHub Pages with Google OAuth:**
```yaml
# .github/workflows/deploy.yml
name: Deploy PWA with Google Auth
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure Google OAuth
        run: |
          echo "const GOOGLE_CLIENT_ID = '${{ secrets.GOOGLE_CLIENT_ID }}';" > js/config.js
      
      - name: Build PWA
        run: |
          npm install
          npm run build
      
      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@4.1.5
        with:
          branch: gh-pages
          folder: dist
```

#### **Firebase with Google Auth:**
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }],
    "headers": [{
      "source": "/**",
      "headers": [{
        "key": "Content-Security-Policy",
        "value": "default-src 'self'; script-src 'self' https://accounts.google.com; img-src 'self' https://*.googleusercontent.com"
      }]
    }]
  }
}
```

### **🔧 8. IMPLEMENTATION CHECKLIST**

#### **Google OAuth Setup:**
- [ ] Create Google Cloud Project
- [ ] Configure OAuth consent screen
- [ ] Generate OAuth 2.0 Client ID
- [ ] Add authorized JavaScript origins
- [ ] Add authorized redirect URIs
- [ ] Enable Google Sign-In API

#### **PWA Implementation:**
- [ ] Implement Google Sign-In button
- [ ] Create manual login form
- [ ] Build unified auth manager
- [ ] Integrate profile display
- [ ] Set up secure token storage
- [ ] Implement remember me for both methods
- [ ] Add logout functionality
- [ ] Test offline authentication

#### **Security Implementation:**
- [ ] Encrypt stored tokens
- [ ] Implement PBKDF2 key derivation
- [ ] Set up Content Security Policy
- [ ] Configure CORS properly
- [ ] Add session timeout
- [ ] Implement token refresh
- [ ] Clear sensitive data on logout

### **📊 9. PERFORMANCE METRICS (UPDATED)**

```javascript
const PERFORMANCE_TARGETS = {
  // Authentication
  googleSignIn: 2000,      // < 2s for Google auth
  manualLogin: 500,        // < 0.5s for manual
  tokenRefresh: 1000,      // < 1s for refresh
  
  // Core metrics
  firstPaint: 1500,        // < 1.5s
  interactive: 3000,       // < 3s
  offlineLoad: 500,        // < 0.5s
  
  // S23 Ultra specific
  animationFPS: 120,       // 120Hz display
  touchResponse: 100,      // < 100ms
  
  // Storage
  authStorage: 1,          // < 1MB for auth data
  usageStorage: 10,        // < 10MB for usage data
  
  // Network
  googleAuthAPI: 1,        // 1 request for auth
  offlineCapability: 100   // 100% offline after login
};
```

This comprehensive update integrates Google authentication as the primary login method while maintaining all original requirements and adding enhanced security and user experience features.