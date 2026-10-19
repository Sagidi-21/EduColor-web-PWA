import { type Page, expect } from "@playwright/test";

/** Welcome → pantalla de acceso colegio (sin vídeo). */
export async function goToSchoolAccess(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Entrar sin Video/i })).toBeVisible();
  await page.getByRole("button", { name: /Entrar sin Video/i }).click();
  // Ambos headings están en el DOM en desktop; basta con el CTA del slider o el título de registro.
  await expect(page.getByRole("button", { name: /Acceder aquí|Acceder al Registro/i })).toBeVisible({
    timeout: 20_000,
  });
}

/**
 * Abre el panel de login si estamos en modo registro.
 * En desktop (≥768) el pane login está en DOM con opacity:0; Playwright lo
 * considera "visible", así que no basta con el heading — usamos el CTA del slider.
 */
export async function ensureLoginMode(page: Page): Promise<void> {
  const loginCta = page.getByRole("button", { name: "Entrar", exact: true });
  const alreadyOnLogin = page.getByRole("button", { name: /Acceder al Registro/i });

  if (await alreadyOnLogin.isVisible().catch(() => false)) {
    await expect(loginCta).toBeVisible();
    return;
  }

  const desktopSwitch = page.getByRole("button", { name: /Acceder aquí/i });
  const mobileSwitch = page.getByRole("button", { name: /Ya estás registrado|Iniciar sesión/i });

  if (await desktopSwitch.isVisible().catch(() => false)) {
    await desktopSwitch.click();
  } else if (await mobileSwitch.isVisible().catch(() => false)) {
    await mobileSwitch.click();
  } else {
    throw new Error("No se encontró el control para pasar a modo login");
  }

  // Espera fin de la transición del slider (0.65s) y panel accionable.
  await expect(alreadyOnLogin).toBeVisible({ timeout: 10_000 });
  await expect(loginCta).toBeVisible();
  await expect(page.getByLabel(/Correo electrónico/i)).toBeEditable();
}

export function hasOwnerCredentials(): boolean {
  return Boolean(process.env.E2E_OWNER_EMAIL?.trim() && process.env.E2E_OWNER_PASSWORD?.trim());
}
