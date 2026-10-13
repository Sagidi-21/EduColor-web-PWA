import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./cintaMetrica";

describe("cintaMetrica engine", () => {
  it("generateSession crea 10 ejercicios con seed estable", () => {
    const session1 = generateSession("easy", 42);
    const session2 = generateSession("easy", 42);

    expect(session1).toHaveLength(10);
    expect(session1).toEqual(session2);
  });

  it("easy y medium solo devuelven choose-unit", () => {
    for (const level of ["easy", "medium"] as const) {
      const session = generateSession(level, 123);
      expect(session).toHaveLength(10);
      for (const ex of session) {
        expect(ex.type).toBe("choose-unit");
        expect(ex.options).toEqual(["cm", "m"]);
        expect(ex.question).toMatch(/mide \d+ ___/);
      }
    }
  });

  it("hard solo devuelve estimate", () => {
    const session = generateSession("hard", 42);
    expect(session).toHaveLength(10);
    for (const ex of session) {
      expect(ex.type).toBe("estimate");
      expect(ex.options).toHaveLength(3);
      expect(ex.question).toMatch(/aproximadamente/i);
    }
  });

  it("estimate: distractores de tamaño claramente separados (no 22 vs 25)", () => {
    for (const seed of [1, 7, 42, 99]) {
      const session = generateSession("hard", seed);
      for (const ex of session) {
        const sameUnit = ex.options
          .map((o) => o.trim().split(/\s+/))
          .filter((parts) => parts[1] === ex.item.unit)
          .map((parts) => Number(parts[0]));
        expect(sameUnit.length).toBe(2);
        const gap = Math.abs(sameUnit[0]! - sameUnit[1]!);
        const minGap = ex.item.unit === "cm" ? 12 : 3;
        expect(gap).toBeGreaterThanOrEqual(minGap);
      }
    }
  });

  it("emoji del estuche no es un lápiz/boli", () => {
    const session = [
      ...generateSession("medium", 1),
      ...generateSession("hard", 2),
      ...generateSession("expert", 3),
    ];
    const estuche = session.find((ex) => ex.item.name === "un estuche");
    if (estuche) {
      expect(estuche.item.emoji).not.toMatch(/✏|🖊/);
      expect(estuche.item.emoji).toBe("🎒");
    }
  });

  it("expert mezcla choose-unit y estimate", () => {
    const session = generateSession("expert", 7);
    const types = new Set(session.map((ex) => ex.type));
    expect(types.has("choose-unit")).toBe(true);
    expect(types.has("estimate")).toBe(true);
  });

  it("no repite items en una sesion", () => {
    const session = generateSession("expert", 999);
    const names = session.map((s) => s.item.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("validateAnswer ignora mayusculas y espacios", () => {
    const ex = generateSession("easy", 42)[0];
    const correct = ex.correctAnswer;

    expect(validateAnswer(ex, correct)).toBe(true);
    expect(validateAnswer(ex, ` ${correct.toUpperCase()} `)).toBe(true);
    expect(validateAnswer(ex, "wrong_answer")).toBe(false);
  });
});
