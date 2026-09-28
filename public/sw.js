// Service worker de EduColor.
//
// El despliegue se hace sobre el portátil del profesor (la pizarra solo
// recibe el vídeo por HDMI), así que la caché del navegador es lo que
// decide si una actualización llega al profesor. Por eso el documento se
// sirve network-first y los recursos con hash en el nombre cache-first:
//
// - Navegación: network-first, con la caché del shell como único respaldo
//   sin red. Cache-first aquí dejaba el index.html clavado en la versión
//   del primer arranque, y ninguna actualización se propagaba nunca.
// - Recursos con hash de contenido: cache-first, porque bajo la misma URL
//   el contenido no cambia nunca.
// - /api: nunca se cachea. Son respuestas del backend (salud del modelo,
//   previews generados) que caducan con el tiempo.
//
// La caché de runtime está acotada porque los nombres llevan hash: cada
// despliegue deja atrás los ficheros de la versión anterior y, sin tope,
// se acumularían indefinidamente.

const CACHE_PREFIX = "educolor-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-v2`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v1`;
const MAX_RUNTIME_ENTRIES = 300;

const SHELL = ["/", "/index.html", "/manifest.webmanifest"];
// El documento se guarda bajo ambas claves para que el respaldo sin red
// sirva siempre la última versión vista en línea.
const SHELL_DOCUMENT = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      await Promise.all(SHELL_DOCUMENT.map((key) => cache.put(key, fresh.clone())));
    }
    return fresh;
  } catch {
    for (const key of [request.url, ...SHELL_DOCUMENT]) {
      const cached = await cache.match(key);
      if (cached) return cached;
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  if (fresh.ok) {
    await cache.put(request, fresh.clone());
    await trimRuntimeCache(cache);
  }
  return fresh;
}

// Descarte por antigüedad de inserción: `keys()` mantiene el orden en que
// se añadieron y el tope de 300 entradas deja margen de sobra para los
// recursos actuales, así que en la práctica solo actúa al encadenar
// despliegues.
async function trimRuntimeCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_RUNTIME_ENTRIES) return;
  for (const key of keys.slice(0, keys.length - MAX_RUNTIME_ENTRIES)) {
    await cache.delete(key);
  }
}
