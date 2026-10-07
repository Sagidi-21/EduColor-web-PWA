import { describe, expect, it } from "vitest";
import { generateSession, validateAnswer } from "./simetria";

describe("simetria core", () => {
  it("generateSession devuelve 4 ejercicios en easy (4 formas × 1 tipo)", () => {
    const sess = generateSession("easy", 123);
    expect(sess).toHaveLength(4);
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
      expect(ex.shape).toBeDefined();
      expect(typeof ex.axes).toBe("number");
      expect(ex.question).toBeTypeOf("string");
      expect(ex.correctAnswer).toBeTypeOf("string");
      expect(Array.isArray(ex.options)).toBe(true);
      expect(ex.options.length).toBeGreaterThanOrEqual(2);
      expect(ex.options).toContain(ex.correctAnswer);
    }
  });

  it("easy: solo tipo is-symmetric con figuras básicas", () => {
    const sess = generateSession("easy", 789);
    for (const ex of sess) {
      expect(ex.type).toBe("is-symmetric");
      expect(["cuadrado", "rectangulo", "triangulo-eq", "triangulo-esc"]).toContain(ex.shape);
      expect(["Sí", "No"]).toContain(ex.correctAnswer);
    }
  });

  it("medium: incluye is-symmetric y which-shape", () => {
    const sess = generateSession("medium", 789);
    const types = new Set(sess.map((e) => e.type));
    expect(types).toContain("is-symmetric");
    expect(types).toContain("which-shape");
  });

  it("hard/expert: incluye count-axes", () => {
    const sess = generateSession("hard", 789);
    const types = new Set(sess.map((e) => e.type));
    expect(types).toContain("count-axes");
  });

  it("pregunta is-symmetric usa formato estándar", () => {
    const sess = generateSession("easy", 111);
    for (const ex of sess) {
      expect(ex.question).toMatch(/^¿Tiene el .+ algún eje de simetría\?$/);
    }
  });

  it("pregunta count-axes usa formato estándar", () => {
    const sess = generateSession("hard", 222);
    for (const ex of sess) {
      if (ex.type === "count-axes") {
        expect(ex.question).toMatch(/^¿Cuántos ejes de simetría tiene el .+\?$/);
      }
    }
  });

  it("pregunta which-shape usa uno de los dos formatos", () => {
    const sess = generateSession("medium", 333);
    for (const ex of sess) {
      if (ex.type === "which-shape") {
        expect([
          "¿Cuál de estas figuras tiene al menos un eje de simetría?",
          "¿Cuál de estas figuras NO tiene eje de simetría?",
        ]).toContain(ex.question);
      }
    }
  });

  it("opciones siempre incluyen la respuesta correcta", () => {
    const sess = generateSession("expert", 444);
    for (const ex of sess) {
      expect(ex.options).toContain(ex.correctAnswer);
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

  it("validateAnswer devuelve false para respuesta incorrecta", () => {
    const sess = generateSession("easy", 1);
    const ex = sess[0];
    const wrong = ex.options.find((o) => o !== ex.correctAnswer);
    expect(wrong).toBeDefined();
    expect(validateAnswer(ex, wrong!)).toBe(false);
  });

  it("todas las respuestas correctas son valores válidos", () => {
    const sess = generateSession("expert", 555);
    for (const ex of sess) {
      if (ex.type === "is-symmetric") {
        expect(["Sí", "No"]).toContain(ex.correctAnswer);
      } else if (ex.type === "count-axes") {
        expect(["0", "1", "2", "3", "4", "5", "6", "∞"]).toContain(ex.correctAnswer);
      } else {
        // which-shape: debe ser nombre de figura
        expect(ex.correctAnswer).toBeTypeOf("string");
      }
    }
  });

  it("no hay combinaciones shape-type repetidas en una sesión", () => {
    const sess = generateSession("medium", 666);
    const keys = sess.map((e) => `${e.shape}-${e.type}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});
