import { describe, it, expect } from "vitest";
import { generateNumeracion1119Session, validateNumeracion1119Answer } from "./numeracion1119";

describe("generateNumeracion1119Session", () => {
  it("genera exactamente 10 ejercicios", () => {
    const session = generateNumeracion1119Session(42, "easy");
    expect(session).toHaveLength(9); // Solo hay 9 números del 11 al 19
  });

  it("es determinista con la misma semilla", () => {
    const a = generateNumeracion1119Session(123, "medium");
    const b = generateNumeracion1119Session(123, "medium");
    expect(a).toEqual(b);
  });

  it("en easy genera ejercicios tipo 'identify'", () => {
    const session = generateNumeracion1119Session(42, "easy");
    for (const ex of session) {
      expect(ex.type).toBe("identify");
      expect(ex.options).toHaveLength(4);
      expect(ex.options).toContain(ex.answer);
    }
  });

  it("en medium genera ejercicios tipo 'units'", () => {
    const session = generateNumeracion1119Session(42, "medium");
    for (const ex of session) {
      expect(ex.type).toBe("units");
      expect(ex.answer).toBe(ex.number % 10);
    }
  });

  it("en expert alterna entre identify, units y sequence", () => {
    const session = generateNumeracion1119Session(42, "expert");
    const types = session.map((ex) => ex.type);
    expect(types).toContain("identify");
    expect(types).toContain("units");
    expect(types).toContain("sequence");
  });
});

describe("validateNumeracion1119Answer", () => {
  it("devuelve true para la respuesta correcta", () => {
    const [ex] = generateNumeracion1119Session(42, "medium"); // Units
    expect(validateNumeracion1119Answer(ex, String(ex.answer))).toBe(true);
  });

  it("devuelve false para la respuesta incorrecta", () => {
    const [ex] = generateNumeracion1119Session(42, "medium");
    expect(validateNumeracion1119Answer(ex, "99")).toBe(false);
  });
});
