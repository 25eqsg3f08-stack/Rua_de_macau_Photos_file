// 缓存名称（修改版本号会触发新缓存）
const CACHE_NAME = 'macau-photo-gallery-v1';
// 强制缓存的核心文件
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './print.html',
  './images/error.png', // 本地错误图
  // Leaflet 公共库CDN（防止外部资源失效）
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://picsum.photos/id/1005/800/500' // CDN错误图
];

// 安装阶段：缓存核心文件
self.addEventListener('install', (event) => {
  // 等待缓存完成后激活
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()) // 跳过等待，立即激活
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          // 删除非当前版本的缓存
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim()) // 接管所有打开的页面
  );
});

// 请求拦截：优先缓存，网络兜底
self.addEventListener('fetch', (event) => {
  // 过滤需要缓存的请求类型
  const request = event.request;
  const url = new URL(request.url);

  // 1. 缓存 GitHub 图片（raw.githubusercontent.com）
  if (url.hostname.includes('raw.githubusercontent.com') && 
      ['jpg', 'png', 'jpeg', 'webp'].some(ext => url.pathname.endsWith(ext))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          // 有缓存直接用，同时后台更新缓存
          if (cachedResponse) {
            fetch(request).then(networkResponse => {
              cache.put(request, networkResponse.clone());
            });
            return cachedResponse;
          }
          // 无缓存则请求网络并缓存
          return fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // 网络失败时返回错误图
            return caches.match('./images/error.png') || caches.match('https://picsum.photos/id/1005/800/500');
          });
        });
      })
    );
    return;
  }

  // 2. 缓存地图瓦片（OpenStreetMap）
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          return fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 3. 核心文件：优先缓存，无缓存则网络请求
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request).catch(() => {
        // 兜底：核心HTML请求失败时返回离线提示
        if (request.mode === 'navigate') {
          return new Response('<h1>离线模式：请先在线加载一次项目</h1>', {
            headers: { 'Content-Type': 'text/html;charset=utf-8' }
          });
        }
      });
    })
  );
});