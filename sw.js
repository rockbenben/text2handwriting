// The production build injects its HTML and static JS/CSS dependency list.
const BUILD = {"version":"5c56299e828b9040","resources":["index.html","assets/index-CUCkU1bW.js","assets/rolldown-runtime-BCiCTKAo.js","assets/index-D9lrmNEi.css"]};
const scope = new URL(self.registration.scope);
const prefix = `text2handwriting:${encodeURIComponent(scope.pathname)}:`;
const shellCache = `${prefix}${BUILD.version}:shell`;
const runtimeCache = `${prefix}${BUILD.version}:runtime`;
const index = new URL('index.html', scope);

self.addEventListener('install', (event) => {
  const requests = BUILD.resources.map(
    (path) => new Request(new URL(path, scope), { cache: 'reload' }),
  );
  // addAll commits the shell as a batch. A failed install leaves the active
  // worker in place. Let the new worker wait until old pages have closed.
  event.waitUntil(caches.open(shellCache).then((cache) => cache.addAll(requests)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(prefix) && key !== shellCache && key !== runtimeCache)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

const identityAssets = new Set([
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

async function fromShell(request) {
  const cache = await caches.open(shellCache);
  return cache.match(request);
}

function cacheAsset(event, { networkFirst = false, revalidate = false } = {}) {
  const request = event.request;
  const cached = (async () => {
    if (!networkFirst) {
      const bundled = await fromShell(request);
      if (bundled) return bundled;
    }
    return (await caches.open(runtimeCache)).match(request);
  })().catch(() => undefined);
  const network = (async () => {
    if (!networkFirst && !revalidate) {
      const response = await cached;
      if (response) return response;
    }
    const response = await fetch(request);
    if (response.ok) {
      try {
        await (await caches.open(runtimeCache)).put(request, response.clone());
      } catch (error) {
        console.warn('Could not cache asset:', request.url, error);
      }
    }
    return response;
  })();

  if (revalidate) {
    event.waitUntil(network.catch(() => undefined));
    event.respondWith(cached.then((response) => response || network));
  } else {
    event.respondWith(network.catch(async (error) => {
      const response = await cached;
      if (response) return response;
      throw error;
    }));
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin !== scope.origin) {
    if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
      cacheAsset(event, { revalidate: true });
    }
    return;
  }
  if (!url.pathname.startsWith(scope.pathname)) return;

  if (request.mode === 'navigate') {
    if (url.pathname === scope.pathname || url.pathname === index.pathname) {
      // The active worker serves its own version's HTML, so it never pairs an
      // old offline shell with a newer deployment's hashed resources.
      event.respondWith(fromShell(index.href).then((response) => response || fetch(request)));
    }
    return;
  }

  const path = url.pathname.slice(scope.pathname.length);
  if (path.startsWith('assets/')) cacheAsset(event);
  else if (path.startsWith('fonts/')) cacheAsset(event, { revalidate: true });
  else if (identityAssets.has(path)) cacheAsset(event, { networkFirst: true });
});
