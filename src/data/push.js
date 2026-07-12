// Not secret - VAPID public keys are meant to ship in client code.
const VAPID_PUBLIC_KEY = 'BBQxz_lUfOLgDzEOz0v18zDxtELpjV7PQ9s7chbrErJPognlo8xeCwisvn65S0gF0e6d35M_r6T9VpUzQhUt9xE'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// iOS Safari only exposes the Push API once the PWA is running standalone
// (added to the home screen) - Notification.permission itself throws/denies
// otherwise, which is the practical signal to show the "add to home
// screen" nudge instead of a broken enable button.
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export async function getNotificationPermissionState() {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

async function registerServiceWorker() {
  return navigator.serviceWorker.register('/sw.js')
}

export async function enablePush(db, { ownerType, clientId, coachId }) {
  const reg = await registerServiceWorker()
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Bạn đã từ chối quyền thông báo.')

  let subscription = await reg.pushManager.getSubscription()
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = subscription.toJSON()
  const { error } = await db.from('push_subscriptions').upsert(
    {
      owner_type: ownerType,
      client_id: ownerType === 'client' ? clientId : null,
      coach_id: ownerType === 'coach' ? coachId : null,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth_key: json.keys.auth,
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw error
}

export async function disablePush(db) {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  const subscription = await reg?.pushManager.getSubscription()
  if (!subscription) return
  await db.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}
