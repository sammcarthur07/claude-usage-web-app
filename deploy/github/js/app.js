/**
 * Main Application Controller
 * Coordinates all managers and handles application lifecycle
 */

class Application {
    constructor() {
        this.isInitialized = false;
        this.managers = {};
        this.startTime = Date.now();
        this.updateLoop = null;
        
        // Application state
        this.state = {
            isAuthenticated: false,
            currentUser: null,
            isOnline: navigator.onLine,
            lastActivity: Date.now()
        };
        
        this.init();
    }
    
    /**
     * Initialize application
     */
    async init() {
        try {
            console.log('[App] Initializing Claude Usage Monitor PWA...');
            this.showLoadingScreen('Initializing application...');
            
            // Initialize managers
            await this.initializeManagers();
            
            // Set up global event handlers
            this.setupGlobalEventHandlers();
            
            // Start services
            this.startServices();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('[App] Application initialized successfully');
            
        } catch (error) {
            console.error('[App] Initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Initialize all managers
     */
    async initializeManagers() {
        const managers = [
            'storageManager', 'themeManager', 'chartManager',
            'googleAuthManager', 'manualAuthManager', 'authManager',
            'dataCollector', 'dashboardManager'
        ];
        
        for (const managerName of managers) {
            await this.waitForManager(managerName);
            this.managers[managerName] = window[managerName];
        }
    }
    
    /**
     * Wait for manager to be ready
     */
    async waitForManager(name, timeout = 5000) {
        let elapsed = 0;
        const interval = 50;
        
        while (!window[name] && elapsed < timeout) {
            await new Promise(r => setTimeout(r, interval));
            elapsed += interval;
        }
        
        if (!window[name]) {
            throw new Error(`${name} failed to initialize`);
        }
    }
    
    /**
     * Set up global event handlers
     */
    setupGlobalEventHandlers() {
        // Authentication events
        document.addEventListener('auth-success', (e) => {
            this.handleAuthSuccess(e.detail);
        });
        
        document.addEventListener('auth-signed-out-complete', () => {
            this.handleAuthSignOut();
        });
        
        // Network events
        window.addEventListener('online', () => {
            this.handleNetworkChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkChange(false);
        });
        
        // Error handling
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e.error);
        });
        
        // Activity tracking
        ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.state.lastActivity = Date.now();
            }, { passive: true });
        });
        
        console.log('[App] Event handlers set up');
    }
    
    /**
     * Start application services
     */
    startServices() {
        // Start update loop
        this.startUpdateLoop();
        
        // Initialize PWA features
        this.initializePWA();
        
        console.log('[App] Services started');
    }
    
    /**
     * Start update loop
     */
    startUpdateLoop() {
        this.updateLoop = setInterval(() => {
            if (this.state.isAuthenticated) {
                this.performUpdates();
            }
        }, 3000);
    }
    
    /**
     * Initialize PWA features
     */
    initializePWA() {
        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setTimeout(() => {
                if (confirm('Install Claude Usage Monitor for better experience?')) {
                    e.prompt();
                }
            }, 3000);
        });
        
        // App installed
        window.addEventListener('appinstalled', () => {
            this.showToast('App installed successfully!', 'success');
        });
    }
    
    /**
     * Perform periodic updates
     */
    performUpdates() {
        const inactiveTime = Date.now() - this.state.lastActivity;
        if (inactiveTime > 300000) return; // 5 minutes
        
        if (document.visibilityState === 'visible') {
            // Updates handled by individual managers
        }
    }
    
    /**
     * Handle authentication success
     */
    handleAuthSuccess(detail) {
        this.state.isAuthenticated = true;
        this.state.currentUser = detail.user;
        
        this.showToast(`Welcome, ${detail.user.name || detail.user.email}!`, 'success');
        document.title = `Claude Usage Monitor - ${detail.user.name || 'Dashboard'}`;
    }
    
    /**
     * Handle authentication sign out
     */
    handleAuthSignOut() {
        this.state.isAuthenticated = false;
        this.state.currentUser = null;
        
        document.title = 'Claude Usage Monitor';
        this.showToast('Signed out successfully', 'info');
    }
    
    /**
     * Handle network changes
     */
    handleNetworkChange(isOnline) {
        this.state.isOnline = isOnline;
        this.showToast(isOnline ? 'Back online' : 'Working offline', 
                      isOnline ? 'success' : 'warning');
    }
    
    /**
     * Handle global errors
     */
    handleGlobalError(error) {
        console.error('[App] Global error:', error);
        
        if (error?.message && !error.message.includes('Script error')) {
            this.showToast('Something went wrong. Please refresh the page.', 'error');
        }
    }
    
    /**
     * Show loading screen
     */
    showLoadingScreen(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        
        if (overlay && text) {
            text.textContent = message;
            overlay.style.display = 'flex';
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (this.managers.authManager?.showToast) {
            this.managers.authManager.showToast({ type, message, duration: 3000 });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    /**
     * Handle initialization error
     */
    handleInitializationError(error) {
        console.error('[App] Init error:', error);
        
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; 
                           min-height: 100vh; flex-direction: column; text-align: center; padding: 2rem;">
                    <span class="material-icons" style="font-size: 4rem; color: #e74c3c; margin-bottom: 1rem;">error_outline</span>
                    <h2 style="color: var(--text-primary); margin-bottom: 1rem;">Failed to Start</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        The application failed to initialize: ${error.message}
                    </p>
                    <button onclick="window.location.reload()" 
                           style="padding: 0.75rem 2rem; background: var(--primary-color); 
                                  color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <span class="material-icons" style="vertical-align: middle; margin-right: 0.5rem;">refresh</span>
                        Retry
                    </button>
                </div>
            `;
        }
        
        this.hideLoadingScreen();
    }
    
    /**
     * Cleanup on unload
     */
    cleanup() {
        if (this.updateLoop) {
            clearInterval(this.updateLoop);
        }
        
        Object.values(this.managers).forEach(manager => {
            if (manager?.cleanup) {
                manager.cleanup();
            }
        });
    }
}

// Initialize app
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new Application();
    window.app = app;
});

window.addEventListener('beforeunload', () => {
    if (app) app.cleanup();
});