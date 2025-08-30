/**
 * Data Collection System
 * Handles usage data collection, processing, and aggregation
 */

class DataCollector {
    constructor() {
        this.isInitialized = false;
        this.updateInterval = null;
        this.currentUser = null;
        this.lastUpdateTime = 0;
        this.isUpdating = false;
        
        // Data sources
        this.dataSources = new Map();
        
        // Mock data for demo purposes
        this.mockData = {
            baseUsage: MOCK_DATA_CONFIG.baseUsage,
            chartData: MOCK_DATA_CONFIG.generateChartData(30),
            realtimeMultiplier: 1
        };
        
        this.init();
    }
    
    /**
     * Initialize data collector
     */
    async init() {
        try {
            console.log('[DataCollector] Initializing data collector...');
            
            // Initialize data sources
            this.initializeDataSources();
            
            // Load cached data
            await this.loadCachedData();
            
            this.isInitialized = true;
            console.log('[DataCollector] Data collector initialized');
            
            // Dispatch ready event
            this.dispatchEvent('data-collector-ready');
            
        } catch (error) {
            console.error('[DataCollector] Failed to initialize:', error);
        }
    }
    
    /**
     * Initialize data sources
     */
    initializeDataSources() {
        // Web chat source
        this.dataSources.set('web', {
            name: 'Web Chat',
            icon: 'web',
            isActive: true,
            lastUpdate: 0,
            data: {
                tokens: 0,
                cost: 0,
                calls: 0
            }
        });
        
        // Claude Code source
        this.dataSources.set('code', {
            name: 'Claude Code',
            icon: 'terminal',
            isActive: false, // Will be detected
            lastUpdate: 0,
            data: {
                tokens: 0,
                cost: 0,
                calls: 0
            }
        });
        
        // Manual entry source
        this.dataSources.set('manual', {
            name: 'Manual Entry',
            icon: 'edit',
            isActive: true,
            lastUpdate: 0,
            data: {
                tokens: 0,
                cost: 0,
                calls: 0
            }
        });
    }
    
    /**
     * Load cached data
     */
    async loadCachedData() {
        try {
            if (window.storageManager) {
                // Load cached usage data
                const cachedData = await window.storageManager.getCacheData('usage_summary');
                if (cachedData) {
                    this.mockData.baseUsage = { ...this.mockData.baseUsage, ...cachedData };
                    console.log('[DataCollector] Cached data loaded');
                }
                
                // Load chart data
                const chartData = await window.storageManager.getCacheData('chart_data');
                if (chartData) {
                    this.mockData.chartData = chartData;
                }
            }
        } catch (error) {
            console.error('[DataCollector] Failed to load cached data:', error);
        }
    }
    
    /**
     * Start real-time updates
     */
    startUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        const interval = CONFIG_UTILS.getUpdateInterval();
        
        this.updateInterval = setInterval(() => {
            this.performUpdate();
        }, interval);
        
        // Initial update
        this.performUpdate();
        
        console.log(`[DataCollector] Started updates (${interval}ms interval)`);
    }
    
    /**
     * Stop real-time updates
     */
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('[DataCollector] Stopped updates');
        }
    }
    
    /**
     * Perform data update
     */
    async performUpdate() {
        if (this.isUpdating) {
            return; // Prevent concurrent updates
        }
        
        try {
            this.isUpdating = true;
            
            // Skip update if page is hidden (battery optimization)
            if (document.visibilityState === 'hidden') {
                return;
            }
            
            // Dispatch update start event
            this.dispatchEvent('data-update-start');
            
            // Simulate data collection from different sources
            await this.collectWebChatData();
            await this.collectClaudeCodeData();
            await this.collectManualData();
            
            // Aggregate and process data
            const aggregatedData = await this.aggregateData();
            
            // Cache the results
            await this.cacheData(aggregatedData);
            
            // Update last update time
            this.lastUpdateTime = Date.now();
            
            // Dispatch update complete event
            this.dispatchEvent('data-update-complete', { data: aggregatedData });
            
        } catch (error) {
            console.error('[DataCollector] Update failed:', error);
            this.dispatchEvent('data-update-error', { error: error.message });
        } finally {
            this.isUpdating = false;
        }
    }
    
    /**
     * Collect web chat data (simulated)
     */
    async collectWebChatData() {
        try {
            // In a real implementation, this would make API calls or parse browser data
            // For demo, we simulate realistic usage patterns
            
            const source = this.dataSources.get('web');
            const timeSinceLastUpdate = Date.now() - source.lastUpdate;
            
            // Simulate new usage every few seconds
            if (timeSinceLastUpdate > 10000 || source.lastUpdate === 0) {
                const increment = Math.floor(Math.random() * 500) + 100; // 100-600 tokens
                
                source.data.tokens += increment;
                source.data.cost += increment * 0.003; // $0.003 per token average
                source.data.calls += Math.random() > 0.7 ? 1 : 0; // ~30% chance of new call
                source.lastUpdate = Date.now();
                
                // Store individual usage record
                await this.storeUsageRecord({
                    source: 'web',
                    model: this.selectRandomModel(),
                    tokens: increment,
                    cost: increment * 0.003,
                    timestamp: Date.now(),
                    date: new Date().toISOString().split('T')[0]
                });
            }
            
        } catch (error) {
            console.error('[DataCollector] Web chat data collection failed:', error);
        }
    }
    
    /**
     * Collect Claude Code data (simulated)
     */
    async collectClaudeCodeData() {
        try {
            const source = this.dataSources.get('code');
            
            // Detect if Claude Code is being used (simulate detection)
            const isCodeActive = Math.random() > 0.8; // 20% chance of activity
            source.isActive = isCodeActive;
            
            if (isCodeActive) {
                const timeSinceLastUpdate = Date.now() - source.lastUpdate;
                
                if (timeSinceLastUpdate > 15000 || source.lastUpdate === 0) {
                    const increment = Math.floor(Math.random() * 1000) + 200; // 200-1200 tokens
                    
                    source.data.tokens += increment;
                    source.data.cost += increment * 0.003;
                    source.data.calls += 1;
                    source.lastUpdate = Date.now();
                    
                    await this.storeUsageRecord({
                        source: 'code',
                        model: this.selectRandomModel(),
                        tokens: increment,
                        cost: increment * 0.003,
                        timestamp: Date.now(),
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            }
            
        } catch (error) {
            console.error('[DataCollector] Claude Code data collection failed:', error);
        }
    }
    
    /**
     * Collect manual data
     */
    async collectManualData() {
        try {
            // Manual data is added through user interface
            // This method handles any pending manual entries
            
            if (window.storageManager) {
                const pendingEntries = await window.storageManager.getCacheData('pending_manual_entries');
                
                if (pendingEntries && pendingEntries.length > 0) {
                    const source = this.dataSources.get('manual');
                    
                    for (const entry of pendingEntries) {
                        source.data.tokens += entry.tokens;
                        source.data.cost += entry.cost;
                        source.data.calls += entry.calls || 1;
                        
                        await this.storeUsageRecord({
                            source: 'manual',
                            model: entry.model || 'claude-3-5-sonnet-20241022',
                            tokens: entry.tokens,
                            cost: entry.cost,
                            timestamp: entry.timestamp || Date.now(),
                            date: entry.date || new Date().toISOString().split('T')[0]
                        });
                    }
                    
                    // Clear pending entries
                    await window.storageManager.removeCacheData('pending_manual_entries');
                    source.lastUpdate = Date.now();
                }
            }
            
        } catch (error) {
            console.error('[DataCollector] Manual data collection failed:', error);
        }
    }
    
    /**
     * Store individual usage record
     */
    async storeUsageRecord(record) {
        try {
            if (window.storageManager) {
                await window.storageManager.storeUsageData(record);
            }
        } catch (error) {
            console.error('[DataCollector] Failed to store usage record:', error);
        }
    }
    
    /**
     * Select random model for simulation
     */
    selectRandomModel() {
        const models = Object.keys(CLAUDE_API_CONFIG.models);
        const weights = [0.65, 0.25, 0.10]; // Sonnet 65%, Opus 25%, Haiku 10%
        const random = Math.random();
        
        if (random < weights[0]) return models[0]; // Sonnet
        if (random < weights[0] + weights[1]) return models[1]; // Opus
        return models[2]; // Haiku
    }
    
    /**
     * Aggregate data from all sources
     */
    async aggregateData() {
        try {
            // Calculate totals from all sources
            let totalTokens = 0;
            let totalCost = 0;
            let totalCalls = 0;
            
            const sourceBreakdown = {};
            
            for (const [sourceId, source] of this.dataSources) {
                totalTokens += source.data.tokens;
                totalCost += source.data.cost;
                totalCalls += source.data.calls;
                
                sourceBreakdown[sourceId] = {
                    name: source.name,
                    tokens: source.data.tokens,
                    cost: source.data.cost,
                    calls: source.data.calls,
                    isActive: source.isActive
                };
            }
            
            // Calculate efficiency
            const efficiency = totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0;
            
            // Get model breakdown
            const modelBreakdown = await this.getModelBreakdown();
            
            // Get chart data
            const chartData = await this.getChartData();
            
            // Calculate growth percentages (simulated)
            const growth = this.calculateGrowth();
            
            return {
                totalTokens: Math.round(totalTokens),
                totalCost: Math.round(totalCost * 100) / 100,
                totalCalls,
                efficiency,
                growth,
                sourceBreakdown,
                modelBreakdown,
                chartData,
                lastUpdate: this.lastUpdateTime
            };
            
        } catch (error) {
            console.error('[DataCollector] Data aggregation failed:', error);
            return this.getDefaultData();
        }
    }
    
    /**
     * Get model usage breakdown
     */
    async getModelBreakdown() {
        try {
            if (window.storageManager) {
                const usageData = await window.storageManager.getUsageData();
                const modelStats = {};
                
                // Initialize model stats
                for (const modelId in CLAUDE_API_CONFIG.models) {
                    modelStats[modelId] = {
                        name: CLAUDE_API_CONFIG.models[modelId].name,
                        tokens: 0,
                        cost: 0,
                        calls: 0,
                        percentage: 0
                    };
                }
                
                // Aggregate by model
                let totalTokens = 0;
                usageData.forEach(record => {
                    if (record.model && modelStats[record.model]) {
                        modelStats[record.model].tokens += record.tokens || 0;
                        modelStats[record.model].cost += record.cost || 0;
                        modelStats[record.model].calls += 1;
                        totalTokens += record.tokens || 0;
                    }
                });
                
                // Calculate percentages
                for (const modelId in modelStats) {
                    if (totalTokens > 0) {
                        modelStats[modelId].percentage = 
                            Math.round((modelStats[modelId].tokens / totalTokens) * 100);
                    }
                }
                
                return modelStats;
            }
            
            // Fallback to mock data
            const totalTokens = this.mockData.baseUsage.totalTokens;
            return {
                'claude-3-5-sonnet-20241022': {
                    name: 'Claude 3.5 Sonnet',
                    tokens: Math.round(totalTokens * 0.65),
                    cost: Math.round(totalTokens * 0.65 * 0.003 * 100) / 100,
                    calls: Math.round(totalTokens * 0.65 / 432),
                    percentage: 65
                },
                'claude-3-opus-20240229': {
                    name: 'Claude 3 Opus',
                    tokens: Math.round(totalTokens * 0.25),
                    cost: Math.round(totalTokens * 0.25 * 0.015 * 100) / 100,
                    calls: Math.round(totalTokens * 0.25 / 432),
                    percentage: 25
                },
                'claude-3-haiku-20240307': {
                    name: 'Claude 3 Haiku',
                    tokens: Math.round(totalTokens * 0.10),
                    cost: Math.round(totalTokens * 0.10 * 0.00125 * 100) / 100,
                    calls: Math.round(totalTokens * 0.10 / 432),
                    percentage: 10
                }
            };
            
        } catch (error) {
            console.error('[DataCollector] Model breakdown calculation failed:', error);
            return {};
        }
    }
    
    /**
     * Get chart data for the last 30 days
     */
    async getChartData(days = 30) {
        try {
            if (window.storageManager) {
                const endDate = new Date();
                const startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - days);
                
                const usageData = await window.storageManager.getUsageData({
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                });
                
                // Group by date
                const dateGroups = {};
                usageData.forEach(record => {
                    const date = record.date;
                    if (!dateGroups[date]) {
                        dateGroups[date] = { tokens: 0, cost: 0, calls: 0 };
                    }
                    dateGroups[date].tokens += record.tokens || 0;
                    dateGroups[date].cost += record.cost || 0;
                    dateGroups[date].calls += 1;
                });
                
                // Fill missing dates
                const chartData = [];
                for (let i = days - 1; i >= 0; i--) {
                    const date = new Date(endDate);
                    date.setDate(endDate.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    chartData.push({
                        date: dateStr,
                        tokens: dateGroups[dateStr]?.tokens || 0,
                        cost: dateGroups[dateStr]?.cost || 0,
                        calls: dateGroups[dateStr]?.calls || 0
                    });
                }
                
                return chartData;
            }
            
            // Fallback to mock data
            return this.mockData.chartData;
            
        } catch (error) {
            console.error('[DataCollector] Chart data generation failed:', error);
            return this.mockData.chartData;
        }
    }
    
    /**
     * Calculate growth percentages
     */
    calculateGrowth() {
        // In a real implementation, this would compare with previous periods
        // For demo, we use simulated growth
        return {
            tokens: Math.round((Math.random() * 40 - 10) * 10) / 10, // -10% to +30%
            cost: Math.round((Math.random() * 35 - 8) * 10) / 10,
            calls: Math.round((Math.random() * 50 - 15) * 10) / 10,
            efficiency: Math.round((Math.random() * 20 - 10) * 10) / 10
        };
    }
    
    /**
     * Cache aggregated data
     */
    async cacheData(data) {
        try {
            if (window.storageManager) {
                // Cache summary data
                await window.storageManager.setCacheData('usage_summary', {
                    totalTokens: data.totalTokens,
                    totalCost: data.totalCost,
                    totalCalls: data.totalCalls,
                    efficiency: data.efficiency
                }, 300000); // 5 minutes TTL
                
                // Cache chart data
                await window.storageManager.setCacheData('chart_data', data.chartData, 600000); // 10 minutes TTL
                
                // Cache model breakdown
                await window.storageManager.setCacheData('model_breakdown', data.modelBreakdown, 300000);
            }
        } catch (error) {
            console.error('[DataCollector] Data caching failed:', error);
        }
    }
    
    /**
     * Add manual usage entry
     */
    async addManualEntry(entry) {
        try {
            // Validate entry
            if (!entry.tokens || !entry.model) {
                throw new Error('Invalid manual entry: tokens and model are required');
            }
            
            // Calculate cost if not provided
            if (!entry.cost && CLAUDE_API_CONFIG.models[entry.model]) {
                const model = CLAUDE_API_CONFIG.models[entry.model];
                entry.cost = (entry.tokens / 1000) * model.inputTokenPrice; // Simplified cost calculation
            }
            
            // Add to pending entries
            if (window.storageManager) {
                const pending = await window.storageManager.getCacheData('pending_manual_entries') || [];
                pending.push({
                    ...entry,
                    timestamp: Date.now(),
                    date: new Date().toISOString().split('T')[0]
                });
                
                await window.storageManager.setCacheData('pending_manual_entries', pending, 3600000); // 1 hour TTL
            }
            
            console.log('[DataCollector] Manual entry added:', entry);
            this.dispatchEvent('manual-entry-added', { entry });
            
            // Trigger immediate update
            setTimeout(() => this.performUpdate(), 100);
            
        } catch (error) {
            console.error('[DataCollector] Failed to add manual entry:', error);
            throw error;
        }
    }
    
    /**
     * Get default/fallback data
     */
    getDefaultData() {
        return {
            totalTokens: this.mockData.baseUsage.totalTokens,
            totalCost: this.mockData.baseUsage.totalCost,
            totalCalls: this.mockData.baseUsage.apiCalls,
            efficiency: this.mockData.baseUsage.efficiency,
            growth: {
                tokens: this.mockData.baseUsage.tokenGrowth,
                cost: this.mockData.baseUsage.costGrowth,
                calls: this.mockData.baseUsage.callsGrowth,
                efficiency: 0
            },
            sourceBreakdown: {
                web: { name: 'Web Chat', tokens: 98432, cost: 2.95, calls: 228, isActive: true },
                code: { name: 'Claude Code', tokens: 34821, cost: 1.04, calls: 81, isActive: false },
                manual: { name: 'Manual Entry', tokens: 14579, cost: 0.44, calls: 34, isActive: true }
            },
            modelBreakdown: {},
            chartData: this.mockData.chartData,
            lastUpdate: Date.now()
        };
    }
    
    /**
     * Export usage data
     */
    async exportData(format = 'json') {
        try {
            const data = await this.aggregateData();
            
            let exportedData;
            let filename;
            let mimeType;
            
            switch (format.toLowerCase()) {
                case 'csv':
                    exportedData = this.convertToCSV(data);
                    filename = `claude-usage-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                
                case 'json':
                default:
                    exportedData = JSON.stringify(data, null, 2);
                    filename = `claude-usage-${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
            }
            
            // Create download
            const blob = new Blob([exportedData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            console.log('[DataCollector] Data exported:', filename);
            this.dispatchEvent('data-exported', { format, filename });
            
        } catch (error) {
            console.error('[DataCollector] Data export failed:', error);
            throw error;
        }
    }
    
    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        const rows = [
            ['Date', 'Tokens', 'Cost', 'Calls']
        ];
        
        data.chartData.forEach(day => {
            rows.push([
                day.date,
                day.tokens,
                day.cost.toFixed(4),
                day.calls
            ]);
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }
    
    /**
     * Get current usage statistics
     */
    async getCurrentStats() {
        if (!this.isInitialized) {
            return this.getDefaultData();
        }
        
        return await this.aggregateData();
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
        this.stopUpdates();
        this.dataSources.clear();
    }
}

// Initialize Data Collector
let dataCollector;

document.addEventListener('DOMContentLoaded', () => {
    dataCollector = new DataCollector();
    window.dataCollector = dataCollector;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dataCollector) {
        dataCollector.cleanup();
    }
});