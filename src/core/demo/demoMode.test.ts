import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_SKIP_KEY,
  DEMO_ALLOWED_ACTIVITY_IDS,
  DEMO_MODE_KEY,
  clearLocalDemoFlags,
  enterLocalDemoFlags,
  isDemoActivityAllowed,
  normalizeLocalAccessFlags,
  readAuthSkip,
  readDemoMode,
  writeAuthSkip,
  writeDemoMode,
} from "./demoMode";

describe("demoMode — allowlist DEMO", () => {
  it("incluye exactamente los 8 activityId aprobados", () => {
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

  it("permite solo IDs de la allowlist", () => {
    expect(isDemoActivityAllowed("counting")).toBe(true);
    expect(isDemoActivityAllowed("multiplicacion")).toBe(true);
    expect(isDemoActivityAllowed("resta")).toBe(false);
    expect(isDemoActivityAllowed("algoritmo3cifras")).toBe(false);
    expect(isDemoActivityAllowed("tresSumandos")).toBe(false);
  });
});

describe("demoMode — emparejado auth_skip / DEMO", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("auth_skip sin DEMO fuerza DEMO (no catálogo completo)", () => {
    writeAuthSkip(true);
    writeDemoMode(false);

    const flags = normalizeLocalAccessFlags();

    expect(flags.authSkipped).toBe(true);
    expect(flags.demoMode).toBe(true);
    expect(readAuthSkip()).toBe(true);
    expect(readDemoMode()).toBe(true);
    expect(sessionStorage.getItem(AUTH_SKIP_KEY)).toBe("1");
    expect(sessionStorage.getItem(DEMO_MODE_KEY)).toBe("1");
  });

  it("DEMO huérfana sin auth_skip se limpia", () => {
    writeAuthSkip(false);
    writeDemoMode(true);

    const flags = normalizeLocalAccessFlags();

    expect(flags.authSkipped).toBe(false);
    expect(flags.demoMode).toBe(false);
    expect(readDemoMode()).toBe(false);
  });

  it("enterLocalDemoFlags activa ambos flags", () => {
    const flags = enterLocalDemoFlags();
    expect(flags).toEqual({ authSkipped: true, demoMode: true });
    expect(readAuthSkip()).toBe(true);
    expect(readDemoMode()).toBe(true);
  });

  it("clearLocalDemoFlags limpia ambos flags", () => {
    enterLocalDemoFlags();
    const flags = clearLocalDemoFlags();
    expect(flags).toEqual({ authSkipped: false, demoMode: false });
    expect(readAuthSkip()).toBe(false);
    expect(readDemoMode()).toBe(false);
  });

  it("normalize es idempotente con ambos flags activos", () => {
    enterLocalDemoFlags();
    expect(normalizeLocalAccessFlags()).toEqual({ authSkipped: true, demoMode: true });
    expect(normalizeLocalAccessFlags()).toEqual({ authSkipped: true, demoMode: true });
  });
});
