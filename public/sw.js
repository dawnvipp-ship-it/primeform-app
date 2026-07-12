// Minimal service worker - exists only to receive push events and show a
// notification. No offline caching (the app doesn't need it and caching
// half-heartedly causes more stale-content bugs than it's worth).

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = { title: 'Prime Form', body: '' }
  try { data = event.data.json() } catch { data.body = event.data?.text() || '' }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Prime Form', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus()
      return self.clients.openWindow('/')
    })
  )
})
