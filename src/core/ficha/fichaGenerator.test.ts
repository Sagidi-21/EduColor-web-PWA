import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { activityManifests } from "../../manifests/content-registry";
import { generateSumaSession } from "../../../supabase/functions/_shared/engines/suma.ts";
import { sumaExercisesToSheet } from "../../../supabase/functions/_shared/ficha/sumSheet.ts";
import { isEdgeContentActivity } from "./edgeContentActivities";
import {
  buildFichaDocument,
  buildFichaDocumentFromExercises,
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

/** Simula respuesta Edge content-ficha (espejo de prueba; no es el path de producción). */
function sumaSheetFromEdgeMirror(
  count: number,
  seed: number,
  modes: Array<"alumno" | "soluciones">,
  withImages: boolean,
  difficulty: "easy" | "medium" | "hard" | "expert" = "easy",
) {
  const session = generateSumaSession(difficulty, seed).slice(0, count);
  return sumaExercisesToSheet(session, modes, withImages).map((ex) =>
    withImages && difficulty === "easy"
      ? { ...ex, imageUrl: ex.imageUrl || "test-object.png" }
      : ex,
  );
}

describe("fichaGenerator", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildFichaDocument rechaza suma (D2: solo Edge)", () => {
    expect(() =>
      buildFichaDocument({
        activityId: "suma",
        config: baseConfig("suma"),
        modes: ["alumno"],
      }),
    ).toThrow(/servidor|content-ficha/i);
  });

  it("buildFichaDocumentFromExercises('suma') produce HTML alumno con operaciones", () => {
    const exercises = sumaSheetFromEdgeMirror(5, 42, ["alumno"], false);
    const doc = buildFichaDocumentFromExercises({
      activityId: "suma",
      config: baseConfig("suma"),
      modes: ["alumno"],
      exercises,
      meta: { title: "Suma", grade: "1º", studentName: true },
    });

    expect(doc.exercises).toHaveLength(5);
    expect(doc.exercises.every((ex) => ex.kind === "operation")).toBe(true);
    expect(doc.html).toContain("ficha-page");
    expect(doc.html).toContain("Suma");
    expect(doc.html).not.toContain("ficha-answer");
    expect(doc.html).toContain("ficha-grid");
    expect(doc.html).toContain("ficha-grid__cell");
    expect(doc.html).toContain("ficha-header__table");
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

  it("modo soluciones incluye respuestas visibles (suma vía ejercicios Edge)", () => {
    const exercises = sumaSheetFromEdgeMirror(5, 42, ["soluciones"], false);
    const doc = buildFichaDocumentFromExercises({
      activityId: "suma",
      config: baseConfig("suma"),
      modes: ["soluciones"],
      exercises,
    });
    expect(doc.html).toContain("ficha-answer");
  });

  it("downloadFichas(alumno+soluciones) exporta PDF con el HTML de la vista previa", async () => {
    const spy = vi.spyOn(pdfExport, "downloadHtmlAsPdf").mockResolvedValue(undefined);
    const exercises = await downloadFichas({
      activityId: "resta",
      config: baseConfig("resta"),
      modes: ["alumno", "soluciones"],
      meta: { title: "Resta", grade: "1º" },
    });
    expect(exercises).toHaveLength(5);
    expect(spy).toHaveBeenCalledOnce();
    const arg = spy.mock.calls[0]![0];
    expect(arg.filename).toContain("resta");
    expect(arg.filename).toMatch(/\.pdf$/);
    expect(arg.html).toContain("ficha-page");
    expect((arg.html.match(/ficha-page/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("misma seed produce el mismo HTML (reproducibilidad byte-a-byte)", () => {
    const input = {
      activityId: "resta" as const,
      config: baseConfig("resta"),
      mode: "alumno" as const,
      meta: { title: "Resta", grade: "1º", studentName: true },
    };
    const a = generateFicha(input);
    const b = generateFicha(input);
    expect(a.html).toBe(b.html);
    expect(a.exercises).toEqual(b.exercises);
  });

  it("semilla distinta cambia ejercicios", () => {
    const a = generateFicha({
      activityId: "resta",
      config: baseConfig("resta"),
      mode: "alumno",
    });
    const b = generateFicha({
      activityId: "resta",
      config: { ...baseConfig("resta"), seed: 99 },
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

  it("comparison pinta dibujos en alumno; soluciones solo la respuesta", () => {
    const medium = generateFicha({
      activityId: "comparison",
      config: { ...baseConfig("comparison"), withImages: true, count: 4, difficulty: "medium" },
      mode: "alumno",
    });
    expect(medium.html).toContain("Redondea la letra donde hay");
    expect(medium.html).toContain("ficha-compare--medium");
    expect(medium.html).not.toContain("Si son iguales pon un signo igual entre las barras");
    expect(medium.html).not.toContain("ficha-compare__equal-slot");
    expect(medium.html).not.toContain("ficha-compare__answer-blank");

    const alumno = generateFicha({
      activityId: "comparison",
      config: { ...baseConfig("comparison"), withImages: true, count: 4, difficulty: "hard" },
      mode: "alumno",
    });
    expect(alumno.exercises.every((ex) => ex.kind === "comparison")).toBe(true);
    expect(alumno.html).toContain("ficha-compare__strip");
    expect(alumno.html).toContain("ficha-compare--hard");
    expect(alumno.html).not.toContain("ficha-compare__more");
    expect(alumno.html).toContain("ficha-exercise--full");
    expect(alumno.html).toContain("Si son iguales pon un signo igual entre las barras");
    expect(alumno.html).toContain("ficha-compare__equal-slot");
    expect(alumno.html).not.toContain("ficha-compare__answer-blank");

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
    expect(soluciones.html).toContain("Iguales");
    expect(soluciones.html).not.toContain("ficha-compare__strip");
    expect(soluciones.html).not.toContain("ficha-compare__thumb");
    expect(soluciones.html).not.toContain("Si son iguales pon un signo igual entre las barras");
    expect(soluciones.html).not.toContain("ficha-compare__equal-slot");
    expect(soluciones.html).toMatch(/Soluciones/i);
  });

  it("suma easy con imágenes pinta filas de objetos; soluciones sin miniaturas", () => {
    const config = {
      ...baseConfig("suma"),
      withImages: true,
      count: 4,
      difficulty: "easy" as const,
    };
    const alumnoEx = sumaSheetFromEdgeMirror(4, 42, ["alumno"], true, "easy");
    const alumno = buildFichaDocumentFromExercises({
      activityId: "suma",
      config,
      modes: ["alumno"],
      exercises: alumnoEx,
    });
    expect(alumno.exercises.every((ex) => ex.kind === "operation")).toBe(true);
    expect(alumno.exercises.some((ex) => ex.kind === "operation" && ex.imageUrl)).toBe(true);
    expect(alumno.html).toContain("ficha-img-row__thumb");
    expect(alumno.html).not.toContain("ficha-answer");

    const solEx = sumaSheetFromEdgeMirror(4, 42, ["soluciones"], true, "easy");
    const soluciones = buildFichaDocumentFromExercises({
      activityId: "suma",
      config,
      modes: ["soluciones"],
      exercises: solEx,
    });
    expect(soluciones.html).toContain("ficha-answer");
    expect(soluciones.html).not.toContain("ficha-img-row__thumb");
  });

  it("shapes muestra figura, pregunta y opciones; soluciones solo el nombre", () => {
    const alumno = generateFicha({
      activityId: "shapes",
      config: { ...baseConfig("shapes"), withImages: true, count: 4, difficulty: "easy" },
      mode: "alumno",
    });
    expect(alumno.exercises.every((ex) => ex.kind === "poligonos")).toBe(true);
    expect(alumno.html).toContain("¿Cómo se llama esta figura?");
    expect(alumno.html).toContain("ficha-poligonos__choices");
    expect(alumno.html).toContain("ficha-poligonos__choice-mark");
    expect(alumno.html).toMatch(/círculo|cuadrado|triángulo/);
    expect(alumno.html).not.toContain("ficha-answer");

    const soluciones = generateFicha({
      activityId: "shapes",
      config: { ...baseConfig("shapes"), withImages: true, count: 4, difficulty: "easy" },
      mode: "soluciones",
    });
    expect(soluciones.html).toContain("ficha-answer");
    expect(soluciones.html).toMatch(/círculo|cuadrado|triángulo/);
    expect(soluciones.html).not.toContain("ficha-poligonos__choices");
    expect(soluciones.html).not.toContain("¿Cómo se llama esta figura?");
    expect(soluciones.html).toMatch(/Soluciones/i);
  });

  it("counting muestra objetos y casilla en alumno; soluciones solo el número", () => {
    const alumno = generateFicha({
      activityId: "counting",
      config: { ...baseConfig("counting"), withImages: true, count: 4 },
      mode: "alumno",
    });
    expect(alumno.exercises.every((ex) => ex.kind === "counting")).toBe(true);
    expect(alumno.html).toContain("ficha-counting__objects");
    expect(alumno.html).toMatch(/¿Cuánt[oa]s .+ hay\?/);
    expect(alumno.html).toContain("ficha-counting__answer-blank");
    expect(alumno.html).not.toContain("ficha-answer");

    const soluciones = generateFicha({
      activityId: "counting",
      config: { ...baseConfig("counting"), withImages: true, count: 4 },
      mode: "soluciones",
    });
    expect(soluciones.html).toContain("ficha-answer");
    expect(soluciones.html).not.toContain("ficha-counting__objects");
    expect(soluciones.html).not.toMatch(/¿Cuánt[oa]s .+ hay\?/);
    expect(soluciones.html).toMatch(/Soluciones/i);
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

  it("soluciones: solo respuesta, sin enunciados ni imágenes", () => {
    for (const activityId of [
      "resta",
      "seriesNumericas",
      "elKilo",
      "balanza",
      "graficoBarras",
      "ordinales",
      "ordenar",
      "comparison",
      "counting",
      "relacionar",
    ] as const) {
      const soluciones = generateFicha({
        activityId,
        config: { ...baseConfig(activityId), withImages: true, count: 3 },
        mode: "soluciones",
      });
      expect(soluciones.html, activityId).toContain("ficha-answer");
      expect(soluciones.html, activityId).toMatch(/Soluciones/i);
      expect(soluciones.html, activityId).not.toContain("ficha-img-row");
      expect(soluciones.html, activityId).not.toContain("ficha-series__sequence");
      expect(soluciones.html, activityId).not.toContain("ficha-photo__items");
      expect(soluciones.html, activityId).not.toContain("ficha-balanza__beam");
      expect(soluciones.html, activityId).not.toContain("ficha-bars__chart");
      expect(soluciones.html, activityId).not.toContain("ficha-ordinales__row");
      expect(soluciones.html, activityId).not.toContain("ficha-ordenar__pool");
      expect(soluciones.html, activityId).not.toContain("ficha-ordenar__table");
      expect(soluciones.html, activityId).not.toContain("ficha-compare__strip");
      expect(soluciones.html, activityId).not.toContain("ficha-counting__objects");
      expect(soluciones.html, activityId).not.toContain("ficha-relacionar__board");
      expect(soluciones.html, activityId).not.toContain("__thumb");
    }
  });

  it("genera ficha para todas las actividades locales del catálogo (excluye Edge)", () => {
    const failures: string[] = [];
    for (const manifest of activityManifests) {
      if (isEdgeContentActivity(manifest.id)) continue;
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

  it("alumno+soluciones juntos para todas las actividades locales con generador", async () => {
    const spy = vi.spyOn(pdfExport, "downloadHtmlAsPdf").mockResolvedValue(undefined);
    const failures: string[] = [];
    for (const manifest of activityManifests) {
      if (isEdgeContentActivity(manifest.id)) continue;
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
