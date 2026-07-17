// Minimal service worker — exists to make the site installable as a PWA.
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
