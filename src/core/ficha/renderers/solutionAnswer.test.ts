import { describe, expect, it } from "vitest";
import { solutionAnswerOf } from "./solutionAnswer";
import type { SheetExercise } from "../types";

describe("solutionAnswerOf", () => {
  it("formatea comparison", () => {
    expect(
      solutionAnswerOf({
        kind: "comparison",
        countA: 1,
        countB: 2,
        imageUrl: "",
        objectLabel: "x",
        questionType: "mas",
        allowEqual: false,
        difficulty: "easy",
        answer: "B",
      }),
    ).toBe("Grupo B");
  });

  it("formatea relacionar y ordenar", () => {
    expect(
      solutionAnswerOf({
        kind: "relacionar",
        left: [],
        right: [],
        answer: ["1 → A", "2 → B"],
      }),
    ).toBe("1 → A · 2 → B");
    expect(
      solutionAnswerOf({
        kind: "ordenar",
        numbers: [3, 1, 2],
        direction: "ascending",
        answer: [1, 2, 3],
      }),
    ).toBe("1, 2, 3");
  });

  it("formatea leftRight e igualdad", () => {
    expect(
      solutionAnswerOf({
        kind: "leftRight",
        leftObj: "A",
        rightObj: "B",
        leftImgUrl: "",
        rightImgUrl: "",
        question: "¿?",
        answer: "left",
      }),
    ).toBe("Izquierda");
    expect(
      solutionAnswerOf({
        kind: "igualdad",
        type: "result",
        a: 1,
        b: 2,
        c: 3,
        imageUrl: "",
        answer: 3,
      }),
    ).toBe("3");
  });

  it("devuelve ? si no hay respuesta", () => {
    const ex = { kind: "weekDay", question: "¿Qué día?" } as SheetExercise;
    expect(solutionAnswerOf(ex)).toBe("?");
  });
});
