import { describe, it, expect } from "vitest";
import { generateNumeracion1119Session, validateNumeracion1119Answer } from "./numeracion1119";

describe("generateNumeracion1119Session", () => {
  it("genera exactamente 10 ejercicios en las cuatro dificultades", () => {
    for (const d of ["easy", "medium", "hard", "expert"] as const) {
      expect(generateNumeracion1119Session(42, d), d).toHaveLength(10);
    }
  });

  it("nunca repite el mismo ejercicio justo después", () => {
    // La paleta 11..19 solo tiene nueve valores, así que para llegar a diez
    // hay que repetir alguno. Se admite, pero no seguido: si el niño ve dos
    // iguales pegados parece que la pantalla no avanza.
    for (const d of ["easy", "medium", "hard", "expert"] as const) {
      const s = generateNumeracion1119Session(7, d);
      for (let i = 1; i < s.length; i++) {
        const a = s[i - 1];
        const b = s[i];
        expect(
          a.type === b.type && a.number === b.number && a.answer === b.answer,
          `${d}: repite ${a.number} en las posiciones ${i} y ${i + 1}`,
        ).toBe(false);
      }
    }
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
