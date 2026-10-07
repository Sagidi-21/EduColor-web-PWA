import { describe, expect, it } from "vitest";
import { generateSession, validateAnswer } from "./posicionesAula";

describe("posicionesAula core", () => {
  it("generateSession devuelve 10 ejercicios en easy", () => {
    const sess = generateSession("easy", 123);
    expect(sess).toHaveLength(10);
  });

  it("generateSession devuelve 10 ejercicios en medium", () => {
    const sess = generateSession("medium", 123);
    expect(sess).toHaveLength(10);
  });

  it("generateSession devuelve 10 ejercicios en hard", () => {
    const sess = generateSession("hard", 123);
    expect(sess).toHaveLength(10);
  });

  it("generateSession devuelve 10 ejercicios en expert", () => {
    const sess = generateSession("expert", 123);
    expect(sess).toHaveLength(10);
  });

  it("cada ejercicio tiene la forma esperada", () => {
    const sess = generateSession("medium", 456);
    for (const ex of sess) {
      expect(ex.container).toBeDefined();
      expect(ex.object).toBeDefined();
      expect(ex.position).toBeDefined();
      expect(ex.question).toBeTypeOf("string");
      expect(ex.correctAnswer).toBeTypeOf("string");
      expect(Array.isArray(ex.options)).toBe(true);
      expect(ex.options.length).toBeGreaterThanOrEqual(2);
      expect(ex.options.map((o) => o.toLowerCase())).toContain(ex.correctAnswer.toLowerCase());
    }
  });

  it("easy/medium: solo posiciones encima/debajo y dentro/fuera", () => {
    const sess = generateSession("easy", 789);
    for (const ex of sess) {
      expect(["encima", "debajo", "dentro", "fuera"]).toContain(ex.position);
      if (["dentro", "fuera"].includes(ex.position)) {
        expect(ex.options).toEqual(expect.arrayContaining(["Dentro", "Fuera"]));
        expect(ex.options.length).toBe(2);
      } else {
        // Only 2 directional positions (encima, debajo), so max 2 options (correct + 1 decoy)
        expect(ex.options.length).toBeLessThanOrEqual(2);
        expect(ex.options.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("hard/expert: incluye 'al lado'", () => {
    const sess = generateSession("hard", 789);
    const positions = new Set(sess.map((e) => e.position));
    expect(positions).toContain("al lado");
  });

  it("contenimiento (dentro/fuera) solo usa recipientes cerrados", () => {
    const sess = generateSession("easy", 999);
    for (const ex of sess) {
      if (ex.position === "dentro" || ex.position === "fuera") {
        expect(["caja", "mochila"]).toContain(ex.container);
      }
    }
  });

  it("direccional (encima/debajo/al lado) usa todos los recipientes", () => {
    const sess = generateSession("hard", 999);
    for (const ex of sess) {
      if (ex.position === "encima" || ex.position === "debajo" || ex.position === "al lado") {
        expect(["caja", "mochila", "mesa", "silla"]).toContain(ex.container);
      }
    }
  });

  it("pregunta incluye el artículo correcto", () => {
    const sess = generateSession("easy", 111);
    for (const ex of sess) {
      expect(ex.question).toMatch(/¿Dónde está (el|la) (pelota|lápiz|libro|goma)\?/);
    }
  });

  it("semilla determinista: misma seed produce misma sesión", () => {
    const a = generateSession("medium", 42);
    const b = generateSession("medium", 42);
    expect(a.map((e) => e.question)).toEqual(b.map((e) => e.question));
    expect(a.map((e) => e.correctAnswer)).toEqual(b.map((e) => e.correctAnswer));
  });

  it("seeds distintas producen sesiones distintas (probabilísticamente)", () => {
    const a = generateSession("medium", 1);
    const b = generateSession("medium", 999);
    const same = a.every((e, i) => e.question === b[i]?.question);
    expect(same).toBe(false);
  });

  it("validateAnswer devuelve true para respuesta correcta", () => {
    const sess = generateSession("easy", 1);
    const ex = sess[0];
    expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);
  });

  it("validateAnswer devuelve true para respuesta correcta con distinta capitalización", () => {
    const sess = generateSession("easy", 1);
    const ex = sess[0];
    expect(validateAnswer(ex, ex.correctAnswer.toUpperCase())).toBe(true);
    expect(validateAnswer(ex, ex.correctAnswer.toLowerCase())).toBe(true);
  });

  it("validateAnswer devuelve false para respuesta incorrecta", () => {
    const sess = generateSession("easy", 1);
    const ex = sess[0];
    const wrong = ex.options.find((o) => o.toLowerCase() !== ex.correctAnswer.toLowerCase());
    expect(wrong).toBeDefined();
    expect(validateAnswer(ex, wrong!)).toBe(false);
  });

  it("todas las respuestas correctas son cadenas no vacías", () => {
    const sess = generateSession("expert", 222);
    for (const ex of sess) {
      expect(ex.correctAnswer.length).toBeGreaterThan(0);
    }
  });

  it("no hay combinaciones repetidas (container-object-position) en una sesión", () => {
    const sess = generateSession("expert", 333);
    const keys = new Set(sess.map((e) => `${e.container}-${e.object}-${e.position}`));
    expect(keys.size).toBe(sess.length);
  });

  it("objetos válidos: pelota, lápiz, libro, goma", () => {
    const sess = generateSession("medium", 444);
    for (const ex of sess) {
      expect(["pelota", "lápiz", "libro", "goma"]).toContain(ex.object);
    }
  });

  it("recipientes válidos: caja, mochila, mesa, silla", () => {
    const sess = generateSession("medium", 555);
    for (const ex of sess) {
      expect(["caja", "mochila", "mesa", "silla"]).toContain(ex.container);
    }
  });
});
