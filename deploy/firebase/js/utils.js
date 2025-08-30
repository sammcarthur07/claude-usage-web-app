/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

// DOM Utilities
const DOMUtils = {
    /**
     * Wait for element to exist in DOM
     */
    waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document, {
                childList: true,
                subtree: true
            });
            
            // Timeout fallback
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    },
    
    /**
     * Create element with attributes and content
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.appendChild(content);
            }
        }
        
        return element;
    },
    
    /**
     * Add CSS animation class temporarily
     */
    addTemporaryClass(element, className, duration = 1000) {
        if (!element) return;
        
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    },
    
    /**
     * Smooth scroll to element
     */
    scrollToElement(element, offset = 0) {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },
    
    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    /**
     * Get element's position relative to document
     */
    getElementPosition(element) {
        if (!element) return { top: 0, left: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    },
    
    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
};

// Data Utilities
const DataUtils = {
    /**
     * Format number with appropriate units
     */
    formatNumber(number, options = {}) {
        const {
            decimals = 0,
            useGrouping = true,
            units = false
        } = options;
        
        if (typeof number !== 'number' || isNaN(number)) {
            return '0';
        }
        
        if (units && number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        } else if (units && number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        }
        
        return number.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: useGrouping
        });
    },
    
    /**
     * Format currency amount
     */
    formatCurrency(amount, currency = 'USD') {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return '$0.00';
        }
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(amount);
    },
    
    /**
     * Format date in various formats
     */
    formatDate(date, format = 'short') {
        if (!date) return '';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }
        
        switch (format) {
            case 'short':
                return dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            
            case 'medium':
                return dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            
            case 'long':
                return dateObj.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            
            case 'time':
                return dateObj.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                });
            
            case 'datetime':
                return dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });
            
            case 'relative':
                return this.formatRelativeTime(dateObj);
            
            case 'iso':
                return dateObj.toISOString();
            
            default:
                return dateObj.toLocaleDateString();
        }
    },
    
    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) {
            return 'just now';
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
        } else if (diffDay < 7) {
            return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
        } else {
            return this.formatDate(date, 'medium');
        }
    },
    
    /**
     * Calculate percentage change
     */
    calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) {
            return newValue > 0 ? 100 : 0;
        }
        
        return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
    },
    
    /**
     * Generate random ID
     */
    generateId(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    },
    
    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = this.deepClone(obj[key]);
        });
        
        return cloned;
    },
    
    /**
     * Debounce function calls
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func(...args);
        };
    },
    
    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Sanitize HTML string
     */
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
};

// Storage Utilities
const StorageUtils = {
    /**
     * Check if localStorage is available
     */
    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },
    
    /**
     * Check if sessionStorage is available
     */
    isSessionStorageAvailable() {
        try {
            const test = '__session_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },
    
    /**
     * Get storage size estimate
     */
    getStorageSize(storage = localStorage) {
        let total = 0;
        
        try {
            for (const key in storage) {
                if (storage.hasOwnProperty(key)) {
                    total += storage[key].length + key.length;
                }
            }
        } catch (error) {
            console.warn('Failed to calculate storage size:', error);
        }
        
        return total;
    },
    
    /**
     * Safe JSON parse with fallback
     */
    safeJSONParse(str, fallback = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.warn('JSON parse failed:', error);
            return fallback;
        }
    },
    
    /**
     * Safe JSON stringify
     */
    safeJSONStringify(obj, fallback = '{}') {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            console.warn('JSON stringify failed:', error);
            return fallback;
        }
    }
};

// Device Utilities
const DeviceUtils = {
    /**
     * Detect device type
     */
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/tablet|ipad|playbook|silk/.test(userAgent)) {
            return 'tablet';
        }
        
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
            return 'mobile';
        }
        
        return 'desktop';
    },
    
    /**
     * Check if device is mobile
     */
    isMobile() {
        return this.getDeviceType() === 'mobile';
    },
    
    /**
     * Check if device is tablet
     */
    isTablet() {
        return this.getDeviceType() === 'tablet';
    },
    
    /**
     * Check if device is desktop
     */
    isDesktop() {
        return this.getDeviceType() === 'desktop';
    },
    
    /**
     * Check if device supports touch
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    
    /**
     * Get viewport dimensions
     */
    getViewport() {
        return {
            width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    },
    
    /**
     * Check if device is Samsung S23 Ultra
     */
    isS23Ultra() {
        const viewport = this.getViewport();
        return viewport.width === 412 && viewport.height === 915;
    },
    
    /**
     * Check if device supports high refresh rate
     */
    supportsHighRefreshRate() {
        // This is a heuristic check - actual refresh rate detection is limited in web browsers
        return this.isS23Ultra() || window.screen.width >= 1920;
    },
    
    /**
     * Get device pixel ratio
     */
    getPixelRatio() {
        return window.devicePixelRatio || 1;
    },
    
    /**
     * Check if device is in landscape orientation
     */
    isLandscape() {
        return window.innerWidth > window.innerHeight;
    },
    
    /**
     * Check if device is in portrait orientation
     */
    isPortrait() {
        return window.innerHeight > window.innerWidth;
    }
};

// Performance Utilities
const PerfUtils = {
    /**
     * Measure function execution time
     */
    measureTime(fn, name = 'Function') {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`${name} took ${(end - start).toFixed(2)} milliseconds`);
        return result;
    },
    
    /**
     * Request idle callback with fallback
     */
    requestIdleCallback(callback, options = {}) {
        if (window.requestIdleCallback) {
            return window.requestIdleCallback(callback, options);
        } else {
            // Fallback for browsers that don't support requestIdleCallback
            return setTimeout(() => {
                callback({
                    didTimeout: false,
                    timeRemaining: () => 50 // Assume 50ms available
                });
            }, 1);
        }
    },
    
    /**
     * Cancel idle callback with fallback
     */
    cancelIdleCallback(id) {
        if (window.cancelIdleCallback) {
            window.cancelIdleCallback(id);
        } else {
            clearTimeout(id);
        }
    },
    
    /**
     * Lazy load function
     */
    lazyLoad(fn, threshold = 0) {
        return new Promise((resolve) => {
            this.requestIdleCallback(() => {
                resolve(fn());
            });
        });
    },
    
    /**
     * Batch DOM operations for better performance
     */
    batchDOMOperations(operations) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                operations.forEach(op => op());
                resolve();
            });
        });
    }
};

// Network Utilities
const NetworkUtils = {
    /**
     * Check if online
     */
    isOnline() {
        return navigator.onLine;
    },
    
    /**
     * Get connection info if available
     */
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (!connection) {
            return null;
        }
        
        return {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
        };
    },
    
    /**
     * Check if connection is slow
     */
    isSlowConnection() {
        const connection = this.getConnectionInfo();
        
        if (!connection) {
            return false; // Assume good connection if no info available
        }
        
        return connection.effectiveType === 'slow-2g' || 
               connection.effectiveType === '2g' ||
               connection.saveData === true;
    },
    
    /**
     * Simple fetch with timeout
     */
    async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
};

// Error Utilities
const ErrorUtils = {
    /**
     * Create standardized error object
     */
    createError(message, code = 'GENERIC_ERROR', details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        error.timestamp = new Date().toISOString();
        return error;
    },
    
    /**
     * Log error with context
     */
    logError(error, context = {}) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            code: error.code,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            context: context
        };
        
        console.error('Application Error:', errorInfo);
        
        // In production, you might want to send this to an error tracking service
        if (APP_CONFIG.environment === 'production') {
            // Example: Send to error tracking service
            // this.sendToErrorTracking(errorInfo);
        }
        
        return errorInfo;
    },
    
    /**
     * Handle promise rejections gracefully
     */
    handleAsync(promise) {
        return promise
            .then(data => [null, data])
            .catch(error => [error, null]);
    },
    
    /**
     * Retry function with exponential backoff
     */
    async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries - 1) {
                    throw error;
                }
                
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }
};

// Export utilities for global use
window.DOMUtils = DOMUtils;
window.DataUtils = DataUtils;
window.StorageUtils = StorageUtils;
window.DeviceUtils = DeviceUtils;
window.PerfUtils = PerfUtils;
window.NetworkUtils = NetworkUtils;
window.ErrorUtils = ErrorUtils;

// Initialize utility diagnostics
document.addEventListener('DOMContentLoaded', () => {
    if (APP_CONFIG.debug) {
        console.log('[Utils] Utility functions loaded');
        console.log('[Utils] Device Info:', {
            type: DeviceUtils.getDeviceType(),
            viewport: DeviceUtils.getViewport(),
            isS23Ultra: DeviceUtils.isS23Ultra(),
            touchSupport: DeviceUtils.isTouchDevice(),
            pixelRatio: DeviceUtils.getPixelRatio(),
            online: NetworkUtils.isOnline(),
            connection: NetworkUtils.getConnectionInfo()
        });
    }
});