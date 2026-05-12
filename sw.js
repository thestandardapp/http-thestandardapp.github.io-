// The Standard — Service Worker
const CACHE_NAME = 'thestandard-v1';
const urlsToCache = ['/'];

// Install
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Fetch - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});

// Push notification received
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'The Standard';
  const options = {
    body: data.body || 'Have you met your standard today?',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'daily-reminder',
    renotify: true,
    data: { url: '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — open the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Background sync for scheduled notifications
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { time, msUntil } = event.data;
    setTimeout(() => {
      self.registration.showNotification('The Standard', {
        body: 'Have you met your standard today?',
        icon: '/icon-192.png',
        tag: 'daily-reminder',
        renotify: true,
      });
      // Reschedule for next day
      setTimeout(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.postMessage({ type: 'RESCHEDULE' }));
        });
      }, 24 * 60 * 60 * 1000);
    }, msUntil);
  }
});
