# Sentry (errores de la app) — guía paso a paso

Sentry avisa cuando la **PWA se rompe** (error de JavaScript), no cuando alguien
falla el login (eso es el chip Seguridad + Resend).

Plan **gratis** vale para el piloto.

---

## 1. Crear cuenta

1. Entra en [https://sentry.io/signup/](https://sentry.io/signup/).
2. Regístrate (puedes usar el mismo Gmail que Resend).
3. Elige o crea una organización (p. ej. `EduColor`).

## 2. Crear proyecto

1. **Create Project**.
2. Plataforma: **React**.
3. Nombre: `educolor-web-pwa` (o similar).
4. Alerta por email: activa avisos a tu Gmail cuando haya un error nuevo.

## 3. Copiar el DSN

1. En el proyecto: **Settings** → **Client Keys (DSN)** (o la pantalla de setup).
2. Copia el **DSN** (empieza por `https://…@….ingest.sentry.io/…`).
3. **No lo pegues en el chat** ni lo subas a git.

## 4. Variables de entorno

### Local (opcional, para probar)

En `.env` (no se sube a git):

```env
VITE_SENTRY_DSN=https://…tu-dsn…
```

Reinicia `npm run dev`.

### Netlify (producción)

Sitio: `peppy-cactus-71f921`. Variable: `VITE_SENTRY_DSN` (contexto all / builds).

1. Site settings → **Environment variables** (o CLI: `netlify env:set VITE_SENTRY_DSN "…"`).
2. Ambientes: Production (y Preview si quieres).
3. Tras el próximo deploy que incluya el código Sentry, quedará activo en la URL pública.

El DSN es una clave **pública de cliente** (va en el bundle); no es la Auth Token
de Sentry. No hace falta Auth Token para este arranque mínimo.

## 5. Comprobar

1. Con DSN configurado, en Admin Central el chip **Sin Fallos** indica que Sentry
   está conectado.
2. En Sentry → **Issues** deberían aparecer errores reales si algo falla.
3. Prueba opcional (solo en local): en la consola del navegador  
   `throw new Error("prueba-sentry-educolor")` tras cargar la app — debe salir
   un issue en Sentry en unos segundos.

## Qué no incluye este arranque

- Session Replay (grabación de pantalla) — desactivado a propósito.
- Source maps en CI — más adelante si hace falta depurar líneas minificadas.
- Errores del servidor Express / Edge — solo la PWA en el navegador.
