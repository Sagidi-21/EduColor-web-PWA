import { describe, expect, it } from "vitest";
import { createCountingExercise, isCorrectAnswer } from "./counting";
describe("createCountingExercise", () => {
  it("genera el mismo ejercicio para una misma semilla", () => expect(createCountingExercise(17)).toEqual(createCountingExercise(17)));
  it("incluye siempre la respuesta correcta", () => { const exercise = createCountingExercise(8); expect(exercise.choices).toContain(exercise.answer); expect(isCorrectAnswer(exercise, exercise.answer)).toBe(true); expect(isCorrectAnswer(exercise, 99)).toBe(false); });
});
