import { apiRequest } from './api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

export async function subscribeToPush(): Promise<void> {
  if (!('Notification' in window)) return
  if (Notification.permission === 'denied') return

  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission()
    if (result !== 'granted') return
  }

  const registration = await registerServiceWorker()
  if (!registration) return

  // Check for existing subscription
  let subscription = await registration.pushManager.getSubscription()

  // If no subscription exists, create one
  if (!subscription) {
    let publicKey: string
    try {
      const resp = await apiRequest('/NotificationController/vapidPublicKey', { method: 'GET' })
      if (!resp.ok) return
      const data = (await resp.json()) as { publicKey: string }
      publicKey = data.publicKey
    } catch {
      return
    }

    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })
    } catch {
      return
    }
  }

  // Send subscription to backend (idempotent upsert)
  const subJson = subscription.toJSON()
  const endpoint = subJson.endpoint
  const keys = subJson.keys as { p256dh?: string; auth?: string } | undefined
  if (!endpoint || !keys?.p256dh || !keys?.auth) return

  try {
    const resp = await apiRequest('/NotificationController/subscribe', {
      method: 'POST',
      body: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    })
    if (!resp.ok) {
      const text = await resp.text()
      console.error('[notifications] Subscribe failed:', resp.status, text)
    } else {
      console.log('[notifications] Subscribed to push:', endpoint.slice(0, 60))
    }
  } catch (err) {
    console.error('[notifications] Subscribe error:', err)
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  const registration = await registerServiceWorker()
  if (!registration) return

  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint

  try {
    await apiRequest('/NotificationController/unsubscribe', {
      method: 'POST',
      body: { endpoint },
    })
  } catch {
    // best-effort
  }

  try {
    await subscription.unsubscribe()
  } catch {
    // best-effort
  }
}
