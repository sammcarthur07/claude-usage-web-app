/**
 * Main Application Controller
 * Handles app initialization, navigation, and user interactions
 */

class ClaudeUsageMonitor {
    constructor() {
        this.currentScreen = 'splash';
        this.chart = null;
        this.refreshInterval = null;
        this.realTimeInterval = null;
        this.usageData = null;
        this.isLoading = false;
        this.currentTheme = 'auto';
        this.isVisible = true;
        this.updateCounter = 0;
        this.isPaused = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize storage manager
            const storageInfo = await window.StorageManager.init();
            
            // Register service worker for PWA
            this.registerServiceWorker();
            
            // Check for stored credentials
            if (storageInfo.hasStoredCredentials) {
                const credentials = await window.StorageManager.getCredentials();
                if (credentials) {
                    // Auto-login with stored credentials
                    setTimeout(() => {
                        this.autoLogin(credentials);
                    }, 1500);
                } else {
                    this.showLoginScreen();
                }
            } else {
                // Show login after splash
                setTimeout(() => {
                    this.showLoginScreen();
                }, 1500);
            }
            
            // Initialize theme
            this.initializeTheme();
            
            // Setup visibility API for pause/resume
            this.setupVisibilityAPI();
            
            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showToast('Failed to initialize app', 'error');
            this.showLoginScreen();
        }
    }

    /**
     * Register service worker for offline functionality
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Password toggle
        const passwordToggle = document.getElementById('passwordToggle');
        passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Clear data button
        const clearDataBtn = document.getElementById('clearDataBtn');
        clearDataBtn.addEventListener('click', () => this.clearSavedData());
        
        // Dashboard buttons
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());
        
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => this.refreshDashboard());
        
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Auto-populate credentials if available
        this.checkForSavedCredentials();
    }

    /**
     * Check and populate saved credentials
     */
    async checkForSavedCredentials() {
        const credentials = await window.StorageManager.getCredentials();
        if (credentials) {
            document.getElementById('email').value = credentials.email || '';
            document.getElementById('apiKey').value = credentials.apiKey || '';
            document.getElementById('rememberMe').checked = credentials.rememberMe || false;
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const email = document.getElementById('email').value;
        const apiKey = document.getElementById('apiKey').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validate inputs
        if (!email || !apiKey) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        
        if (!window.CryptoUtils.validateApiKey(apiKey)) {
            this.showToast('Invalid API key format', 'error');
            return;
        }
        
        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Validate API key with Anthropic
            const isValid = await window.ApiService.validateApiKey(apiKey);
            
            if (!isValid) {
                throw new Error('Invalid API key');
            }
            
            // Save credentials if remember me is checked
            if (rememberMe) {
                await window.StorageManager.saveCredentials(email, apiKey, true);
            } else {
                // Save to session only
                await window.StorageManager.saveCredentials(email, apiKey, false);
            }
            
            // Set API key for future requests
            window.ApiService.setApiKey(apiKey);
            
            // Navigate to dashboard
            this.showDashboard();
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Authentication failed. Please check your credentials.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Auto-login with stored credentials
     */
    async autoLogin(credentials) {
        try {
            // Set API key
            window.ApiService.setApiKey(credentials.apiKey);
            
            // Navigate to dashboard
            this.showDashboard();
            
            this.showToast('Welcome back!', 'success');
            
        } catch (error) {
            console.error('Auto-login error:', error);
            this.showLoginScreen();
        }
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const apiKeyInput = document.getElementById('apiKey');
        const toggleIcon = document.querySelector('#passwordToggle .material-icons-round');
        
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleIcon.textContent = 'visibility';
        } else {
            apiKeyInput.type = 'password';
            toggleIcon.textContent = 'visibility_off';
        }
    }

    /**
     * Clear saved credentials
     */
    async clearSavedData() {
        if (confirm('Are you sure you want to clear all saved data?')) {
            window.StorageManager.clearAllData();
            document.getElementById('email').value = '';
            document.getElementById('apiKey').value = '';
            document.getElementById('rememberMe').checked = false;
            this.showToast('All saved data has been cleared', 'success');
        }
    }

    /**
     * Show dashboard screen
     */
    async showDashboard() {
        this.switchScreen('dashboard');
        
        // Load and display usage data
        await this.loadUsageData();
        
        // Setup auto-refresh
        const prefs = window.StorageManager.getPreferences();
        if (prefs.autoRefresh) {
            this.refreshInterval = setInterval(() => {
                this.refreshDashboard();
            }, prefs.refreshInterval);
        }
        
        // Setup real-time updates (every 3 seconds)
        this.startRealTimeUpdates();
    }

    /**
     * Load and display usage data
     */
    async loadUsageData() {
        try {
            // Show loading state
            this.showDashboardLoading(true);
            
            // Fetch usage data
            this.usageData = await window.ApiService.fetchUsageData();
            
            // Update UI elements
            this.updateDashboardStats();
            this.updateChart();
            this.updateProgressBar();
            
            // Update last updated time
            document.getElementById('lastUpdated').textContent = 
                window.ApiService.formatDate(this.usageData.lastUpdated);
            
        } catch (error) {
            console.error('Failed to load usage data:', error);
            this.showToast('Failed to load usage data', 'error');
            
            // Try to load cached data
            const cached = window.StorageManager.getUsageData();
            if (cached) {
                this.usageData = cached;
                this.updateDashboardStats();
                this.updateChart();
                this.updateProgressBar();
                this.showToast('Showing cached data', 'info');
            }
        } finally {
            this.showDashboardLoading(false);
        }
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        if (!this.usageData) return;
        
        // Update stat cards
        document.getElementById('totalTokens').textContent = 
            window.ApiService.formatNumber(this.usageData.totalTokens);
        document.getElementById('apiCalls').textContent = 
            window.ApiService.formatNumber(this.usageData.apiCalls);
        document.getElementById('opusCost').textContent = 
            this.usageData.opusCost.toFixed(2);
        document.getElementById('sonnetCost').textContent = 
            this.usageData.sonnetCost.toFixed(2);
        
        // Update summary
        document.getElementById('totalCost').textContent = 
            this.usageData.totalCost.toFixed(2);
        document.getElementById('webTokens').textContent = 
            window.ApiService.formatNumber(this.usageData.webTokens);
        document.getElementById('terminalTokens').textContent = 
            window.ApiService.formatNumber(this.usageData.terminalTokens);
    }

    /**
     * Update usage chart
     */
    updateChart() {
        if (!this.usageData || !this.usageData.dailyUsage) return;
        
        const ctx = document.getElementById('usageChart').getContext('2d');
        
        // Destroy existing chart if present
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Create new chart
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.usageData.dailyUsage.map(d => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Daily Tokens',
                    data: this.usageData.dailyUsage.map(d => d.tokens),
                    borderColor: '#3498DB',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#3498DB',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                return `Tokens: ${window.ApiService.formatNumber(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: (value) => {
                                if (value >= 1000000) {
                                    return (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return (value / 1000).toFixed(0) + 'K';
                                }
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        if (!this.usageData) return;
        
        const percentage = Math.min(
            (this.usageData.totalTokens / this.usageData.usageLimit) * 100,
            100
        );
        
        const progressBar = document.getElementById('usageProgressBar');
        const progressPercentage = document.getElementById('usagePercentage');
        const usedTokens = document.getElementById('usedTokens');
        const limitTokens = document.getElementById('limitTokens');
        
        progressBar.style.width = percentage + '%';
        progressPercentage.textContent = percentage.toFixed(1) + '%';
        usedTokens.textContent = window.ApiService.formatNumber(this.usageData.totalTokens);
        limitTokens.textContent = window.ApiService.formatNumber(this.usageData.usageLimit);
        
        // Change color based on usage
        if (percentage > 80) {
            progressBar.style.background = 'linear-gradient(90deg, #E74C3C, #C0392B)';
        } else if (percentage > 60) {
            progressBar.style.background = 'linear-gradient(90deg, #F39C12, #E67E22)';
        }
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.classList.add('spinning');
        
        await this.loadUsageData();
        
        setTimeout(() => {
            refreshBtn.classList.remove('spinning');
        }, 500);
        
        this.showToast('Dashboard refreshed', 'success');
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear session
            window.StorageManager.clearSession();
            
            // Clear refresh interval
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
            
            // Navigate to login
            this.showLoginScreen();
            
            this.showToast('Logged out successfully', 'success');
        }
    }

    /**
     * Show login screen
     */
    showLoginScreen() {
        this.switchScreen('login');
        this.checkForSavedCredentials();
    }

    /**
     * Switch between screens
     */
    switchScreen(screenName) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        const targetScreen = document.getElementById(screenName + 'Screen');
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
    }

    /**
     * Set loading state for login button
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        const loginBtn = document.getElementById('loginBtn');
        
        if (isLoading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }

    /**
     * Show dashboard loading state
     */
    showDashboardLoading(show) {
        const dashboardContent = document.querySelector('.dashboard-content');
        if (show) {
            dashboardContent.style.opacity = '0.5';
        } else {
            dashboardContent.style.opacity = '1';
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        
        toast.innerHTML = `
            <span class="material-icons-round toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <span class="material-icons-round">close</span>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        });
    }

    /**
     * Initialize theme system
     */
    initializeTheme() {
        // Load saved theme preference
        const prefs = window.StorageManager.getPreferences();
        this.currentTheme = prefs.theme || 'auto';
        
        // Apply theme
        this.applyTheme(this.currentTheme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    /**
     * Toggle theme between light, dark, and auto
     */
    toggleTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('.material-icons-round');
        
        // Add switching animation
        themeToggle.classList.add('theme-switching');
        
        // Cycle through themes: auto -> light -> dark -> auto
        const themes = ['auto', 'light', 'dark'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        // Apply new theme
        this.currentTheme = nextTheme;
        this.applyTheme(nextTheme);
        
        // Save preference
        const prefs = window.StorageManager.getPreferences();
        prefs.theme = nextTheme;
        window.StorageManager.savePreferences(prefs);
        
        // Update icon
        const icons = {
            'auto': 'brightness_auto',
            'light': 'light_mode',
            'dark': 'dark_mode'
        };
        icon.textContent = icons[nextTheme];
        
        // Remove animation class
        setTimeout(() => {
            themeToggle.classList.remove('theme-switching');
        }, 200);
        
        this.showToast(`Theme switched to ${nextTheme}`, 'success');
    }

    /**
     * Apply theme to the application
     */
    applyTheme(theme) {
        const html = document.documentElement;
        const themeToggle = document.getElementById('themeToggle');
        
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
        } else {
            // Auto - use system preference
            html.removeAttribute('data-theme');
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                html.setAttribute('data-theme', 'dark');
            }
        }
        
        // Update theme color meta tag
        const themeColor = html.getAttribute('data-theme') === 'dark' ? '#1a1a1a' : '#2C3E50';
        document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
        
        // Update icon
        if (themeToggle) {
            const icon = themeToggle.querySelector('.material-icons-round');
            const icons = {
                'auto': 'brightness_auto',
                'light': 'light_mode',
                'dark': 'dark_mode'
            };
            icon.textContent = icons[theme];
        }
    }

    /**
     * Setup visibility API for pause/resume functionality
     */
    setupVisibilityAPI() {
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            
            if (this.isVisible) {
                this.resumeUpdates();
            } else {
                this.pauseUpdates();
            }
        });

        // Also handle window focus/blur
        window.addEventListener('focus', () => this.resumeUpdates());
        window.addEventListener('blur', () => this.pauseUpdates());
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }
        
        this.realTimeInterval = setInterval(() => {
            if (this.isVisible && !this.isPaused && this.currentScreen === 'dashboard') {
                this.performRealTimeUpdate();
            }
        }, 3000); // Update every 3 seconds
        
        // Add auto-refresh indicator
        this.showAutoRefreshIndicator();
    }

    /**
     * Perform real-time data update with animations
     */
    async performRealTimeUpdate() {
        try {
            this.updateCounter++;
            
            // Add updating classes for fade out effect
            this.addUpdatingClasses();
            
            // Fetch new data
            const newData = await window.ApiService.fetchUsageData();
            
            // Wait for fade out animation
            setTimeout(() => {
                // Update data
                this.usageData = newData;
                
                // Update UI with new data
                this.updateDashboardStats();
                this.updateChart();
                this.updateProgressBar();
                
                // Update last updated time
                document.getElementById('lastUpdated').textContent = 
                    window.ApiService.formatDate(this.usageData.lastUpdated);
                
                // Remove updating classes and add updated classes
                this.showUpdatedData();
                
            }, 150); // Half of the 300ms transition
            
        } catch (error) {
            console.error('Real-time update error:', error);
            this.removeUpdatingClasses();
        }
    }

    /**
     * Add updating animation classes
     */
    addUpdatingClasses() {
        const elements = document.querySelectorAll('.stat-value, .summary-value, .progress-percentage');
        elements.forEach(element => {
            element.classList.add('updating');
        });
        
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.classList.add('updating');
        }
    }

    /**
     * Show updated data with animation
     */
    showUpdatedData() {
        const elements = document.querySelectorAll('.stat-value, .summary-value, .progress-percentage');
        elements.forEach(element => {
            element.classList.remove('updating');
            element.classList.add('updated');
            
            // Remove updated class after animation
            setTimeout(() => {
                element.classList.remove('updated');
            }, 300);
        });
        
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.classList.remove('updating');
            chartContainer.classList.add('updated');
            
            setTimeout(() => {
                chartContainer.classList.remove('updated');
            }, 300);
        }
    }

    /**
     * Remove updating classes
     */
    removeUpdatingClasses() {
        const elements = document.querySelectorAll('.stat-value, .summary-value, .progress-percentage, .chart-container');
        elements.forEach(element => {
            element.classList.remove('updating', 'updated');
        });
    }

    /**
     * Show auto-refresh indicator
     */
    showAutoRefreshIndicator() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn && !refreshBtn.querySelector('.auto-refresh-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'auto-refresh-indicator';
            refreshBtn.style.position = 'relative';
            refreshBtn.appendChild(indicator);
        }
    }

    /**
     * Pause updates when app not visible
     */
    pauseUpdates() {
        this.isPaused = true;
        
        // Show paused indicator
        const indicator = document.createElement('div');
        indicator.id = 'pausedIndicator';
        indicator.className = 'paused-indicator';
        indicator.textContent = '⏸️ Updates paused';
        document.body.appendChild(indicator);
        
        console.log('Updates paused - app not visible');
    }

    /**
     * Resume updates when app becomes visible
     */
    resumeUpdates() {
        this.isPaused = false;
        
        // Remove paused indicator
        const indicator = document.getElementById('pausedIndicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Immediately update if on dashboard
        if (this.currentScreen === 'dashboard') {
            setTimeout(() => {
                this.performRealTimeUpdate();
            }, 500);
        }
        
        console.log('Updates resumed - app visible');
    }

    /**
     * Enhanced refresh with loading overlay
     */
    async refreshDashboard() {
        const refreshBtn = document.getElementById('refreshBtn');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        // Show loading overlay
        loadingOverlay.classList.add('active');
        refreshBtn.classList.add('refreshing');
        
        try {
            await this.loadUsageData();
            this.showToast('Dashboard refreshed successfully', 'success');
        } catch (error) {
            this.showToast('Failed to refresh dashboard', 'error');
        } finally {
            // Hide loading overlay
            setTimeout(() => {
                loadingOverlay.classList.remove('active');
                refreshBtn.classList.remove('refreshing');
            }, 500);
        }
    }

    /**
     * Enhanced logout with cleanup
     */
    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear intervals
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
            
            if (this.realTimeInterval) {
                clearInterval(this.realTimeInterval);
                this.realTimeInterval = null;
            }
            
            // Clear session
            window.StorageManager.clearSession();
            
            // Navigate to login
            this.showLoginScreen();
            
            this.showToast('Logged out successfully', 'success');
        }
    }
}

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(120%);
            opacity: 0;
        }
    }
    
    .spinning {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ClaudeUsageMonitor();
    app.init();
});

// Make app available globally for debugging
window.ClaudeApp = new ClaudeUsageMonitor();