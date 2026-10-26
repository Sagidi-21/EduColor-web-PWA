# Sentry (errores de la app) — guía e integración

Sentry avisa cuando la **PWA se rompe** (error de JavaScript), no cuando alguien
falla el login (eso es el chip Seguridad + Resend).

Mapa completo de correos / lockout / Sentry:
[AUTH_ALERTAS_Y_CORREOS.md](../AUTH_ALERTAS_Y_CORREOS.md).

Plan **gratis** vale para el piloto.

---

## Cómo está integrado (código)

Ya está en el repo (no hace falta volver a cablear el SDK):

1. Paquete `@sentry/react`.
2. `src/platform/sentry.ts` — `initSentry()` solo si hay `VITE_SENTRY_DSN`;
   exporta `isSentryConfigured` y el namespace `Sentry`. Sin Session Replay.
3. `src/main.tsx` — llama `initSentry()` y envuelve la app en
   `Sentry.ErrorBoundary`.
4. Admin Central — chip **Sin Fallos** / hint según `isSentryConfigured()`.

Sin DSN la app funciona igual (útil en local sin cuenta Sentry).

Proyecto piloto: org **`home-x55`**, slug **`educolor-web-pwa`**.

---

## 1. Crear cuenta (si aún no)

1. Entra en [https://sentry.io/signup/](https://sentry.io/signup/).
2. Regístrate (puedes usar el mismo Gmail que Resend).
3. Organización (p. ej. la ya usada `home-x55`).

## 2. Crear proyecto (si aún no)

1. **Create Project**.
2. Plataforma: **React** (API: `javascript-react`).
3. Nombre / slug: `educolor-web-pwa`.
4. Alerta por email: activa avisos a tu Gmail cuando haya un error nuevo.

## 3. Copiar el DSN

1. **Settings** → **Client Keys (DSN)**.
2. Copia el **DSN** (`https://…@….ingest.…sentry.io/…`).
3. **No lo pegues en el chat** ni lo subas a git.

## 4. Variables de entorno

### Local (opcional)

En `.env` (no se sube a git):

```env
VITE_SENTRY_DSN=https://…tu-dsn…
```

Reinicia `npm run dev`.

### Netlify (producción)

Sitio: `peppy-cactus-71f921`. Variable: `VITE_SENTRY_DSN` (builds / production).

1. Site settings → **Environment variables**, o  
   `netlify env:set VITE_SENTRY_DSN "…"`.
2. Hace falta un **deploy/rebuild** para meter el DSN en el bundle.

El DSN es clave **pública de cliente**; no es la Auth Token de Sentry.

## 5. Comprobar

1. Con DSN en el build, en Admin Central el hint de **Sin Fallos** indica que
   Sentry está conectado.
2. Sentry → **Issues** ante errores reales.
3. Prueba local (opcional): en la consola del navegador, tras cargar la app,  
   `throw new Error("prueba-sentry-educolor")`.

## Qué no incluye este arranque

- Session Replay (grabación de pantalla) — desactivado a propósito.
- Source maps en CI — más adelante si hace falta depurar líneas minificadas.
- Errores del servidor Express / Edge Functions — solo la PWA en el navegador.
- Lockouts / fallos de login — ver [AUTH_ALERTAS_Y_CORREOS.md](../AUTH_ALERTAS_Y_CORREOS.md).
