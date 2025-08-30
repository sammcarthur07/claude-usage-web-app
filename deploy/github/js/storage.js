/**
 * Secure Storage Manager
 * Handles encrypted local storage, IndexedDB operations, and data persistence
 */

class StorageManager {
    constructor() {
        this.isInitialized = false;
        this.encryptionKey = null;
        this.db = null;
        this.dbName = 'ClaudeUsageDB';
        this.dbVersion = 2;
        
        this.init();
    }
    
    /**
     * Initialize storage manager
     */
    async init() {
        try {
            console.log('[Storage] Initializing storage manager...');
            
            // Initialize encryption key
            await this.initializeEncryption();
            
            // Initialize IndexedDB
            await this.initializeIndexedDB();
            
            // Migrate legacy data if needed
            await this.migrateLegacyData();
            
            this.isInitialized = true;
            console.log('[Storage] Storage manager initialized');
            
        } catch (error) {
            console.error('[Storage] Failed to initialize:', error);
            // Fallback to localStorage only
            this.isInitialized = true;
        }
    }
    
    /**
     * Initialize encryption system
     */
    async initializeEncryption() {
        try {
            // Check if Web Crypto API is available
            if (!window.crypto || !window.crypto.subtle) {
                console.warn('[Storage] Web Crypto API not available, using fallback encryption');
                return;
            }
            
            // Try to load existing encryption key
            const storedKey = localStorage.getItem(APP_CONFIG.storageKeys.encryptionKey);
            
            if (storedKey) {
                // Import existing key
                this.encryptionKey = await window.crypto.subtle.importKey(
                    'jwk',
                    JSON.parse(storedKey),
                    { name: 'AES-GCM' },
                    false,
                    ['encrypt', 'decrypt']
                );
                console.log('[Storage] Existing encryption key loaded');
            } else {
                // Generate new key
                this.encryptionKey = await window.crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
                
                // Export and store key
                const exportedKey = await window.crypto.subtle.exportKey('jwk', this.encryptionKey);
                localStorage.setItem(
                    APP_CONFIG.storageKeys.encryptionKey,
                    JSON.stringify(exportedKey)
                );
                console.log('[Storage] New encryption key generated and stored');
            }
            
        } catch (error) {
            console.error('[Storage] Failed to initialize encryption:', error);
            this.encryptionKey = null;
        }
    }
    
    /**
     * Initialize IndexedDB
     */
    async initializeIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('[Storage] IndexedDB open failed:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('[Storage] IndexedDB initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                this.createObjectStores(db);
                
                console.log('[Storage] IndexedDB schema upgraded');
            };
        });
    }
    
    /**
     * Create IndexedDB object stores
     */
    createObjectStores(db) {
        try {
            // Secure data store (encrypted)
            if (!db.objectStoreNames.contains('secureData')) {
                const secureStore = db.createObjectStore('secureData', { keyPath: 'key' });
                secureStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            // Usage data store
            if (!db.objectStoreNames.contains('usageData')) {
                const usageStore = db.createObjectStore('usageData', { keyPath: 'id', autoIncrement: true });
                usageStore.createIndex('date', 'date', { unique: false });
                usageStore.createIndex('source', 'source', { unique: false });
                usageStore.createIndex('model', 'model', { unique: false });
            }
            
            // Cache store
            if (!db.objectStoreNames.contains('cache')) {
                const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                cacheStore.createIndex('expires', 'expires', { unique: false });
            }
            
            // Preferences store
            if (!db.objectStoreNames.contains('preferences')) {
                const prefsStore = db.createObjectStore('preferences', { keyPath: 'key' });
            }
            
            // Sync queue store (for offline data sync)
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncStore.createIndex('type', 'type', { unique: false });
            }
            
        } catch (error) {
            console.error('[Storage] Failed to create object stores:', error);
        }
    }
    
    /**
     * Encrypt data using Web Crypto API
     */
    async encryptData(data) {
        try {
            if (!this.encryptionKey) {
                return this.fallbackEncrypt(data);
            }
            
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(JSON.stringify(data));
            
            // Generate random IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt data
            const encryptedData = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                dataBytes
            );
            
            // Combine IV and encrypted data
            const result = new Uint8Array(iv.length + encryptedData.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encryptedData), iv.length);
            
            // Convert to base64
            return btoa(String.fromCharCode(...result));
            
        } catch (error) {
            console.error('[Storage] Encryption failed:', error);
            return this.fallbackEncrypt(data);
        }
    }
    
    /**
     * Decrypt data using Web Crypto API
     */
    async decryptData(encryptedData) {
        try {
            if (!this.encryptionKey) {
                return this.fallbackDecrypt(encryptedData);
            }
            
            // Convert from base64
            const dataBytes = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );
            
            // Extract IV and encrypted data
            const iv = dataBytes.slice(0, 12);
            const encrypted = dataBytes.slice(12);
            
            // Decrypt data
            const decryptedData = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encrypted
            );
            
            // Convert back to string and parse JSON
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(decryptedData);
            return JSON.parse(jsonString);
            
        } catch (error) {
            console.error('[Storage] Decryption failed:', error);
            return this.fallbackDecrypt(encryptedData);
        }
    }
    
    /**
     * Fallback encryption (simple Base64 encoding)
     */
    fallbackEncrypt(data) {
        try {
            return btoa(JSON.stringify(data));
        } catch (error) {
            console.error('[Storage] Fallback encryption failed:', error);
            return JSON.stringify(data);
        }
    }
    
    /**
     * Fallback decryption (simple Base64 decoding)
     */
    fallbackDecrypt(encryptedData) {
        try {
            return JSON.parse(atob(encryptedData));
        } catch (error) {
            console.error('[Storage] Fallback decryption failed:', error);
            return JSON.parse(encryptedData);
        }
    }
    
    /**
     * Store secure data (encrypted)
     */
    async setSecureData(key, data) {
        try {
            const encryptedData = await this.encryptData(data);
            const record = {
                key: key,
                data: encryptedData,
                timestamp: Date.now()
            };
            
            if (this.db) {
                // Store in IndexedDB
                await this.performDBOperation('secureData', 'readwrite', (store) => {
                    return store.put(record);
                });
            } else {
                // Fallback to localStorage
                localStorage.setItem(`secure_${key}`, JSON.stringify(record));
            }
            
            console.log(`[Storage] Secure data stored: ${key}`);
            
        } catch (error) {
            console.error(`[Storage] Failed to store secure data (${key}):`, error);
            throw error;
        }
    }
    
    /**
     * Get secure data (decrypted)
     */
    async getSecureData(key) {
        try {
            let record = null;
            
            if (this.db) {
                // Get from IndexedDB
                record = await this.performDBOperation('secureData', 'readonly', (store) => {
                    return store.get(key);
                });
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem(`secure_${key}`);
                if (stored) {
                    record = JSON.parse(stored);
                }
            }
            
            if (!record) {
                return null;
            }
            
            const decryptedData = await this.decryptData(record.data);
            console.log(`[Storage] Secure data retrieved: ${key}`);
            return decryptedData;
            
        } catch (error) {
            console.error(`[Storage] Failed to get secure data (${key}):`, error);
            return null;
        }
    }
    
    /**
     * Remove secure data
     */
    async removeSecureData(key) {
        try {
            if (this.db) {
                await this.performDBOperation('secureData', 'readwrite', (store) => {
                    return store.delete(key);
                });
            } else {
                localStorage.removeItem(`secure_${key}`);
            }
            
            console.log(`[Storage] Secure data removed: ${key}`);
            
        } catch (error) {
            console.error(`[Storage] Failed to remove secure data (${key}):`, error);
        }
    }
    
    /**
     * Store usage data
     */
    async storeUsageData(data) {
        try {
            const record = {
                ...data,
                id: data.id || Date.now(),
                timestamp: Date.now()
            };
            
            if (this.db) {
                await this.performDBOperation('usageData', 'readwrite', (store) => {
                    return store.put(record);
                });
            } else {
                // Fallback: append to localStorage array
                const existing = JSON.parse(localStorage.getItem('usage_data') || '[]');
                existing.push(record);
                
                // Keep only last 1000 records
                if (existing.length > 1000) {
                    existing.splice(0, existing.length - 1000);
                }
                
                localStorage.setItem('usage_data', JSON.stringify(existing));
            }
            
            console.log('[Storage] Usage data stored');
            
        } catch (error) {
            console.error('[Storage] Failed to store usage data:', error);
            throw error;
        }
    }
    
    /**
     * Get usage data with filters
     */
    async getUsageData(filters = {}) {
        try {
            let data = [];
            
            if (this.db) {
                data = await this.performDBOperation('usageData', 'readonly', (store) => {
                    return store.getAll();
                });
            } else {
                data = JSON.parse(localStorage.getItem('usage_data') || '[]');
            }
            
            // Apply filters
            if (filters.startDate) {
                data = data.filter(item => item.date >= filters.startDate);
            }
            
            if (filters.endDate) {
                data = data.filter(item => item.date <= filters.endDate);
            }
            
            if (filters.source) {
                data = data.filter(item => item.source === filters.source);
            }
            
            if (filters.model) {
                data = data.filter(item => item.model === filters.model);
            }
            
            return data;
            
        } catch (error) {
            console.error('[Storage] Failed to get usage data:', error);
            return [];
        }
    }
    
    /**
     * Store cached data with expiration
     */
    async setCacheData(key, data, ttl = 3600000) { // Default 1 hour TTL
        try {
            const record = {
                key: key,
                data: data,
                expires: Date.now() + ttl,
                timestamp: Date.now()
            };
            
            if (this.db) {
                await this.performDBOperation('cache', 'readwrite', (store) => {
                    return store.put(record);
                });
            } else {
                localStorage.setItem(`cache_${key}`, JSON.stringify(record));
            }
            
            console.log(`[Storage] Cache data stored: ${key}`);
            
        } catch (error) {
            console.error(`[Storage] Failed to store cache data (${key}):`, error);
        }
    }
    
    /**
     * Get cached data (if not expired)
     */
    async getCacheData(key) {
        try {
            let record = null;
            
            if (this.db) {
                record = await this.performDBOperation('cache', 'readonly', (store) => {
                    return store.get(key);
                });
            } else {
                const stored = localStorage.getItem(`cache_${key}`);
                if (stored) {
                    record = JSON.parse(stored);
                }
            }
            
            if (!record) {
                return null;
            }
            
            // Check if expired
            if (Date.now() > record.expires) {
                await this.removeCacheData(key);
                return null;
            }
            
            return record.data;
            
        } catch (error) {
            console.error(`[Storage] Failed to get cache data (${key}):`, error);
            return null;
        }
    }
    
    /**
     * Remove cached data
     */
    async removeCacheData(key) {
        try {
            if (this.db) {
                await this.performDBOperation('cache', 'readwrite', (store) => {
                    return store.delete(key);
                });
            } else {
                localStorage.removeItem(`cache_${key}`);
            }
            
        } catch (error) {
            console.error(`[Storage] Failed to remove cache data (${key}):`, error);
        }
    }
    
    /**
     * Clean expired cache data
     */
    async cleanExpiredCache() {
        try {
            if (this.db) {
                await this.performDBOperation('cache', 'readwrite', (store) => {
                    const index = store.index('expires');
                    const range = IDBKeyRange.upperBound(Date.now());
                    return index.openCursor(range);
                }, (cursor) => {
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                });
            } else {
                // Clean localStorage cache
                const keys = Object.keys(localStorage);
                const now = Date.now();
                
                keys.forEach(key => {
                    if (key.startsWith('cache_')) {
                        try {
                            const record = JSON.parse(localStorage.getItem(key));
                            if (record.expires && now > record.expires) {
                                localStorage.removeItem(key);
                            }
                        } catch (error) {
                            // Remove invalid cache entries
                            localStorage.removeItem(key);
                        }
                    }
                });
            }
            
            console.log('[Storage] Expired cache cleaned');
            
        } catch (error) {
            console.error('[Storage] Failed to clean expired cache:', error);
        }
    }
    
    /**
     * Store user preferences
     */
    async setPreference(key, value) {
        try {
            const record = {
                key: key,
                value: value,
                timestamp: Date.now()
            };
            
            if (this.db) {
                await this.performDBOperation('preferences', 'readwrite', (store) => {
                    return store.put(record);
                });
            } else {
                localStorage.setItem(`pref_${key}`, JSON.stringify(record));
            }
            
        } catch (error) {
            console.error(`[Storage] Failed to store preference (${key}):`, error);
        }
    }
    
    /**
     * Get user preference
     */
    async getPreference(key, defaultValue = null) {
        try {
            let record = null;
            
            if (this.db) {
                record = await this.performDBOperation('preferences', 'readonly', (store) => {
                    return store.get(key);
                });
            } else {
                const stored = localStorage.getItem(`pref_${key}`);
                if (stored) {
                    record = JSON.parse(stored);
                }
            }
            
            return record ? record.value : defaultValue;
            
        } catch (error) {
            console.error(`[Storage] Failed to get preference (${key}):`, error);
            return defaultValue;
        }
    }
    
    /**
     * Add data to sync queue for offline support
     */
    async addToSyncQueue(type, data) {
        try {
            const record = {
                type: type,
                data: data,
                timestamp: Date.now()
            };
            
            if (this.db) {
                await this.performDBOperation('syncQueue', 'readwrite', (store) => {
                    return store.add(record);
                });
            } else {
                const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
                queue.push(record);
                localStorage.setItem('sync_queue', JSON.stringify(queue));
            }
            
            console.log(`[Storage] Added to sync queue: ${type}`);
            
        } catch (error) {
            console.error('[Storage] Failed to add to sync queue:', error);
        }
    }
    
    /**
     * Get pending sync data
     */
    async getSyncQueue() {
        try {
            if (this.db) {
                return await this.performDBOperation('syncQueue', 'readonly', (store) => {
                    return store.getAll();
                });
            } else {
                return JSON.parse(localStorage.getItem('sync_queue') || '[]');
            }
        } catch (error) {
            console.error('[Storage] Failed to get sync queue:', error);
            return [];
        }
    }
    
    /**
     * Clear sync queue after successful sync
     */
    async clearSyncQueue() {
        try {
            if (this.db) {
                await this.performDBOperation('syncQueue', 'readwrite', (store) => {
                    return store.clear();
                });
            } else {
                localStorage.removeItem('sync_queue');
            }
            
            console.log('[Storage] Sync queue cleared');
            
        } catch (error) {
            console.error('[Storage] Failed to clear sync queue:', error);
        }
    }
    
    /**
     * Clear all application data
     */
    async clearAllData() {
        try {
            if (this.db) {
                // Clear all object stores
                const storeNames = ['secureData', 'usageData', 'cache', 'preferences', 'syncQueue'];
                
                for (const storeName of storeNames) {
                    await this.performDBOperation(storeName, 'readwrite', (store) => {
                        return store.clear();
                    });
                }
            }
            
            // Clear localStorage data
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('secure_') || 
                    key.startsWith('cache_') || 
                    key.startsWith('pref_') ||
                    Object.values(APP_CONFIG.storageKeys).includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('[Storage] All data cleared');
            
        } catch (error) {
            console.error('[Storage] Failed to clear all data:', error);
        }
    }
    
    /**
     * Get storage statistics
     */
    async getStorageStats() {
        const stats = {
            localStorage: this.getLocalStorageSize(),
            indexedDB: await this.getIndexedDBSize(),
            total: 0
        };
        
        stats.total = stats.localStorage + stats.indexedDB;
        return stats;
    }
    
    /**
     * Get localStorage size estimate
     */
    getLocalStorageSize() {
        let total = 0;
        try {
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
        } catch (error) {
            console.error('[Storage] Failed to calculate localStorage size:', error);
        }
        return total;
    }
    
    /**
     * Get IndexedDB size estimate
     */
    async getIndexedDBSize() {
        if (!this.db) return 0;
        
        try {
            // This is an approximation since IndexedDB doesn't provide exact size
            let total = 0;
            const storeNames = ['secureData', 'usageData', 'cache', 'preferences', 'syncQueue'];
            
            for (const storeName of storeNames) {
                const count = await this.performDBOperation(storeName, 'readonly', (store) => {
                    return store.count();
                });
                total += count * 100; // Rough estimate of 100 bytes per record
            }
            
            return total;
        } catch (error) {
            console.error('[Storage] Failed to calculate IndexedDB size:', error);
            return 0;
        }
    }
    
    /**
     * Migrate legacy data from previous versions
     */
    async migrateLegacyData() {
        try {
            // Migrate from localStorage to secure storage
            const legacyKeys = [
                'claude_user_profile',
                'claude_usage_data',
                'claude_auth_token'
            ];
            
            for (const key of legacyKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsedData = JSON.parse(data);
                        const secureKey = key.replace('claude_', '');
                        await this.setSecureData(secureKey, parsedData);
                        localStorage.removeItem(key);
                        console.log(`[Storage] Migrated legacy data: ${key}`);
                    } catch (error) {
                        console.warn(`[Storage] Failed to migrate ${key}:`, error);
                    }
                }
            }
            
        } catch (error) {
            console.error('[Storage] Failed to migrate legacy data:', error);
        }
    }
    
    /**
     * Perform IndexedDB operation with proper error handling
     */
    async performDBOperation(storeName, mode, operation, cursorCallback = null) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not available'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(new Error('Transaction aborted'));
            
            try {
                const request = operation(store);
                
                if (cursorCallback) {
                    request.onsuccess = () => cursorCallback(request.result);
                } else {
                    request.onsuccess = () => resolve(request.result);
                }
                
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Initialize Storage Manager
let storageManager;

document.addEventListener('DOMContentLoaded', async () => {
    storageManager = new StorageManager();
    window.storageManager = storageManager;
    
    // Clean expired cache periodically
    setInterval(() => {
        if (storageManager.isInitialized) {
            storageManager.cleanExpiredCache();
        }
    }, 3600000); // Every hour
});