/**
 * API Service for Anthropic Integration
 * Handles API calls and data processing
 */

class ApiService {
    constructor() {
        this.baseUrl = 'https://api.anthropic.com/v1';
        this.headers = {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        };
        
        // Pricing per million tokens (as of 2024)
        this.pricing = {
            opus: { input: 15.00, output: 75.00 },
            sonnet: { input: 3.00, output: 15.00 },
            haiku: { input: 0.25, output: 1.25 }
        };
    }

    /**
     * Set API key for requests
     */
    setApiKey(apiKey) {
        this.headers['x-api-key'] = apiKey;
    }

    /**
     * Validate API key by making a minimal request
     */
    async validateApiKey(apiKey) {
        try {
            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1
                })
            });

            // 200 = valid, 401 = invalid key, 429 = rate limit (but valid)
            return response.status === 200 || response.status === 429;
        } catch (error) {
            console.error('API validation error:', error);
            return false;
        }
    }

    /**
     * Fetch usage data (simulated - Anthropic doesn't have direct usage API)
     */
    async fetchUsageData() {
        try {
            // In production, this would connect to your backend that tracks usage
            // For demo, we'll generate realistic mock data
            const data = this.generateMockUsageData();
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Save to cache
            window.StorageManager.saveUsageData(data);
            
            return data;
        } catch (error) {
            console.error('Failed to fetch usage data:', error);
            
            // Try to return cached data
            const cached = window.StorageManager.getUsageData();
            if (cached) {
                return cached;
            }
            
            throw error;
        }
    }

    /**
     * Generate mock usage data for demonstration
     */
    generateMockUsageData() {
        const now = new Date();
        const dailyUsage = [];
        
        // Generate last 30 days of usage
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Realistic token usage patterns
            const baseTokens = 50000 + Math.random() * 100000;
            const dayOfWeek = date.getDay();
            const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.2;
            const tokens = Math.floor(baseTokens * weekendMultiplier);
            
            dailyUsage.push({
                date: date.toISOString().split('T')[0],
                tokens: tokens,
                apiCalls: Math.floor(tokens / 500),
                cost: this.calculateCost(tokens)
            });
        }
        
        // Calculate totals
        const totalTokens = dailyUsage.reduce((sum, day) => sum + day.tokens, 0);
        const totalApiCalls = dailyUsage.reduce((sum, day) => sum + day.apiCalls, 0);
        
        // Distribute between models (30% Opus, 60% Sonnet, 10% Haiku)
        const opusTokens = Math.floor(totalTokens * 0.3);
        const sonnetTokens = Math.floor(totalTokens * 0.6);
        const haikuTokens = totalTokens - opusTokens - sonnetTokens;
        
        // Calculate costs
        const opusCost = this.calculateModelCost(opusTokens, 'opus');
        const sonnetCost = this.calculateModelCost(sonnetTokens, 'sonnet');
        const haikuCost = this.calculateModelCost(haikuTokens, 'haiku');
        
        // Simulate web vs terminal usage
        const webTokens = Math.floor(totalTokens * 0.65);
        const terminalTokens = totalTokens - webTokens;
        
        return {
            totalTokens,
            apiCalls: totalApiCalls,
            opusCost,
            sonnetCost,
            haikuCost,
            totalCost: opusCost + sonnetCost + haikuCost,
            webTokens,
            terminalTokens,
            dailyUsage: dailyUsage.slice(-7), // Last 7 days for chart
            usageLimit: 5000000, // 5M tokens monthly limit
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Calculate cost for token usage
     */
    calculateCost(tokens) {
        // Average cost assuming 60% Sonnet, 30% Opus, 10% Haiku
        const avgCostPerMillion = (
            0.6 * ((this.pricing.sonnet.input + this.pricing.sonnet.output) / 2) +
            0.3 * ((this.pricing.opus.input + this.pricing.opus.output) / 2) +
            0.1 * ((this.pricing.haiku.input + this.pricing.haiku.output) / 2)
        );
        return (tokens / 1000000) * avgCostPerMillion;
    }

    /**
     * Calculate cost for specific model
     */
    calculateModelCost(tokens, model) {
        const modelPricing = this.pricing[model];
        if (!modelPricing) return 0;
        
        // Assume 30% input, 70% output for typical usage
        const inputTokens = tokens * 0.3;
        const outputTokens = tokens * 0.7;
        
        return (inputTokens / 1000000) * modelPricing.input + 
               (outputTokens / 1000000) * modelPricing.output;
    }

    /**
     * Parse local Claude Code logs (simulated)
     */
    async parseLocalLogs() {
        try {
            // In a real implementation, this would use File System Access API
            // For PWA, we simulate terminal usage data
            const terminalUsage = {
                sessions: Math.floor(Math.random() * 50) + 10,
                totalTokens: Math.floor(Math.random() * 500000) + 100000,
                lastSession: new Date(Date.now() - Math.random() * 86400000).toISOString()
            };
            
            return terminalUsage;
        } catch (error) {
            console.error('Failed to parse local logs:', error);
            return {
                sessions: 0,
                totalTokens: 0,
                lastSession: null
            };
        }
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }
}

// Export for use in other modules
window.ApiService = new ApiService();