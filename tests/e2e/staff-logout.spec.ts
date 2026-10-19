import { test, expect } from "@playwright/test";
import { hasOwnerCredentials, loginAsOwner } from "./helpers";

test.describe("Cerrar sesión", () => {
  test.skip(!hasOwnerCredentials(), "Define E2E_OWNER_EMAIL y E2E_OWNER_PASSWORD en el entorno");

  test("logout vuelve a la pantalla de acceso colegio", async ({ page }) => {
    await loginAsOwner(page);

    await page.getByRole("button", { name: /Cerrar Sesión/i }).click();

    await expect(page.getByRole("button", { name: /Acceder aquí|Acceder al Registro/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: /Cerrar Sesión/i })).toHaveCount(0);
  });
});
