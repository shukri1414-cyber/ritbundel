// RitBundel service worker: caches the app and its libraries, never customer data.
const V = "rb-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
const LIB_HOSTS = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // App files: network first, so updates arrive; cache when offline.
                      if (u.origin === location.origin) {
                        e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })
                                      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
                        return;
                      }
  // Libraries and OCR language data: cache first.
                      if (LIB_HOSTS.includes(u.hostname)) {
                        e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
                          if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); }
                          return r;
                        })));
                      }
  // Everything else (address lookups) goes straight to the network and is not stored.
});
