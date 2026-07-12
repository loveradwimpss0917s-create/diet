const CACHE_NAME = "ai-meal-tracker-v1";
const PRECACHE_URLS = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// 静的アセット（precache対象）のみキャッシュ優先。
// それ以外（ページ・APIなど動的コンテンツ）は常にネットワークから取得し、
// 食事データ等が古い状態で表示されるのを防ぐ。
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!PRECACHE_URLS.some((url) => event.request.url.endsWith(url))) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
  );
});
