import { describe, expect, it } from "vitest";
import {
  authorizeActivity,
  clientAuthFieldsRejected,
  isDemoTokenExpired,
  type ContentCaller,
} from "./authzPolicy";
import { handleContentFicha, handleContentSession } from "./contentHandlers";
import {
  DEMO_ALLOWED_ACTIVITY_IDS,
  isDemoActivityAllowed,
  isEdgeImplementedActivity,
} from "./demoAllowlist";
import { generateSumaSession } from "./sumaEngine";
import { sumaExercisesToSheet } from "./sumSheet";

const registered: ContentCaller = { kind: "registered", userId: "u-1" };
const demo: ContentCaller = { kind: "demo", demoSessionId: "d-1" };
const anonymous: ContentCaller = { kind: "anonymous" };

describe("D0 demo allowlist", () => {
  it("incluye exactamente las 8 actividades demo aprobadas", () => {
    expect([...DEMO_ALLOWED_ACTIVITY_IDS].sort()).toEqual(
      [
        "amigos10",
        "comparison",
        "counting",
        "leftRight",
        "multiplicacion",
        "ordenar",
        "relacionar",
        "seriesNumericas",
      ].sort(),
    );
  });

  it("no permite suma en demo", () => {
    expect(isDemoActivityAllowed("suma")).toBe(false);
  });

  it("marca suma como implementada en Edge (D1)", () => {
    expect(isEdgeImplementedActivity("suma")).toBe(true);
    expect(isEdgeImplementedActivity("counting")).toBe(false);
  });
});

describe("D0 authz policy", () => {
  it("rechaza anónimo", () => {
    const r = authorizeActivity(anonymous, "suma");
    expect(r).toEqual({ ok: false, status: 401, error: "Unauthorized" });
  });

  it("demo no puede generar suma (premium)", () => {
    const r = authorizeActivity(demo, "suma");
    expect(r).toEqual({ ok: false, status: 403, error: "Forbidden" });
  });

  it("demo puede pedir actividad allowlist (authz; motor puede ser 501)", () => {
    const r = authorizeActivity(demo, "counting");
    expect(r.ok).toBe(true);
  });

  it("registrado puede pedir suma a nivel de rol", () => {
    const r = authorizeActivity(registered, "suma");
    expect(r.ok).toBe(true);
  });

  it("detecta token demo expirado", () => {
    const now = Date.parse("2026-10-22T12:00:00.000Z");
    expect(isDemoTokenExpired("2026-10-22T11:59:59.000Z", now)).toBe(true);
    expect(isDemoTokenExpired("2026-10-22T12:00:01.000Z", now)).toBe(false);
  });

  it("rechaza campos de autorización manipulados en el body", () => {
    expect(clientAuthFieldsRejected({ activityId: "suma", isDemo: true })).toBe(true);
    expect(clientAuthFieldsRejected({ activityId: "suma", role: "admin" })).toBe(true);
    expect(clientAuthFieldsRejected({ activityId: "suma", isPremium: true })).toBe(true);
    expect(clientAuthFieldsRejected({ activityId: "suma", seed: 42 })).toBe(false);
  });
});

describe("D1 suma engine parity (seed determinista)", () => {
  it("misma semilla → mismos a/b/answer", () => {
    const a = generateSumaSession("easy", 42);
    const b = generateSumaSession("easy", 42);
    expect(a).toEqual(b);
    expect(a.length).toBe(10);
    for (const ex of a) {
      expect(ex.op).toBe("suma");
      expect(ex.answer).toBe(ex.a + ex.b);
      expect(ex.a + ex.b).toBeLessThanOrEqual(5);
    }
  });

  it("semillas distintas → secuencias distintas", () => {
    const a = generateSumaSession("medium", 7).map((e) => `${e.a}+${e.b}`);
    const b = generateSumaSession("medium", 8).map((e) => `${e.a}+${e.b}`);
    expect(a).not.toEqual(b);
  });

  it("ficha transforma sesión con/sin soluciones", () => {
    const session = generateSumaSession("easy", 42).slice(0, 3);
    const alumno = sumaExercisesToSheet(session, ["alumno"], false);
    expect(alumno.every((e) => e.answer === undefined)).toBe(true);
    const sol = sumaExercisesToSheet(session, ["soluciones"], false);
    expect(sol.every((e) => e.answer === e.a + e.b)).toBe(true);
  });

  it("documenta: cliente operations.ts consume RNG de imágenes; no es la paridad D1", async () => {
    const { generateSession } = await import("../../core/activities/operations");
    const edge = generateSumaSession("easy", 42).map((e) => `${e.a}+${e.b}`);
    const client = generateSession("suma", "easy", 42).map((e) => `${e.a}+${e.b}`);
    // El shuffle de categorías en el cliente avanza el LCG antes de a/b.
    expect(client).not.toEqual(edge);
  });
});

describe("D1 content-session handler", () => {
  it("registrado genera suma con seed", () => {
    const r = handleContentSession(registered, {
      activityId: "suma",
      difficulty: "easy",
      seed: 42,
    });
    expect(r.status).toBe(200);
    if (r.status !== 200) return;
    expect(r.body.activityId).toBe("suma");
    expect(r.body.seed).toBe(42);
    expect(r.body.exercises).toEqual(generateSumaSession("easy", 42));
  });

  it("demo + suma → 403", () => {
    const r = handleContentSession(demo, { activityId: "suma", seed: 42 });
    expect(r.status).toBe(403);
  });

  it("anónimo → 401", () => {
    const r = handleContentSession(anonymous, { activityId: "suma", seed: 42 });
    expect(r.status).toBe(401);
  });

  it("actividad desconocida / no implementada → 501 tras authz registrada", () => {
    const r = handleContentSession(registered, { activityId: "noExiste", seed: 42 });
    expect(r.status).toBe(501);
  });

  it("demo allowlist sin motor edge → 501", () => {
    const r = handleContentSession(demo, { activityId: "counting", seed: 42 });
    expect(r.status).toBe(501);
  });

  it("entradas inválidas → 400", () => {
    expect(handleContentSession(registered, {}).status).toBe(400);
    expect(
      handleContentSession(registered, { activityId: "suma", difficulty: "n/a", seed: 1 }).status,
    ).toBe(400);
    expect(handleContentSession(registered, { activityId: "suma", seed: 0 }).status).toBe(400);
  });

  it("campos de autorización manipulados → 400", () => {
    const r = handleContentSession(registered, {
      activityId: "suma",
      seed: 42,
      isPremium: true,
    });
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ error: "Invalid authorization fields" });
  });
});

describe("D1 content-ficha handler", () => {
  it("registrado genera ficha suma alumno", () => {
    const r = handleContentFicha(registered, {
      activityId: "suma",
      difficulty: "easy",
      seed: 42,
      count: 5,
      modes: ["alumno"],
      withImages: false,
    });
    expect(r.status).toBe(200);
    if (r.status !== 200) return;
    expect(r.body.count).toBe(5);
    expect(r.body.answersIncluded).toBe(false);
    const exercises = r.body.exercises as Array<{ a: number; b: number; answer?: number }>;
    expect(exercises).toHaveLength(5);
    expect(exercises.every((e) => e.answer === undefined)).toBe(true);
  });

  it("soluciones incluye respuestas", () => {
    const r = handleContentFicha(registered, {
      activityId: "suma",
      seed: 42,
      count: 3,
      modes: ["soluciones"],
    });
    expect(r.status).toBe(200);
    if (r.status !== 200) return;
    expect(r.body.answersIncluded).toBe(true);
    const exercises = r.body.exercises as Array<{ a: number; b: number; answer?: number }>;
    expect(exercises.every((e) => e.answer === e.a + e.b)).toBe(true);
  });

  it("demo + suma → 403; anónimo → 401; auth fields → 400", () => {
    expect(handleContentFicha(demo, { activityId: "suma", seed: 42 }).status).toBe(403);
    expect(handleContentFicha(anonymous, { activityId: "suma", seed: 42 }).status).toBe(401);
    expect(
      handleContentFicha(registered, { activityId: "suma", seed: 42, role: "admin" }).status,
    ).toBe(400);
  });

  it("count inválido / modes vacíos → 400", () => {
    expect(handleContentFicha(registered, { activityId: "suma", seed: 42, count: 99 }).status).toBe(
      400,
    );
    expect(
      handleContentFicha(registered, { activityId: "suma", seed: 42, modes: ["x"] }).status,
    ).toBe(400);
  });
});
