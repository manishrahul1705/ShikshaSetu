// N49 NOT-ADOPTED: static assets only, no offline case data or mutation queue.
const PREFIX = 'awaaz-s6a-';
const CACHE = `${PREFIX}static-v5-shikshasetu-icons`;
const OFFLINE = '/pwa/offline.html';
const FIXED = [OFFLINE, '/brand/shikshasetu-logo.png', '/brand/shikshasetu-icon.png', '/brand/shikshasetu-icon-192.png', '/brand/shikshasetu-icon-512.png'];
const assetPath = pathname => /^\/assets\/[A-Za-z0-9_.-]+\.(js|css)$/.test(pathname);
const staticPath = pathname => FIXED.includes(pathname) || assetPath(pathname);
async function clearCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith(PREFIX)).map(key => caches.delete(key)));
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FIXED);
    // Inspect static build URLs only; never cache index HTML or arbitrary hrefs.
    const response = await fetch('/', { cache: 'no-store' });
    if (response.ok) {
      const html = await response.text();
      const urls = new Set();
      for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        const url = new URL(match[1], self.location.origin);
        if (url.origin === self.location.origin && assetPath(url.pathname) && !url.search) urls.add(url.pathname);
      }
      await cache.addAll([...urls]);
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'LOGOUT') event.waitUntil(clearCaches());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    // Network-only API. Local logout clears caches even if the network fails.
    event.respondWith((async () => {
      if (url.pathname === '/api/v1/auth/logout' && request.method === 'POST') await clearCaches();
      return fetch(request);
    })());
    return;
  }
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE)) || new Response('You are offline', { status: 503, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } })));
    return;
  }
  if (staticPath(url.pathname) && !url.search) event.respondWith(caches.match(url.pathname).then(cached => cached || fetch(request)));
});
