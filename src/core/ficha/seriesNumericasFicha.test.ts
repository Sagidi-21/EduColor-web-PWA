import { describe, expect, it } from "vitest";
import { buildFichaDocument } from "./fichaGenerator";
import { pageSizeForExercises } from "./renderers/pageLayout";

describe("seriesNumericas ficha", () => {
  it("alumno+soluciones genera páginas de alumno y respuestas visibles", () => {
    const doc = buildFichaDocument({
      activityId: "seriesNumericas",
      config: {
        activityId: "seriesNumericas",
        difficulty: "easy",
        count: 10,
        withImages: false,
        seed: 42,
      },
      modes: ["alumno", "soluciones"],
    });

    const pageCount = (doc.html.match(/class="ficha-page/g) ?? []).length;
    const answers = (doc.html.match(/ficha-answer/g) ?? []).length;
    const seriesBlocks = (doc.html.match(/ficha-series__/g) ?? []).length;

    expect(doc.exercises).toHaveLength(10);
    expect(doc.exercises.every((ex) => ex.kind === "seriesNumericas")).toBe(true);
    // Al menos 1 hoja alumno + 1 hoja soluciones (el packing real puede añadir continuación).
    expect(pageCount).toBeGreaterThanOrEqual(2);
    expect(answers).toBe(10);
    expect(seriesBlocks).toBeGreaterThan(0);
    expect(doc.html).toMatch(/Soluciones/i);
    expect(pageSizeForExercises(doc.exercises, { showAnswer: false })).toBe(10);
    expect(pageSizeForExercises(doc.exercises, { showAnswer: true })).toBe(20);
  });

  it("con más de 10 ejercicios el heurístico crea hoja 2 de alumno", () => {
    const doc = buildFichaDocument({
      activityId: "seriesNumericas",
      config: {
        activityId: "seriesNumericas",
        difficulty: "medium",
        count: 15,
        withImages: false,
        seed: 7,
      },
      modes: ["alumno", "soluciones"],
    });

    expect(doc.exercises).toHaveLength(15);
    expect(doc.html).toMatch(/continuación/);
    expect((doc.html.match(/class="ficha-page/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect((doc.html.match(/ficha-answer/g) ?? []).length).toBe(15);
  });
});
