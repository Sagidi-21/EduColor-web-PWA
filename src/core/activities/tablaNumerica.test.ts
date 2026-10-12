import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./tablaNumerica";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

describe("tablaNumerica — generateSession", () => {
  it("genera 10 ejercicios en todas las dificultades", () => {
    for (const diff of DIFFICULTIES) {
      expect(generateSession(diff, 42)).toHaveLength(10);
    }
  });

  it("es determinista con la misma seed", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 123)).toEqual(generateSession(diff, 123));
    });
  });

  it("produce sesiones distintas con seeds distintas", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 1)).not.toEqual(generateSession(diff, 2));
    });
  });

  it("medium/hard/expert: rejilla de 100 casillas", () => {
    for (const diff of ["medium", "hard", "expert"] as const) {
      generateSession(diff, 7).forEach((ex) => {
        expect(ex.gridState).toHaveLength(100);
      });
    }
  });

  it("no repite casilla objetivo en easy", () => {
    const session = generateSession("easy", 5);
    const targets = session.map((ex) => ex.targetIndex);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it("easy: una única casilla target y tabla solo hasta respuesta + 10", () => {
    generateSession("easy", 9).forEach((ex) => {
      expect(ex.type).toBe("missing");
      const targets = ex.gridState.filter((s) => s === "target");
      expect(targets).toHaveLength(1);
      expect(ex.answer).toBe(String(ex.targetIndex));
      const expectedLen = Math.min(100, ex.targetIndex + 10 + 1);
      expect(ex.gridState).toHaveLength(expectedLen);
      expect(ex.gridState.length - 1).toBe(Math.min(99, ex.targetIndex + 10));
    });
  });

  it("medium: 4–10 símbolos en la tabla y pregunta por 2–4 de ellos", () => {
    const gridCounts = new Set<number>();
    const askCounts = new Set<number>();
    generateSession("medium", 11).forEach((ex) => {
      expect(ex.type).toBe("symbol");
      const symbolCells = ex.gridState.filter((s) => s === "symbol");
      expect(symbolCells.length).toBeGreaterThanOrEqual(4);
      expect(symbolCells.length).toBeLessThanOrEqual(10);
      gridCounts.add(symbolCells.length);

      expect(ex.validSet).toBeDefined();
      expect(ex.validSet!.length).toBeGreaterThanOrEqual(2);
      expect(ex.validSet!.length).toBeLessThanOrEqual(4);
      expect(ex.validSet!.length).toBeLessThanOrEqual(symbolCells.length);
      askCounts.add(ex.validSet!.length);

      expect(ex.targetSymbols).toHaveLength(ex.validSet!.length);
      expect(ex.symbolMap).toBeDefined();
      expect(Object.keys(ex.symbolMap ?? {})).toHaveLength(symbolCells.length);
      ex.validSet!.forEach((pos, i) => {
        expect(ex.symbolMap?.[pos]).toBe(ex.targetSymbols![i]);
      });
      expect(ex.answer).toBe(ex.validSet!.join(", "));
    });
    expect(gridCounts.size).toBeGreaterThan(1);
    expect(askCounts.size).toBeGreaterThan(1);
  });

  it("medium: no repite casillas preguntadas entre ejercicios", () => {
    const session = generateSession("medium", 3);
    const asks = session.flatMap((ex) => ex.validSet ?? []);
    expect(new Set(asks).size).toBe(asks.length);
  });

  it("hard: colorea por unidades y decenas con 10 reglas distintas", () => {
    generateSession("hard", 42).forEach((ex) => {
      expect(ex.type).toBe("colorear");
      expect(ex.ruleLabel).toMatch(/^\d (unidades|decenas)$/);
      const digit = Number(ex.ruleLabel?.[0]);
      if (ex.ruleLabel?.endsWith("unidades")) {
        expect(ex.validSet?.length).toBe(10);
        ex.validSet?.forEach((i) => expect(i % 10).toBe(digit));
      } else {
        expect(ex.validSet?.length).toBe(10);
        ex.validSet?.forEach((i) => expect(Math.floor(i / 10)).toBe(digit));
      }
    });
  });

  it("expert: mezcla reglas de unidades y decenas sin repetir", () => {
    const session = generateSession("expert", 42);
    const rules = session.map((ex) => ex.ruleLabel);
    expect(rules).toContainEqual(expect.stringMatching(/unidades$/));
    expect(rules).toContainEqual(expect.stringMatching(/decenas$/));
    expect(new Set(rules).size).toBe(rules.length);
  });

  it("el conjunto válido de decenas solo contiene números con esa decena", () => {
    generateSession("expert", 88)
      .filter((ex) => ex.ruleLabel?.endsWith("decenas"))
      .forEach((ex) => {
        const digit = Number(ex.ruleLabel?.[0]);
        ex.validSet?.forEach((i) => {
          expect(Math.floor(i / 10)).toBe(digit);
        });
      });
  });
});

describe("tablaNumerica — validateAnswer", () => {
  it("acepta la respuesta del ejercicio y rechaza cualquier otra", () => {
    for (const diff of DIFFICULTIES) {
      generateSession(diff, 21).forEach((ex) => {
        expect(validateAnswer(ex, ex.answer)).toBe(true);
        expect(validateAnswer(ex, `${ex.answer}0`)).toBe(false);
      });
    }
  });
});
