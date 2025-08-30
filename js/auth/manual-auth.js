/**
 * Manual Authentication System
 * Handles email/password and API key authentication as backup to Google Sign-In
 */

class ManualAuthManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.loginForm = null;
        
        this.init();
    }
    
    /**
     * Initialize manual authentication
     */
    init() {
        try {
            console.log('[ManualAuth] Initializing manual authentication...');
            
            // Try to get form elements with retry mechanism
            this.findElements();
            
            if (!this.loginForm || !this.toggleButton) {
                console.log('[ManualAuth] Elements not ready yet, retrying in 500ms...');
                setTimeout(() => {
                    this.init();
                }, 500);
                return;
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Check for existing session
            this.checkExistingSession();
            
            this.isInitialized = true;
            console.log('[ManualAuth] Manual authentication initialized');
            
        } catch (error) {
            console.error('[ManualAuth] Failed to initialize:', error);
            // Don't fail completely - create fallback object
            this.isInitialized = false;
        }
    }
    
    /**
     * Find DOM elements
     */
    findElements() {
        this.loginForm = document.getElementById('manual-login-form');
        this.toggleButton = document.getElementById('manual-login-toggle');
        this.loginButton = document.getElementById('manual-login-btn');
        this.passwordToggle = document.getElementById('toggle-password');
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Toggle form visibility
        this.toggleButton.addEventListener('click', () => {
            this.toggleFormVisibility();
        });
        
        // Handle form submission
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Password visibility toggle
        if (this.passwordToggle) {
            this.passwordToggle.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }
        
        // Input validation
        const inputs = this.loginForm.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateInput(input));
            input.addEventListener('input', () => this.clearInputError(input));
        });
        
        // Remember me functionality
        const rememberCheckbox = document.getElementById('remember-me');
        if (rememberCheckbox) {
            rememberCheckbox.addEventListener('change', () => {
                this.updateRememberPreference(rememberCheckbox.checked);
            });
        }
    }
    
    /**
     * Toggle form visibility
     */
    toggleFormVisibility() {
        const isHidden = this.loginForm.classList.contains('hidden');
        
        if (isHidden) {
            this.loginForm.classList.remove('hidden');
            this.toggleButton.innerHTML = `
                <span class="material-icons">expand_less</span>
                Hide Email Sign-In
            `;
            
            // Focus first input
            const firstInput = this.loginForm.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 300);
            }
        } else {
            this.loginForm.classList.add('hidden');
            this.toggleButton.innerHTML = `
                <span class="material-icons">email</span>
                Sign in with Email
            `;
        }
        
        // Animate the toggle
        this.loginForm.style.transition = 'all 0.3s ease';
    }
    
    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = this.passwordToggle.querySelector('.material-icons');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = 'visibility_off';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = 'visibility';
        }
    }
    
    /**
     * Handle login form submission
     */
    async handleLogin() {
        try {
            const formData = this.getFormData();
            
            // Validate form data
            if (!this.validateFormData(formData)) {
                return;
            }
            
            // Show loading state
            this.setLoadingState(true);
            
            // Determine authentication type
            const authType = this.detectAuthType(formData.password);
            
            console.log(`[ManualAuth] Attempting ${authType} authentication`);
            
            // Authenticate based on type
            let userProfile;
            if (authType === 'api_key') {
                userProfile = await this.authenticateWithAPIKey(formData);
            } else {
                userProfile = await this.authenticateWithPassword(formData);
            }
            
            // Store user profile
            await this.storeUserProfile(userProfile);
            
            // Update current user
            this.currentUser = userProfile;
            
            // Hide loading state
            this.setLoadingState(false);
            
            // Dispatch success event
            this.dispatchEvent('manual-sign-in-success', { user: userProfile });
            
            console.log('[ManualAuth] Authentication successful');
            
        } catch (error) {
            console.error('[ManualAuth] Authentication failed:', error);
            
            this.setLoadingState(false);
            this.showError(error.message);
            this.dispatchEvent('manual-sign-in-error', { error: error.message });
        }
    }
    
    /**
     * Get form data
     */
    getFormData() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        return { email, password, rememberMe };
    }
    
    /**
     * Validate form data
     */
    validateFormData(formData) {
        let isValid = true;
        
        // Validate email
        if (!this.isValidEmail(formData.email)) {
            this.showInputError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate password/API key
        if (!formData.password || formData.password.length < 3) {
            this.showInputError('password', 'Password or API key is required');
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Detect authentication type based on password format
     */
    detectAuthType(password) {
        // Check if it looks like an Anthropic API key
        if (password.startsWith('sk-ant-') || password.length > 50) {
            return 'api_key';
        }
        
        // Otherwise treat as password
        return 'password';
    }
    
    /**
     * Authenticate with API key
     */
    async authenticateWithAPIKey(formData) {
        // Validate API key format
        if (!this.isValidAPIKey(formData.password)) {
            throw new Error('Invalid API key format');
        }
        
        // For now, we'll create a mock user profile
        // In a real implementation, you'd validate the key with Anthropic's API
        const userProfile = {
            id: this.generateUserId(formData.email),
            email: formData.email,
            name: formData.email.split('@')[0], // Use email prefix as name
            picture: null, // No avatar for API key auth
            verified_email: true,
            
            // Authentication metadata
            auth_method: 'api_key',
            auth_time: Date.now(),
            api_key: formData.password,
            remember_me: formData.rememberMe,
            expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        };
        
        console.log('[ManualAuth] API key authentication simulated');
        return userProfile;
    }
    
    /**
     * Authenticate with email/password
     */
    async authenticateWithPassword(formData) {
        // For demo purposes, accept any email/password combination
        // In a real implementation, you'd validate against your authentication service
        
        const userProfile = {
            id: this.generateUserId(formData.email),
            email: formData.email,
            name: formData.email.split('@')[0],
            picture: null,
            verified_email: true,
            
            // Authentication metadata
            auth_method: 'password',
            auth_time: Date.now(),
            password_hash: await this.hashPassword(formData.password),
            remember_me: formData.rememberMe,
            expires_at: Date.now() + (formData.rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000 // 30 days if remembered, 1 day otherwise
        };
        
        console.log('[ManualAuth] Password authentication simulated');
        return userProfile;
    }
    
    /**
     * Validate API key format
     */
    isValidAPIKey(apiKey) {
        // Basic validation for Anthropic API key format
        return apiKey && (apiKey.startsWith('sk-ant-') || apiKey.length > 20);
    }
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Generate user ID from email
     */
    generateUserId(email) {
        // Simple hash-based ID generation
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    /**
     * Hash password (simple implementation for demo)
     */
    async hashPassword(password) {
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hash = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hash));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback for older browsers
            return btoa(password).replace(/[^a-zA-Z0-9]/g, '');
        }
    }
    
    /**
     * Store user profile
     */
    async storeUserProfile(userProfile) {
        try {
            const storageKey = APP_CONFIG.storageKeys.userProfile;
            
            if (window.storageManager) {
                await window.storageManager.setSecureData(storageKey, userProfile);
            } else {
                // Fallback to localStorage
                localStorage.setItem(storageKey, JSON.stringify(userProfile));
            }
            
            console.log('[ManualAuth] User profile stored');
            
        } catch (error) {
            console.error('[ManualAuth] Failed to store user profile:', error);
            throw error;
        }
    }
    
    /**
     * Check for existing session
     */
    async checkExistingSession() {
        try {
            let userProfile = null;
            
            if (window.storageManager) {
                userProfile = await window.storageManager.getSecureData(
                    APP_CONFIG.storageKeys.userProfile
                );
            } else {
                const storedProfile = localStorage.getItem(APP_CONFIG.storageKeys.userProfile);
                if (storedProfile) {
                    userProfile = JSON.parse(storedProfile);
                }
            }
            
            if (userProfile && this.isSessionValid(userProfile)) {
                this.currentUser = userProfile;
                
                console.log('[ManualAuth] Existing session restored');
                this.dispatchEvent('manual-session-restored', { user: userProfile });
                
                return true;
            } else if (userProfile) {
                // Session expired
                await this.clearStoredSession();
                console.log('[ManualAuth] Expired session cleared');
            }
            
            return false;
            
        } catch (error) {
            console.error('[ManualAuth] Failed to check existing session:', error);
            return false;
        }
    }
    
    /**
     * Check if session is still valid
     */
    isSessionValid(userProfile) {
        if (!userProfile || !userProfile.expires_at) {
            return false;
        }
        
        return Date.now() < userProfile.expires_at;
    }
    
    /**
     * Sign out user
     */
    async signOut() {
        try {
            console.log('[ManualAuth] Signing out user');
            
            await this.clearStoredSession();
            this.currentUser = null;
            
            // Reset form
            if (this.loginForm) {
                this.loginForm.reset();
                this.loginForm.classList.add('hidden');
            }
            
            // Reset toggle button
            if (this.toggleButton) {
                this.toggleButton.innerHTML = `
                    <span class="material-icons">email</span>
                    Sign in with Email
                `;
            }
            
            this.dispatchEvent('manual-sign-out');
            console.log('[ManualAuth] Sign-out successful');
            
        } catch (error) {
            console.error('[ManualAuth] Sign-out failed:', error);
        }
    }
    
    /**
     * Clear stored session
     */
    async clearStoredSession() {
        try {
            if (window.storageManager) {
                await window.storageManager.removeSecureData(APP_CONFIG.storageKeys.userProfile);
            } else {
                localStorage.removeItem(APP_CONFIG.storageKeys.userProfile);
            }
        } catch (error) {
            console.error('[ManualAuth] Failed to clear session:', error);
        }
    }
    
    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        const buttonText = this.loginButton.querySelector('.button-text');
        const buttonIcon = this.loginButton.querySelector('.button-icon');
        
        if (isLoading) {
            this.loginButton.disabled = true;
            this.loginButton.classList.add('loading');
            buttonText.style.opacity = '0';
            buttonIcon.classList.remove('hidden');
        } else {
            this.loginButton.disabled = false;
            this.loginButton.classList.remove('loading');
            buttonText.style.opacity = '1';
            buttonIcon.classList.add('hidden');
        }
    }
    
    /**
     * Show input error
     */
    showInputError(inputId, message) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        input.classList.add('input-error');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <span class="material-icons">error</span>
            <span>${message}</span>
        `;
        
        input.parentNode.appendChild(errorElement);
    }
    
    /**
     * Clear input error
     */
    clearInputError(input) {
        input.classList.remove('input-error');
        
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
    
    /**
     * Show general error
     */
    showError(message) {
        // Create or update error display
        let errorContainer = this.loginForm.querySelector('.auth-error');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'auth-error';
            this.loginForm.insertBefore(errorContainer, this.loginForm.firstChild);
        }
        
        errorContainer.innerHTML = `
            <span class="material-icons">error</span>
            <span>${message}</span>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorContainer && errorContainer.parentNode) {
                errorContainer.remove();
            }
        }, 5000);
    }
    
    /**
     * Validate individual input
     */
    validateInput(input) {
        const value = input.value.trim();
        
        if (input.id === 'email') {
            if (!value) {
                this.showInputError(input.id, 'Email is required');
            } else if (!this.isValidEmail(value)) {
                this.showInputError(input.id, 'Please enter a valid email address');
            } else {
                this.clearInputError(input);
            }
        } else if (input.id === 'password') {
            if (!value) {
                this.showInputError(input.id, 'Password or API key is required');
            } else if (value.length < 3) {
                this.showInputError(input.id, 'Password must be at least 3 characters');
            } else {
                this.clearInputError(input);
            }
        }
    }
    
    /**
     * Update remember preference
     */
    updateRememberPreference(remember) {
        try {
            localStorage.setItem('claude_remember_preference', remember ? 'true' : 'false');
        } catch (error) {
            console.warn('[ManualAuth] Failed to save remember preference:', error);
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
        return this.currentUser !== null && this.isSessionValid(this.currentUser);
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
     * Get user avatar (default for manual auth)
     */
    getUserAvatar(size = 96) {
        if (this.currentUser && this.currentUser.picture) {
            return this.currentUser.picture;
        }
        
        // Generate initials-based avatar
        const initials = this.getUserInitials();
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="20" fill="#3498DB"/>
                <text x="20" y="26" font-family="Inter, sans-serif" font-size="14" font-weight="600" 
                      fill="white" text-anchor="middle">${initials}</text>
            </svg>
        `)}`;
    }
    
    /**
     * Get user initials for avatar
     */
    getUserInitials() {
        if (!this.currentUser) return 'U';
        
        const name = this.currentUser.name || this.currentUser.email;
        const parts = name.split(/[\s@]+/);
        
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        } else {
            return parts[0].substring(0, 2).toUpperCase();
        }
    }
}

// Initialize Manual Auth Manager
let manualAuthManager;

document.addEventListener('DOMContentLoaded', () => {
    manualAuthManager = new ManualAuthManager();
    window.manualAuthManager = manualAuthManager;
});