import { describe, expect, it } from "vitest";
import type { OrderingSheetExercise, RelacionarSheetExercise } from "../types";
import { packExercisesByFit, packExercisesByHeights, packExercisesForPrint } from "./pagePacking";

function relacionar(pairs: number, maxCount: number): RelacionarSheetExercise {
  return {
    kind: "relacionar",
    left: Array.from({ length: pairs }, (_, i) => ({ id: i, number: i + 1 })),
    right: Array.from({ length: pairs }, (_, i) => ({
      id: i,
      letter: String.fromCharCode(65 + i),
      count: Math.min(maxCount, i + 1),
      imageUrl: "/x.png",
      objectLabel: "obj",
    })),
    answer: [],
  };
}

function ordenar(): OrderingSheetExercise {
  return {
    kind: "ordenar",
    numbers: [5, 2, 9],
    direction: "ascending",
    answer: [2, 5, 9],
  };
}

describe("pagePacking", () => {
  it("packExercisesByHeights mete el máximo que cabe sin partir filas de 2 columnas", () => {
    const exercises = Array.from({ length: 10 }, () => ordenar());
    const heights = exercises.map(() => 80);
    const pages = packExercisesByHeights(exercises, heights, { showAnswer: false });
    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages.flat()).toHaveLength(10);
    for (const page of pages.slice(0, -1)) {
      expect(page.length % 2).toBe(0);
    }
  });

  it("relacionar full-width: no deja ejercicios fuera", () => {
    const exercises = Array.from({ length: 7 }, () => relacionar(5, 12));
    const heights = exercises.map(() => 200);
    const pages = packExercisesByHeights(exercises, heights, { showAnswer: false });
    expect(pages.flat()).toHaveLength(7);
    expect(pages.every((p) => p.length >= 1)).toBe(true);
  });

  it("ejercicios altos → menos por hoja; bajos → más (sin cortar)", () => {
    const tall = Array.from({ length: 6 }, () => relacionar(5, 12));
    const short = Array.from({ length: 6 }, () => relacionar(3, 4));
    const tallPages = packExercisesByHeights(
      tall,
      tall.map(() => 320),
      { showAnswer: false },
    );
    const shortPages = packExercisesByHeights(
      short,
      short.map(() => 120),
      { showAnswer: false },
    );
    expect(tallPages.flat()).toHaveLength(6);
    expect(shortPages.flat()).toHaveLength(6);
    const maxTall = Math.max(...tallPages.map((p) => p.length));
    const maxShort = Math.max(...shortPages.map((p) => p.length));
    expect(maxTall).toBeLessThanOrEqual(maxShort);
    expect(tallPages.length).toBeGreaterThanOrEqual(shortPages.length);
  });

  it("packExercisesForPrint / ByFit empaquetan todos los ejercicios", () => {
    const exercises = Array.from({ length: 6 }, () => ordenar());
    const pages = packExercisesForPrint(exercises, { showAnswer: false });
    expect(pages.flat()).toHaveLength(6);
    const byFit = packExercisesByFit(exercises, { showAnswer: false });
    expect(byFit.flat()).toHaveLength(6);
  });
});
