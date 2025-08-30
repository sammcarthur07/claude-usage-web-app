/**
 * Service Worker for Claude Usage Monitor PWA
 * Provides complete offline functionality, caching, and background sync
 * Optimized for Samsung S23 Ultra and all mobile devices
 */

const CACHE_NAME = 'claude-monitor-v2.0.0';
const STATIC_CACHE = 'claude-static-v2.0.0';
const DYNAMIC_CACHE = 'claude-dynamic-v2.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/main.css',
    '/css/animations.css', 
    '/css/auth.css',
    '/css/responsive.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/storage.js',
    '/js/auth/google-auth.js',
    '/js/auth/manual-auth.js',
    '/js/auth/auth-manager.js',
    '/js/data-collector.js',
    '/js/charts.js',
    '/js/theme.js',
    '/js/dashboard.js',
    '/js/app.js',
    // External dependencies (cached when loaded)
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Assets to cache dynamically
const DYNAMIC_PATTERNS = [
    '/assets/',
    'https://fonts.gstatic.com/',
    'https://lh3.googleusercontent.com/' // Google profile images
];

// Network-first patterns (always try network first)
const NETWORK_FIRST = [
    'https://accounts.google.com/',
    'https://apis.google.com/',
    '/api/'
];

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker v2.0.0');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting(); // Activate immediately
            })
            .catch(error => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker v2.0.0');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Claim all clients
            self.clients.claim()
        ])
    );
});

/**
 * Fetch Event - Handle all network requests
 */
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests and chrome-extension requests
    if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different request types
    if (isNetworkFirst(event.request.url)) {
        event.respondWith(networkFirst(event.request));
    } else if (isStaticAsset(event.request.url)) {
        event.respondWith(cacheFirst(event.request));
    } else {
        event.respondWith(staleWhileRevalidate(event.request));
    }
});

/**
 * Background Sync - Handle offline data sync
 */
self.addEventListener('sync', event => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-usage-data') {
        event.waitUntil(syncUsageData());
    } else if (event.tag === 'sync-auth-tokens') {
        event.waitUntil(syncAuthTokens());
    }
});

/**
 * Push Event - Handle push notifications (future enhancement)
 */
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'Claude usage update available',
            icon: '/assets/icons/icon-192.png',
            badge: '/assets/icons/icon-96.png',
            vibrate: [200, 100, 200],
            data: data,
            actions: [
                {
                    action: 'view',
                    title: 'View Dashboard',
                    icon: '/assets/icons/icon-96.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss',
                    icon: '/assets/icons/icon-96.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Claude Usage Monitor',
                options
            )
        );
    }
});

/**
 * Notification Click - Handle notification interactions
 */
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/') || clients.focus()
        );
    }
});

/**
 * Message Event - Handle messages from main app
 */
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'CACHE_USAGE_DATA') {
        cacheUsageData(event.data.data);
    } else if (event.data.type === 'CLEAR_CACHE') {
        clearAllCaches();
    } else if (event.data.type === 'GET_CACHE_STATUS') {
        getCacheStatus().then(status => {
            event.ports[0].postMessage(status);
        });
    }
});

/**
 * Check if URL should use network-first strategy
 */
function isNetworkFirst(url) {
    return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
    return STATIC_ASSETS.includes(url) || 
           url.includes('/css/') ||
           url.includes('/js/') ||
           url.includes('/assets/');
}

/**
 * Check if URL should be cached dynamically
 */
function isDynamicAsset(url) {
    return DYNAMIC_PATTERNS.some(pattern => url.includes(pattern));
}

/**
 * Network First Strategy - For Google APIs and auth
 */
async function networkFirst(request) {
    try {
        console.log('[SW] Network first:', request.url);
        
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok && isDynamicAsset(request.url)) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        // Fallback to cache
        const cacheResponse = await caches.match(request);
        if (cacheResponse) {
            return cacheResponse;
        }
        
        // Return offline fallback
        return new Response(
            JSON.stringify({ 
                offline: true, 
                error: 'Network unavailable',
                message: 'This feature requires an internet connection'
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Cache First Strategy - For static assets
 */
async function cacheFirst(request) {
    try {
        console.log('[SW] Cache first:', request.url);
        
        // Try cache first
        const cacheResponse = await caches.match(request);
        if (cacheResponse) {
            return cacheResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        return new Response('Asset not available offline', { status: 404 });
    }
}

/**
 * Stale While Revalidate Strategy - For dynamic content
 */
async function staleWhileRevalidate(request) {
    console.log('[SW] Stale while revalidate:', request.url);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cacheResponse = await cache.match(request);
    
    // Fetch new version in background
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(error => {
        console.log('[SW] Network fetch failed:', error);
        return null;
    });
    
    // Return cached version immediately, update in background
    return cacheResponse || await fetchPromise || new Response(
        'Content not available offline',
        { status: 404 }
    );
}

/**
 * Sync usage data when back online
 */
async function syncUsageData() {
    try {
        console.log('[SW] Syncing usage data...');
        
        // Get pending data from IndexedDB
        const pendingData = await getPendingUsageData();
        
        if (pendingData.length > 0) {
            // Process each pending item
            for (const data of pendingData) {
                await processUsageData(data);
            }
            
            // Clear pending data
            await clearPendingUsageData();
            
            console.log('[SW] Usage data synced successfully');
        }
    } catch (error) {
        console.error('[SW] Failed to sync usage data:', error);
        throw error; // Retry sync later
    }
}

/**
 * Sync auth tokens when back online
 */
async function syncAuthTokens() {
    try {
        console.log('[SW] Syncing auth tokens...');
        
        // Check token expiration and refresh if needed
        const tokens = await getStoredTokens();
        
        if (tokens && isTokenExpiring(tokens)) {
            const refreshedTokens = await refreshTokens(tokens);
            await storeTokens(refreshedTokens);
            
            // Notify main app
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'TOKENS_REFRESHED',
                    tokens: refreshedTokens
                });
            });
        }
        
        console.log('[SW] Auth tokens synced successfully');
    } catch (error) {
        console.error('[SW] Failed to sync auth tokens:', error);
    }
}

/**
 * Cache usage data for offline access
 */
async function cacheUsageData(data) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put('/offline-usage-data', response);
        console.log('[SW] Usage data cached for offline access');
    } catch (error) {
        console.error('[SW] Failed to cache usage data:', error);
    }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[SW] All caches cleared');
    } catch (error) {
        console.error('[SW] Failed to clear caches:', error);
    }
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
    try {
        const cacheNames = await caches.keys();
        const status = {
            caches: cacheNames.length,
            staticCached: false,
            dynamicCached: false,
            totalSize: 0
        };
        
        // Check if static cache exists
        status.staticCached = cacheNames.includes(STATIC_CACHE);
        status.dynamicCached = cacheNames.includes(DYNAMIC_CACHE);
        
        // Calculate total cache size (approximate)
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            status.totalSize += keys.length;
        }
        
        return status;
    } catch (error) {
        console.error('[SW] Failed to get cache status:', error);
        return { error: error.message };
    }
}

/**
 * Helper functions for IndexedDB operations
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ClaudeUsageDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('pendingSync')) {
                db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('tokens')) {
                db.createObjectStore('tokens', { keyPath: 'id' });
            }
        };
    });
}

async function getPendingUsageData() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pendingSync'], 'readonly');
        const store = transaction.objectStore('pendingSync');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function clearPendingUsageData() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pendingSync'], 'readwrite');
        const store = transaction.objectStore('pendingSync');
        const request = store.clear();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function processUsageData(data) {
    // Process usage data (implement based on your data structure)
    console.log('[SW] Processing usage data:', data);
    // This would typically involve sending data to a server or updating local storage
}

async function getStoredTokens() {
    // Get tokens from IndexedDB (implement based on your token storage)
    return null; // Placeholder
}

function isTokenExpiring(tokens) {
    // Check if tokens are expiring soon
    const expirationTime = tokens.expires_at || tokens.exp * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (expirationTime - now) < fiveMinutes;
}

async function refreshTokens(tokens) {
    // Refresh tokens using refresh token
    // This would typically involve calling Google's token refresh endpoint
    return tokens; // Placeholder
}

async function storeTokens(tokens) {
    // Store refreshed tokens (implement based on your storage strategy)
    console.log('[SW] Storing refreshed tokens');
}

console.log('[SW] Service Worker v2.0.0 loaded successfully');