import { describe, expect, it } from "vitest";
import type {
  ComparisonSheetExercise,
  CountingSheetExercise,
  RelacionarSheetExercise,
  SeriesNumericasSheetExercise,
  SheetExercise,
} from "../types";
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

  it("relacionar heurístico de respaldo; soluciones → 12", () => {
    expect(pageSizeForExercises([relacionar(3, 5)])).toBe(5);
    expect(pageSizeForExercises([relacionar(4, 9)])).toBe(4);
    expect(pageSizeForExercises([relacionar(5, 15)])).toBe(3);
    expect(pageSizeForExercises([relacionar(3, 5)], { showAnswer: true })).toBe(12);
  });

  it("relacionar usa ancho completo solo en alumno", () => {
    expect(isFullWidthExercise(relacionar(3, 3))).toBe(true);
    expect(isFullWidthExercise(relacionar(3, 3), { showAnswer: true })).toBe(false);
    expect(isFullWidthExercise({ kind: "operation", a: 1, b: 2, op: "+", imageUrl: "" })).toBe(
      false,
    );
  });

  it("counting siempre 10 por hoja en 2 columnas", () => {
    const few: CountingSheetExercise = {
      kind: "counting",
      count: 3,
      imageUrl: "/x.png",
      objectLabel: "obj",
      question: "¿Cuántos?",
      answer: 3,
    };
    const many: CountingSheetExercise = {
      ...few,
      count: 16,
      answer: 16,
    };
    expect(pageSizeForExercises([few])).toBe(10);
    expect(pageSizeForExercises([many])).toBe(10);
    expect(isFullWidthExercise(few)).toBe(false);
    expect(isFullWidthExercise(many)).toBe(false);
  });

  it("comparison: 10 por hoja a ancho completo; soluciones sin dibujos más densas", () => {
    const ex: ComparisonSheetExercise = {
      kind: "comparison",
      countA: 4,
      countB: 15,
      imageUrl: "/x.png",
      objectLabel: "globos",
      questionType: "menos",
      allowEqual: true,
      difficulty: "hard",
      answer: "A",
    };
    expect(pageSizeForExercises([ex])).toBe(10);
    expect(pageSizeForExercises([ex], { showAnswer: true })).toBe(12);
    expect(isFullWidthExercise(ex)).toBe(true);
    expect(isFullWidthExercise(ex, { showAnswer: true })).toBe(false);
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

  it("ordenar siempre 10 por hoja", () => {
    const few = {
      kind: "ordenar" as const,
      numbers: [1, 2, 3],
      direction: "ascending" as const,
    };
    const many = {
      kind: "ordenar" as const,
      numbers: [15, 10, 5, 17, 13],
      direction: "ascending" as const,
    };
    expect(pageSizeForExercises([few])).toBe(10);
    expect(pageSizeForExercises([many])).toBe(10);
    expect(pageSizeForExercises([many], { showAnswer: true })).toBe(10);
  });

  it("series: 10 por hoja a ancho completo; soluciones solo número más densas", () => {
    const ex: SeriesNumericasSheetExercise = {
      kind: "seriesNumericas",
      sequence: [1, 2, -1, 4, 5],
      blankIndex: 2,
      step: 1,
      ascending: true,
      question: "¿Qué número falta?",
      answer: 3,
    };
    expect(pageSizeForExercises([ex])).toBe(10);
    expect(pageSizeForExercises([ex], { showAnswer: true })).toBe(20);
    expect(isFullWidthExercise(ex)).toBe(true);
    expect(isFullWidthExercise(ex, { showAnswer: true })).toBe(false);
  });
});
