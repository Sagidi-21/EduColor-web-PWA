import { describe, expect, it } from "vitest";
import type { RelacionarSheetExercise, SheetExercise } from "../types";
import { chunkByPageSize, isFullWidthExercise, pageSizeForExercises } from "./pageLayout";

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

describe("pageLayout", () => {
  it("parte en páginas del tamaño pedido", () => {
    expect(chunkByPageSize([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("relacionar easy → 6 por página; hard/expert → menos; soluciones → 12", () => {
    expect(pageSizeForExercises([relacionar(3, 5)])).toBe(6);
    expect(pageSizeForExercises([relacionar(4, 9)])).toBe(5);
    expect(pageSizeForExercises([relacionar(5, 15)])).toBe(4);
    expect(pageSizeForExercises([relacionar(3, 5)], { showAnswer: true })).toBe(12);
  });

  it("relacionar usa ancho completo solo en alumno", () => {
    expect(isFullWidthExercise(relacionar(3, 3))).toBe(true);
    expect(isFullWidthExercise(relacionar(3, 3), { showAnswer: true })).toBe(false);
    expect(isFullWidthExercise({ kind: "operation", a: 1, b: 2, op: "+", imageUrl: "" })).toBe(
      false,
    );
  });

  it("otras actividades no fragmentan por defecto", () => {
    const ops: SheetExercise[] = Array.from({ length: 10 }, () => ({
      kind: "operation" as const,
      a: 1,
      b: 2,
      op: "+" as const,
      imageUrl: "",
    }));
    expect(pageSizeForExercises(ops)).toBe(10);
  });
});
