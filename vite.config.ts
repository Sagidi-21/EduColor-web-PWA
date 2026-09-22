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
    ],
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
