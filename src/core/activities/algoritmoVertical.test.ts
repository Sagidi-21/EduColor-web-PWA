import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./algoritmoVertical";

describe("algoritmoVertical engine", () => {
  const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

  it("genera exactamente 10 ejercicios por dificultad", () => {
    for (const d of DIFFICULTIES) {
      const session = generateSession(d, 42);
      expect(session).toHaveLength(10);
    }
  });

  it("es determinista con la misma semilla", () => {
    for (const d of DIFFICULTIES) {
      const s1 = generateSession(d, 123);
      const s2 = generateSession(d, 123);
      expect(s1).toEqual(s2);
    }
  });

  it("varía con semillas distintas", () => {
    const s1 = generateSession("medium", 1);
    const s2 = generateSession("medium", 2);
    expect(s1).not.toEqual(s2);
  });

  it("easy — sin llevar, b de 1 cifra, resultado ≤ 50", () => {
    const session = generateSession("easy", 42);
    for (const ex of session) {
      expect(ex.b).toBeLessThan(10);
      expect(ex.aU + ex.bU).toBeLessThanOrEqual(9); // sin llevar
      expect(ex.answer).toBeLessThanOrEqual(50);
      expect(ex.answer).toBe(ex.a + ex.b);
    }
  });

  it("medium — sin llevar, ambos con decenas, resultado ≤ 99", () => {
    const session = generateSession("medium", 42);
    for (const ex of session) {
      expect(ex.bD).toBeGreaterThan(0);
      expect(ex.aU + ex.bU).toBeLessThanOrEqual(9); // sin llevar
      expect(ex.answer).toBeLessThanOrEqual(99);
    }
  });

  it("hard — con llevar en unidades, resultado ≤ 50", () => {
    const session = generateSession("hard", 42);
    for (const ex of session) {
      expect(ex.aU + ex.bU).toBeGreaterThanOrEqual(10); // garantiza llevada
      expect(ex.answer).toBeLessThanOrEqual(50);
    }
  });

  it("expert — con llevar en unidades, resultado ≤ 99", () => {
    const session = generateSession("expert", 42);
    for (const ex of session) {
      expect(ex.aU + ex.bU).toBeGreaterThanOrEqual(10);
      expect(ex.answer).toBeLessThanOrEqual(99);
    }
  });

  it("los campos D/U de a y b son correctos", () => {
    const session = generateSession("medium", 99);
    for (const ex of session) {
      expect(ex.aD).toBe(Math.floor(ex.a / 10));
      expect(ex.aU).toBe(ex.a % 10);
      expect(ex.bD).toBe(Math.floor(ex.b / 10));
      expect(ex.bU).toBe(ex.b % 10);
    }
  });

  it("no genera pares duplicados", () => {
    for (const d of DIFFICULTIES) {
      const session = generateSession(d, 7);
      const keys = session.map((e) => `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("validateAnswer acepta la respuesta correcta como string", () => {
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
