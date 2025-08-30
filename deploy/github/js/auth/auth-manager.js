/**
 * Unified Authentication Manager
 * Coordinates Google Sign-In and Manual Authentication systems
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authMethod = null; // 'google' or 'manual'
        this.isInitialized = false;
        this.authCheckInterval = null;
        
        this.init();
    }
    
    /**
     * Initialize authentication manager
     */
    async init() {
        try {
            console.log('[AuthManager] Initializing authentication manager...');
            
            // Wait for both auth managers to be available
            await this.waitForAuthManagers();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Check for existing authentication
            await this.checkExistingAuth();
            
            // Start authentication monitoring
            this.startAuthMonitoring();
            
            this.isInitialized = true;
            console.log('[AuthManager] Authentication manager initialized');
            
            // Dispatch ready event
            this.dispatchEvent('auth-manager-ready');
            
        } catch (error) {
            console.error('[AuthManager] Failed to initialize:', error);
        }
    }
    
    /**
     * Wait for auth managers to be available
     */
    async waitForAuthManagers() {
        return new Promise((resolve) => {
            const checkManagers = () => {
                if (window.googleAuthManager && window.manualAuthManager) {
                    resolve();
                } else {
                    setTimeout(checkManagers, 100);
                }
            };
            checkManagers();
        });
    }
    
    /**
     * Set up event listeners for both auth methods
     */
    setupEventListeners() {
        // Google Sign-In events
        document.addEventListener('google-sign-in-success', (e) => {
            this.handleGoogleSignIn(e.detail.user);
        });
        
        document.addEventListener('google-sign-out', () => {
            this.handleSignOut('google');
        });
        
        document.addEventListener('google-session-restored', (e) => {
            this.handleSessionRestore(e.detail.user, 'google');
        });
        
        document.addEventListener('google-sign-in-error', (e) => {
            this.handleAuthError('google', e.detail.error);
        });
        
        // Manual authentication events
        document.addEventListener('manual-sign-in-success', (e) => {
            this.handleManualSignIn(e.detail.user);
        });
        
        document.addEventListener('manual-sign-out', () => {
            this.handleSignOut('manual');
        });
        
        document.addEventListener('manual-session-restored', (e) => {
            this.handleSessionRestore(e.detail.user, 'manual');
        });
        
        document.addEventListener('manual-sign-in-error', (e) => {
            this.handleAuthError('manual', e.detail.error);
        });
        
        // Connection status changes
        window.addEventListener('online', () => {
            this.handleConnectionChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleConnectionChange(false);
        });
        
        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshAuthStatus();
            }
        });
        
        // Logout button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                this.signOut();
            });
        }
    }
    
    /**
     * Check for existing authentication from either method
     */
    async checkExistingAuth() {
        try {
            console.log('[AuthManager] Checking for existing authentication...');
            
            // Check Google authentication first (preferred)
            if (window.googleAuthManager && window.googleAuthManager.isSignedIn()) {
                const user = window.googleAuthManager.getCurrentUser();
                this.handleSessionRestore(user, 'google');
                return;
            }
            
            // Check manual authentication
            if (window.manualAuthManager && window.manualAuthManager.isSignedIn()) {
                const user = window.manualAuthManager.getCurrentUser();
                this.handleSessionRestore(user, 'manual');
                return;
            }
            
            // No existing authentication found
            this.showLoginScreen();
            
        } catch (error) {
            console.error('[AuthManager] Error checking existing auth:', error);
            this.showLoginScreen();
        }
    }
    
    /**
     * Handle successful Google Sign-In
     */
    handleGoogleSignIn(user) {
        console.log('[AuthManager] Google sign-in successful');
        
        this.currentUser = user;
        this.authMethod = 'google';
        
        // Ensure manual auth is signed out
        if (window.manualAuthManager && window.manualAuthManager.isSignedIn()) {
            window.manualAuthManager.signOut();
        }
        
        this.showDashboard();
        this.dispatchEvent('auth-success', { user, method: 'google' });
    }
    
    /**
     * Handle successful Manual Sign-In
     */
    handleManualSignIn(user) {
        console.log('[AuthManager] Manual sign-in successful');
        
        this.currentUser = user;
        this.authMethod = 'manual';
        
        // Ensure Google auth is signed out
        if (window.googleAuthManager && window.googleAuthManager.isSignedIn()) {
            window.googleAuthManager.signOut();
        }
        
        this.showDashboard();
        this.dispatchEvent('auth-success', { user, method: 'manual' });
    }
    
    /**
     * Handle session restoration
     */
    handleSessionRestore(user, method) {
        console.log(`[AuthManager] Session restored via ${method}`);
        
        this.currentUser = user;
        this.authMethod = method;
        
        this.showDashboard();
        this.dispatchEvent('auth-restored', { user, method });
    }
    
    /**
     * Handle sign out from either method
     */
    handleSignOut(method) {
        console.log(`[AuthManager] Sign-out from ${method}`);
        
        // Only clear if this was the active method
        if (this.authMethod === method) {
            this.currentUser = null;
            this.authMethod = null;
            
            this.showLoginScreen();
            this.dispatchEvent('auth-signed-out', { method });
        }
    }
    
    /**
     * Handle authentication errors
     */
    handleAuthError(method, error) {
        console.error(`[AuthManager] ${method} auth error:`, error);
        
        this.showToast({
            type: 'error',
            message: `${method === 'google' ? 'Google' : 'Email'} sign-in failed: ${error}`,
            duration: 5000
        });
        
        this.dispatchEvent('auth-error', { method, error });
    }
    
    /**
     * Handle connection status changes
     */
    handleConnectionChange(isOnline) {
        console.log(`[AuthManager] Connection status: ${isOnline ? 'online' : 'offline'}`);
        
        // Update connection indicator
        this.updateConnectionStatus(isOnline);
        
        if (isOnline) {
            // Refresh authentication when back online
            this.refreshAuthStatus();
        }
    }
    
    /**
     * Update connection status indicator
     */
    updateConnectionStatus(isOnline) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (statusDot && statusText) {
            statusDot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
            statusText.textContent = isOnline ? 'Online' : 'Offline';
        }
    }
    
    /**
     * Start authentication monitoring
     */
    startAuthMonitoring() {
        // Check authentication status every 5 minutes
        this.authCheckInterval = setInterval(() => {
            this.refreshAuthStatus();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Refresh authentication status
     */
    async refreshAuthStatus() {
        if (!this.isSignedIn()) {
            return;
        }
        
        try {
            // Check if current authentication is still valid
            let isValid = false;
            
            if (this.authMethod === 'google' && window.googleAuthManager) {
                isValid = window.googleAuthManager.isSignedIn();
            } else if (this.authMethod === 'manual' && window.manualAuthManager) {
                isValid = window.manualAuthManager.isSignedIn();
            }
            
            if (!isValid) {
                console.log('[AuthManager] Authentication expired, signing out');
                await this.signOut();
            }
            
        } catch (error) {
            console.error('[AuthManager] Error refreshing auth status:', error);
        }
    }
    
    /**
     * Sign out from current authentication method
     */
    async signOut() {
        try {
            console.log('[AuthManager] Signing out...');
            
            // Sign out from active auth method
            if (this.authMethod === 'google' && window.googleAuthManager) {
                await window.googleAuthManager.signOut();
            } else if (this.authMethod === 'manual' && window.manualAuthManager) {
                await window.manualAuthManager.signOut();
            }
            
            // Clear current state
            this.currentUser = null;
            this.authMethod = null;
            
            // Show login screen
            this.showLoginScreen();
            
            // Clear any cached data
            await this.clearCachedData();
            
            console.log('[AuthManager] Sign-out completed');
            this.dispatchEvent('auth-signed-out-complete');
            
        } catch (error) {
            console.error('[AuthManager] Sign-out failed:', error);
        }
    }
    
    /**
     * Show login screen
     */
    showLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const dashboardScreen = document.getElementById('dashboard-screen');
        
        if (loginScreen && dashboardScreen) {
            loginScreen.classList.add('active');
            dashboardScreen.classList.remove('active');
            
            // Add transition animation
            loginScreen.classList.add('force-fade-in-up');
            setTimeout(() => {
                loginScreen.classList.remove('force-fade-in-up');
            }, 300);
        }
        
        console.log('[AuthManager] Login screen shown');
    }
    
    /**
     * Show dashboard screen
     */
    showDashboard() {
        const loginScreen = document.getElementById('login-screen');
        const dashboardScreen = document.getElementById('dashboard-screen');
        
        if (loginScreen && dashboardScreen) {
            loginScreen.classList.remove('active');
            dashboardScreen.classList.add('active');
            
            // Add transition animation
            dashboardScreen.classList.add('force-fade-in-up');
            setTimeout(() => {
                dashboardScreen.classList.remove('force-fade-in-up');
            }, 300);
            
            // Initialize dashboard data
            this.initializeDashboard();
        }
        
        console.log('[AuthManager] Dashboard screen shown');
    }
    
    /**
     * Initialize dashboard with user data
     */
    initializeDashboard() {
        if (!this.currentUser) return;
        
        try {
            // Update user profile display
            this.updateUserProfile();
            
            // Initialize dashboard data loading
            if (window.dashboardManager) {
                window.dashboardManager.initialize(this.currentUser);
            }
            
            // Start real-time updates
            if (window.dataCollector) {
                window.dataCollector.startUpdates();
            }
            
        } catch (error) {
            console.error('[AuthManager] Failed to initialize dashboard:', error);
        }
    }
    
    /**
     * Update user profile display in dashboard
     */
    updateUserProfile() {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const authBadge = document.getElementById('auth-badge');
        
        if (userAvatar) {
            userAvatar.src = this.getUserAvatar();
            userAvatar.alt = this.currentUser.name || 'User';
        }
        
        if (userName) {
            userName.textContent = this.currentUser.name || 'User';
        }
        
        if (userEmail) {
            userEmail.textContent = this.currentUser.email || '';
        }
        
        if (authBadge) {
            const authText = this.authMethod === 'google' ? 'Google Account' : 
                           this.currentUser.auth_method === 'api_key' ? 'API Key' : 'Email Account';
            authBadge.textContent = authText;
            authBadge.className = `auth-badge ${this.authMethod}`;
        }
    }
    
    /**
     * Get user avatar URL
     */
    getUserAvatar(size = 96) {
        if (this.authMethod === 'google' && window.googleAuthManager) {
            return window.googleAuthManager.getUserAvatar(size);
        } else if (this.authMethod === 'manual' && window.manualAuthManager) {
            return window.manualAuthManager.getUserAvatar(size);
        }
        
        // Default avatar
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#E1E8ED"/>
                <circle cx="12" cy="9" r="3" fill="#AAB8C2"/>
                <path d="M17.25 19.5c0-2.9-2.35-5.25-5.25-5.25s-5.25 2.35-5.25 5.25" fill="#AAB8C2"/>
            </svg>
        `)}`;
    }
    
    /**
     * Clear cached application data
     */
    async clearCachedData() {
        try {
            // Clear localStorage data
            const keys = Object.values(APP_CONFIG.storageKeys);
            keys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clear secure storage if available
            if (window.storageManager) {
                await window.storageManager.clearAllData();
            }
            
            // Clear service worker cache
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_CACHE'
                });
            }
            
            console.log('[AuthManager] Cached data cleared');
            
        } catch (error) {
            console.error('[AuthManager] Failed to clear cached data:', error);
        }
    }
    
    /**
     * Show toast notification
     */
    showToast({ type = 'info', message, duration = 3000 }) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="material-icons">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-hide
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Get appropriate icon for toast type
     */
    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Check if user is signed in
     */
    isSignedIn() {
        return this.currentUser !== null;
    }
    
    /**
     * Get authentication method
     */
    getAuthMethod() {
        return this.authMethod;
    }
    
    /**
     * Dispatch custom events
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
    }
}

// Initialize Auth Manager
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    window.authManager = authManager;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (authManager) {
        authManager.cleanup();
    }
});