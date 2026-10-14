// Offline cache: the app works without internet after the first start.
const CACHE = "kh-0a4b027dd6";
const FILES = [
"./",
"Outfit-Bold.ttf",
"Outfit-Regular.ttf",
"Poppins-Bold.ttf",
"Poppins-Medium.ttf",
"Poppins-Regular.ttf",
"app.js",
"apple-touch-icon.png",
"icon-192.png",
"icon-512.png",
"index.html",
"lang-de.js",
"lang-en.js",
"lang-es.js",
"lang-fr.js",
"lang-it.js",
"lang-nl.js",
"lang-pl.js",
"lang-tr.js",
"manifest.webmanifest",
"web-bridge.js"
];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
