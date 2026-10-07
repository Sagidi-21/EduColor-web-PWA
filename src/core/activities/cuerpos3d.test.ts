import { describe, expect, it } from "vitest";
import { generateSession, validateAnswer } from "./cuerpos3d";

describe("cuerpos3d core", () => {
  it("generateSession devuelve hasta 10 ejercicios (easy tiene menos combinaciones únicas)", () => {
    const sess = generateSession("easy", 123);
    expect(sess.length).toBeGreaterThan(0);
    expect(sess.length).toBeLessThanOrEqual(10);
  });

  it("medium/hard/expert devuelven 10 ejercicios", () => {
    expect(generateSession("medium", 123)).toHaveLength(10);
    expect(generateSession("hard", 123)).toHaveLength(10);
    expect(generateSession("expert", 123)).toHaveLength(10);
  });

  it("cada ejercicio tiene la forma esperada", () => {
    const sess = generateSession("medium", 456);
    for (const ex of sess) {
      expect(ex.type).toBeDefined();
      expect(ex.shape).toBeDefined();
      expect(ex.question).toBeTypeOf("string");
      expect(ex.correctAnswer).toBeTypeOf("string");
      expect(Array.isArray(ex.options)).toBe(true);
      expect(ex.options.length).toBeGreaterThanOrEqual(4);
      expect(ex.options).toContain(ex.correctAnswer);
    }
  });

  it("tipos por dificultad: easy solo identify-name y real-object", () => {
    const sess = generateSession("easy", 789);
    for (const ex of sess) {
      expect(["identify-name", "real-object"]).toContain(ex.type);
    }
  });

  it("tipos por dificultad: medium añade count-faces", () => {
    const sess = generateSession("medium", 789);
    for (const ex of sess) {
      expect(["identify-name", "real-object", "count-faces"]).toContain(ex.type);
    }
  });

  it("tipos por dificultad: hard añade count-vertices", () => {
    const sess = generateSession("hard", 789);
    for (const ex of sess) {
      expect(["identify-name", "real-object", "count-faces", "count-vertices"]).toContain(ex.type);
    }
  });

  it("tipos por dificultad: expert añade count-edges", () => {
    const sess = generateSession("expert", 789);
    for (const ex of sess) {
      expect([
        "identify-name",
        "real-object",
        "count-faces",
        "count-vertices",
        "count-edges",
      ]).toContain(ex.type);
    }
  });

  it("cuerpos por dificultad: easy 4, medium 5, hard 6, expert 6", () => {
    const easy = new Set(generateSession("easy", 1).map((e) => e.shape));
    const med = new Set(generateSession("medium", 1).map((e) => e.shape));
    const hard = new Set(generateSession("hard", 1).map((e) => e.shape));
    const exp = new Set(generateSession("expert", 1).map((e) => e.shape));
    expect(easy.size).toBeLessThanOrEqual(4);
    expect(med.size).toBeLessThanOrEqual(5);
    expect(hard.size).toBeLessThanOrEqual(6);
    expect(exp.size).toBeLessThanOrEqual(6);
  });

  it("semilla determinista: misma seed produce misma sesión", () => {
    const a = generateSession("medium", 42);
    const b = generateSession("medium", 42);
    expect(a.map((e) => e.question)).toEqual(b.map((e) => e.question));
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

  it("validateAnswer devuelve false para respuesta incorrecta", () => {
    const sess = generateSession("easy", 1);
    const ex = sess[0];
    const wrong = ex.options.find((o) => o !== ex.correctAnswer);
    expect(wrong).toBeDefined();
    expect(validateAnswer(ex, wrong!)).toBe(false);
  });

  it("respuesta correcta sensible a mayúsculas/minúsculas (coincidencia exacta)", () => {
    const sess = generateSession("easy", 1);
    const ex = sess[0];
    expect(validateAnswer(ex, ex.correctAnswer.toLowerCase())).toBe(false);
    expect(validateAnswer(ex, ex.correctAnswer.toUpperCase())).toBe(false);
  });

  it("opciones en count-* están ordenadas numéricamente", () => {
    const sess = generateSession("hard", 111);
    for (const ex of sess) {
      if (ex.type.startsWith("count-")) {
        const nums = ex.options.map(Number);
        const sorted = [...nums].sort((a, b) => a - b);
        expect(nums).toEqual(sorted);
      }
    }
  });

  it("todas las respuestas correctas son cadenas no vacías", () => {
    const sess = generateSession("expert", 222);
    for (const ex of sess) {
      expect(ex.correctAnswer.length).toBeGreaterThan(0);
    }
  });

  it("pregunta en count-* menciona el cuerpo (normalizando acentos)", () => {
    const sess = generateSession("hard", 333);
    for (const ex of sess) {
      if (ex.type.startsWith("count-")) {
        const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        expect(norm(ex.question.toLowerCase())).toContain(norm(ex.shape));
      }
    }
  });
});
