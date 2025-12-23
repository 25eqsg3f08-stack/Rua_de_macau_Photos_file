// 缓存配置
const CACHE_NAME = 'macau-photos-cache-v1';
// 需缓存的核心静态资源
const CORE_CACHE_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/repo.js',
    '/js/main.js',
    '/js/offlinecache.js'
];

// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // 注册当前文件为 Service Worker
            const registration = await navigator.serviceWorker.register('/Rua_de_macau_Photos_file/js/offlinecache.js');
            console.log('Service Worker 注册成功：', registration.scope);
        } catch (err) {
            console.error('Service Worker 注册失败：', err);
        }
    });
}

// 安装阶段：缓存核心资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存核心资源');
                return cache.addAll(CORE_CACHE_ASSETS);
            })
            .then(() => self.skipWaiting()) // 跳过等待，立即激活
    );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name)) // 删除旧缓存
            );
        }).then(() => self.clients.claim()) // 接管所有打开的页面
    );
});

// 拦截请求：优先缓存，无缓存则请求网络
self.addEventListener('fetch', (event) => {
    // 只缓存图片和核心页面资源
    if (event.request.url.match(/\.(jpg|jpeg|png|html|css|js)$/) || event.request.url === '/') {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // 有缓存返回缓存，无缓存则请求网络
                    const fetchPromise = fetch(event.request)
                        .then(networkResponse => {
                            // 缓存 GitHub Pages 上的照片资源
                            if (event.request.url.includes('25eqsg3f08-stack.github.io')) {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, networkResponse.clone()));
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            // 无网络且无缓存时，返回友好提示（仅针对图片）
                            if (event.request.url.match(/\.(jpg|jpeg|png)$/)) {
                                return new Response(
                                    '<div style="text-align:center;padding:50px;color:#666;">无网络连接，暂无缓存照片</div>',
                                    { headers: { 'Content-Type': 'text/html' } }
                                );
                            }
                            return cachedResponse;
                        });

                    return cachedResponse || fetchPromise;
                })
        );
    }
});