// AR Rakshak PWA Service Worker for Offline Operation
const CACHE_NAME = "ar-rakshak-v2.0.1";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/config.js",
  "/js/i18n.js",
  "/js/theme.js",
  "/js/router.js",
  "/js/auth.js",
  "/js/storage.js",
  "/js/api.js",
  "/js/camera.js",
  "/js/ui.js",
  "/js/worker.js",
  "/js/training.js",
  "/js/incident.js",
  "/js/dashboard.js",
  "/js/certificate.js",
  "/js/gps.js",
  "/js/sos.js",
  "/js/assistant.js",
  "/js/checklist.js",
  "/js/passport.js",
  "/js/simulator.js",
  "/js/analytics.js",
  "/js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for API requests, falling back to cached response
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (event.request.method !== "GET") return;

  // Network-first for application assets so code updates apply immediately; cache is the offline fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
