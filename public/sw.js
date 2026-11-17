// Minimal service worker. It caches NOTHING (no risk of stale UI); it exists only so prayer notifications
// work on mobile browsers (Android Chrome rejects `new Notification()` and requires showNotification()
// from a service worker) and so tapping one brings the app back to the foreground.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const key = e.notification.data && e.notification.data.key
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const c = list[0]
      if (c) { c.postMessage({ type: 'prayer-open', key }); return c.focus() }
      return self.clients.openWindow(self.registration.scope)
    })
  )
})
