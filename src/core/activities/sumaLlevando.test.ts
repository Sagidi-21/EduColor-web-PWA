import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./sumaLlevando";

describe("sumaLlevando engine", () => {
  const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

  it("genera exactamente 10 ejercicios por dificultad", () => {
    for (const d of DIFFICULTIES) {
      expect(generateSession(d, 42)).toHaveLength(10);
    }
  });

  it("easy — 2 sumandos, con llevada, resultado ≤ 50", () => {
    for (const ex of generateSession("easy", 42)) {
      expect(ex.type).toBe("2-addends");
      expect(ex.addends).toHaveLength(2);
      const [a, b] = ex.addends;
      expect(b).toBeLessThan(10); // b de 1 cifra
      expect((a % 10) + b).toBeGreaterThanOrEqual(10); // garantiza llevada
      expect(ex.answer).toBeLessThanOrEqual(50);
    }
  });

  it("medium — 2 sumandos con llevada, resultado ≤ 99", () => {
    for (const ex of generateSession("medium", 42)) {
      expect(ex.type).toBe("2-addends");
      const [a, b] = ex.addends;
      expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10);
      expect(ex.answer).toBeLessThanOrEqual(99);
    }
  });

  it("hard — 3 sumandos, suma de unidades > 9 y ≤ 19, resultado ≤ 99", () => {
    for (const ex of generateSession("hard", 42)) {
      expect(ex.type).toBe("3-addends");
      expect(ex.addends).toHaveLength(3);
      const sumU = ex.addends.reduce((acc, v) => acc + (v % 10), 0);
      expect(sumU).toBeGreaterThanOrEqual(10);
      expect(sumU).toBeLessThanOrEqual(19);
      expect(ex.answer).toBeLessThanOrEqual(99);
    }
  });

  it("expert — 3 sumandos, suma de unidades ≥ 20, resultado ≤ 99", () => {
    for (const ex of generateSession("expert", 42)) {
      expect(ex.type).toBe("3-addends");
      const sumU = ex.addends.reduce((acc, v) => acc + (v % 10), 0);
      expect(sumU).toBeGreaterThanOrEqual(20);
      expect(ex.answer).toBeLessThanOrEqual(99);
    }
  });

  it("el answer siempre es la suma de los addends", () => {
    for (const d of DIFFICULTIES) {
      for (const ex of generateSession(d, 5)) {
        const expected = ex.addends.reduce((acc, v) => acc + v, 0);
        expect(ex.answer).toBe(expected);
      }
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
});
