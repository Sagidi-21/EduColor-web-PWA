# Carpeta tests/ — Playwright E2E (excluida de Vitest)

Esta carpeta contiene **specs E2E de Playwright** (`*.spec.ts`).

## Por qué NO los ejecuta `npm test`

- Playwright requiere un navegador real y su propio runner
  (`npx playwright test`), no Vitest + happy-dom.
- Ejecutarlos desde Vitest provocaba:

  ```
  Playwright Test did not expect test.describe() to be called here.
  ```

- La configuración de Vitest (`vite.config.ts → test.exclude`) excluye
  `tests/**` explícitamente.

## Decisión y trazabilidad

- Decisión de estrategia de testing: `docs/DECISIONES.md` → **D-015**.
- Deuda técnica / camino para convertirlos en tests reales de CI:
  `docs/DEUDA_TECNICA.md` → **DT-009**.

## `portal-diagnostics.spec.ts`

Test de diagnóstico del componente `PortalTransition` (mascota).

**Qué hace hoy:**

- Abre `diagnostic-portal.html` (fixture HTML mock con la misma estructura
  CSS que el portal) en 3 niveles de zoom del body: `1x`, `1.25x`, `1.5x`.
- Captura métricas reales de layout en Chromium (viewport, bounding rects,
  computed styles) y las guarda como JSON en
  `test-results/playwright-diagnostics/`.
- Asegura que el overlay cubra todo el viewport con tolerancia < 2 px y
  que la imagen use `object-fit: contain`.

**Limitación importante:**

- **No valida el componente React real** (`PortalTransition.tsx`). El
  fixture HTML replica la lógica de CSS a mano y no ejercita
  `getZoomCorrectedViewport()`, el canvas de dissolve ni ningún
  comportamiento JS de React.
- Por eso **no protege de regresiones en el código fuente** — es una
  herramienta manual de depuración visual del layout/zoom.

**Cómo ejecutarlo (cuando Playwright esté configurado):**

```bash
npx playwright install          # binarios de navegador, solo la 1ª vez
npx playwright test tests/portal-diagnostics.spec.ts
```

Actualmente el repo **no tiene `playwright.config.ts`**, así que se trata
como un script de diagnóstico ad-hoc, no como suite de CI.
