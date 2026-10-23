import { test, expect, type Page, type Response } from "@playwright/test";
import { ensureLoginMode, fillLoginForm, goToSchoolAccess, loginAsOwner } from "./helpers";

const STAGING_HOST = "inwmxkaazxfavyfanovg.supabase.co";
const PROD_HOST = "vrvyldqaacyxmarqbayd.supabase.co";

function requireStagingEnv(): void {
  const url = process.env.VITE_SUPABASE_URL ?? "";
  expect(url, "VITE_SUPABASE_URL debe apuntar a staging").toContain(STAGING_HOST);
  expect(url).not.toContain(PROD_HOST);
  expect(process.env.VITE_SUPABASE_ANON_KEY?.trim().length ?? 0).toBeGreaterThan(20);
}

function isContentFn(url: string): boolean {
  return (
    url.includes(STAGING_HOST) &&
    (url.includes("/functions/v1/content-session") ||
      url.includes("/functions/v1/content-ficha") ||
      url.includes("/functions/v1/start-demo-session"))
  );
}

function assertNoProd(url: string): void {
  expect(url, `petición inesperada a producción: ${url}`).not.toContain(PROD_HOST);
}

async function openPizarraSuma(page: Page): Promise<void> {
  await page.getByRole("button", { name: /1º/i }).first().click();
  await page.getByRole("button", { name: /Pizarra Digital/i }).click();
  await expect(page.getByRole("button", { name: /La suma/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /La suma/i }).click();
  await page.getByRole("button", { name: /Empezar Ejercicio/i }).click();
}

async function openFichaSuma(page: Page): Promise<void> {
  await page.getByRole("button", { name: /1º/i }).first().click();
  await page.getByRole("button", { name: /Generador de Fichas/i }).click();
  await expect(page.getByRole("button", { name: /La suma/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /La suma/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function waitContentSession(page: Page): Promise<{ status: number; body: unknown }> {
  const res = await page.waitForResponse(
    (r) =>
      isContentFn(r.url()) &&
      r.url().includes("content-session") &&
      r.request().method() === "POST",
    { timeout: 45_000 },
  );
  assertNoProd(res.url());
  expect(res.url()).toContain(STAGING_HOST);
  const body = await res.json().catch(() => null);
  return { status: res.status(), body };
}

function enterAnswerOnNumpad(page: Page, answer: number): Promise<void> {
  const digits = String(answer).split("").reverse();
  return (async () => {
    for (const d of digits) {
      await page.locator(".shared-numpad__key", { hasText: new RegExp(`^${d}$`) }).click();
    }
  })();
}

test.describe.configure({ mode: "serial" });

test.describe("P2 suma E2E → Supabase staging", () => {
  test.beforeAll(() => {
    requireStagingEnv();
  });

  test("1) usuario autorizado: carga ejercicios, corrige y no usa prod", async ({ page }) => {
    const contentUrls: string[] = [];
    page.on("request", (req) => {
      const u = req.url();
      if (u.includes("supabase.co")) {
        assertNoProd(u);
        if (isContentFn(u)) contentUrls.push(u);
      }
    });

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await loginAsOwner(page);

    const sessionPromise = waitContentSession(page);
    await openPizarraSuma(page);
    const session = await sessionPromise;

    expect(session.status).toBe(200);
    const exercises = (session.body as { exercises?: { a: number; b: number; answer: number }[] })
      ?.exercises;
    expect(exercises?.length ?? 0).toBeGreaterThan(0);

    await expect(page.getByText(/Cargando ejercicios/i)).toBeHidden({ timeout: 20_000 });
    await expect(page.locator(".ops__exercise")).toBeVisible();
    await expect(page.getByText(/\d+\s*\/\s*\d+/)).toBeVisible();

    const first = exercises![0]!;
    await enterAnswerOnNumpad(page, first.answer);
    await expect(page.getByText(/¡Muy bien!/i)).toBeVisible({ timeout: 10_000 });

    expect(contentUrls.length).toBeGreaterThan(0);
    for (const u of contentUrls) {
      expect(u).toContain(STAGING_HOST);
      expect(u).not.toContain(PROD_HOST);
    }

    const sensitiveLeak = consoleErrors.some((t) =>
      /service_role|eyJhbGciOi.*service_role/i.test(t),
    );
    expect(sensitiveLeak).toBe(false);
  });

  test("2) ficha alumno sin soluciones; soluciones con auth válida", async ({ page }) => {
    await loginAsOwner(page);

    type FichaBody = {
      modes?: string[];
      answersIncluded?: boolean;
      exercises?: { answer?: number }[];
    };

    const isContentFicha = (res: Response) =>
      res.url().includes("content-ficha") &&
      res.request().method() === "POST" &&
      res.url().includes(STAGING_HOST);

    const requestModes = (res: Response): string[] => {
      try {
        const data = res.request().postDataJSON() as { modes?: unknown } | null;
        return Array.isArray(data?.modes)
          ? data!.modes!.filter((m): m is string => typeof m === "string")
          : [];
      } catch {
        return [];
      }
    };

    await openFichaSuma(page);

    const alumnoCheck = page.getByLabel(/Alumno \(sin soluciones\)/i);
    const solCheck = page.getByLabel(/^Soluciones$/i);
    await expect(alumnoCheck).toBeChecked();

    // El modal abre con Soluciones marcado → 1.ª respuesta puede incluir answers.
    // Esperamos la respuesta disparada al dejar solo "alumno".
    const alumnoRespPromise = page.waitForResponse(
      async (res) => {
        if (!isContentFicha(res) || res.status() !== 200) return false;
        assertNoProd(res.url());
        const modes = requestModes(res);
        return modes.includes("alumno") && !modes.includes("soluciones");
      },
      { timeout: 30_000 },
    );
    if (await solCheck.isChecked()) {
      await solCheck.uncheck();
    }
    const alumnoHttp = await alumnoRespPromise;
    const alumnoBody = (await alumnoHttp.json()) as FichaBody;
    expect(alumnoBody.answersIncluded).toBe(false);
    const alumnoEx = alumnoBody.exercises ?? [];
    expect(alumnoEx.length).toBeGreaterThan(0);
    expect(alumnoEx.every((e) => e.answer === undefined || e.answer === null)).toBe(true);

    const iframe = page.frameLocator(".ficha-modal iframe").first();
    await expect(iframe.locator("body")).toBeVisible({ timeout: 15_000 });
    const alumnoHtml = await iframe.locator("body").innerHTML();
    expect(alumnoHtml.toLowerCase()).not.toMatch(/soluci[oó]n/);

    const solRespPromise = page.waitForResponse(
      async (res) => {
        if (!isContentFicha(res) || res.status() !== 200) return false;
        assertNoProd(res.url());
        const modes = requestModes(res);
        return modes.includes("soluciones");
      },
      { timeout: 30_000 },
    );
    await solCheck.check();
    const solHttp = await solRespPromise;
    const solBody = (await solHttp.json()) as FichaBody;
    expect(solBody.answersIncluded).toBe(true);
    const solEx = solBody.exercises ?? [];
    expect(solEx.length).toBeGreaterThan(0);
    expect(solEx.some((e) => typeof e.answer === "number")).toBe(true);
  });

  test("3) demo no puede lanzar suma", async ({ page }) => {
    await goToSchoolAccess(page);
    await page.getByRole("button", { name: /Continuar sin cuenta \(Probar DEMO\)/i }).click();
    await expect(page.getByRole("heading", { name: /¿Con qué clase trabajamos hoy/i })).toBeVisible(
      {
        timeout: 20_000,
      },
    );
    await page.getByRole("button", { name: /1º/i }).first().click();
    await page.getByRole("button", { name: /Pizarra Digital/i }).click();

    const suma = page.getByRole("button", { name: /La suma/i });
    await expect(suma).toBeVisible();
    await expect(suma).toBeDisabled();
    await expect(page.getByText(/No disponible en DEMO/i).first()).toBeVisible();
  });

  test("4) usuario sin permisos: school-login deniega el acceso a la app", async ({ page }) => {
    const email = process.env.E2E_NOACCESS_EMAIL?.trim();
    const password = process.env.E2E_NOACCESS_PASSWORD?.trim();
    test.skip(!email || !password, "Faltan E2E_NOACCESS_EMAIL / E2E_NOACCESS_PASSWORD");

    // Auth directo puede autenticar, pero la UI pasa por school-login, que exige
    // session_has_app_access / membership. Sin eso → mensaje genérico, sin home ni suma.
    let schoolLoginOk: boolean | null = null;
    let contentSessionHits = 0;
    page.on("response", async (res) => {
      const u = res.url();
      if (u.includes(PROD_HOST)) assertNoProd(u);
      if (u.includes("/functions/v1/school-login") && res.request().method() === "POST") {
        expect(u).toContain(STAGING_HOST);
        const body = await res.json().catch(() => null);
        schoolLoginOk =
          body && typeof body === "object" ? Boolean((body as { ok?: boolean }).ok) : null;
      }
      if (u.includes("/functions/v1/content-session") && res.request().method() === "POST") {
        contentSessionHits += 1;
      }
    });

    await goToSchoolAccess(page);
    await ensureLoginMode(page);
    await fillLoginForm(page, email!, password!);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page.getByRole("alert")).toContainText(/Credenciales inválidas/i, {
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: /¿Con qué clase trabajamos hoy/i })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: /La suma/i })).toHaveCount(0);
    expect(schoolLoginOk).toBe(false);
    expect(contentSessionHits).toBe(0);
  });

  test("5) fallo de API: Reintentar sin generar en cliente; luego recupera desde staging", async ({
    page,
  }) => {
    await loginAsOwner(page);

    // Bloquear hasta pulsar Reintentar (cubre doble mount de React Strict Mode).
    let blockContentSession = true;
    await page.route("**/functions/v1/content-session**", async (route) => {
      const u = route.request().url();
      assertNoProd(u);
      if (!u.includes(STAGING_HOST)) {
        await route.continue();
        return;
      }
      if (blockContentSession) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
        return;
      }
      await route.continue();
    });

    await openPizarraSuma(page);
    await expect(page.getByRole("button", { name: /Reintentar/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText(/No se pudieron cargar|Server error|Error al llamar/i),
    ).toBeVisible();
    await expect(page.locator(".ops__exercise")).toHaveCount(0);

    blockContentSession = false;
    const recover = waitContentSession(page);
    await page.getByRole("button", { name: /Reintentar/i }).click();
    const session = await recover;
    expect(session.status).toBe(200);
    expect(((session.body as { exercises?: unknown[] })?.exercises ?? []).length).toBeGreaterThan(
      0,
    );
    await expect(page.locator(".ops__exercise")).toBeVisible({ timeout: 20_000 });
  });
});
