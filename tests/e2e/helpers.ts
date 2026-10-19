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

export async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel(/Correo electrónico/i).fill(email);
  await page.getByLabel(/^Contraseña$/i).fill(password);
}

/** Login owner real → home. Requiere E2E_OWNER_*. */
export async function loginAsOwner(page: Page): Promise<void> {
  if (!hasOwnerCredentials()) {
    throw new Error("Faltan E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD");
  }
  const email = process.env.E2E_OWNER_EMAIL!.trim();
  const password = process.env.E2E_OWNER_PASSWORD!.trim();

  await goToSchoolAccess(page);
  await ensureLoginMode(page);
  await fillLoginForm(page, email, password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /¿Con qué clase trabajamos hoy/i })).toBeVisible({
    timeout: 30_000,
  });
}

/** Email único por corrida (lockout email+IP; no reutilizar). */
export function uniqueE2EEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@educolor.test`;
}
