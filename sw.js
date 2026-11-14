const CACHE = 'cn-v1'
const FILES = ['./', './parse.js', './manifest.webmanifest', './icon.svg', './icon.png', './icon-192.png']

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())))
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Network first, so an updated page shows up on the next open without cache versioning; the cache answers when offline.
self.addEventListener('fetch', (e) => {
  // Share target (manifest share_target): another app shared a file or text to us. Park it in the cache and open the app,
  // which picks it up from there; a POST body cannot be handed to the page any other way.
  if (e.request.method === 'POST' && new URL(e.request.url).pathname.endsWith('/share')) {
    e.respondWith((async () => {
      const form = await e.request.formData()
      const texts = await Promise.all(form.getAll('files').map((f) => f.text()))
      const typed = [form.get('title'), form.get('text')].filter(Boolean).join('\n') // shared as plain text instead of a file
      if (!texts.length && typed) texts.push(typed)
      await (await caches.open(CACHE)).put(new URL('shared', self.location).href, new Response(JSON.stringify(texts)))
      return Response.redirect(new URL('./', self.location).href, 303)
    })())
    return
  }
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return
  // no-cache = always revalidate with the server: the browser's HTTP cache otherwise pairs a new index.html with an old parse.js, and the page dies on a missing import
  e.respondWith(fetch(e.request.url, { cache: 'no-cache' }).then(
    (r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)) }
      return r
    },
    () => caches.match(e.request, { ignoreSearch: true }),
  ))
})
