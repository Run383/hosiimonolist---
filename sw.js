// ============================================================
// Service Worker — ネットワークファースト戦略
// ============================================================

const CACHE_NAME = 'wishlist-v1';
const PRECACHE_URLS = [
    '/',
    '/index.html'
];

// インストール時にシェルをキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// アクティベーション時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// フェッチ時: ネットワーク優先、失敗時にキャッシュ利用
self.addEventListener('fetch', (event) => {
    // POST や Firebase API リクエストはスキップ
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('firestore.googleapis.com')) return;
    if (event.request.url.includes('identitytoolkit.googleapis.com')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // 成功したレスポンスをキャッシュに保存
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // オフラインの場合はキャッシュから返す
                return caches.match(event.request);
            })
    );
});
