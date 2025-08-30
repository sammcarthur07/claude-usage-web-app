/**
 * Dashboard Manager
 * Handles dashboard UI updates, user interactions, and data visualization
 */

class DashboardManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.currentData = null;
        this.updateAnimationFrame = null;
        
        // UI elements
        this.elements = {};
        
        this.init();
    }
    
    /**
     * Initialize dashboard manager
     */
    async init() {
        try {
            console.log('[Dashboard] Initializing dashboard manager...');
            
            // Get UI elements
            this.cacheElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize refresh button
            this.setupRefreshButton();
            
            this.isInitialized = true;
            console.log('[Dashboard] Dashboard manager initialized');
            
        } catch (error) {
            console.error('[Dashboard] Failed to initialize:', error);
        }
    }
    
    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.elements = {
            // Stats cards
            totalTokens: document.getElementById('total-tokens'),
            totalCost: document.getElementById('total-cost'),
            apiCalls: document.getElementById('api-calls'),
            efficiency: document.getElementById('efficiency'),
            
            // Change indicators
            tokenChange: document.getElementById('token-change'),
            costChange: document.getElementById('cost-change'),
            callsChange: document.getElementById('calls-change'),
            efficiencyChange: document.getElementById('efficiency-change'),
            
            // Model breakdown
            sonnetUsage: document.getElementById('sonnet-usage'),
            sonnetCost: document.getElementById('sonnet-cost'),
            sonnetProgress: document.getElementById('sonnet-progress'),
            
            opusUsage: document.getElementById('opus-usage'),
            opusCost: document.getElementById('opus-cost'),
            opusProgress: document.getElementById('opus-progress'),
            
            haikuUsage: document.getElementById('haiku-usage'),
            haikuCost: document.getElementById('haiku-cost'),
            haikuProgress: document.getElementById('haiku-progress'),
            
            // Source breakdown
            webTokens: document.getElementById('web-tokens'),
            webStatus: document.getElementById('web-status'),
            
            codeTokens: document.getElementById('code-tokens'),
            codeStatus: document.getElementById('code-status'),
            
            manualTokens: document.getElementById('manual-tokens'),
            manualStatus: document.getElementById('manual-status'),
            
            // Controls
            refreshButton: document.getElementById('refresh-button'),
            refreshIndicator: document.getElementById('refresh-indicator'),
            themeToggle: document.getElementById('theme-toggle'),
            logoutButton: document.getElementById('logout-button')
        };
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Data update events
        document.addEventListener('data-update-start', () => {
            this.handleUpdateStart();
        });
        
        document.addEventListener('data-update-complete', (e) => {
            this.handleUpdateComplete(e.detail.data);
        });
        
        document.addEventListener('data-update-error', (e) => {
            this.handleUpdateError(e.detail.error);
        });
        
        // Chart toggle buttons
        const chartToggles = document.querySelectorAll('.chart-toggle');
        chartToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.handleChartToggle(toggle);
            });
        });
        
        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                if (window.themeManager) {
                    window.themeManager.toggleTheme();
                }
            });
        }
        
        // Manual data entry (future enhancement)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' && e.ctrlKey) {
                this.showManualEntryDialog();
            }
        });
        
        // Card interactions
        this.setupCardInteractions();
    }
    
    /**
     * Set up refresh button functionality
     */
    setupRefreshButton() {
        if (this.elements.refreshButton) {
            this.elements.refreshButton.addEventListener('click', () => {
                this.triggerRefresh();
            });
        }
    }
    
    /**
     * Set up card interactions
     */
    setupCardInteractions() {
        const cards = document.querySelectorAll('.stat-card, .source-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                this.handleCardClick(card);
            });
        });
    }
    
    /**
     * Initialize dashboard with user data
     */
    async initialize(user) {
        this.currentUser = user;
        
        try {
            // Update user profile display
            this.updateUserProfile(user);
            
            // Load initial data
            await this.loadInitialData();
            
            // Start listening for updates
            if (window.dataCollector) {
                window.dataCollector.startUpdates();
            }
            
            console.log('[Dashboard] Dashboard initialized for user:', user.email);
            
        } catch (error) {
            console.error('[Dashboard] Failed to initialize dashboard:', error);
        }
    }
    
    /**
     * Update user profile display
     */
    updateUserProfile(user) {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const authBadge = document.getElementById('auth-badge');
        
        if (userAvatar && window.authManager) {
            userAvatar.src = window.authManager.getUserAvatar();
            userAvatar.alt = user.name || 'User';
        }
        
        if (userName) {
            userName.textContent = user.name || 'User';
        }
        
        if (userEmail) {
            userEmail.textContent = user.email || '';
        }
        
        if (authBadge && window.authManager) {
            const method = window.authManager.getAuthMethod();
            const authText = method === 'google' ? 'Google Account' : 
                           user.auth_method === 'api_key' ? 'API Key' : 'Email Account';
            authBadge.textContent = authText;
            authBadge.className = `auth-badge ${method}`;
        }
    }
    
    /**
     * Load initial dashboard data
     */
    async loadInitialData() {
        try {
            if (window.dataCollector) {
                const data = await window.dataCollector.getCurrentStats();
                this.updateDashboard(data);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to load initial data:', error);
        }
    }
    
    /**
     * Handle data update start
     */
    handleUpdateStart() {
        // Add updating animation to relevant elements
        const updatableElements = [
            this.elements.totalTokens,
            this.elements.totalCost,
            this.elements.apiCalls,
            this.elements.efficiency
        ].filter(el => el);
        
        updatableElements.forEach(el => {
            el.parentElement.classList.add('updating');
        });
        
        // Show refresh indicator
        if (this.elements.refreshIndicator) {
            this.elements.refreshIndicator.classList.add('active');
        }
    }
    
    /**
     * Handle data update completion
     */
    handleUpdateComplete(data) {
        this.currentData = data;
        
        // Update dashboard with smooth animations
        this.updateDashboard(data);
        
        // Remove updating states
        const updatedElements = document.querySelectorAll('.updating');
        updatedElements.forEach(el => {
            el.classList.remove('updating');
            el.classList.add('updated');
            
            // Add completion animation
            setTimeout(() => {
                el.classList.add('updating-complete');
                setTimeout(() => {
                    el.classList.remove('updated', 'updating-complete');
                }, 600);
            }, 200);
        });
        
        // Hide refresh indicator
        if (this.elements.refreshIndicator) {
            setTimeout(() => {
                this.elements.refreshIndicator.classList.remove('active');
            }, 500);
        }
    }
    
    /**
     * Handle data update error
     */
    handleUpdateError(error) {
        console.error('[Dashboard] Data update error:', error);
        
        // Remove updating states
        const updatingElements = document.querySelectorAll('.updating');
        updatingElements.forEach(el => {
            el.classList.remove('updating');
        });
        
        // Hide refresh indicator
        if (this.elements.refreshIndicator) {
            this.elements.refreshIndicator.classList.remove('active');
        }
        
        // Show error toast
        if (window.authManager) {
            window.authManager.showToast({
                type: 'error',
                message: 'Failed to update usage data',
                duration: 3000
            });
        }
    }
    
    /**
     * Update dashboard with new data
     */
    updateDashboard(data) {
        if (!data) return;
        
        try {
            // Update stats cards
            this.updateStatsCards(data);
            
            // Update model breakdown
            this.updateModelBreakdown(data.modelBreakdown);
            
            // Update source breakdown
            this.updateSourceBreakdown(data.sourceBreakdown);
            
            // Update chart
            this.updateChart(data.chartData);
            
            console.log('[Dashboard] Dashboard updated');
            
        } catch (error) {
            console.error('[Dashboard] Failed to update dashboard:', error);
        }
    }
    
    /**
     * Update statistics cards
     */
    updateStatsCards(data) {
        // Total tokens
        if (this.elements.totalTokens) {
            this.animateNumber(this.elements.totalTokens, data.totalTokens, true);
        }
        
        // Total cost
        if (this.elements.totalCost) {
            this.animateNumber(this.elements.totalCost, data.totalCost, false, '$');
        }
        
        // API calls
        if (this.elements.apiCalls) {
            this.animateNumber(this.elements.apiCalls, data.totalCalls, true);
        }
        
        // Efficiency
        if (this.elements.efficiency) {
            this.animateNumber(this.elements.efficiency, data.efficiency, true);
        }
        
        // Update change indicators
        if (data.growth) {
            this.updateChangeIndicator(this.elements.tokenChange, data.growth.tokens);
            this.updateChangeIndicator(this.elements.costChange, data.growth.cost);
            this.updateChangeIndicator(this.elements.callsChange, data.growth.calls);
            this.updateChangeIndicator(this.elements.efficiencyChange, data.growth.efficiency);
        }
    }
    
    /**
     * Animate number changes
     */
    animateNumber(element, targetValue, useCommas = false, prefix = '') {
        if (!element) return;
        
        const currentValue = parseFloat(element.textContent.replace(/[^0-9.]/g, '')) || 0;
        const difference = targetValue - currentValue;
        const duration = CONFIG_UTILS.getAnimationDuration();
        const steps = 30;
        const stepValue = difference / steps;
        const stepTime = duration / steps;
        
        let current = currentValue;
        let step = 0;
        
        const animate = () => {
            step++;
            current += stepValue;
            
            if (step >= steps) {
                current = targetValue;
            }
            
            let displayValue = prefix + (useCommas ? this.formatNumber(Math.round(current)) : current.toFixed(2));
            element.textContent = displayValue;
            
            if (step < steps) {
                setTimeout(animate, stepTime);
            }
        };
        
        animate();
    }
    
    /**
     * Format number with commas
     */
    formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * Update change indicator
     */
    updateChangeIndicator(element, value) {
        if (!element || value === undefined) return;
        
        const isPositive = value > 0;
        const isNegative = value < 0;
        const isNeutral = value === 0;
        
        element.className = `stat-change ${
            isPositive ? 'positive' : 
            isNegative ? 'negative' : 
            'neutral'
        }`;
        
        const sign = isPositive ? '+' : isNegative ? '' : '';
        element.textContent = `${sign}${value.toFixed(1)}%`;
    }
    
    /**
     * Update model breakdown
     */
    updateModelBreakdown(modelData) {
        if (!modelData) return;
        
        const models = [
            { key: 'claude-3-5-sonnet-20241022', elements: { usage: this.elements.sonnetUsage, cost: this.elements.sonnetCost, progress: this.elements.sonnetProgress } },
            { key: 'claude-3-opus-20240229', elements: { usage: this.elements.opusUsage, cost: this.elements.opusCost, progress: this.elements.opusProgress } },
            { key: 'claude-3-haiku-20240307', elements: { usage: this.elements.haikuUsage, cost: this.elements.haikuCost, progress: this.elements.haikuProgress } }
        ];
        
        models.forEach(model => {
            const data = modelData[model.key];
            if (!data) return;
            
            if (model.elements.usage) {
                model.elements.usage.textContent = `${this.formatNumber(data.tokens)} tokens`;
            }
            
            if (model.elements.cost) {
                model.elements.cost.textContent = `$${data.cost.toFixed(2)}`;
            }
            
            if (model.elements.progress) {
                const percentage = data.percentage || 0;
                model.elements.progress.style.width = `${percentage}%`;
                
                // Animate progress bar
                model.elements.progress.style.transition = 'width 0.5s ease-out';
            }
        });
    }
    
    /**
     * Update source breakdown
     */
    updateSourceBreakdown(sourceData) {
        if (!sourceData) return;
        
        const sources = [
            { key: 'web', tokens: this.elements.webTokens, status: this.elements.webStatus },
            { key: 'code', tokens: this.elements.codeTokens, status: this.elements.codeStatus },
            { key: 'manual', tokens: this.elements.manualTokens, status: this.elements.manualStatus }
        ];
        
        sources.forEach(source => {
            const data = sourceData[source.key];
            if (!data) return;
            
            if (source.tokens) {
                source.tokens.textContent = this.formatNumber(data.tokens);
            }
            
            if (source.status) {
                source.status.className = `source-status ${data.isActive ? 'online' : 'offline'}`;
            }
        });
    }
    
    /**
     * Update chart
     */
    updateChart(chartData) {
        if (window.chartManager && chartData) {
            window.chartManager.updateChart(chartData);
        }
    }
    
    /**
     * Handle chart toggle button clicks
     */
    handleChartToggle(clickedToggle) {
        // Update active state
        const allToggles = document.querySelectorAll('.chart-toggle');
        allToggles.forEach(toggle => toggle.classList.remove('active'));
        clickedToggle.classList.add('active');
        
        // Get chart type
        const chartType = clickedToggle.dataset.chart;
        
        // Update chart
        if (window.chartManager) {
            window.chartManager.switchChart(chartType);
        }
        
        // Add animation
        clickedToggle.classList.add('force-pulse');
        setTimeout(() => {
            clickedToggle.classList.remove('force-pulse');
        }, 1000);
    }
    
    /**
     * Handle card clicks
     */
    handleCardClick(card) {
        // Add click animation
        card.classList.add('force-bounce');
        setTimeout(() => {
            card.classList.remove('force-bounce');
        }, 600);
        
        // Future: Open detailed view
        console.log('[Dashboard] Card clicked:', card.className);
    }
    
    /**
     * Trigger manual refresh
     */
    triggerRefresh() {
        if (window.dataCollector) {
            // Add spin animation to refresh button
            const icon = this.elements.refreshButton.querySelector('.material-icons');
            if (icon) {
                icon.classList.add('force-spin');
                setTimeout(() => {
                    icon.classList.remove('force-spin');
                }, 1000);
            }
            
            // Trigger data update
            window.dataCollector.performUpdate();
        }
    }
    
    /**
     * Show manual data entry dialog
     */
    showManualEntryDialog() {
        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>Add Manual Usage Entry</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <form class="modal-body" id="manual-entry-form">
                    <div class="form-group">
                        <label for="entry-model">Model</label>
                        <select id="entry-model" required>
                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="entry-tokens">Tokens Used</label>
                        <input type="number" id="entry-tokens" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="entry-description">Description (Optional)</label>
                        <input type="text" id="entry-description" placeholder="What was this usage for?">
                    </div>
                    <div class="modal-actions">
                        <button type="button" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="primary">Add Entry</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#manual-entry-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const model = document.getElementById('entry-model').value;
            const tokens = parseInt(document.getElementById('entry-tokens').value);
            const description = document.getElementById('entry-description').value;
            
            try {
                if (window.dataCollector) {
                    await window.dataCollector.addManualEntry({
                        model,
                        tokens,
                        description
                    });
                    
                    modal.remove();
                    
                    if (window.authManager) {
                        window.authManager.showToast({
                            type: 'success',
                            message: 'Manual entry added successfully',
                            duration: 3000
                        });
                    }
                }
            } catch (error) {
                console.error('[Dashboard] Failed to add manual entry:', error);
                
                if (window.authManager) {
                    window.authManager.showToast({
                        type: 'error',
                        message: 'Failed to add manual entry',
                        duration: 3000
                    });
                }
            }
        });
        
        // Add modal animations
        modal.classList.add('force-fade-in-up');
        setTimeout(() => {
            modal.classList.remove('force-fade-in-up');
        }, 300);
    }
    
    /**
     * Export current data
     */
    async exportData(format = 'json') {
        try {
            if (window.dataCollector) {
                await window.dataCollector.exportData(format);
                
                if (window.authManager) {
                    window.authManager.showToast({
                        type: 'success',
                        message: `Data exported as ${format.toUpperCase()}`,
                        duration: 3000
                    });
                }
            }
        } catch (error) {
            console.error('[Dashboard] Export failed:', error);
            
            if (window.authManager) {
                window.authManager.showToast({
                    type: 'error',
                    message: 'Export failed',
                    duration: 3000
                });
            }
        }
    }
    
    /**
     * Get current dashboard state
     */
    getCurrentState() {
        return {
            user: this.currentUser,
            data: this.currentData,
            isInitialized: this.isInitialized
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.updateAnimationFrame) {
            cancelAnimationFrame(this.updateAnimationFrame);
        }
        
        // Remove event listeners
        const elements = Object.values(this.elements);
        elements.forEach(el => {
            if (el && el.removeEventListener) {
                el.removeEventListener('click', () => {});
            }
        });
    }
}

// Initialize Dashboard Manager
let dashboardManager;

document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
    window.dashboardManager = dashboardManager;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dashboardManager) {
        dashboardManager.cleanup();
    }
});