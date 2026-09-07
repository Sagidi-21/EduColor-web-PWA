import { describe, expect, it } from "vitest";
import {
  comparisonObjectSets,
  createComparisonExercise,
  isCorrectComparison,
  type ComparisonChoice,
  type ComparisonDifficulty,
} from "./comparison";

const difficulties: ComparisonDifficulty[] = ["easy", "medium", "hard", "expert"];

describe("createComparisonExercise", () => {
  it("genera el mismo ejercicio para una misma semilla y dificultad", () => {
    for (const difficulty of difficulties) {
      expect(createComparisonExercise(21, difficulty)).toEqual(
        createComparisonExercise(21, difficulty),
      );
    }
  });

  it("respeta los límites pedagógicos de cada nivel", () => {
    const easy = Array.from({ length: 40 }, (_, seed) =>
      createComparisonExercise(seed + 1, "easy"),
    );
    expect(easy.every((exercise) => exercise.leftCount !== exercise.rightCount)).toBe(true);
    expect(easy.every((exercise) => exercise.leftCount <= 5 && exercise.rightCount <= 5)).toBe(
      true,
    );
    expect(easy.every((exercise) => !exercise.allowEqual)).toBe(true);

    const medium = Array.from({ length: 40 }, (_, seed) =>
      createComparisonExercise(seed + 1, "medium"),
    );
    expect(medium.every((exercise) => exercise.leftCount <= 10 && exercise.rightCount <= 10)).toBe(
      true,
    );
    expect(medium.every((exercise) => exercise.leftCount !== exercise.rightCount)).toBe(true);
    expect(medium.some((exercise) => exercise.question === "more")).toBe(true);
    expect(medium.some((exercise) => exercise.question === "less")).toBe(true);

    const hard = Array.from({ length: 80 }, (_, seed) =>
      createComparisonExercise(seed + 1, "hard"),
    );
    expect(hard.every((exercise) => exercise.leftCount <= 19 && exercise.rightCount <= 19)).toBe(
      true,
    );
    expect(hard.some((exercise) => exercise.leftCount === exercise.rightCount)).toBe(true);

    const expert = Array.from({ length: 80 }, (_, seed) =>
      createComparisonExercise(seed + 1, "expert"),
    );
    expect(expert.every((exercise) => exercise.leftCount <= 20 && exercise.rightCount <= 20)).toBe(
      true,
    );
    expect(expert.every((exercise) => comparisonObjectSets.includes(exercise.objectSet))).toBe(
      true,
    );
    expect(expert.some((exercise) => exercise.leftCount === exercise.rightCount)).toBe(true);
  });

  it("valida la respuesta correcta y rechaza las demás", () => {
    const exercise = createComparisonExercise(8, "easy");
    expect(isCorrectComparison(exercise, exercise.answer)).toBe(true);
    const choices: ComparisonChoice[] = ["left", "right", "equal"];
    expect(
      choices
        .filter((choice) => choice !== exercise.answer)
        .every((choice) => !isCorrectComparison(exercise, choice)),
    ).toBe(true);
  });
});
