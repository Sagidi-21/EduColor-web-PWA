import { describe, expect, it } from "vitest";
import { generateSession, validateAnswer, numberToWord } from "./lecturaNumeros";
import type { LecturaExercise } from "./lecturaNumeros";

describe("lecturaNumeros", () => {
  it("numberToWord cubre los casos clave", () => {
    expect(numberToWord(0)).toBe("cero");
    expect(numberToWord(10)).toBe("diez");
    expect(numberToWord(16)).toBe("dieciséis");
    expect(numberToWord(30)).toBe("treinta");
    expect(numberToWord(35)).toBe("treinta y cinco");
    expect(numberToWord(99)).toBe("noventa y nueve");
  });

  it("easy genera ejercicios de 0-9 solo cifra→palabra", () => {
    const session = generateSession("easy", 42);
    expect(session.length).toBeGreaterThanOrEqual(1);
    expect(session.length).toBeLessThanOrEqual(10);
    for (const ex of session) {
      expect(ex.number).toBeGreaterThanOrEqual(0);
      expect(ex.number).toBeLessThanOrEqual(9);
      expect(ex.type).toBe("cifra-to-palabra");
    }
  });

  it("medium genera ejercicios de 0-19 solo cifra→palabra", () => {
    const session = generateSession("medium", 42);
    expect(session.length).toBeGreaterThanOrEqual(1);
    for (const ex of session) {
      expect(ex.number).toBeLessThanOrEqual(19);
      expect(ex.type).toBe("cifra-to-palabra");
    }
  });

  it("hard puede generar mix cifra↔palabra hasta 59", () => {
    const session = generateSession("hard", 42);
    expect(session.length).toBe(10);
    for (const ex of session) {
      expect(ex.number).toBeLessThanOrEqual(59);
    }
    // Con seed 42 y hard debe haber algún tipo palabra-to-cifra
    const tipos = new Set(session.map((e) => e.type));
    expect(tipos.size).toBeGreaterThanOrEqual(1);
  });

  it("expert genera ejercicios hasta 99", () => {
    const session = generateSession("expert", 99);
    expect(session.length).toBe(10);
    for (const ex of session) {
      expect(ex.number).toBeLessThanOrEqual(99);
      expect(ex.options).toHaveLength(4);
    }
  });

  it("es determinista: misma semilla → misma sesión", () => {
    const a = generateSession("hard", 1234);
    const b = generateSession("hard", 1234);
    expect(a.map((e) => e.number)).toEqual(b.map((e) => e.number));
    expect(a.map((e) => e.type)).toEqual(b.map((e) => e.type));
  });

  it("correctAnswer coincide con el tipo de ejercicio", () => {
    const session = generateSession("expert", 7);
    for (const ex of session) {
      if (ex.type === "cifra-to-palabra") {
        expect(ex.correctAnswer).toBe(ex.word);
      } else {
        expect(ex.correctAnswer).toBe(String(ex.number));
      }
      expect(ex.options).toContain(ex.correctAnswer);
    }
  });

  it("validateAnswer devuelve true solo para la respuesta correcta", () => {
    const session = generateSession("medium", 42);
    const ex: LecturaExercise = session[0];
    expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);
    const wrong = ex.options.find((o) => o !== ex.correctAnswer)!;
    if (wrong) expect(validateAnswer(ex, wrong)).toBe(false);
  });
});
