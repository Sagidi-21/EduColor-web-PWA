import { test, expect } from "@playwright/test";
import { ensureLoginMode, fillLoginForm, goToSchoolAccess, uniqueE2EEmail } from "./helpers";

test.describe("Olvidé la contraseña", () => {
  test("mensaje neutro sin filtrar si el email existe", async ({ page }) => {
    await goToSchoolAccess(page);
    await ensureLoginMode(page);

    // Solo email: el botón forgot no exige contraseña.
    await fillLoginForm(page, uniqueE2EEmail("forgot"), "NoSeUsa1!");
    await page.getByRole("button", { name: /Olvidé la contraseña/i }).click();

    await expect(page.getByRole("status")).toContainText(/Si el email está registrado/i, {
      timeout: 20_000,
    });
  });

  test("sin email válido pide escribir el correo", async ({ page }) => {
    await goToSchoolAccess(page);
    await ensureLoginMode(page);

    await page.getByLabel(/Correo electrónico/i).fill("no-es-un-email");
    await page.getByRole("button", { name: /Olvidé la contraseña/i }).click();

    await expect(page.getByRole("alert")).toContainText(/Escribe tu correo electrónico/i);
  });
});
