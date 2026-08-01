const CACHE_NAME = "dms-shell-v3";
const SHELL_ASSETS = ["/login", "/manifest.webmanifest", "/icon-192x192.png", "/icon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Page navigations (including the PWA's start_url launch) must be left to
  // the browser's normal network handling. proxy.ts always redirects "/" to
  // either /login or /home - and Chrome refuses to let a service worker
  // respond to a navigation with a response that went through a redirect
  // ("response.redirected"), throwing a network error instead of rendering
  // anything. That's exactly what caused the blank-white-screen-on-reopen
  // bug: the service worker only starts controlling the page *after* its
  // first install, so the very first launch (before it took over) worked,
  // but every relaunch afterward hit this straight away.
  if (event.request.mode === "navigate") return;

  const url = new URL(event.request.url);

  // Next's own build output (/_next/static/...) is content-hashed and never
  // changes for a given deploy - serve it straight from cache instead of
  // re-validating over the network on every navigation, and only go to the
  // network the first time a given hash is requested.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
            return response;
          })
      )
    );
    return;
  }

  // Everything else (API calls, pages) stays network-first so data screens
  // stay fresh; falls back to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
