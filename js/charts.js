/**
 * Chart Manager
 * Handles Chart.js integration and data visualization
 */

class ChartManager {
    constructor() {
        this.isInitialized = false;
        this.chart = null;
        this.currentChartType = 'usage';
        this.chartData = null;
        this.canvas = null;
        
        this.init();
    }
    
    /**
     * Initialize chart manager
     */
    async init() {
        try {
            console.log('[Charts] Initializing chart manager...');
            
            // Wait for Chart.js to load
            await this.waitForChartJS();
            
            // Get canvas element with retry mechanism
            this.canvas = document.getElementById('usage-chart');
            if (!this.canvas) {
                console.log('[Charts] Chart canvas not found, retrying in 500ms...');
                setTimeout(() => {
                    this.init();
                }, 500);
                return;
            }
            
            // Initialize chart
            this.initializeChart();
            
            this.isInitialized = true;
            console.log('[Charts] Chart manager initialized');
            
        } catch (error) {
            console.error('[Charts] Failed to initialize:', error);
            // Don't fail completely - just mark as not initialized
            this.isInitialized = false;
        }
    }
    
    /**
     * Wait for Chart.js library to load
     */
    waitForChartJS() {
        return new Promise((resolve, reject) => {
            if (window.Chart) {
                resolve();
                return;
            }
            
            const checkInterval = setInterval(() => {
                if (window.Chart) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('Chart.js failed to load'));
            }, 10000);
        });
    }
    
    /**
     * Initialize Chart.js chart
     */
    initializeChart() {
        try {
            const ctx = this.canvas.getContext('2d');
            
            // Configure Chart.js defaults
            Chart.defaults.font.family = 'Inter, sans-serif';
            Chart.defaults.color = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim();
            
            // Create chart
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Tokens Used',
                        data: [],
                        borderColor: CHART_CONFIG.colors.primary,
                        backgroundColor: this.createGradient(ctx, CHART_CONFIG.colors.gradients.blue),
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: CHART_CONFIG.colors.primary,
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    ...CHART_CONFIG.defaultOptions,
                    plugins: {
                        ...CHART_CONFIG.defaultOptions.plugins,
                        title: {
                            display: false
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        ...CHART_CONFIG.defaultOptions.scales,
                        y: {
                            ...CHART_CONFIG.defaultOptions.scales.y,
                            beginAtZero: true,
                            ticks: {
                                ...CHART_CONFIG.defaultOptions.scales.y.ticks,
                                callback: (value) => this.formatYAxisLabel(value, this.currentChartType)
                            }
                        },
                        x: {
                            ...CHART_CONFIG.defaultOptions.scales.x,
                            ticks: {
                                ...CHART_CONFIG.defaultOptions.scales.x.ticks,
                                callback: (value, index, values) => {
                                    const label = this.chart.data.labels[index];
                                    if (!label) return '';
                                    
                                    // Show every 5th label on mobile, every 3rd on desktop
                                    const interval = window.innerWidth < 768 ? 5 : 3;
                                    return index % interval === 0 ? this.formatDateLabel(label) : '';
                                }
                            }
                        }
                    },
                    onHover: (event, elements) => {
                        this.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                    }
                }
            });
            
            console.log('[Charts] Chart initialized');
            
        } catch (error) {
            console.error('[Charts] Failed to initialize chart:', error);
            this.showChartError();
        }
    }
    
    /**
     * Create gradient for chart fill
     */
    createGradient(ctx, colors) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        return gradient;
    }
    
    /**
     * Update chart with new data
     */
    updateChart(chartData, animate = true) {
        if (!this.chart || !chartData) return;
        
        try {
            this.chartData = chartData;
            
            // Extract data based on current chart type
            const { labels, data } = this.extractChartData(chartData, this.currentChartType);
            
            // Update chart data
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = data;
            
            // Update dataset properties based on chart type
            this.updateDatasetProperties(this.currentChartType);
            
            // Update chart with animation
            this.chart.update(animate ? 'active' : 'none');
            
            console.log(`[Charts] Chart updated (${this.currentChartType})`);
            
        } catch (error) {
            console.error('[Charts] Failed to update chart:', error);
        }
    }
    
    /**
     * Switch chart type
     */
    switchChart(chartType) {
        if (chartType === this.currentChartType) return;
        
        this.currentChartType = chartType;
        
        if (this.chartData) {
            this.updateChart(this.chartData, true);
        }
        
        // Add loading animation
        this.showChartLoading();
        setTimeout(() => {
            this.hideChartLoading();
        }, 500);
    }
    
    /**
     * Extract chart data based on type
     */
    extractChartData(chartData, chartType) {
        const labels = chartData.map(item => item.date);
        let data;
        
        switch (chartType) {
            case 'cost':
                data = chartData.map(item => item.cost);
                break;
            case 'calls':
                data = chartData.map(item => item.calls);
                break;
            case 'usage':
            default:
                data = chartData.map(item => item.tokens);
                break;
        }
        
        return { labels, data };
    }
    
    /**
     * Update dataset properties based on chart type
     */
    updateDatasetProperties(chartType) {
        const dataset = this.chart.data.datasets[0];
        const ctx = this.canvas.getContext('2d');
        
        switch (chartType) {
            case 'cost':
                dataset.label = 'Cost ($)';
                dataset.borderColor = CHART_CONFIG.colors.secondary;
                dataset.pointBackgroundColor = CHART_CONFIG.colors.secondary;
                dataset.backgroundColor = this.createGradient(ctx, CHART_CONFIG.colors.gradients.green);
                break;
            
            case 'calls':
                dataset.label = 'API Calls';
                dataset.borderColor = CHART_CONFIG.colors.tertiary;
                dataset.pointBackgroundColor = CHART_CONFIG.colors.tertiary;
                dataset.backgroundColor = this.createGradient(ctx, CHART_CONFIG.colors.gradients.purple);
                break;
            
            case 'usage':
            default:
                dataset.label = 'Tokens Used';
                dataset.borderColor = CHART_CONFIG.colors.primary;
                dataset.pointBackgroundColor = CHART_CONFIG.colors.primary;
                dataset.backgroundColor = this.createGradient(ctx, CHART_CONFIG.colors.gradients.blue);
                break;
        }
    }
    
    /**
     * Format Y-axis labels based on chart type
     */
    formatYAxisLabel(value, chartType) {
        switch (chartType) {
            case 'cost':
                return '$' + value.toFixed(2);
            case 'calls':
                return Math.round(value).toString();
            case 'usage':
            default:
                return this.formatNumber(Math.round(value));
        }
    }
    
    /**
     * Format date labels for X-axis
     */
    formatDateLabel(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }
    
    /**
     * Format number with appropriate units
     */
    formatNumber(number) {
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        } else {
            return number.toString();
        }
    }
    
    /**
     * Show chart loading state
     */
    showChartLoading() {
        const loadingElement = document.getElementById('chart-loading');
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
            loadingElement.classList.add('chart-loading');
        }
        
        if (this.canvas) {
            this.canvas.style.opacity = '0.3';
        }
    }
    
    /**
     * Hide chart loading state
     */
    hideChartLoading() {
        const loadingElement = document.getElementById('chart-loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
            loadingElement.classList.remove('chart-loading');
        }
        
        if (this.canvas) {
            this.canvas.style.opacity = '1';
        }
    }
    
    /**
     * Show chart error state
     */
    showChartError() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const errorElement = document.createElement('div');
        errorElement.className = 'chart-error';
        errorElement.innerHTML = `
            <div class="error-content">
                <span class="material-icons">error_outline</span>
                <p>Failed to load chart</p>
                <button onclick="window.chartManager.retryChart()" class="retry-button">
                    <span class="material-icons">refresh</span>
                    Retry
                </button>
            </div>
        `;
        
        container.appendChild(errorElement);
        this.canvas.style.display = 'none';
    }
    
    /**
     * Retry chart initialization
     */
    retryChart() {
        const errorElement = document.querySelector('.chart-error');
        if (errorElement) {
            errorElement.remove();
        }
        
        if (this.canvas) {
            this.canvas.style.display = 'block';
        }
        
        this.init();
    }
    
    /**
     * Resize chart (called on window resize)
     */
    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }
    
    /**
     * Update chart theme
     */
    updateTheme() {
        if (!this.chart) return;
        
        try {
            // Update chart colors based on current theme
            const textColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim();
            
            // Update global defaults
            Chart.defaults.color = textColor;
            
            // Update chart options
            this.chart.options.scales.x.ticks.color = textColor;
            this.chart.options.scales.y.ticks.color = textColor;
            this.chart.options.scales.x.grid.color = getComputedStyle(document.documentElement)
                .getPropertyValue('--border-secondary').trim();
            this.chart.options.scales.y.grid.color = getComputedStyle(document.documentElement)
                .getPropertyValue('--border-secondary').trim();
            
            // Update tooltip colors
            this.chart.options.plugins.tooltip.backgroundColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--surface-primary').trim();
            this.chart.options.plugins.tooltip.titleColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-primary').trim();
            this.chart.options.plugins.tooltip.bodyColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim();
            this.chart.options.plugins.tooltip.borderColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--border-primary').trim();
            
            // Update chart
            this.chart.update('none');
            
            console.log('[Charts] Theme updated');
            
        } catch (error) {
            console.error('[Charts] Failed to update theme:', error);
        }
    }
    
    /**
     * Export chart as image
     */
    exportChart(format = 'png') {
        if (!this.chart) return;
        
        try {
            const url = this.chart.toBase64Image(format, 1.0);
            
            const link = document.createElement('a');
            link.download = `claude-usage-chart-${new Date().toISOString().split('T')[0]}.${format}`;
            link.href = url;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('[Charts] Chart exported as', format);
            
        } catch (error) {
            console.error('[Charts] Chart export failed:', error);
        }
    }
    
    /**
     * Get chart statistics
     */
    getChartStats() {
        if (!this.chartData) return null;
        
        const data = this.chartData.map(item => {
            switch (this.currentChartType) {
                case 'cost': return item.cost;
                case 'calls': return item.calls;
                default: return item.tokens;
            }
        });
        
        return {
            total: data.reduce((sum, value) => sum + value, 0),
            average: data.reduce((sum, value) => sum + value, 0) / data.length,
            max: Math.max(...data),
            min: Math.min(...data),
            trend: this.calculateTrend(data)
        };
    }
    
    /**
     * Calculate trend direction
     */
    calculateTrend(data) {
        if (data.length < 2) return 'neutral';
        
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        const difference = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (difference > 5) return 'increasing';
        if (difference < -5) return 'decreasing';
        return 'stable';
    }
    
    /**
     * Destroy chart
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        this.destroy();
        this.chartData = null;
        this.canvas = null;
    }
}

// Initialize Chart Manager
let chartManager;

document.addEventListener('DOMContentLoaded', () => {
    chartManager = new ChartManager();
    window.chartManager = chartManager;
});

// Handle window resize
window.addEventListener('resize', () => {
    if (chartManager) {
        chartManager.resize();
    }
});

// Handle theme changes
document.addEventListener('theme-changed', () => {
    if (chartManager) {
        chartManager.updateTheme();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (chartManager) {
        chartManager.cleanup();
    }
});