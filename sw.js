const CACHE_NAME = 'globalway-v1.0.0';
const STATIC_CACHE = 'globalway-static-v1.0.0';
const DYNAMIC_CACHE = 'globalway-dynamic-v1.0.0';

// Статические ресурсы для кэширования
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    
    // CSS
    '/css/variables.css',
    '/css/styles.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/css/components.css',
    
    // JavaScript
    '/js/app.js',
    '/js/web3-manager.js',
    '/js/contract-manager.js',
    '/js/ui-controller.js',
    '/js/id-generator.js',
    '/js/i18n.js',
    '/js/admin-controller.js',
    
    // Переводы
    '/translations/en.json',
    '/translations/ru.json',
    '/translations/uk.json',
    
    // Изображения
    '/assets/images/background.jpg',
    '/assets/planets/planet-club.png',
    '/assets/planets/planet-mission.png',
    '/assets/planets/planet-goals.png',
    '/assets/planets/planet-roadmap.png',
    '/assets/planets/planet-projects.png',
    '/assets/planets/gwt-coin.png',
    
    // Иконки
    '/assets/icons/favicon.ico',
    '/assets/icons/logo-16x16.png',
    '/assets/icons/logo-32x32.png',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

// Ресурсы для Network-First стратегии
const NETWORK_FIRST_URLS = [
    '/contracts/',
    'opbnb-mainnet-rpc.bnbchain.org',
    'api.'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Удаление старых кэшей
                    if (cacheName !== STATIC_CACHE && 
                        cacheName !== DYNAMIC_CACHE &&
                        cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Пропускаем запросы к расширениям браузера
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return;
    }
    
    // Определяем стратегию кэширования
    if (shouldUseNetworkFirst(event.request.url)) {
        event.respondWith(networkFirstStrategy(event.request));
    } else {
        event.respondWith(cacheFirstStrategy(event.request));
    }
});

// Cache-First стратегия для статических ресурсов
async function cacheFirstStrategy(request) {
    try {
        // Проверяем кэш
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Если нет в кэше, загружаем из сети
        const networkResponse = await fetch(request);
        
        // Кэшируем успешные ответы
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache-first strategy failed:', error);
        
        // Fallback для HTML страниц
        if (request.headers.get('accept').includes('text/html')) {
            const cachedIndex = await caches.match('/index.html');
            return cachedIndex || new Response('Offline', { status: 503 });
        }
        
        return new Response('Offline', { status: 503 });
    }
}

// Network-First стратегия для динамических данных
async function networkFirstStrategy(request) {
    try {
        // Сначала пытаемся загрузить из сети
        const networkResponse = await fetch(request);
        
        // Кэшируем успешные ответы
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network request failed, trying cache:', error);
        
        // Если сеть недоступна, используем кэш
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Если ничего нет, возвращаем ошибку
        return new Response('Network unavailable', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Определение стратегии кэширования
function shouldUseNetworkFirst(url) {
    return NETWORK_FIRST_URLS.some(pattern => url.includes(pattern));
}

// Обработка сообщений от основного потока
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        updateCache();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearAllCaches();
    }
});

// Обновление кэша
async function updateCache() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_ASSETS);
        console.log('Cache updated successfully');
        
        // Уведомляем клиентов об обновлении
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'CACHE_UPDATED' });
        });
    } catch (error) {
        console.error('Failed to update cache:', error);
    }
}

// Очистка всех кэшей
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('All caches cleared');
    } catch (error) {
        console.error('Failed to clear caches:', error);
    }
}

// Background Sync для offline операций
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(handleBackgroundSync());
    }
});

async function handleBackgroundSync() {
    try {
        // Получаем отложенные транзакции из IndexedDB
        const pendingTransactions = await getPendingTransactions();
        
        for (const tx of pendingTransactions) {
            try {
                await retryTransaction(tx);
                await removePendingTransaction(tx.id);
            } catch (error) {
                console.error('Failed to retry transaction:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push уведомления (для будущего использования)
self.addEventListener('push', event => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/logo-32x32.png',
            vibrate: [200, 100, 200],
            tag: 'globalway-notification',
            actions: [
                {
                    action: 'open',
                    title: 'Open App',
                    icon: '/assets/icons/logo-32x32.png'
                },
                {
                    action: 'close',
                    title: 'Close',
                    icon: '/assets/icons/close-32x32.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification('GlobalWay', options)
        );
    }
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Placeholder функции для IndexedDB операций
async function getPendingTransactions() {
    // Реализация получения отложенных транзакций
    return [];
}

async function retryTransaction(tx) {
    // Реализация повторной отправки транзакции
    console.log('Retrying transaction:', tx);
}

async function removePendingTransaction(id) {
    // Реализация удаления обработанной транзакции
    console.log('Removing pending transaction:', id);
}
