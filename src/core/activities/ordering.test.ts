import { describe, expect, it } from "vitest";
import { createOrderingSession, isCorrectOrderingValue } from "./ordering";

describe("createOrderingSession", () => {
  it("reproduce una sesión para la misma semilla", () => {
    expect(createOrderingSession(48, "hard")).toEqual(createOrderingSession(48, "hard"));
  });

  it("respeta los límites y tamaño de cada dificultad", () => {
    const easy = createOrderingSession(4, "easy");
    expect(easy).toHaveLength(10);
    expect(easy.every((exercise) => exercise.numbers.length === 3)).toBe(true);
    expect(
      easy.every((exercise) => exercise.numbers.every((number) => number >= 1 && number <= 10)),
    ).toBe(true);
    expect(easy.every((exercise) => exercise.direction === "ascending")).toBe(true);

    const expert = createOrderingSession(9, "expert");
    expect(expert.every((exercise) => exercise.numbers.length === 5)).toBe(true);
    expect(
      expert.every((exercise) => exercise.numbers.every((number) => number >= 10 && number <= 99)),
    ).toBe(true);
    expect(expert.some((exercise) => exercise.direction === "ascending")).toBe(true);
    expect(expert.some((exercise) => exercise.direction === "descending")).toBe(true);
  });

  it("valida cada posición y rechaza números fuera de orden", () => {
    const [exercise] = createOrderingSession(42, "medium");
    expect(isCorrectOrderingValue(exercise, 0, exercise.sortedNumbers[0])).toBe(true);
    expect(isCorrectOrderingValue(exercise, 0, exercise.sortedNumbers.at(-1) as number)).toBe(
      false,
    );
  });
});
