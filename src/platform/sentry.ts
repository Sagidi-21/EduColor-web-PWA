import * as Sentry from "@sentry/react";

const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim() ?? "";

/** true si hay DSN configurado (prod/local con env). */
export function isSentryConfigured(): boolean {
  return dsn.length > 0;
}

/**
 * Inicializa Sentry solo si existe VITE_SENTRY_DSN.
 * Sin DSN la app funciona igual (piloto local sin cuenta).
 * No usamos Session Replay: aula / pantallas de colegio.
 */
export function initSentry(): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    // Errores: todos. Trazas de rendimiento: pocas (piloto).
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  });
}

export { Sentry };
