import { test, expect } from "@playwright/test";
import { ensureLoginMode, fillLoginForm, goToSchoolAccess, uniqueE2EEmail } from "./helpers";

test.describe("Lockout login (D-037)", () => {
  test("tras 3 fallos muestra bloqueo de 15 minutos", async ({ page }) => {
    test.setTimeout(120_000);

    const email = uniqueE2EEmail("lockout");
    const password = "ClaveFals4!";

    await goToSchoolAccess(page);
    await ensureLoginMode(page);
    await fillLoginForm(page, email, password);

    const entrar = page.getByRole("button", { name: "Entrar", exact: true });

    // 1.er y 2.º fallo → credenciales inválidas
    for (let i = 0; i < 2; i++) {
      await entrar.click();
      await expect(page.getByRole("alert")).toContainText(/Credenciales inválidas/i, {
        timeout: 25_000,
      });
    }

    // 3.er fallo → lockout (mismo email + IP)
    await entrar.click();
    await expect(page.getByRole("alert")).toContainText(
      /Demasiadas credenciales inválidas\. Espera 15 minutos/i, // + aviso correo si existe
      { timeout: 25_000 },
    );
  });
});
