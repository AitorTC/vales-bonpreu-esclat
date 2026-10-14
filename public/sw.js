// Service Worker for Descomptes d'Aitor i Xènia · Bonpreu Esclat
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Vales Bonpreu Esclat", body: event.data ? event.data.text() : '' };
  }

  const title = data.title || "Val per caducar en 2 dies! (Aitor i Xènia)";
  const options = {
    body: data.body || "Tens un val de Bonpreu Esclat que venç aviat. Obre l'app per veure el codi.",
    icon: './icon-192.svg',
    badge: './icon-192.svg',
    vibrate: [200, 100, 200],
    data: data.url || './',
    tag: data.tag || 'bonpreu-alert',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
