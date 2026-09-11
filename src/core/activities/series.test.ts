import { describe, it, expect } from "vitest";
import { generateSeriesSession, validateSeriesAnswer } from "./series";

describe("generateSeriesSession", () => {
  it("genera exactamente 10 ejercicios", () => {
    const session = generateSeriesSession(42, "easy");
    expect(session).toHaveLength(10);
  });

  it("es determinista con la misma semilla", () => {
    const a = generateSeriesSession(123, "medium");
    const b = generateSeriesSession(123, "medium");
    expect(a).toEqual(b);
  });

  it("produce resultados distintos con semillas distintas", () => {
    const a = generateSeriesSession(1, "easy");
    const b = generateSeriesSession(2, "easy");
    expect(a[0]).not.toEqual(b[0]);
  });

  it("cada ejercicio tiene 4 opciones (1 correcta + 3 distractores)", () => {
    const session = generateSeriesSession(42, "medium");
    for (const ex of session) {
      expect(ex.options).toHaveLength(4);
      expect(ex.options).toContain(ex.correctAnswer);
    }
  });

  it("la respuesta correcta siempre es el número del hueco", () => {
    const session = generateSeriesSession(7, "hard");
    for (const ex of session) {
      const { sequence, blankIndex, correctAnswer } = ex;
      expect(sequence[blankIndex]).toBe(-1);
      // reconstruye la secuencia con la respuesta y verifica progresión aritmética
      const full = sequence.map((n, i) => (i === blankIndex ? Number(correctAnswer) : n));
      for (let i = 1; i < full.length; i++) {
        expect(full[i] - full[i - 1]).toBe(ex.ascending ? ex.step : -ex.step);
      }
    }
  });

  it("todos los números de la secuencia están entre 0 y 99", () => {
    for (const diff of ["easy", "medium", "hard", "expert"] as const) {
      const session = generateSeriesSession(99, diff);
      for (const ex of session) {
        const full = ex.sequence.map((n, i) =>
          i === ex.blankIndex ? Number(ex.correctAnswer) : n,
        );
        expect(full.every((n) => n >= 0 && n <= 99)).toBe(true);
      }
    }
  });

  it("el hueco nunca está en la primera posición", () => {
    for (let seed = 0; seed < 20; seed++) {
      const session = generateSeriesSession(seed, "easy");
      for (const ex of session) {
        expect(ex.blankIndex).toBeGreaterThan(0);
      }
    }
  });
});

describe("validateSeriesAnswer", () => {
  it("devuelve true con la respuesta correcta", () => {
    const [ex] = generateSeriesSession(42, "easy");
    expect(validateSeriesAnswer(ex, ex.correctAnswer)).toBe(true);
  });

  it("devuelve false con una respuesta incorrecta", () => {
    const [ex] = generateSeriesSession(42, "easy");
    const wrong = ex.options.find((o) => o !== ex.correctAnswer)!;
    expect(validateSeriesAnswer(ex, wrong)).toBe(false);
  });
});
