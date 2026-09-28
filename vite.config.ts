import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
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
      // Estándar de cobertura: docs/DEFINITION_OF_DONE.md y DEUDA_TECNICA.md DT-014.
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
