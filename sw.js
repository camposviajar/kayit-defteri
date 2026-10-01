const CACHE = "kd3-pwa-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Önbellekten hemen aç, arkada ağdan tazele (yeni sürüm bir sonraki açılışta gelir). Ağ yoksa ya da yavaşsa uygulama beklemeden açılır.
self.addEventListener("fetch", e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET" || u.origin !== location.origin) return;     // sunucu istekleri (POST, başka alan adı) hiç önbelleğe girmez
  e.respondWith((async () => {
    const cache = await caches.open(CACHE), nav = req.mode === "navigate";
    const cached = (await cache.match(req, {ignoreSearch: true})) || (nav ? await cache.match("index.html") : null);
    const fresh = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }
    const r = await fresh;
    return r || (nav ? cache.match("index.html") : Response.error());
  })());
});
