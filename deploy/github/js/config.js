/**
 * Configuration and Constants
 * Claude Usage Monitor PWA
 */

// App Configuration
const APP_CONFIG = {
    name: 'Claude Usage Monitor',
    version: '2.0.0',
    environment: 'production', // 'development' or 'production'
    debug: false,
    
    // Update intervals (milliseconds)
    updateInterval: 3000, // 3 seconds for real-time updates
    tokenRefreshInterval: 300000, // 5 minutes
    backgroundSyncInterval: 60000, // 1 minute
    
    // Animation settings
    animationDuration: 300,
    chartAnimationDuration: 750,
    updateAnimationDuration: 200,
    
    // Samsung S23 Ultra optimizations
    isS23Ultra: window.screen.width === 412 && window.screen.height === 915,
    supports120Hz: window.screen.width === 412 && window.screen.height === 915,
    
    // Storage keys
    storageKeys: {
        authToken: 'claude_auth_token',
        userProfile: 'claude_user_profile',
        usageData: 'claude_usage_data',
        preferences: 'claude_preferences',
        theme: 'claude_theme',
        lastSync: 'claude_last_sync',
        encryptionKey: 'claude_encryption_key'
    }
};

// Google OAuth Configuration
const GOOGLE_CONFIG = {
    clientId: '434040424762-qteijknkc7qa069puf75onnn8qm38cnm.apps.googleusercontent.com', // Your Google Client ID
    scope: 'openid email profile',
    
    // Google Sign-In button configuration
    buttonConfig: {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
    },
    
    // Redirect URIs for development and production
    redirectUris: {
        development: ['http://localhost:8080', 'http://127.0.0.1:8080'],
        production: ['https://your-app-domain.com'] // Replace with your actual domain
    }
};

// Claude API Configuration (for future direct API integration)
const CLAUDE_API_CONFIG = {
    baseUrl: 'https://api.anthropic.com',
    version: 'v1',
    models: {
        'claude-3-5-sonnet-20241022': {
            name: 'Claude 3.5 Sonnet',
            inputTokenPrice: 0.003, // per 1K tokens
            outputTokenPrice: 0.015, // per 1K tokens
            maxTokens: 200000,
            color: '#3498DB'
        },
        'claude-3-opus-20240229': {
            name: 'Claude 3 Opus',
            inputTokenPrice: 0.015, // per 1K tokens
            outputTokenPrice: 0.075, // per 1K tokens
            maxTokens: 200000,
            color: '#9B59B6'
        },
        'claude-3-haiku-20240307': {
            name: 'Claude 3 Haiku',
            inputTokenPrice: 0.00025, // per 1K tokens
            outputTokenPrice: 0.00125, // per 1K tokens
            maxTokens: 200000,
            color: '#27AE60'
        }
    }
};

// Data Sources Configuration
const DATA_SOURCES = {
    web: {
        name: 'Web Chat',
        icon: 'web',
        active: true,
        endpoint: null, // No direct API access
        mockData: true
    },
    code: {
        name: 'Claude Code',
        icon: 'terminal',
        active: false, // Will be detected automatically
        endpoint: null,
        mockData: true
    },
    manual: {
        name: 'Manual Entry',
        icon: 'edit',
        active: true,
        endpoint: null,
        mockData: false
    }
};

// Theme Configuration
const THEME_CONFIG = {
    default: 'auto', // 'light', 'dark', or 'auto'
    storageKey: APP_CONFIG.storageKeys.theme,
    
    // CSS custom properties for each theme
    themes: {
        light: {
            'bg-primary': '#FFFFFF',
            'bg-secondary': '#F8F9FA',
            'surface-primary': '#FFFFFF',
            'surface-secondary': '#F1F3F4',
            'surface-tertiary': '#E8EAED',
            'text-primary': '#212529',
            'text-secondary': '#6C757D',
            'text-tertiary': '#ADB5BD',
            'primary-color': '#3498DB',
            'primary-color-hover': '#2980B9',
            'primary-color-alpha': 'rgba(52, 152, 219, 0.1)',
            'secondary-color': '#27AE60',
            'accent-color': '#E74C3C',
            'success-color': '#27AE60',
            'warning-color': '#F39C12',
            'error-color': '#E74C3C',
            'error-color-alpha': 'rgba(231, 76, 60, 0.1)',
            'border-primary': '#DEE2E6',
            'border-secondary': '#E9ECEF',
            'shadow-small': '0 1px 3px rgba(0, 0, 0, 0.1)',
            'shadow-medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
            'shadow-large': '0 10px 25px rgba(0, 0, 0, 0.15)'
        },
        dark: {
            'bg-primary': '#1A1A1A',
            'bg-secondary': '#2D2D30',
            'surface-primary': '#2A2A2E',
            'surface-secondary': '#3C3C41',
            'surface-tertiary': '#4A4A4F',
            'text-primary': '#FFFFFF',
            'text-secondary': '#B0B0B0',
            'text-tertiary': '#808080',
            'primary-color': '#5DADE2',
            'primary-color-hover': '#3498DB',
            'primary-color-alpha': 'rgba(93, 173, 226, 0.15)',
            'secondary-color': '#52C41A',
            'accent-color': '#FF6B6B',
            'success-color': '#52C41A',
            'warning-color': '#FADB14',
            'error-color': '#FF4D4F',
            'error-color-alpha': 'rgba(255, 77, 79, 0.15)',
            'border-primary': '#404040',
            'border-secondary': '#525252',
            'shadow-small': '0 1px 3px rgba(0, 0, 0, 0.3)',
            'shadow-medium': '0 4px 6px rgba(0, 0, 0, 0.3)',
            'shadow-large': '0 10px 25px rgba(0, 0, 0, 0.4)'
        }
    }
};

// Chart Configuration
const CHART_CONFIG = {
    // Chart.js default options
    defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'var(--surface-primary)',
                titleColor: 'var(--text-primary)',
                bodyColor: 'var(--text-secondary)',
                borderColor: 'var(--border-primary)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                titleFont: {
                    family: 'Inter',
                    weight: '600'
                },
                bodyFont: {
                    family: 'Inter'
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'var(--text-secondary)',
                    font: {
                        family: 'Inter',
                        size: 11
                    }
                }
            },
            y: {
                grid: {
                    color: 'var(--border-secondary)',
                    borderWidth: 0.5
                },
                ticks: {
                    color: 'var(--text-secondary)',
                    font: {
                        family: 'Inter',
                        size: 11
                    }
                }
            }
        },
        animation: {
            duration: APP_CONFIG.chartAnimationDuration,
            easing: 'easeOutCubic'
        }
    },
    
    // Color schemes for different chart types
    colors: {
        primary: '#3498DB',
        secondary: '#27AE60',
        tertiary: '#9B59B6',
        quaternary: '#E67E22',
        success: '#27AE60',
        warning: '#F39C12',
        error: '#E74C3C',
        gradients: {
            blue: ['rgba(52, 152, 219, 0.8)', 'rgba(52, 152, 219, 0.1)'],
            green: ['rgba(39, 174, 96, 0.8)', 'rgba(39, 174, 96, 0.1)'],
            purple: ['rgba(155, 89, 182, 0.8)', 'rgba(155, 89, 182, 0.1)'],
            orange: ['rgba(230, 126, 34, 0.8)', 'rgba(230, 126, 34, 0.1)']
        }
    }
};

// Security Configuration
const SECURITY_CONFIG = {
    // AES-GCM encryption settings
    encryption: {
        algorithm: 'AES-GCM',
        keyLength: 256,
        ivLength: 12,
        tagLength: 16
    },
    
    // Content Security Policy
    csp: {
        'default-src': "'self'",
        'script-src': "'self' https://accounts.google.com https://apis.google.com 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'img-src': "'self' https://*.googleusercontent.com https://lh3.googleusercontent.com data:",
        'connect-src': "'self' https://accounts.google.com https://apis.google.com",
        'font-src': "'self' https://fonts.gstatic.com"
    },
    
    // Token validation settings
    tokenValidation: {
        minLength: 10,
        maxAge: 3600000, // 1 hour in milliseconds
        refreshThreshold: 300000 // 5 minutes before expiry
    }
};

// Mock Data Configuration (for testing without API access)
const MOCK_DATA_CONFIG = {
    enabled: true, // Set to false when real APIs are available
    
    // Simulated usage data
    baseUsage: {
        totalTokens: 147832,
        totalCost: 4.23,
        apiCalls: 342,
        efficiency: 432, // tokens per call
        
        // Monthly growth
        tokenGrowth: 23.5,
        costGrowth: 18.7,
        callsGrowth: 31.2,
        
        // Model breakdown (percentages)
        modelUsage: {
            'claude-3-5-sonnet-20241022': 65,
            'claude-3-opus-20240229': 25,
            'claude-3-haiku-20240307': 10
        },
        
        // Source breakdown
        sourceUsage: {
            web: 98432,
            code: 34821,
            manual: 14579
        }
    },
    
    // Simulated chart data (last 30 days)
    generateChartData: (days = 30) => {
        const data = [];
        const baseValue = 1000;
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Simulate realistic usage patterns
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const weekendMultiplier = isWeekend ? 0.3 : 1;
            
            // Add some randomness
            const randomMultiplier = 0.8 + Math.random() * 0.4;
            const value = Math.floor(baseValue * weekendMultiplier * randomMultiplier);
            
            data.push({
                date: date.toISOString().split('T')[0],
                tokens: value,
                cost: value * 0.003, // $0.003 per token average
                calls: Math.floor(value / 432) // average tokens per call
            });
        }
        
        return data;
    }
};

// Utility functions
const CONFIG_UTILS = {
    // Get current environment
    getEnvironment: () => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            return hostname === 'localhost' || hostname === '127.0.0.1' 
                ? 'development' 
                : 'production';
        }
        return APP_CONFIG.environment;
    },
    
    // Check if running on Samsung S23 Ultra
    isS23Ultra: () => {
        return window.screen.width === 412 && window.screen.height === 915;
    },
    
    // Get appropriate update interval based on device
    getUpdateInterval: () => {
        // Faster updates for high refresh rate displays
        if (CONFIG_UTILS.isS23Ultra()) {
            return Math.floor(APP_CONFIG.updateInterval * 0.8); // 20% faster
        }
        return APP_CONFIG.updateInterval;
    },
    
    // Get animation duration based on device capabilities
    getAnimationDuration: () => {
        if (CONFIG_UTILS.isS23Ultra()) {
            return Math.floor(APP_CONFIG.animationDuration * 0.5); // 50% faster for 120Hz
        }
        return APP_CONFIG.animationDuration;
    },
    
    // Deep merge configuration objects
    mergeConfig: (defaultConfig, userConfig) => {
        const result = { ...defaultConfig };
        
        for (const key in userConfig) {
            if (userConfig.hasOwnProperty(key)) {
                if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
                    result[key] = CONFIG_UTILS.mergeConfig(result[key] || {}, userConfig[key]);
                } else {
                    result[key] = userConfig[key];
                }
            }
        }
        
        return result;
    },
    
    // Validate configuration
    validateConfig: () => {
        const errors = [];
        
        // Validate Google OAuth config
        if (!GOOGLE_CONFIG.clientId || GOOGLE_CONFIG.clientId.includes('your-client-id')) {
            errors.push('Google OAuth Client ID not configured');
        }
        
        // Validate required API endpoints
        if (APP_CONFIG.environment === 'production' && !GOOGLE_CONFIG.redirectUris.production[0].includes('your-app-domain')) {
            errors.push('Production redirect URI not configured');
        }
        
        return errors;
    }
};

// Export configuration (for ES6 modules compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_CONFIG,
        GOOGLE_CONFIG,
        CLAUDE_API_CONFIG,
        DATA_SOURCES,
        THEME_CONFIG,
        CHART_CONFIG,
        SECURITY_CONFIG,
        MOCK_DATA_CONFIG,
        CONFIG_UTILS
    };
}

// Initialize configuration validation on load
document.addEventListener('DOMContentLoaded', () => {
    if (APP_CONFIG.debug) {
        const configErrors = CONFIG_UTILS.validateConfig();
        if (configErrors.length > 0) {
            console.warn('Configuration Issues:', configErrors);
        }
        
        console.log('App Configuration Loaded:', {
            version: APP_CONFIG.version,
            environment: CONFIG_UTILS.getEnvironment(),
            isS23Ultra: CONFIG_UTILS.isS23Ultra(),
            updateInterval: CONFIG_UTILS.getUpdateInterval(),
            animationDuration: CONFIG_UTILS.getAnimationDuration()
        });
    }
});