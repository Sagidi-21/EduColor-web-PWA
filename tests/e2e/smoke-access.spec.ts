import { test, expect } from "@playwright/test";
import { ensureLoginMode, goToSchoolAccess } from "./helpers";

test.describe("Smoke acceso colegio", () => {
  test("Welcome → Entrar sin Video → pantalla de auth", async ({ page }) => {
    await goToSchoolAccess(page);
    await ensureLoginMode(page);
    await expect(page.getByRole("heading", { name: "Entrar al Colegio" })).toBeVisible();
    await expect(page.getByLabel(/Correo electrónico/i)).toBeEditable();
    await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: /Olvidé la contraseña/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Acceder al Registro/i })).toBeVisible();
  });
});
