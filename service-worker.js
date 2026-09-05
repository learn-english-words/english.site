const CACHE_NAME = "englishwords-app-v4";
const APP_SHELL = ["./", "./index.html", "./home-modern.css?v=2", "./home-live.css?v=3", "./home-pwa.css?v=1", "./home-mobile-compact.css?v=1", "./home-modern.js?v=6", "./manifest.webmanifest", "./app-icon-192.png", "./app-icon-512.png"];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
    if (event.request.mode === "navigate") {
        event.respondWith(fetch(event.request).then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            return response;
        }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html"))));
        return;
    }
    event.respondWith(caches.match(event.request).then(cached => {
        const network = fetch(event.request).then(response => {
            if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
            return response;
        });
        return cached || network;
    }));
});
