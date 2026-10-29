// ========================================================
// A-Maps Service Worker - Reopen Alerts & Notifications
// ========================================================

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Bildirishnoma bosilganda ilovaga olib borish va modalni ochish
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const stationId = event.notification.data?.stationId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'OPEN_REOPEN_STATION_MODAL',
            stationId: stationId,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?reopenDue=' + encodeURIComponent(stationId || ''));
      }
    })
  );
});
