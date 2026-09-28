import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./capacidad";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

describe("capacidad — generateSession", () => {
  it("genera 10 ejercicios en easy y expert", () => {
    expect(generateSession("easy", 42)).toHaveLength(10);
    expect(generateSession("expert", 42)).toHaveLength(10);
  });

  it("medium y hard se limitan a 5 por la deduplicación de combinaciones", () => {
    // Con 5 litros como máximo solo hay 5 valores únicos por tipo.
    expect(generateSession("medium", 42)).toHaveLength(5);
    expect(generateSession("hard", 42)).toHaveLength(5);
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

  it("cada dificultad usa solo su tipo de ejercicio", () => {
    generateSession("easy", 7).forEach((ex) => expect(ex.type).toBe("compare"));
    generateSession("medium", 7).forEach((ex) => expect(ex.type).toBe("read"));
    generateSession("hard", 7).forEach((ex) => expect(ex.type).toBe("fill"));
  });

  it("expert mezcla los tres tipos", () => {
    const types = new Set(generateSession("expert", 42).map((ex) => ex.type));
    expect(types).toEqual(new Set(["compare", "read", "fill"]));
  });

  it("compare: la respuesta coincide con los litros de cada recipiente", () => {
    for (const diff of ["easy", "expert"] as const) {
      generateSession(diff, 33).forEach((ex) => {
        if (ex.type !== "compare") return;
        const expected =
          ex.litersA! > ex.litersB! ? "A" : ex.litersB! > ex.litersA! ? "B" : "Igual";
        expect(ex.answer).toBe(expected);
        expect(ex.options).toEqual(["A", "B", "Igual"]);
      });
    }
  });

  it("no repite combinación en compare", () => {
    const keys = generateSession("easy", 42).map(
      (ex) => `${ex.litersA}-${ex.litersB}-${ex.litersA === ex.litersB}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("read: la respuesta es el número de litros mostrado", () => {
    generateSession("medium", 42).forEach((ex) => {
      expect(ex.liters).toBeGreaterThanOrEqual(1);
      expect(ex.liters!).toBeLessThanOrEqual(ex.maxLiters!);
      expect(ex.answer).toBe(String(ex.liters));
    });
  });

  it("fill: la respuesta coincide con los vasos dibujados", () => {
    generateSession("hard", 42).forEach((ex) => {
      expect(ex.answer).toBe(String(ex.cups));
      expect(ex.question).toContain(String(ex.cups));
    });
  });

  it("expert llega hasta 8 litros", () => {
    const maxes = new Set(
      generateSession("expert", 42).flatMap((ex) => [ex.maxLiters, ex.cups].filter(Boolean)),
    );
    expect(maxes.has(8)).toBe(true);
  });
});

describe("capacidad — validateAnswer", () => {
  it("acepta la respuesta correcta y rechaza el resto", () => {
    for (const diff of DIFFICULTIES) {
      generateSession(diff, 21).forEach((ex) => {
        expect(validateAnswer(ex, ex.answer)).toBe(true);
        expect(validateAnswer(ex, "999")).toBe(false);
      });
    }
  });

  it("tolera espacios alrededor de la respuesta", () => {
    generateSession("medium", 42).forEach((ex) => {
      expect(validateAnswer(ex, `  ${ex.answer}  `)).toBe(true);
    });
  });
});
