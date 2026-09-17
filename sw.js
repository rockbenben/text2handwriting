/*
 * 轻量 Service Worker：应用外壳缓存，使工具可离线使用、可安装到桌面。
 *
 * 设计取舍：
 *  - 不预缓存 16MB 的 TTF 字体，改为「首次访问后缓存」(stale-while-revalidate)，
 *    避免安装时一次性吞掉用户流量；离线后已访问过的语言/字体仍可用。
 *  - 带内容哈希的 /assets/ 文件：cache-first（文件名一变就是新 URL，天然不会拿到旧版）。
 *  - 文档/入口：network-first，保证发布新版本后用户立刻能拿到新 HTML，离线才回落缓存。
 *  - 品牌标识类资源（图标 / manifest / 分享卡）：同样 network-first。它们文件名固定、
 *    内容却随发布变化，用 SWR 会先把旧副本给页面 —— 表现为「logo 换了但页面还是旧的」。
 *  - 只处理同源 GET；Google Fonts CDN 走单独的 SWR 规则。
 */
const CACHE_VERSION = 'shouxie-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

self.addEventListener('install', (event) => {
  // 不预拉字体等大文件，只让 SW 尽快激活
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isHashedAsset(url) {
  // Vite 产物形如 /assets/index-DpfrMuil.js
  return url.pathname.includes('/assets/');
}

/**
 * 品牌标识类资源：文件名固定、内容却会随发布变化（换 logo、换分享卡、改 manifest）。
 * 这类走 network-first，不能用 SWR —— SWR 会先把缓存里的旧副本返回给页面，
 * 表现为「logo 已经换了，但页面还是旧的」，要等下一次访问才更新。
 *
 * 按【最后一段路径】匹配而不是整条路径，子路径部署（GitHub Pages）也认得出。
 */
const IDENTITY_ASSETS = new Set([
  'favicon.svg',
  'icon-maskable.svg',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'manifest.webmanifest',
  'social-card.png',
  'social-card.svg',
]);

function isIdentityAsset(url) {
  return IDENTITY_ASSETS.has(url.pathname.split('/').pop());
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('offline and no cache');
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Google Fonts 的样式与字体文件：SWR，离线可回落
    if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
      event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    }
    return;
  }

  // 页面导航与入口：network-first（确保发布即更新）
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // 品牌标识类资源：network-first，保证换 logo / 换分享卡后立刻生效
  if (isIdentityAsset(url)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // 带哈希的构建产物：cache-first；字体等其余静态资源：SWR
  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
