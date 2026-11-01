// Service worker — makes the site installable as a PWA, and shows the live
// chat's reply notifications (push handlers below, ported from MIMOSALSD).
// It deliberately does NOT cache anything: the site is highly dynamic
// (orders, availability, admin), and a stale cache is worse than no cache.
// Every request passes straight through to the network.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", () => {
  // Intentionally empty — default network handling for all requests.
});

// ─── Push: the team's chat replies, shown even when no page is open ─────────
const APP_ICON = '/pwa/icon-192.png'
// Android draws this white-on-transparent in the status bar, the way it draws every
// messaging app's small icon. Other platforms ignore it.
const STATUS_BAR_BADGE = '/pwa/icon-192.png'

/** A same-site path to open, never another site. Kept pure, and tested. */
function notificationTarget(data) {
  const fallback = data && data.tag === 'chat-reply' ? '/en/account/chat' : '/en'
  const raw = data && typeof data.url === 'string' ? data.url : fallback
  try {
    const url = new URL(raw, self.location.origin)
    return url.origin === self.location.origin ? url.href : new URL(fallback, self.location.origin).href
  } catch {
    return new URL(fallback, self.location.origin).href
  }
}

/** What to show for one push. Kept pure, and tested. */
function notificationFor(payload) {
  const data = payload && typeof payload === 'object' ? payload : {}
  const title = typeof data.title === 'string' && data.title ? data.title : 'Splash Republic'
  const options = {
    body: typeof data.body === 'string' ? data.body : '',
    icon: APP_ICON,
    badge: STATUS_BAR_BADGE,
    // Buzz like a message arriving. Ignored where the platform decides for itself.
    vibrate: [180, 80, 180],
    timestamp: Date.now(),
    data: { url: notificationTarget(data), tag: typeof data.tag === 'string' ? data.tag : undefined },
  }
  if (typeof data.tag === 'string' && data.tag) {
    // Same tag: replace the earlier notification rather than stack another, and
    // still alert, so a second reply in a conversation is not silent.
    options.tag = data.tag
    options.renotify = true
  }
  return { title, options, badgeCount: typeof data.badgeCount === 'number' ? data.badgeCount : 0 }
}

function readPayload(event) {
  if (!event.data) return {}
  try {
    return event.data.json()
  } catch {
    try {
      return { body: event.data.text() }
    } catch {
      return {}
    }
  }
}

self.addEventListener('push', (event) => {
  const { title, options, badgeCount } = notificationFor(readPayload(event))
  const shown = self.registration.showNotification(title, options)
  // The red count on the app icon, where the platform has one (an installed app on
  // iPhone, Android launchers that show dots, desktop Chrome and Edge).
  const badge =
    badgeCount > 0 && self.navigator && typeof self.navigator.setAppBadge === 'function'
      ? self.navigator.setAppBadge(badgeCount).catch(() => {})
      : Promise.resolve()
  event.waitUntil(Promise.all([shown, badge]))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = notificationTarget(event.notification.data)
  event.waitUntil(
    (async () => {
      if (self.navigator && typeof self.navigator.clearAppBadge === 'function') {
        await self.navigator.clearAppBadge().catch(() => {})
      }
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      // Reuse an open window of the site, the way a messaging app comes to the front
      // rather than opening a second copy of itself.
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
      if (open) {
        try {
          const focused = await open.focus()
          if (open.url !== target && typeof focused.navigate === 'function') await focused.navigate(target)
          return
        } catch {
          // An uncontrolled window cannot be navigated from here; open the page instead.
        }
      }
      await self.clients.openWindow(target)
    })(),
  )
})

/*
 * The browser replaced its push subscription (keys expire or are rotated). Without
 * this the old endpoint starts failing and the person silently stops receiving
 * anything until they turn notifications on again by hand.
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch('/api/push/subscribe', { credentials: 'same-origin' })
      if (!response.ok) return
      const { publicKey } = await response.json()
      const padded = (publicKey + '==='.slice((publicKey.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/')
      const key = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
      const subscription =
        event.newSubscription ||
        (await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }))
      await fetch('/api/push/subscribe', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription.toJSON(),
          replaces: event.oldSubscription ? event.oldSubscription.endpoint : undefined,
        }),
      })
    })().catch(() => {}),
  )
})
