/**
 * Test Data and Mock API Responses for Claude Usage Monitor
 * Provides realistic test data for development and testing
 */

window.TestData = {
    // Test credentials
    testCredentials: {
        valid: {
            email: 'test@example.com',
            apiKey: 'sk-ant-test123456789abcdefghijklmnop',
            rememberMe: true
        },
        invalid: {
            email: 'invalid@example.com',  
            apiKey: 'invalid-key-format',
            rememberMe: false
        }
    },

    // Mock usage data scenarios
    usageScenarios: {
        low: {
            totalTokens: 245000,
            apiCalls: 490,
            opusCost: 4.90,
            sonnetCost: 2.45,
            haikuCost: 0.12,
            totalCost: 7.47,
            webTokens: 171500,
            terminalTokens: 73500,
            usageLimit: 5000000,
            dailyUsage: [
                { date: '2024-08-24', tokens: 30000, apiCalls: 60, cost: 1.05 },
                { date: '2024-08-25', tokens: 35000, apiCalls: 70, cost: 1.23 },
                { date: '2024-08-26', tokens: 40000, apiCalls: 80, cost: 1.40 },
                { date: '2024-08-27', tokens: 42000, apiCalls: 84, cost: 1.47 },
                { date: '2024-08-28', tokens: 38000, apiCalls: 76, cost: 1.33 },
                { date: '2024-08-29', tokens: 32000, apiCalls: 64, cost: 1.12 },
                { date: '2024-08-30', tokens: 28000, apiCalls: 56, cost: 0.98 }
            ]
        },
        medium: {
            totalTokens: 1250000,
            apiCalls: 2500,
            opusCost: 25.00,
            sonnetCost: 12.50,
            haikuCost: 0.63,
            totalCost: 38.13,
            webTokens: 875000,
            terminalTokens: 375000,
            usageLimit: 5000000,
            dailyUsage: [
                { date: '2024-08-24', tokens: 150000, apiCalls: 300, cost: 5.25 },
                { date: '2024-08-25', tokens: 180000, apiCalls: 360, cost: 6.30 },
                { date: '2024-08-26', tokens: 200000, apiCalls: 400, cost: 7.00 },
                { date: '2024-08-27', tokens: 210000, apiCalls: 420, cost: 7.35 },
                { date: '2024-08-28', tokens: 190000, apiCalls: 380, cost: 6.65 },
                { date: '2024-08-29', tokens: 160000, apiCalls: 320, cost: 5.60 },
                { date: '2024-08-30', tokens: 160000, apiCalls: 320, cost: 5.60 }
            ]
        },
        high: {
            totalTokens: 4200000,
            apiCalls: 8400,
            opusCost: 84.00,
            sonnetCost: 42.00,
            haikuCost: 2.10,
            totalCost: 128.10,
            webTokens: 2940000,
            terminalTokens: 1260000,
            usageLimit: 5000000,
            dailyUsage: [
                { date: '2024-08-24', tokens: 500000, apiCalls: 1000, cost: 17.50 },
                { date: '2024-08-25', tokens: 620000, apiCalls: 1240, cost: 21.70 },
                { date: '2024-08-26', tokens: 700000, apiCalls: 1400, cost: 24.50 },
                { date: '2024-08-27', tokens: 680000, apiCalls: 1360, cost: 23.80 },
                { date: '2024-08-28', tokens: 650000, apiCalls: 1300, cost: 22.75 },
                { date: '2024-08-29', tokens: 580000, apiCalls: 1160, cost: 20.30 },
                { date: '2024-08-30', tokens: 470000, apiCalls: 940, cost: 16.45 }
            ]
        },
        critical: {
            totalTokens: 4900000,
            apiCalls: 9800,
            opusCost: 98.00,
            sonnetCost: 49.00,
            haikuCost: 2.45,
            totalCost: 149.45,
            webTokens: 3430000,
            terminalTokens: 1470000,
            usageLimit: 5000000,
            dailyUsage: [
                { date: '2024-08-24', tokens: 600000, apiCalls: 1200, cost: 21.00 },
                { date: '2024-08-25', tokens: 720000, apiCalls: 1440, cost: 25.20 },
                { date: '2024-08-26', tokens: 800000, apiCalls: 1600, cost: 28.00 },
                { date: '2024-08-27', tokens: 750000, apiCalls: 1500, cost: 26.25 },
                { date: '2024-08-28', tokens: 700000, apiCalls: 1400, cost: 24.50 },
                { date: '2024-08-29', tokens: 650000, apiCalls: 1300, cost: 22.75 },
                { date: '2024-08-30', tokens: 680000, apiCalls: 1360, cost: 23.80 }
            ]
        }
    },

    // Animation test data
    animationTests: {
        quickUpdate: {
            interval: 1000, // 1 second for testing
            duration: 10000 // 10 seconds total
        },
        normalUpdate: {
            interval: 3000, // 3 seconds (production)
            duration: 30000 // 30 seconds
        }
    },

    // Theme test scenarios
    themeTests: [
        { name: 'Auto', value: 'auto', icon: 'brightness_auto' },
        { name: 'Light', value: 'light', icon: 'light_mode' },
        { name: 'Dark', value: 'dark', icon: 'dark_mode' }
    ],

    // Error scenarios for testing
    errorScenarios: {
        networkError: {
            type: 'network',
            message: 'Network connection failed',
            shouldRetry: true
        },
        invalidApi: {
            type: 'auth',
            message: 'Invalid API key',
            shouldRetry: false
        },
        rateLimited: {
            type: 'rate_limit',
            message: 'Rate limit exceeded',
            shouldRetry: true
        },
        serverError: {
            type: 'server',
            message: 'Internal server error',
            shouldRetry: true
        }
    },

    // Performance test data
    performanceMetrics: {
        targetFrameRate: 60,
        maxLoadTime: 3000, // 3 seconds
        maxTransitionTime: 300, // 300ms
        maxThemeSwitch: 200 // 200ms
    },

    // Generate dynamic test data
    generateDynamicData() {
        const now = new Date();
        const randomTokens = Math.floor(Math.random() * 100000) + 50000;
        
        return {
            totalTokens: randomTokens,
            apiCalls: Math.floor(randomTokens / 500),
            opusCost: randomTokens * 0.00002,
            sonnetCost: randomTokens * 0.00001,
            haikuCost: randomTokens * 0.000005,
            totalCost: randomTokens * 0.000035,
            webTokens: Math.floor(randomTokens * 0.7),
            terminalTokens: Math.floor(randomTokens * 0.3),
            usageLimit: 5000000,
            lastUpdated: now.toISOString(),
            dailyUsage: this.generateDailyUsage()
        };
    },

    generateDailyUsage() {
        const usage = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const tokens = Math.floor(Math.random() * 200000) + 20000;
            usage.push({
                date: date.toISOString().split('T')[0],
                tokens: tokens,
                apiCalls: Math.floor(tokens / 500),
                cost: tokens * 0.000035
            });
        }
        
        return usage;
    },

    // Mock API responses
    mockApiResponses: {
        validateSuccess: {
            valid: true,
            message: 'API key is valid',
            user: 'test@example.com'
        },
        validateFail: {
            valid: false,
            message: 'Invalid API key format',
            error: 'INVALID_KEY'
        },
        usageSuccess(scenario = 'medium') {
            const data = this.usageScenarios[scenario] || this.usageScenarios.medium;
            return {
                success: true,
                data: {
                    ...data,
                    lastUpdated: new Date().toISOString()
                }
            };
        },
        usageError: {
            success: false,
            error: 'Failed to fetch usage data',
            code: 'FETCH_ERROR'
        }
    }
};

// Enhanced API Service for testing
window.TestApiService = {
    currentScenario: 'medium',
    errorMode: false,
    
    // Override API methods for testing
    setScenario(scenario) {
        this.currentScenario = scenario;
        console.log(`🧪 Test API: Set scenario to "${scenario}"`);
    },
    
    enableErrorMode(enabled = true) {
        this.errorMode = enabled;
        console.log(`🧪 Test API: Error mode ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    async validateApiKey(apiKey) {
        console.log('🧪 Test API: Validating key:', apiKey.substring(0, 10) + '...');
        
        if (this.errorMode) {
            throw new Error('Network error');
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return apiKey.startsWith('sk-ant-');
    },
    
    async fetchUsageData() {
        console.log(`🧪 Test API: Fetching data (scenario: ${this.currentScenario})`);
        
        if (this.errorMode) {
            throw new Error('Failed to fetch usage data');
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const data = window.TestData.usageScenarios[this.currentScenario];
        return {
            ...data,
            lastUpdated: new Date().toISOString()
        };
    }
};

console.log('🧪 Test data loaded! Available scenarios:', Object.keys(window.TestData.usageScenarios));