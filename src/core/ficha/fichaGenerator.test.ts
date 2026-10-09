import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { activityManifests } from "../../manifests/content-registry";
import {
  buildFichaDocument,
  downloadFichas,
  generateFicha,
  loadLastFicha,
  persistLastFicha,
  randomFichaSeed,
} from "./fichaGenerator";
import { getGenerator } from "./generators/registry";
import * as pdfExport from "./pdfExport";
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
    expect(result.html).toContain("ficha-grid");
    expect(result.html).toContain("ficha-grid__cell");
    expect(result.html).toContain("ficha-header__table");
  });

  it("buildFichaDocument comparte ejercicios entre alumno y soluciones", () => {
    const doc = buildFichaDocument({
      activityId: "ordenar",
      config: baseConfig("ordenar"),
      modes: ["alumno", "soluciones"],
      meta: { title: "Ordenar números", grade: "1º" },
    });
    expect(doc.modes).toEqual(["alumno", "soluciones"]);
    expect(doc.chunks).toHaveLength(2);
    expect(doc.exercises).toHaveLength(5);
    expect(doc.html).toContain("ficha-print-break");
    expect(doc.html).toContain("ficha-ordenar");
    expect(typeof doc.css).toBe("string");
    expect(doc.chunks[0]!.html).toContain("ficha-exercise--ordenar");
    expect(doc.chunks[0]!.html).toContain("ficha-ordenar__table");
  });

  it("modo soluciones incluye respuestas visibles", () => {
    const result = generateFicha({
      activityId: "suma",
      config: baseConfig("suma"),
      mode: "soluciones",
    });
    expect(result.html).toContain("ficha-answer");
  });

  it("downloadFichas(alumno+soluciones) exporta PDF con el HTML de la vista previa", async () => {
    const spy = vi.spyOn(pdfExport, "downloadHtmlAsPdf").mockResolvedValue(undefined);
    const exercises = await downloadFichas({
      activityId: "suma",
      config: baseConfig("suma"),
      modes: ["alumno", "soluciones"],
      meta: { title: "Suma", grade: "1º" },
    });
    expect(exercises).toHaveLength(5);
    expect(spy).toHaveBeenCalledOnce();
    const arg = spy.mock.calls[0]![0];
    expect(arg.filename).toContain("suma");
    expect(arg.filename).toMatch(/\.pdf$/);
    expect(arg.html).toContain("ficha-page");
    expect((arg.html.match(/ficha-page/g) ?? []).length).toBeGreaterThanOrEqual(2);
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

  it("comparison pinta dibujos en alumno y solo respuesta en soluciones", () => {
    const medium = generateFicha({
      activityId: "comparison",
      config: { ...baseConfig("comparison"), withImages: true, count: 4, difficulty: "medium" },
      mode: "alumno",
    });
    expect(medium.html).not.toContain("pueden ser iguales");

    const alumno = generateFicha({
      activityId: "comparison",
      config: { ...baseConfig("comparison"), withImages: true, count: 4, difficulty: "hard" },
      mode: "alumno",
    });
    expect(alumno.exercises.every((ex) => ex.kind === "comparison")).toBe(true);
    expect(alumno.html).toContain("ficha-compare__strip");
    expect(alumno.html).not.toContain("ficha-compare__more");
    expect(alumno.html).toContain("ficha-exercise--full");
    expect(alumno.html).toContain("pueden ser iguales");

    let seedWithEqual = 1;
    for (let s = 1; s < 400; s += 1) {
      const sample = getGenerator("comparison").generate({
        ...baseConfig("comparison"),
        withImages: true,
        count: 12,
        difficulty: "hard",
        seed: s,
      });
      if (sample.some((ex) => ex.kind === "comparison" && ex.answer === "iguales")) {
        seedWithEqual = s;
        break;
      }
    }
    const soluciones = generateFicha({
      activityId: "comparison",
      config: {
        ...baseConfig("comparison"),
        withImages: true,
        count: 12,
        difficulty: "hard",
        seed: seedWithEqual,
      },
      mode: "soluciones",
    });
    expect(soluciones.html).toContain("ficha-answer");
    expect(soluciones.html).not.toContain("ficha-compare__strip");
    expect(soluciones.html).not.toContain("ficha-compare__thumb");
    expect(soluciones.html).not.toContain("pueden ser iguales");
    expect(soluciones.html).toContain("Iguales");
  });

  it("suma easy con imágenes pinta filas de objetos; soluciones sin miniaturas", () => {
    const alumno = generateFicha({
      activityId: "suma",
      config: { ...baseConfig("suma"), withImages: true, count: 4, difficulty: "easy" },
      mode: "alumno",
    });
    expect(alumno.exercises.every((ex) => ex.kind === "operation")).toBe(true);
    expect(alumno.exercises.some((ex) => ex.kind === "operation" && ex.imageUrl)).toBe(true);
    expect(alumno.html).toContain("ficha-img-row__thumb");
    expect(alumno.html).not.toContain("ficha-answer");

    const soluciones = generateFicha({
      activityId: "suma",
      config: { ...baseConfig("suma"), withImages: true, count: 4, difficulty: "easy" },
      mode: "soluciones",
    });
    expect(soluciones.html).toContain("ficha-answer");
    expect(soluciones.html).not.toContain("ficha-img-row__thumb");
  });

  it("counting muestra objetos y pregunta; soluciones solo el número", () => {
    const alumno = generateFicha({
      activityId: "counting",
      config: { ...baseConfig("counting"), withImages: true, count: 4 },
      mode: "alumno",
    });
    expect(alumno.exercises.every((ex) => ex.kind === "counting")).toBe(true);
    expect(alumno.html).toContain("ficha-counting__objects");
    expect(alumno.html).toMatch(/¿Cuántos .+ hay\?/);
    expect(alumno.html).not.toContain("ficha-answer");

    const soluciones = generateFicha({
      activityId: "counting",
      config: { ...baseConfig("counting"), withImages: true, count: 4 },
      mode: "soluciones",
    });
    expect(soluciones.html).toContain("ficha-answer");
    expect(soluciones.html).not.toContain("ficha-counting__objects");
    expect(soluciones.html).not.toMatch(/¿Cuántos .+ hay\?/);
  });

  it("relacionar genera bloques con números, letras y soluciones número→letra", () => {
    const alumno = generateFicha({
      activityId: "relacionar",
      config: { ...baseConfig("relacionar"), withImages: true, count: 6 },
      mode: "alumno",
    });
    expect(alumno.exercises.every((ex) => ex.kind === "relacionar")).toBe(true);
    expect(alumno.html).toContain("Une con una línea");
    expect(alumno.html).toContain("ficha-relacionar__letter");
    expect(alumno.html).not.toContain("→");

    const soluciones = generateFicha({
      activityId: "relacionar",
      config: { ...baseConfig("relacionar"), withImages: true, count: 6 },
      mode: "soluciones",
    });
    expect(soluciones.html).toMatch(/\d+ → [A-Z]/);
    expect(soluciones.html).toContain("ficha-answer");
    expect(soluciones.html).not.toContain("Une con una línea");
    expect(soluciones.html).not.toContain("ficha-relacionar__board");
    expect(soluciones.html).not.toContain("ficha-relacionar__thumb");
  });

  it("soluciones de cualquier actividad solo muestran la respuesta", () => {
    for (const activityId of [
      "suma",
      "seriesNumericas",
      "elKilo",
      "balanza",
      "graficoBarras",
      "ordinales",
      "ordenar",
    ] as const) {
      const soluciones = generateFicha({
        activityId,
        config: { ...baseConfig(activityId), withImages: true, count: 3 },
        mode: "soluciones",
      });
      expect(soluciones.html, activityId).toContain("ficha-answer");
      expect(soluciones.html, activityId).not.toContain("ficha-img-row");
      expect(soluciones.html, activityId).not.toContain("ficha-series__sequence");
      expect(soluciones.html, activityId).not.toContain("ficha-photo__items");
      expect(soluciones.html, activityId).not.toContain("ficha-balanza__beam");
      expect(soluciones.html, activityId).not.toContain("ficha-bars__chart");
      expect(soluciones.html, activityId).not.toContain("ficha-ordinales__row");
      expect(soluciones.html, activityId).not.toContain("ficha-ordenar__pool");
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

  it("alumno+soluciones juntos para todas las actividades con generador", async () => {
    const spy = vi.spyOn(pdfExport, "downloadHtmlAsPdf").mockResolvedValue(undefined);
    const failures: string[] = [];
    for (const manifest of activityManifests) {
      try {
        spy.mockClear();
        const exercises = await downloadFichas({
          activityId: manifest.id,
          config: { ...baseConfig(manifest.id), count: 3 },
          modes: ["alumno", "soluciones"],
        });
        if (exercises.length === 0) {
          failures.push(`${manifest.id}: 0 ejercicios`);
          continue;
        }
        const arg = spy.mock.calls[0]?.[0];
        if (!arg?.html.includes("ficha-page")) {
          failures.push(`${manifest.id}: HTML de vista previa ausente`);
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
