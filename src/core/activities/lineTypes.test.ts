import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, LINES, type LineKind } from "./lineTypes";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

const POOLS: Record<(typeof DIFFICULTIES)[number], LineKind[]> = {
  easy: ["horizontal", "vertical", "curva", "oblicua"],
  medium: ["horizontal", "vertical", "oblicua", "curva"],
  hard: ["abierta", "cerrada", "curva", "recta"],
  expert: ["horizontal", "vertical", "oblicua", "curva", "abierta", "cerrada", "recta"],
};

describe("lineTypes — generateSession", () => {
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

  it("cada ejercicio ofrece 4 opciones distintas con la correcta incluida", () => {
    for (const diff of DIFFICULTIES) {
      generateSession(diff, 7).forEach((ex) => {
        expect(ex.options).toHaveLength(4);
        expect(new Set(ex.options).size).toBe(4);
        expect(ex.options).toContain(ex.answer);
      });
    }
  });

  it("solo usa tipos del pool de la dificultad", () => {
    for (const diff of DIFFICULTIES) {
      const allowed = new Set(POOLS[diff]);
      generateSession(diff, 55).forEach((ex) => {
        expect(allowed.has(ex.line.kind)).toBe(true);
      });
    }
  });

  it("cubre todos los tipos del pool en las 10 posiciones", () => {
    for (const diff of DIFFICULTIES) {
      const kinds = new Set(generateSession(diff, 99).map((ex) => ex.line.kind));
      expect(kinds).toEqual(new Set(POOLS[diff]));
    }
  });

  it("el SVG dibujado corresponde al tipo anunciado", () => {
    const byKind = new Map(LINES.map((l) => [l.kind, l.svg]));
    for (const diff of DIFFICULTIES) {
      generateSession(diff, 3).forEach((ex) => {
        expect(ex.line.svg).toBe(byKind.get(ex.line.kind));
      });
    }
  });

  it("expert incluye los 7 tipos definidos", () => {
    const kinds = new Set(generateSession("expert", 42).map((ex) => ex.line.kind));
    expect(kinds.size).toBe(LINES.length);
  });
});

describe("lineTypes — validateAnswer", () => {
  it("acepta la etiqueta correcta y rechaza cualquier otra", () => {
    for (const diff of DIFFICULTIES) {
      generateSession(diff, 21).forEach((ex) => {
        expect(validateAnswer(ex, ex.answer)).toBe(true);
        ex.options
          .filter((o) => o !== ex.answer)
          .forEach((wrong) => expect(validateAnswer(ex, wrong)).toBe(false));
      });
    }
  });
});
