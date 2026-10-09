import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { activityManifests } from "../../manifests/content-registry";
import {
  downloadFichas,
  generateFicha,
  loadLastFicha,
  persistLastFicha,
  randomFichaSeed,
} from "./fichaGenerator";
import * as pdf from "./pdf";
import type { SheetConfig } from "./types";

const baseConfig = (activityId: string): SheetConfig => ({
  activityId,
  difficulty: "easy",
  count: 5,
  withImages: false,
  seed: 42,
});

describe("fichaGenerator", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generateFicha('suma') produce HTML alumno con operaciones", () => {
    const result = generateFicha({
      activityId: "suma",
      config: baseConfig("suma"),
      mode: "alumno",
      meta: { title: "Suma", grade: "1º", studentName: true },
    });

    expect(result.exercises).toHaveLength(5);
    expect(result.exercises.every((ex) => ex.kind === "operation")).toBe(true);
    expect(result.html).toContain("ficha-page");
    expect(result.html).toContain("Suma");
    expect(result.html).not.toContain("ficha-answer");
  });

  it("modo soluciones incluye respuestas visibles", () => {
    const result = generateFicha({
      activityId: "suma",
      config: baseConfig("suma"),
      mode: "soluciones",
    });
    expect(result.html).toContain("ficha-answer");
  });

  it("downloadFichas(alumno+soluciones) imprime ambos con los mismos ejercicios", () => {
    const spy = vi.spyOn(pdf, "generatePDF").mockImplementation(() => undefined);
    const exercises = downloadFichas({
      activityId: "suma",
      config: baseConfig("suma"),
      modes: ["alumno", "soluciones"],
      meta: { title: "Suma", grade: "1º" },
    });
    expect(exercises).toHaveLength(5);
    expect(spy).toHaveBeenCalledOnce();
    const html = spy.mock.calls[0]![0] as string;
    expect(html).toContain("ficha-print-break");
    expect(html).toContain("ficha-answer");
    expect((html.match(/ficha-page/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("misma seed produce el mismo HTML (reproducibilidad byte-a-byte)", () => {
    const input = {
      activityId: "suma" as const,
      config: baseConfig("suma"),
      mode: "alumno" as const,
      meta: { title: "Suma", grade: "1º", studentName: true },
    };
    const a = generateFicha(input);
    const b = generateFicha(input);
    expect(a.html).toBe(b.html);
    expect(a.exercises).toEqual(b.exercises);
  });

  it("semilla distinta cambia ejercicios", () => {
    const a = generateFicha({
      activityId: "suma",
      config: baseConfig("suma"),
      mode: "alumno",
    });
    const b = generateFicha({
      activityId: "suma",
      config: { ...baseConfig("suma"), seed: 99 },
      mode: "alumno",
    });
    expect(a.exercises).not.toEqual(b.exercises);
  });

  it("persiste última ficha en localStorage", () => {
    persistLastFicha({
      activityId: "resta",
      config: baseConfig("resta"),
      mode: "soluciones",
    });
    const loaded = loadLastFicha();
    expect(loaded?.activityId).toBe("resta");
    expect(loaded?.mode).toBe("soluciones");
    expect(loaded?.config.seed).toBe(42);
  });

  it("randomFichaSeed está en rango válido", () => {
    for (let i = 0; i < 20; i += 1) {
      const seed = randomFichaSeed();
      expect(seed).toBeGreaterThanOrEqual(1);
      expect(seed).toBeLessThan(999983);
    }
  });

  it("genera ficha para todas las actividades del catálogo", () => {
    const failures: string[] = [];
    for (const manifest of activityManifests) {
      try {
        const result = generateFicha({
          activityId: manifest.id,
          config: { ...baseConfig(manifest.id), count: 3 },
          mode: "alumno",
        });
        expect(result.exercises.length).toBeGreaterThan(0);
        expect(result.html).toContain("ficha-page");
      } catch (err) {
        failures.push(`${manifest.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("alumno+soluciones juntos para todas las actividades con generador", () => {
    const spy = vi.spyOn(pdf, "generatePDF").mockImplementation(() => undefined);
    const failures: string[] = [];
    for (const manifest of activityManifests) {
      try {
        spy.mockClear();
        const exercises = downloadFichas({
          activityId: manifest.id,
          config: { ...baseConfig(manifest.id), count: 3 },
          modes: ["alumno", "soluciones"],
        });
        if (exercises.length === 0) {
          failures.push(`${manifest.id}: 0 ejercicios`);
          continue;
        }
        const html = String(spy.mock.calls[0]?.[0] ?? "");
        if (!html.includes("ficha-print-break")) {
          failures.push(`${manifest.id}: falta salto alumno/soluciones`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("No hay generador")) {
          failures.push(`${manifest.id}: ${msg}`);
        }
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });
});
