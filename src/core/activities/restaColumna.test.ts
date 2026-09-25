import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./restaColumna";

describe("restaColumna engine", () => {
  const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

  it("genera exactamente 10 ejercicios por dificultad", () => {
    for (const d of DIFFICULTIES) {
      expect(generateSession(d, 42)).toHaveLength(10);
    }
  });

  it("es determinista con la misma semilla", () => {
    for (const d of DIFFICULTIES) {
      expect(generateSession(d, 55)).toEqual(generateSession(d, 55));
    }
  });

  it("easy — minuendo 12–19, sustraendo 1 cifra, resultado ≥ 1", () => {
    const session = generateSession("easy", 42);
    for (const ex of session) {
      expect(ex.a).toBeGreaterThanOrEqual(12);
      expect(ex.a).toBeLessThanOrEqual(19);
      expect(ex.b).toBeLessThan(10);
      expect(ex.answer).toBeGreaterThanOrEqual(1);
    }
  });

  it("medium — minuendo 20–39, ambos de 2 cifras, sin llevar", () => {
    const session = generateSession("medium", 42);
    for (const ex of session) {
      expect(ex.a).toBeGreaterThanOrEqual(20);
      expect(ex.a).toBeLessThanOrEqual(39);
      expect(ex.bD).toBeGreaterThan(0);
      expect(ex.aU).toBeGreaterThanOrEqual(ex.bU); // sin llevar
    }
  });

  it("hard — minuendo 30–59, resultado ≥ 10, sin llevar", () => {
    const session = generateSession("hard", 42);
    for (const ex of session) {
      expect(ex.a).toBeGreaterThanOrEqual(30);
      expect(ex.a).toBeLessThanOrEqual(59);
      expect(ex.answer).toBeGreaterThanOrEqual(10);
      expect(ex.aU).toBeGreaterThanOrEqual(ex.bU);
    }
  });

  it("expert — minuendo 40–59, resultado ≥ 10, sin llevar", () => {
    const session = generateSession("expert", 42);
    for (const ex of session) {
      expect(ex.a).toBeGreaterThanOrEqual(40);
      expect(ex.a).toBeLessThanOrEqual(59);
      expect(ex.answer).toBeGreaterThanOrEqual(10);
    }
  });

  it("el resultado siempre es a − b", () => {
    for (const d of DIFFICULTIES) {
      for (const ex of generateSession(d, 7)) {
        expect(ex.answer).toBe(ex.a - ex.b);
      }
    }
  });

  it("los campos D/U son correctos", () => {
    for (const ex of generateSession("medium", 3)) {
      expect(ex.aD).toBe(Math.floor(ex.a / 10));
      expect(ex.aU).toBe(ex.a % 10);
      expect(ex.bD).toBe(Math.floor(ex.b / 10));
      expect(ex.bU).toBe(ex.b % 10);
    }
  });

  it("no genera pares duplicados", () => {
    for (const d of DIFFICULTIES) {
      const keys = generateSession(d, 9).map((e) => `${e.a}-${e.b}`);
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
