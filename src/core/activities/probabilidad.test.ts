import { describe, expect, it } from "vitest";
import { generateSession, validateAnswer } from "./probabilidad";

describe("probabilidad core", () => {
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
      expect(ex.type).toBeDefined();
      expect(ex.context).toBeTypeOf("string");
      expect(ex.question).toBeTypeOf("string");
      expect(ex.correctAnswer).toBeTypeOf("string");
      expect(Array.isArray(ex.options)).toBe(true);
      expect(ex.options.length).toBe(3);
      expect(ex.options.map((o) => o.toLowerCase())).toContain(ex.correctAnswer.toLowerCase());
    }
  });

  it("easy: solo eventos seguros e imposibles (sin posibles)", () => {
    const sess = generateSession("easy", 789);
    for (const ex of sess) {
      expect(["seguro", "imposible"]).toContain(ex.correctAnswer);
      expect(ex.type).toBe("classify");
    }
  });

  it("medium: incluye los tres tipos", () => {
    const sess = generateSession("medium", 789);
    const results = new Set(sess.map((e) => e.correctAnswer));
    expect(results).toContain("seguro");
    expect(results).toContain("posible");
    expect(results).toContain("imposible");
  });

  it("hard/expert: incluye ejercicios de bolsa", () => {
    const sess = generateSession("hard", 789);
    const types = new Set(sess.map((e) => e.type));
    expect(types).toContain("bag");
  });

  it("ejercicios de bolsa tienen contexto con descripción de pelotas", () => {
    const sess = generateSession("hard", 999);
    for (const ex of sess) {
      if (ex.type === "bag") {
        expect(ex.context).toContain("Bolsa:");
        expect(ex.context).toContain("pelotas");
      }
    }
  });

  it("pregunta de clasificación usa formato estándar", () => {
    const sess = generateSession("medium", 111);
    for (const ex of sess) {
      if (ex.type === "classify") {
        expect(ex.question).toBe("¿Es este suceso seguro, posible o imposible?");
      }
    }
  });

  it("opciones siempre son las 3 categorías en orden aleatorio", () => {
    const sess = generateSession("medium", 222);
    for (const ex of sess) {
      const opts = ex.options.map((o) => o.toLowerCase()).sort();
      expect(opts).toEqual(["imposible", "posible", "seguro"]);
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
    // Con distinta semilla, es muy improbable que TODAS las 10 preguntas coincidan
    const allSame = a.every(
      (e, i) => e.question === b[i]?.question && e.correctAnswer === b[i]?.correctAnswer,
    );
    expect(allSame).toBe(false);
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
    const wrong = ex.options.find((o) => o.toLowerCase() !== ex.correctAnswer);
    expect(wrong).toBeDefined();
    expect(validateAnswer(ex, wrong!)).toBe(false);
  });

  it("todas las respuestas correctas son valores válidos", () => {
    const sess = generateSession("expert", 222);
    for (const ex of sess) {
      expect(["seguro", "posible", "imposible"]).toContain(ex.correctAnswer);
    }
  });

  it("no hay textos repetidos en una sesión (classify)", () => {
    const sess = generateSession("medium", 333);
    const texts = sess.filter((e) => e.type === "classify").map((e) => e.context);
    const unique = new Set(texts);
    expect(unique.size).toBe(texts.length);
  });

  it("no hay bolsas repetidas en una sesión", () => {
    const sess = generateSession("hard", 444);
    const bagContexts = sess.filter((e) => e.type === "bag").map((e) => e.context);
    const unique = new Set(bagContexts);
    expect(unique.size).toBe(bagContexts.length);
  });
});
