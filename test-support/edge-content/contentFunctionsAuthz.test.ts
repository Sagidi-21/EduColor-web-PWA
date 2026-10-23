/**
 * Garantiza que toda función Edge `content-*` resuelve el caller y aplica
 * autorización antes de generar contenido. Falla si se añade una carpeta
 * content-* sin ese flujo.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  authorizeActivity,
  type ContentCaller,
} from "../../supabase/functions/_shared/authzPolicy.ts";
import {
  handleContentFicha,
  handleContentSession,
} from "../../supabase/functions/_shared/contentHandlers.ts";

const root = process.cwd();
const functionsRoot = resolve(root, "supabase/functions");

function listContentFunctionNames(): string[] {
  return readdirSync(functionsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("content-"))
    .map((d) => d.name)
    .sort();
}

function readFunctionIndex(name: string): string {
  const path = resolve(functionsRoot, name, "index.ts");
  expect(existsSync(path), `falta ${name}/index.ts`).toBe(true);
  return readFileSync(path, "utf8");
}

/** Orden de llamadas en el handler Deno: resolveCaller(...) antes de handleContent*(...). */
function assertAuthzBeforeEngine(source: string, functionName: string): void {
  expect(source, `${functionName}: debe importar resolveCaller`).toMatch(
    /import\s*\{[^}]*\bresolveCaller\b[^}]*\}\s*from/,
  );

  const resolveCall = source.search(/\bresolveCaller\s*\(/);
  expect(resolveCall, `${functionName}: debe invocar resolveCaller(`).toBeGreaterThanOrEqual(0);

  const handleMatch = source.match(/\b(handleContent\w*)\s*\(/);
  expect(handleMatch, `${functionName}: debe delegar en handleContent*`).not.toBeNull();
  const handleName = handleMatch![1]!;
  const handleCall = handleMatch!.index!;
  expect(
    resolveCall,
    `${functionName}: resolveCaller debe ejecutarse antes de ${handleName}`,
  ).toBeLessThan(handleCall);

  // El caller resuelto se pasa al handler (no se ignora).
  expect(source, `${functionName}: ${handleName}(caller, …)`).toMatch(
    new RegExp(`\\b${handleName}\\s*\\(\\s*caller\\b`),
  );

  // El entrypoint no debe generar ejercicios directamente.
  expect(source).not.toMatch(/\bgenerateSumaSession\s*\(/);
  expect(source).not.toMatch(/\bgenerateSession\s*\(/);
}

describe("content-* Edge entrypoints: authz antes del motor", () => {
  it("existe al menos content-session y content-ficha", () => {
    const names = listContentFunctionNames();
    expect(names).toContain("content-session");
    expect(names).toContain("content-ficha");
    expect(names.length).toBeGreaterThanOrEqual(2);
  });

  it("cada content-* resuelve caller y autoriza antes de generar", () => {
    for (const name of listContentFunctionNames()) {
      assertAuthzBeforeEngine(readFunctionIndex(name), name);
    }
  });

  it("verify_jwt=false está documentado en cada content-*", () => {
    for (const name of listContentFunctionNames()) {
      const cfgPath = resolve(functionsRoot, name, "config.toml");
      expect(existsSync(cfgPath), `${name}/config.toml`).toBe(true);
      const cfg = readFileSync(cfgPath, "utf8");
      expect(cfg, `${name}: verify_jwt = false`).toMatch(/verify_jwt\s*=\s*false/);
      expect(cfg, `${name}: justificar demo_/authz propia`).toMatch(/demo_|authz|Authorization/i);
    }
  });
});

describe("flujo de autorización (handlers, no solo texto)", () => {
  const anonymous: ContentCaller = { kind: "anonymous" };
  const demo: ContentCaller = { kind: "demo", demoSessionId: "d-1" };
  const registered: ContentCaller = { kind: "registered", userId: "u-1" };
  const body = { activityId: "suma", difficulty: "easy", seed: 42 };

  it("anónimo no obtiene sesión ni ficha ni soluciones", () => {
    expect(authorizeActivity(anonymous, "suma").ok).toBe(false);
    expect(handleContentSession(anonymous, body).status).toBe(401);
    expect(handleContentFicha(anonymous, { ...body, modes: ["soluciones"] }).status).toBe(401);
  });

  it("demo no obtiene suma (ni ejercicios ni respuestas)", () => {
    expect(authorizeActivity(demo, "suma")).toEqual({
      ok: false,
      status: 403,
      error: "Forbidden",
    });
    expect(handleContentSession(demo, body).status).toBe(403);
    const ficha = handleContentFicha(demo, { ...body, modes: ["soluciones"], count: 3 });
    expect(ficha.status).toBe(403);
    expect(ficha.body).not.toHaveProperty("exercises");
  });

  it("registrado sí obtiene sesión y ficha/soluciones tras authz", () => {
    expect(authorizeActivity(registered, "suma").ok).toBe(true);
    const session = handleContentSession(registered, body);
    expect(session.status).toBe(200);
    if (session.status === 200) {
      expect(Array.isArray(session.body.exercises)).toBe(true);
    }
    const ficha = handleContentFicha(registered, { ...body, modes: ["soluciones"], count: 3 });
    expect(ficha.status).toBe(200);
    if (ficha.status === 200) {
      expect(ficha.body.answersIncluded).toBe(true);
      const exercises = ficha.body.exercises as Array<{ answer?: number }>;
      expect(exercises.every((e) => typeof e.answer === "number")).toBe(true);
    }
  });
});

describe("espejo de motor fuera del grafo Vite (src/)", () => {
  it("src/platform/content-api no contiene sumaEngine ni handlers Edge", () => {
    const dir = resolve(root, "src/platform/content-api");
    const files = existsSync(dir) ? readdirSync(dir) : [];
    expect(files).not.toContain("sumaEngine.ts");
    expect(files).not.toContain("sumSheet.ts");
    expect(files).not.toContain("contentHandlers.ts");
    expect(files).not.toContain("authzPolicy.ts");
    expect(files).not.toContain("demoAllowlist.ts");
    expect(files).toContain("contentClient.ts");
  });
});
