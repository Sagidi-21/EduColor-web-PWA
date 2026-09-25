import { describe, it, expect } from "vitest";
import { generateSession, validateAnswers, allCorrect } from "./relacionSumaResta";

// ────────────────────────────────────────────────────────────────
// generateSession
// ────────────────────────────────────────────────────────────────

describe("relacionSumaResta – generateSession", () => {
  const difficulties = ["easy", "medium", "hard", "expert"] as const;

  it.each(difficulties)("genera exactamente 10 ejercicios en dificultad %s", (diff) => {
    const session = generateSession(diff, 42);
    expect(session).toHaveLength(10);
  });

  it.each(difficulties)("la invariante partA + partB === total se cumple en %s", (diff) => {
    const session = generateSession(diff, 123);
    for (const ex of session) {
      expect(ex.partA + ex.partB).toBe(ex.total);
    }
  });

  it("easy: total entre 5 y 10, partes ≥ 1", () => {
    const session = generateSession("easy", 7);
    for (const ex of session) {
      expect(ex.total).toBeGreaterThanOrEqual(5);
      expect(ex.total).toBeLessThanOrEqual(10);
      expect(ex.partA).toBeGreaterThanOrEqual(1);
      expect(ex.partB).toBeGreaterThanOrEqual(1);
    }
  });

  it("medium: total entre 11 y 20", () => {
    const session = generateSession("medium", 7);
    for (const ex of session) {
      expect(ex.total).toBeGreaterThanOrEqual(11);
      expect(ex.total).toBeLessThanOrEqual(20);
    }
  });

  it("hard: total entre 21 y 50", () => {
    const session = generateSession("hard", 7);
    for (const ex of session) {
      expect(ex.total).toBeGreaterThanOrEqual(21);
      expect(ex.total).toBeLessThanOrEqual(50);
    }
  });

  it("expert: total entre 51 y 99", () => {
    const session = generateSession("expert", 7);
    for (const ex of session) {
      expect(ex.total).toBeGreaterThanOrEqual(51);
      expect(ex.total).toBeLessThanOrEqual(99);
    }
  });

  it("es determinista: misma seed → misma sesión", () => {
    const s1 = generateSession("medium", 999);
    const s2 = generateSession("medium", 999);
    expect(s1).toEqual(s2);
  });

  it("no repite ejercicios con la misma semilla", () => {
    const session = generateSession("easy", 42);
    const keys = session.map((ex) => `${ex.total}-${Math.min(ex.partA, ex.partB)}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(session.length);
  });
});

// ────────────────────────────────────────────────────────────────
// validateAnswers
// ────────────────────────────────────────────────────────────────

describe("relacionSumaResta – validateAnswers", () => {
  const ex = { total: 10, partA: 6, partB: 4 };
  // input[0] = partB (10-6=4), input[1] = partA (10-4=6), input[2] = total (6+4=10)

  it("acepta tres respuestas correctas", () => {
    const result = validateAnswers(ex, ["4", "6", "10"]);
    expect(result).toEqual([true, true, true]);
  });

  it("rechaza input[0] incorrecto", () => {
    const result = validateAnswers(ex, ["3", "6", "10"]);
    expect(result[0]).toBe(false);
    expect(result[1]).toBe(true);
    expect(result[2]).toBe(true);
  });

  it("rechaza input[1] incorrecto", () => {
    const result = validateAnswers(ex, ["4", "5", "10"]);
    expect(result[0]).toBe(true);
    expect(result[1]).toBe(false);
    expect(result[2]).toBe(true);
  });

  it("rechaza input[2] incorrecto", () => {
    const result = validateAnswers(ex, ["4", "6", "9"]);
    expect(result[0]).toBe(true);
    expect(result[1]).toBe(true);
    expect(result[2]).toBe(false);
  });

  it("ignora espacios en los inputs", () => {
    const result = validateAnswers(ex, [" 4", "6 ", " 10 "]);
    expect(result).toEqual([true, true, true]);
  });
});

// ────────────────────────────────────────────────────────────────
// allCorrect
// ────────────────────────────────────────────────────────────────

describe("relacionSumaResta – allCorrect", () => {
  it("devuelve true si los 3 son correctos", () => {
    expect(allCorrect([true, true, true])).toBe(true);
  });

  it("devuelve false si cualquiera es incorrecto", () => {
    expect(allCorrect([false, true, true])).toBe(false);
    expect(allCorrect([true, false, true])).toBe(false);
    expect(allCorrect([true, true, false])).toBe(false);
    expect(allCorrect([false, false, false])).toBe(false);
  });
});
