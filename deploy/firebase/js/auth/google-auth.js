/**
 * Google Authentication System
 * Handles Google Sign-In integration and token management
 */

class GoogleAuthManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.authInstance = null;
        this.tokenCheckInterval = null;
        
        // Bind methods to maintain context
        this.handleCredentialResponse = this.handleCredentialResponse.bind(this);
        this.onGoogleLibraryLoad = this.onGoogleLibraryLoad.bind(this);
        
        this.init();
    }
    
    /**
     * Initialize Google Sign-In
     */
    async init() {
        try {
            console.log('[GoogleAuth] Initializing Google Sign-In...');
            
            // Wait for Google library to load
            await this.waitForGoogleLibrary();
            
            // Initialize Google Identity Services
            this.initializeGIS();
            
            // Check for existing session
            await this.checkExistingSession();
            
            this.isInitialized = true;
            console.log('[GoogleAuth] Google Sign-In initialized successfully');
            
            // Dispatch ready event
            this.dispatchEvent('google-auth-ready');
            
        } catch (error) {
            console.error('[GoogleAuth] Failed to initialize:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Wait for Google library to load
     */
    waitForGoogleLibrary() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.google && window.google.accounts) {
                resolve();
                return;
            }
            
            // Set up global callback
            window.onGoogleLibraryLoad = () => {
                console.log('[GoogleAuth] Google library loaded');
                resolve();
            };
            
            // Wait up to 10 seconds for library to load
            const timeout = setTimeout(() => {
                reject(new Error('Google library failed to load within timeout'));
            }, 10000);
            
            // Check periodically if library is loaded
            const checkInterval = setInterval(() => {
                if (window.google && window.google.accounts) {
                    clearInterval(checkInterval);
                    clearTimeout(timeout);
                    resolve();
                }
            }, 100);
        });
    }
    
    /**
     * Initialize Google Identity Services
     */
    initializeGIS() {
        try {
            // Initialize Google Sign-In button
            google.accounts.id.initialize({
                client_id: GOOGLE_CONFIG.clientId,
                callback: this.handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                use_fedcm_for_prompt: true
            });
            
            // Render the sign-in button
            this.renderSignInButton();
            
            console.log('[GoogleAuth] Google Identity Services initialized');
            
        } catch (error) {
            console.error('[GoogleAuth] Failed to initialize GIS:', error);
            throw error;
        }
    }
    
    /**
     * Render Google Sign-In button
     */
    renderSignInButton() {
        const buttonContainer = document.getElementById('google-signin-button');
        if (!buttonContainer) {
            console.warn('[GoogleAuth] Sign-in button container not found');
            return;
        }
        
        // Clear loading state
        buttonContainer.innerHTML = '';
        buttonContainer.className = 'google-signin-container';
        
        try {
            // Render the Google Sign-In button
            google.accounts.id.renderButton(buttonContainer, {
                theme: GOOGLE_CONFIG.buttonConfig.theme,
                size: GOOGLE_CONFIG.buttonConfig.size,
                text: GOOGLE_CONFIG.buttonConfig.text,
                shape: GOOGLE_CONFIG.buttonConfig.shape,
                logo_alignment: GOOGLE_CONFIG.buttonConfig.logo_alignment,
                width: '100%'
            });
            
            console.log('[GoogleAuth] Sign-in button rendered');
            
        } catch (error) {
            console.error('[GoogleAuth] Failed to render sign-in button:', error);
            this.showFallbackButton(buttonContainer);
        }
    }
    
    /**
     * Show fallback button if Google button fails to render
     */
    showFallbackButton(container) {
        container.innerHTML = `
            <button class="google-signin-fallback" onclick="googleAuthManager.signIn()">
                <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.3H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                    <path fill="#FBBC05" d="M4.46 10.5a4.8 4.8 0 0 1-.25-1.5 4.8 4.8 0 0 1 .25-1.5V5.43H1.83a8 8 0 0 0 0 7.14l2.63-2.07z"/>
                    <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.54-2.54A8 8 0 0 0 8.98 1 8 8 0 0 0 1.83 5.43L4.46 7.5A4.77 4.77 0 0 1 8.98 3.58z"/>
                </svg>
                Sign in with Google
            </button>
        `;
    }
    
    /**
     * Handle credential response from Google
     */
    async handleCredentialResponse(response) {
        try {
            console.log('[GoogleAuth] Received credential response');
            
            // Decode the JWT token
            const userInfo = this.decodeJWT(response.credential);
            console.log('[GoogleAuth] User info decoded:', {
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            });
            
            // Create user profile
            const userProfile = {
                id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                given_name: userInfo.given_name,
                family_name: userInfo.family_name,
                picture: userInfo.picture,
                verified_email: userInfo.email_verified,
                locale: userInfo.locale,
                
                // Authentication metadata
                auth_method: 'google',
                auth_time: Date.now(),
                token: response.credential,
                expires_at: userInfo.exp * 1000 // Convert to milliseconds
            };
            
            // Store user profile securely
            await this.storeUserProfile(userProfile);
            
            // Update current user
            this.currentUser = userProfile;
            
            // Start token monitoring
            this.startTokenMonitoring();
            
            // Dispatch sign-in success event
            this.dispatchEvent('google-sign-in-success', { user: userProfile });
            
            console.log('[GoogleAuth] Sign-in successful');
            
        } catch (error) {
            console.error('[GoogleAuth] Sign-in failed:', error);
            this.dispatchEvent('google-sign-in-error', { error: error.message });
        }
    }
    
    /**
     * Decode JWT token
     */
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('[GoogleAuth] Failed to decode JWT:', error);
            throw new Error('Invalid token format');
        }
    }
    
    /**
     * Store user profile securely
     */
    async storeUserProfile(userProfile) {
        try {
            // Store encrypted profile
            if (window.storageManager) {
                await window.storageManager.setSecureData(
                    APP_CONFIG.storageKeys.userProfile,
                    userProfile
                );
            } else {
                // Fallback to localStorage (less secure)
                localStorage.setItem(
                    APP_CONFIG.storageKeys.userProfile,
                    JSON.stringify(userProfile)
                );
            }
            
            console.log('[GoogleAuth] User profile stored securely');
            
        } catch (error) {
            console.error('[GoogleAuth] Failed to store user profile:', error);
            throw error;
        }
    }
    
    /**
     * Check for existing session
     */
    async checkExistingSession() {
        try {
            let userProfile = null;
            
            // Try to load from secure storage
            if (window.storageManager) {
                userProfile = await window.storageManager.getSecureData(
                    APP_CONFIG.storageKeys.userProfile
                );
            } else {
                // Fallback to localStorage
                const storedProfile = localStorage.getItem(APP_CONFIG.storageKeys.userProfile);
                if (storedProfile) {
                    userProfile = JSON.parse(storedProfile);
                }
            }
            
            if (userProfile && this.isTokenValid(userProfile)) {
                this.currentUser = userProfile;
                this.startTokenMonitoring();
                
                console.log('[GoogleAuth] Existing session restored');
                this.dispatchEvent('google-session-restored', { user: userProfile });
                
                return true;
            } else if (userProfile) {
                // Token expired, clear stored data
                await this.clearStoredSession();
                console.log('[GoogleAuth] Expired session cleared');
            }
            
            return false;
            
        } catch (error) {
            console.error('[GoogleAuth] Failed to check existing session:', error);
            return false;
        }
    }
    
    /**
     * Check if token is still valid
     */
    isTokenValid(userProfile) {
        if (!userProfile || !userProfile.expires_at) {
            return false;
        }
        
        const now = Date.now();
        const expiryTime = userProfile.expires_at;
        const timeUntilExpiry = expiryTime - now;
        
        // Consider token invalid if it expires within 5 minutes
        return timeUntilExpiry > (5 * 60 * 1000);
    }
    
    /**
     * Start monitoring token expiration
     */
    startTokenMonitoring() {
        // Clear existing interval
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
        }
        
        // Check token every minute
        this.tokenCheckInterval = setInterval(() => {
            if (this.currentUser && !this.isTokenValid(this.currentUser)) {
                console.log('[GoogleAuth] Token expired, signing out');
                this.signOut();
            }
        }, 60000);
    }
    
    /**
     * Manual sign-in trigger
     */
    async signIn() {
        try {
            if (!this.isInitialized) {
                throw new Error('Google Auth not initialized');
            }
            
            // Prompt for sign-in
            google.accounts.id.prompt();
            
        } catch (error) {
            console.error('[GoogleAuth] Manual sign-in failed:', error);
            this.dispatchEvent('google-sign-in-error', { error: error.message });
        }
    }
    
    /**
     * Sign out user
     */
    async signOut() {
        try {
            console.log('[GoogleAuth] Signing out user');
            
            // Clear token monitoring
            if (this.tokenCheckInterval) {
                clearInterval(this.tokenCheckInterval);
                this.tokenCheckInterval = null;
            }
            
            // Revoke Google token if available
            if (this.currentUser && this.currentUser.token) {
                try {
                    google.accounts.id.revoke(this.currentUser.email);
                } catch (error) {
                    console.warn('[GoogleAuth] Failed to revoke token:', error);
                }
            }
            
            // Clear stored session
            await this.clearStoredSession();
            
            // Clear current user
            this.currentUser = null;
            
            // Dispatch sign-out event
            this.dispatchEvent('google-sign-out');
            
            console.log('[GoogleAuth] Sign-out successful');
            
        } catch (error) {
            console.error('[GoogleAuth] Sign-out failed:', error);
        }
    }
    
    /**
     * Clear stored session data
     */
    async clearStoredSession() {
        try {
            if (window.storageManager) {
                await window.storageManager.removeSecureData(APP_CONFIG.storageKeys.userProfile);
            } else {
                localStorage.removeItem(APP_CONFIG.storageKeys.userProfile);
            }
        } catch (error) {
            console.error('[GoogleAuth] Failed to clear stored session:', error);
        }
    }
    
    /**
     * Get current user profile
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Check if user is signed in
     */
    isSignedIn() {
        return this.currentUser !== null && this.isTokenValid(this.currentUser);
    }
    
    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('[GoogleAuth] Initialization error:', error);
        
        // Show fallback sign-in option
        const buttonContainer = document.getElementById('google-signin-button');
        if (buttonContainer) {
            buttonContainer.innerHTML = `
                <div class="google-signin-error">
                    <span class="material-icons">warning</span>
                    <div class="error-content">
                        <p>Google Sign-In temporarily unavailable</p>
                        <button class="manual-login-fallback" onclick="document.getElementById('manual-login-toggle').click()">
                            Use Email Sign-In Instead
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.dispatchEvent('google-auth-error', { error: error.message });
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
     * Get user avatar URL with fallback
     */
    getUserAvatar(size = 96) {
        if (this.currentUser && this.currentUser.picture) {
            // Google profile images support size parameter
            const url = new URL(this.currentUser.picture);
            url.searchParams.set('s', size.toString());
            return url.toString();
        }
        
        // Return default avatar
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#E1E8ED"/>
                <circle cx="12" cy="9" r="3" fill="#AAB8C2"/>
                <path d="M17.25 19.5c0-2.9-2.35-5.25-5.25-5.25s-5.25 2.35-5.25 5.25" fill="#AAB8C2"/>
            </svg>
        `)}`;
    }
}

// Initialize Google Auth Manager
let googleAuthManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    googleAuthManager = new GoogleAuthManager();
    
    // Make it globally available
    window.googleAuthManager = googleAuthManager;
});

// Global callback for Google library load
window.onGoogleLibraryLoad = () => {
    console.log('[GoogleAuth] Google library load callback triggered');
    if (googleAuthManager) {
        googleAuthManager.onGoogleLibraryLoad();
    }
};