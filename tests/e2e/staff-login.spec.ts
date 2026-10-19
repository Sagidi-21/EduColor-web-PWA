import { test, expect } from "@playwright/test";
import {
  ensureLoginMode,
  fillLoginForm,
  goToSchoolAccess,
  hasOwnerCredentials,
  loginAsOwner,
  uniqueE2EEmail,
} from "./helpers";

test.describe("Login fallido", () => {
  test("credenciales inválidas muestran mensaje genérico", async ({ page }) => {
    await goToSchoolAccess(page);
    await ensureLoginMode(page);

    await fillLoginForm(page, uniqueE2EEmail("invalid"), "ClaveFals4!");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page.getByRole("alert")).toContainText(/Credenciales inválidas/i, {
      timeout: 20_000,
    });
  });
});

test.describe("Login owner (credenciales reales)", () => {
  test.skip(!hasOwnerCredentials(), "Define E2E_OWNER_EMAIL y E2E_OWNER_PASSWORD en el entorno");

  test("login válido llega al home con clases", async ({ page }) => {
    await loginAsOwner(page);
    await expect(page.getByRole("button", { name: /Cerrar Sesión/i })).toBeVisible();
  });
});
