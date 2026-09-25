import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./tresSumandosColumna";

describe("tresSumandosColumna engine", () => {
  const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

  it("genera exactamente 10 ejercicios por dificultad", () => {
    for (const d of DIFFICULTIES) {
      expect(generateSession(d, 42)).toHaveLength(10);
    }
  });

  it("es determinista con la misma semilla", () => {
    for (const d of DIFFICULTIES) {
      expect(generateSession(d, 77)).toEqual(generateSession(d, 77));
    }
  });

  it("easy — a con decenas, b y c de 1 cifra, sin llevar", () => {
    for (const ex of generateSession("easy", 42)) {
      expect(ex.aD).toBe(1);
      expect(ex.b).toBeLessThan(10);
      expect(ex.c).toBeLessThan(10);
      expect(ex.aU + ex.bU + ex.cU).toBeLessThanOrEqual(9);
    }
  });

  it("medium — a y b con decenas, c de 1 cifra, sin llevar", () => {
    for (const ex of generateSession("medium", 42)) {
      expect(ex.aD).toBeGreaterThanOrEqual(1);
      expect(ex.bD).toBe(1);
      expect(ex.cD).toBe(0);
      expect(ex.aU + ex.bU + ex.cU).toBeLessThanOrEqual(9);
    }
  });

  it("hard — todos con decenas, sin llevar", () => {
    for (const ex of generateSession("hard", 42)) {
      expect(ex.aD).toBeGreaterThan(0);
      expect(ex.bD).toBeGreaterThan(0);
      expect(ex.cD).toBeGreaterThan(0);
      expect(ex.aU + ex.bU + ex.cU).toBeLessThanOrEqual(9);
    }
  });

  it("expert — todos de 2 cifras, sin llevar, resultado ≤ 89", () => {
    for (const ex of generateSession("expert", 42)) {
      expect(ex.aD).toBeGreaterThan(0);
      expect(ex.bD).toBeGreaterThan(0);
      expect(ex.cD).toBeGreaterThan(0);
      expect(ex.answer).toBeLessThanOrEqual(89);
      expect(ex.aU + ex.bU + ex.cU).toBeLessThanOrEqual(9);
    }
  });

  it("el answer siempre es a + b + c", () => {
    for (const d of DIFFICULTIES) {
      for (const ex of generateSession(d, 5)) {
        expect(ex.answer).toBe(ex.a + ex.b + ex.c);
      }
    }
  });

  it("los campos D/U son correctos", () => {
    for (const ex of generateSession("expert", 3)) {
      expect(ex.aD).toBe(Math.floor(ex.a / 10));
      expect(ex.aU).toBe(ex.a % 10);
      expect(ex.bD).toBe(Math.floor(ex.b / 10));
      expect(ex.bU).toBe(ex.b % 10);
      expect(ex.cD).toBe(Math.floor(ex.c / 10));
      expect(ex.cU).toBe(ex.c % 10);
    }
  });

  it("no genera tripletas duplicadas", () => {
    for (const d of DIFFICULTIES) {
      const keys = generateSession(d, 9).map((e) => `${e.a}-${e.b}-${e.c}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("validateAnswer acepta la respuesta correcta", () => {
    const ex = generateSession("easy", 1)[0];
    expect(validateAnswer(ex, String(ex.answer))).toBe(true);
  });

  it("validateAnswer rechaza respuesta incorrecta", () => {
    const ex = generateSession("easy", 1)[0];
    expect(validateAnswer(ex, String(ex.answer + 1))).toBe(false);
  });

  it("validateAnswer ignora espacios en blanco", () => {
    const ex = generateSession("medium", 1)[0];
    expect(validateAnswer(ex, `  ${ex.answer}  `)).toBe(true);
  });
});
