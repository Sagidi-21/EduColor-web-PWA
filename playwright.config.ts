import { defineConfig, devices } from "@playwright/test";

/**
 * E2E staff / auth (D-015): independiente de Vitest.
 * Smoke siempre; login real solo si hay E2E_OWNER_EMAIL + E2E_OWNER_PASSWORD.
 */
const baseURL = process.env.E2E_BASE_URL?.trim() || "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Host explícito: Playwright espera 127.0.0.1, no solo "localhost".
        command: "npx vite --host 127.0.0.1 --port 5173",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
