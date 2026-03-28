const CACHE_NAME = 'upbase-v3';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => caches.delete(key))
    )).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. ALWAYS Bypass for API and Development tools
  if (url.pathname.startsWith('/api') || url.port === '5173' || url.hostname === 'localhost') {
    return; 
  }

  // 2. Standard Fetch with Safety Catch
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(err => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response("Network error occurred", { status: 408 });
      });
    })
  );
});
