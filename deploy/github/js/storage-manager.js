/**
 * Storage Manager for Secure Local Storage
 * Handles encrypted credential storage and data caching
 */

class StorageManager {
    constructor() {
        this.storageKeys = {
            CREDENTIALS: 'claude_monitor_credentials',
            USAGE_DATA: 'claude_monitor_usage_data',
            USER_PREFS: 'claude_monitor_preferences',
            SESSION: 'claude_monitor_session',
            DEVICE_ID: 'claude_monitor_device_id'
        };
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Initialize storage and check for existing credentials
     */
    async init() {
        // Generate or retrieve device ID
        let deviceId = localStorage.getItem(this.storageKeys.DEVICE_ID);
        if (!deviceId) {
            deviceId = await window.CryptoUtils.generateDeviceId();
            localStorage.setItem(this.storageKeys.DEVICE_ID, deviceId);
        }
        this.deviceId = deviceId;

        // Check session validity
        const session = this.getSession();
        if (session && session.expiry < Date.now()) {
            this.clearSession();
        }

        return {
            hasStoredCredentials: this.hasStoredCredentials(),
            deviceId: this.deviceId
        };
    }

    /**
     * Save encrypted credentials
     */
    async saveCredentials(email, apiKey, rememberMe) {
        try {
            if (!rememberMe) {
                // Store in session only
                this.setSession({ email, apiKey });
                return true;
            }

            const credentials = {
                email,
                apiKey,
                savedAt: Date.now(),
                rememberMe: true
            };

            // Encrypt with device ID as password
            const encrypted = await window.CryptoUtils.encrypt(credentials, this.deviceId);
            localStorage.setItem(this.storageKeys.CREDENTIALS, encrypted);
            
            // Also set session for immediate use
            this.setSession({ email, apiKey });
            
            return true;
        } catch (error) {
            console.error('Failed to save credentials:', error);
            return false;
        }
    }

    /**
     * Retrieve and decrypt stored credentials
     */
    async getCredentials() {
        try {
            // Check session first
            const session = this.getSession();
            if (session && session.credentials) {
                return session.credentials;
            }

            // Check encrypted storage
            const encrypted = localStorage.getItem(this.storageKeys.CREDENTIALS);
            if (!encrypted) return null;

            const decrypted = await window.CryptoUtils.decrypt(encrypted, this.deviceId);
            
            // Validate stored credentials
            if (decrypted && decrypted.apiKey) {
                // Refresh session
                this.setSession({ 
                    email: decrypted.email, 
                    apiKey: decrypted.apiKey 
                });
                return decrypted;
            }
            
            return null;
        } catch (error) {
            console.error('Failed to retrieve credentials:', error);
            // Clear corrupted data
            this.clearCredentials();
            return null;
        }
    }

    /**
     * Clear stored credentials
     */
    clearCredentials() {
        localStorage.removeItem(this.storageKeys.CREDENTIALS);
        this.clearSession();
    }

    /**
     * Check if credentials are stored
     */
    hasStoredCredentials() {
        return localStorage.getItem(this.storageKeys.CREDENTIALS) !== null ||
               this.getSession()?.credentials !== undefined;
    }

    /**
     * Session management
     */
    setSession(data) {
        const session = {
            credentials: data,
            expiry: Date.now() + this.sessionTimeout,
            createdAt: Date.now()
        };
        sessionStorage.setItem(this.storageKeys.SESSION, JSON.stringify(session));
    }

    getSession() {
        try {
            const session = sessionStorage.getItem(this.storageKeys.SESSION);
            return session ? JSON.parse(session) : null;
        } catch {
            return null;
        }
    }

    clearSession() {
        sessionStorage.removeItem(this.storageKeys.SESSION);
    }

    /**
     * Save usage data for offline access
     */
    saveUsageData(data) {
        try {
            const usageData = {
                ...data,
                cachedAt: Date.now()
            };
            localStorage.setItem(this.storageKeys.USAGE_DATA, JSON.stringify(usageData));
            return true;
        } catch (error) {
            console.error('Failed to save usage data:', error);
            return false;
        }
    }

    /**
     * Get cached usage data
     */
    getUsageData() {
        try {
            const data = localStorage.getItem(this.storageKeys.USAGE_DATA);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    /**
     * Save user preferences
     */
    savePreferences(prefs) {
        try {
            localStorage.setItem(this.storageKeys.USER_PREFS, JSON.stringify(prefs));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get user preferences
     */
    getPreferences() {
        try {
            const prefs = localStorage.getItem(this.storageKeys.USER_PREFS);
            return prefs ? JSON.parse(prefs) : {
                theme: 'auto',
                notifications: true,
                autoRefresh: true,
                refreshInterval: 60000 // 1 minute
            };
        } catch {
            return {
                theme: 'auto',
                notifications: true,
                autoRefresh: true,
                refreshInterval: 60000
            };
        }
    }

    /**
     * Clear all stored data
     */
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    /**
     * Get storage usage info
     */
    getStorageInfo() {
        let totalSize = 0;
        const items = {};

        for (const key in localStorage) {
            const item = localStorage.getItem(key);
            const size = new Blob([item]).size;
            totalSize += size;
            items[key] = size;
        }

        return {
            totalSize,
            items,
            formattedSize: this.formatBytes(totalSize)
        };
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Export for use in other modules
window.StorageManager = new StorageManager();