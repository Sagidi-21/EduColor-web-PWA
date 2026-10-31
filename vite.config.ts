import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "EduColor",
        short_name: "EduColor",
        description: "Plataforma educativa de Matemáticas para Primaria",
        theme_color: "#5b4bdb",
        background_color: "#f8f7ff",
        display: "standalone",
        orientation: "landscape-primary",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Nueva sesión",
            short_name: "Nueva",
            url: "/?new=1",
            description: "Iniciar actividad rápida",
          },
        ],
        categories: ["education"],
        screenshots: [],
      },
      workbox: {
        // Sin mp4 en precache: los vídeos de celebración/libro superan 2 MiB y
        // rompían el build de Netlify. Se sirven bajo demanda (runtimeCaching /assets/).
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,json,bin,webp,jpg,jpeg}"],
        globIgnores: ["**/benchmark-digit.html", "**/*.mp4", "**/*.webm"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/model\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "educolor-model",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/assets\/.*/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "educolor-assets" },
          },
          {
            urlPattern: /\/manifests\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "educolor-manifests",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100 },
            },
          },
          {
            urlPattern: /manifest\.webmanifest$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "educolor-manifest",
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /\/api\/.*/,
            handler: "NetworkFirst",
            options: { cacheName: "educolor-api" },
          },
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "educolor-shell",
              networkTimeoutSeconds: 3,
              plugins: [
                {
                  handlerDidError: async () =>
                    (await caches.match("/offline.html")) || Response.error(),
                },
              ],
            },
          },
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      // En local el SW de VitePWA cacheaba CSS/JS y ocultaba cambios (HMR “fantasma”).
      // La PWA real solo se registra en build/prod (`serviceWorkerRegistration.ts`).
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: "happy-dom",
    // happy-dom ≥21 desactiva iframes por defecto (mitigación SSRF). Los tests
    // de PDF montan iframes about:blank; hay que reactivar solo en Vitest.
    environmentOptions: {
      happyDOM: {
        settings: {
          enableIframePageLoading: true,
        },
      },
    },
    // `pool: "vmThreads"` en vez del fork por defecto: en Windows los workers
    // de Vitest (forks de Node) se cuelgan con el código 0xC0000045 cuando la
    // suite es grande (126 archivos de test), aunque todos los tests pasen.
    // vmThreads ejecuta los workers en el mismo proceso, sin forks, y evita
    // ese crash. Mantiene el aislamiento por archivo (cada test文件 tiene su
    // propio entorno) pero sin el coste de arrancar un Node por archivo.
    // Decisión D-025.
    pool: "vmThreads",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
    exclude: [
      ...configDefaults.exclude,
      "electron-reference/**",
      // La carpeta tests/ contiene specs E2E de Playwright (*.spec.ts) que
      // requieren un navegador real y su propio runner (@playwright/test).
      // Vitest + happy-dom no puede ejecutarlos (provocan "test.describe() not
      // expected") y además algunos specs usan fixtures HTML mock que no
      // protegen de regresiones en el código React.
      // Decisión: docs/DECISIONES.md → D-015. Deuda técnica: docs/DEUDA_TECNICA.md → DT-009.
      "tests/**",
      // Los worktrees de Agent Manager contienen una copia completa de src/
      // con sus propios archivos .test.ts. El patrón anterior solo excluía su
      // carpeta tests/, así que sus tests se ejecutaban junto con los de la
      // rama actual, inflando el recuento y validando código de otra rama.
      ".kilo/**",
    ],
    coverage: {
      provider: "v8",
      // `skipFull` es opción del reporter, no global: sin ella los archivos con
      // 100 % en las cuatro métricas desaparecen del informe y sus cifras se
      // mezclan con las de los demás.
      reporter: ["text-summary", ["text", { skipFull: false }], "html"],
      reportsDirectory: "coverage",
      // Estándar de cobertura: docs/ops/DEFINITION_OF_DONE.md y DEUDA_TECNICA.md DT-014.
      //
      // El umbral se fija solo sobre `src/core/activities/`, que es donde vive la
      // lógica matemática que decide si la respuesta del alumno es correcta. Todas
      // las funciones están cubiertas; quedan ramas defensivas y randomizadas.
      //
      // No se aplica `thresholds` global a propósito: los renderers, la
      // plataforma de dígitos y el backend tienen una cobertura baja y sube
      // mayoritariamente, y un umbral global obligaría a escribir pruebas que
      // el Definición de Done no exige (admite justificación explícita).
      include: ["src/core/activities/**/*.ts"],
      exclude: ["**/*.test.ts"],
      thresholds: {
        lines: 90,
        functions: 100,
        statements: 90,
        branches: 85,
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
