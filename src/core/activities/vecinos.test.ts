import { describe, it, expect } from "vitest";
import { generateVecinosSession, validateVecinosAnswer } from "./vecinos";

describe("generateVecinosSession", () => {
  it("genera exactamente 10 ejercicios", () => {
    const session = generateVecinosSession(42, "easy");
    expect(session).toHaveLength(10);
  });

  it("es determinista con la misma semilla", () => {
    const a = generateVecinosSession(123, "medium");
    const b = generateVecinosSession(123, "medium");
    expect(a).toEqual(b);
  });

  it("produce resultados distintos con semillas distintas", () => {
    const a = generateVecinosSession(1, "easy");
    const b = generateVecinosSession(2, "easy");
    expect(a[0]).not.toEqual(b[0]);
  });

  it("en easy y medium el tipo es 'anterior' o 'posterior'", () => {
    for (const diff of ["easy", "medium"] as const) {
      const session = generateVecinosSession(42, diff);
      for (const ex of session) {
        expect(["anterior", "posterior"]).toContain(ex.type);
      }
    }
  });

  it("en hard y expert el tipo es siempre 'ambos'", () => {
    for (const diff of ["hard", "expert"] as const) {
      const session = generateVecinosSession(42, diff);
      for (const ex of session) {
        expect(ex.type).toBe("ambos");
      }
    }
  });

  it("respeta los límites maxN de cada nivel", () => {
    // Para easy maxN = 9 (números entre 2 y 8)
    const easy = generateVecinosSession(1, "easy");
    expect(easy.every((ex) => ex.number >= 2 && ex.number <= 8)).toBe(true);

    // Para expert maxN = 99 (números entre 2 y 98)
    const expert = generateVecinosSession(1, "expert");
    expect(expert.every((ex) => ex.number >= 2 && ex.number <= 98)).toBe(true);
  });

  it("las opciones contienen la correcta y 3 distractores (4 total)", () => {
    const session = generateVecinosSession(42, "expert");
    for (const ex of session) {
      expect(ex.options).toHaveLength(4);
      expect(ex.options).toContain(ex.correctAnswer);
      // Sin duplicados
      expect(new Set(ex.options).size).toBe(4);
    }
  });

  it("calcula bien correctAnswer para 'ambos'", () => {
    const session = generateVecinosSession(42, "expert");
    for (const ex of session) {
      expect(ex.correctAnswer).toBe(`${ex.number - 1}·${ex.number + 1}`);
    }
  });
});

describe("validateVecinosAnswer", () => {
  it("devuelve true para la respuesta correcta", () => {
    const [ex] = generateVecinosSession(42, "easy");
    expect(validateVecinosAnswer(ex, ex.correctAnswer)).toBe(true);
  });

  it("devuelve false para la respuesta incorrecta", () => {
    const [ex] = generateVecinosSession(42, "easy");
    const wrong = ex.options.find((o) => o !== ex.correctAnswer)!;
    expect(validateVecinosAnswer(ex, wrong)).toBe(false);
  });
});
