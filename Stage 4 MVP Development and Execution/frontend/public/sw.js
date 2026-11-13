// MAMAR service worker: lets the site install on the phone like an app (PWA) and opens the
// last visited pages when the network is weak. API calls always go to the network.
const CACHE = "mamar-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Only this site's own GET files; the API and other sites are never cached.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    // Pages: network first, the saved app shell when offline.
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }
  // Built files (JS, CSS, images): saved copy first, then the network.
  event.respondWith(
    caches.match(request).then(
      (saved) =>
        saved ||
        fetch(request).then((response) => {
          if (response.ok && url.pathname.startsWith("/assets/")) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
