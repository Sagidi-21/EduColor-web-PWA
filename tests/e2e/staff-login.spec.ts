import { test, expect } from "@playwright/test";
import { ensureLoginMode, goToSchoolAccess, hasOwnerCredentials } from "./helpers";

test.describe("Login fallido", () => {
  test("credenciales inválidas muestran mensaje genérico", async ({ page }) => {
    await goToSchoolAccess(page);
    await ensureLoginMode(page);

    await page.getByLabel(/Correo electrónico/i).fill("no-existe-e2e@educolor.test");
    await page.getByLabel(/^Contraseña$/i).fill("ClaveFals4!");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page.getByRole("alert")).toContainText(/Credenciales inválidas/i, {
      timeout: 20_000,
    });
  });
});

test.describe("Login owner (credenciales reales)", () => {
  test.skip(!hasOwnerCredentials(), "Define E2E_OWNER_EMAIL y E2E_OWNER_PASSWORD en el entorno");

  test("login válido llega al home con clases", async ({ page }) => {
    const email = process.env.E2E_OWNER_EMAIL!.trim();
    const password = process.env.E2E_OWNER_PASSWORD!.trim();

    await goToSchoolAccess(page);
    await ensureLoginMode(page);

    await page.getByLabel(/Correo electrónico/i).fill(email);
    await page.getByLabel(/^Contraseña$/i).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page.getByRole("heading", { name: /¿Con qué clase trabajamos hoy/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /Cerrar Sesión/i })).toBeVisible();
  });
});
