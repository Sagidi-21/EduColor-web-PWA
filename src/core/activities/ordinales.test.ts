import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, ORDINAL_LABELS } from "./ordinales";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

describe("ordinales — generateSession", () => {
  it("genera 10 ejercicios salvo en medium, limitado a 7 posiciones únicas", () => {
    expect(generateSession("easy", 42)).toHaveLength(10);
    expect(generateSession("hard", 42)).toHaveLength(10);
    expect(generateSession("expert", 42)).toHaveLength(10);
    // Con 7 posiciones como máximo solo hay 7 ejercicios sin repetir.
    expect(generateSession("medium", 42)).toHaveLength(7);
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

  it("produce 7 ejercicios en medium y 10 en el resto", () => {
    expect(generateSession("medium", 42)).toHaveLength(7);
    DIFFICULTIES.filter((d) => d !== "medium").forEach((diff) => {
      expect(generateSession(diff, 42)).toHaveLength(10);
    });
  });

  it("crece la fila con la dificultad: 5, 7 y 10 objetos", () => {
    expect(new Set(generateSession("easy", 42).map((ex) => ex.rowSize))).toEqual(new Set([5]));
    expect(new Set(generateSession("medium", 42).map((ex) => ex.rowSize))).toEqual(new Set([7]));
    expect(new Set(generateSession("hard", 42).map((ex) => ex.rowSize))).toEqual(new Set([10]));
  });

  it("la estrella siempre cae dentro de la fila", () => {
    for (const diff of DIFFICULTIES) {
      generateSession(diff, 7).forEach((ex) => {
        expect(ex.target).toBeGreaterThanOrEqual(1);
        expect(ex.target).toBeLessThanOrEqual(ex.rowSize);
      });
    }
  });

  it("la respuesta siempre está dentro del rango ordinal", () => {
    for (const diff of DIFFICULTIES) {
      generateSession(diff, 7).forEach((ex) => {
        expect(ex.answer).toBeGreaterThanOrEqual(1);
        expect(ex.answer).toBeLessThanOrEqual(ex.rowSize);
      });
    }
  });

  it("cada dificultad usa solo su tipo de ejercicio", () => {
    generateSession("easy", 42).forEach((ex) => expect(ex.type).toBe("identify"));
    generateSession("medium", 42).forEach((ex) => expect(ex.type).toBe("position"));
    generateSession("hard", 42).forEach((ex) => expect(ex.type).toBe("fromRight"));
  });

  it("expert mezcla los tres tipos", () => {
    const types = new Set(generateSession("expert", 42).map((ex) => ex.type));
    expect(types).toEqual(new Set(["identify", "position", "fromRight"]));
  });

  it("identify: 4 opciones distintas con la respuesta incluida", () => {
    generateSession("easy", 42).forEach((ex) => {
      expect(ex.options).toHaveLength(4);
      expect(new Set(ex.options).size).toBe(4);
      expect(ex.options).toContain(ex.answer);
    });
  });

  it("identify: la pregunta nombra el ordinal pedido", () => {
    generateSession("easy", 33).forEach((ex) => {
      expect(ex.question).toBe(`¿Cuál es el ${ORDINAL_LABELS[ex.answer - 1]}?`);
    });
  });

  it("position: la respuesta es la posición dibujada", () => {
    generateSession("medium", 42).forEach((ex) => {
      expect(ex.answer).toBe(ex.target);
      expect(ex.fromRight).toBe(false);
    });
  });

  it("fromRight: cuenta de izquierda a derecha (respuesta = posición dibujada)", () => {
    generateSession("hard", 42).forEach((ex) => {
      expect(ex.fromRight).toBe(true);
      expect(ex.answer).toBe(ex.target);
      expect(ex.question).not.toMatch(/derecha/i);
    });
  });

  it("asigna un emoji distinto a cada ejercicio de la sesión (mientras quepa el pool)", () => {
    DIFFICULTIES.forEach((diff) => {
      const session = generateSession(diff, 42);
      const emojis = session.map((ex) => ex.emoji);
      expect(emojis.every((e) => e.length > 0)).toBe(true);
      expect(new Set(emojis).size).toBe(session.length);
    });
  });

  it("no repite posición en position ni en fromRight", () => {
    (["medium", "hard"] as const).forEach((diff) => {
      const answers = generateSession(diff, 42).map((ex) => ex.answer);
      expect(new Set(answers).size).toBe(answers.length);
    });
  });
});

describe("ordinales — validateAnswer", () => {
  it("acepta la respuesta correcta como número, tolerando espacios", () => {
    for (const diff of DIFFICULTIES) {
      generateSession(diff, 21).forEach((ex) => {
        expect(validateAnswer(ex, String(ex.answer))).toBe(true);
        expect(validateAnswer(ex, ` ${ex.answer} `)).toBe(true);
        expect(validateAnswer(ex, "99")).toBe(false);
      });
    }
  });
});
