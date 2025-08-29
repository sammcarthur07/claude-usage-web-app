/**
 * Service Worker for Claude Usage Monitor PWA
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'claude-monitor-v1.0.0';
const DYNAMIC_CACHE = 'claude-monitor-dynamic-v1.0.0';

// Assets to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles.css',
    '/js/app.js',
    '/js/api-service.js',
    '/js/storage-manager.js',
    '/js/crypto-utils.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Round',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Install complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Install failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('claude-monitor-') &&
                                   cacheName !== CACHE_NAME &&
                                   cacheName !== DYNAMIC_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activate complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle API requests differently
    if (url.origin === 'https://api.anthropic.com') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone response before caching
                    const responseToCache = response.clone();
                    
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    
                    return response;
                })
                .catch(() => {
                    // Return cached API response if available
                    return caches.match(request);
                })
        );
        return;
    }
    
    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }
                
                // Fetch from network
                return fetch(request)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type === 'opaque') {
                            return response;
                        }
                        
                        // Clone response before caching
                        const responseToCache = response.clone();
                        
                        // Cache dynamically fetched content
                        caches.open(DYNAMIC_CACHE)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        
                        return response;
                    });
            })
            .catch(() => {
                // Offline fallback
                if (request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync triggered');
    
    if (event.tag === 'sync-usage-data') {
        event.waitUntil(
            syncUsageData()
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-usage-data') {
        event.waitUntil(
            syncUsageData()
        );
    }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Usage limit alert',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View Dashboard',
                icon: '/icons/dashboard-96.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/close-96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Claude Usage Monitor', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/?screen=dashboard')
        );
    }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((cacheName) => {
                            return caches.delete(cacheName);
                        })
                    );
                })
                .then(() => {
                    return event.ports[0].postMessage({ cleared: true });
                })
        );
    }
});

// Helper function to sync usage data
async function syncUsageData() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedRequests = await cache.keys();
        
        // Find API requests in cache
        const apiRequests = cachedRequests.filter(request => 
            request.url.includes('api.anthropic.com')
        );
        
        // Attempt to refresh cached API data
        for (const request of apiRequests) {
            try {
                const response = await fetch(request);
                await cache.put(request, response);
            } catch (error) {
                console.error('[Service Worker] Failed to sync:', error);
            }
        }
        
        // Notify clients of update
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'DATA_SYNCED',
                timestamp: Date.now()
            });
        });
        
    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
    }
}

// Cache versioning and update handler
const VERSION = '1.0.0';

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECK_VERSION') {
        event.ports[0].postMessage({ version: VERSION });
    }
});