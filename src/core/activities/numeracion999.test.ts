import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./numeracion999";

describe("numeracion999", () => {
  it("genera 10 ejercicios", () => {
    const session = generateSession("easy", 42);
    expect(session).toHaveLength(10);
  });

  it("easy solo usa cifra-to-cdu y cdu-to-cifra", () => {
    const session = generateSession("easy", 42);
    const types = new Set(session.map((ex) => ex.type));
    expect(types.has("cifra-to-cdu")).toBe(true);
    expect(types.has("cdu-to-cifra")).toBe(true);
    expect(types.has("valor-posicional")).toBe(false);
    expect(types.has("anterior-posterior")).toBe(false);
  });

  it("medium usa hasta valor-posicional", () => {
    const session = generateSession("medium", 42);
    const types = new Set(session.map((ex) => ex.type));
    expect(types.has("cifra-to-cdu")).toBe(true);
    expect(types.has("cdu-to-cifra")).toBe(true);
    expect(types.has("valor-posicional")).toBe(true);
    expect(types.has("anterior-posterior")).toBe(false);
  });

  it("hard y expert pueden producir todos los tipos", () => {
    for (const diff of ["hard", "expert"] as const) {
      const foundTypes: Record<string, boolean> = { "cifra-to-cdu": false, "cdu-to-cifra": false, "valor-posicional": false, "anterior-posterior": false };
      let attempts = 0;
      while (attempts < 100 && !Object.values(foundTypes).every(Boolean)) {
        attempts++;
        const session = generateSession(diff, attempts);
        session.forEach((ex) => {
          if (ex.type in foundTypes) foundTypes[ex.type as keyof typeof foundTypes] = true;
        });
      }
      expect(foundTypes["cifra-to-cdu"]).toBe(true);
      expect(foundTypes["cdu-to-cifra"]).toBe(true);
      expect(foundTypes["valor-posicional"]).toBe(true);
      expect(foundTypes["anterior-posterior"]).toBe(true);
    }
  });

  it("easy usa rango 100-299", () => {
    const session = generateSession("easy", 42);
    session.forEach((ex) => {
      expect(ex.number).toBeGreaterThanOrEqual(100);
      expect(ex.number).toBeLessThanOrEqual(299);
    });
  });

  it("medium usa rango 100-499", () => {
    const session = generateSession("medium", 42);
    session.forEach((ex) => {
      expect(ex.number).toBeGreaterThanOrEqual(100);
      expect(ex.number).toBeLessThanOrEqual(499);
    });
  });

  it("hard usa rango 100-699", () => {
    const session = generateSession("hard", 42);
    session.forEach((ex) => {
      expect(ex.number).toBeGreaterThanOrEqual(100);
      expect(ex.number).toBeLessThanOrEqual(699);
    });
  });

  it("expert usa rango 100-999", () => {
    const session = generateSession("expert", 42);
    session.forEach((ex) => {
      expect(ex.number).toBeGreaterThanOrEqual(100);
      expect(ex.number).toBeLessThanOrEqual(999);
    });
  });

  it("semilla reproducible", () => {
    const a = generateSession("easy", 42);
    const b = generateSession("easy", 42);
    expect(a).toEqual(b);
  });

  it("semilla diferente genera resultados distintos", () => {
    const a = generateSession("easy", 42);
    const b = generateSession("easy", 99);
    expect(a).not.toEqual(b);
  });

  it("ejercicios tienen centenas, decenas, unidades", () => {
    const session = generateSession("easy", 1);
    session.forEach((ex) => {
      expect(ex).toHaveProperty("centenas");
      expect(ex).toHaveProperty("decenas");
      expect(ex).toHaveProperty("unidades");
      expect(ex.centenas).toBeGreaterThanOrEqual(0);
      expect(ex.decenas).toBeGreaterThanOrEqual(0);
      expect(ex.decenas).toBeLessThanOrEqual(9);
      expect(ex.unidades).toBeGreaterThanOrEqual(0);
      expect(ex.unidades).toBeLessThanOrEqual(9);
    });
  });

  it("validateAnswer acepta respuesta correcta (exact match)", () => {
    const ex = generateSession("easy", 42)[0];
    expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);
  });

  it("validateAnswer rechaza respuesta incorrecta", () => {
    const ex = generateSession("easy", 42)[0];
    expect(validateAnswer(ex, "incorrecta")).toBe(false);
  });
});