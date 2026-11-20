const CACHE = "mamar-v2";

const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests from this website.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Navigation: network first, cached homepage as fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/");

        return (
          cached ||
          new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        );
      })
    );

    return;
  }

  // Cache only built assets.
  if (!url.pathname.startsWith("/assets/")) {
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const saved = await cache.match(request);

      if (saved) return saved;

      try {
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      } catch {
        return new Response("Asset unavailable.", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })
  );
});