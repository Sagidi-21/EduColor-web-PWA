import { describe, expect, it } from "vitest";
import { generateSession, validateAnswer, validateSteps } from "./problemas2pasos";

describe("problemas2pasos core", () => {
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
      expect(ex.op1).toBeDefined();
      expect(ex.op2).toBeDefined();
      expect(typeof ex.a).toBe("number");
      expect(typeof ex.b).toBe("number");
      expect(typeof ex.c).toBe("number");
      expect(typeof ex.mid).toBe("number");
      expect(typeof ex.result).toBe("number");
      expect(Array.isArray(ex.story)).toBe(true);
      expect(ex.story.length).toBeGreaterThanOrEqual(2);
      expect(ex.question).toBeTypeOf("string");
      expect(ex.correctAnswer).toBeTypeOf("string");
      expect(Array.isArray(ex.options)).toBe(true);
      expect(ex.options.length).toBe(4);
      expect(ex.options).toContain(ex.correctAnswer);
    }
  });

  it("easy: solo tipos add-add y add-sub", () => {
    const sess = generateSession("easy", 789);
    for (const ex of sess) {
      expect(["add-add", "add-sub"]).toContain(ex.type);
      expect(ex.op1).toBe("+");
      expect(["+", "-"]).toContain(ex.op2);
    }
  });

  it("medium: añade sub-add", () => {
    const sess = generateSession("medium", 789);
    const types = new Set(sess.map((e) => e.type));
    expect(types).toContain("add-add");
    expect(types).toContain("add-sub");
    expect(types).toContain("sub-add");
  });

  it("hard/expert: todos los tipos", () => {
    const sess = generateSession("hard", 789);
    const types = new Set(sess.map((e) => e.type));
    expect(types).toContain("add-add");
    expect(types).toContain("add-sub");
    expect(types).toContain("sub-add");
    expect(types).toContain("sub-sub");
  });

  it("story tiene 3 líneas", () => {
    const sess = generateSession("medium", 111);
    for (const ex of sess) {
      expect(ex.story).toHaveLength(3);
    }
  });

  it("mid y result son correctos según operaciones", () => {
    const sess = generateSession("medium", 222);
    for (const ex of sess) {
      const step1 = ex.op1 === "+" ? ex.a + ex.b : ex.a - ex.b;
      expect(ex.mid).toBe(step1);
      const step2 = ex.op2 === "+" ? ex.mid + ex.c : ex.mid - ex.c;
      expect(ex.result).toBe(step2);
    }
  });

  it("opciones están ordenadas numéricamente", () => {
    const sess = generateSession("expert", 333);
    for (const ex of sess) {
      const nums = ex.options.map(Number);
      for (let i = 1; i < nums.length; i++) {
        expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
      }
    }
  });

  it("semilla determinista: misma seed produce misma sesión", () => {
    const a = generateSession("medium", 42);
    const b = generateSession("medium", 42);
    expect(a.map((e) => e.a)).toEqual(b.map((e) => e.a));
    expect(a.map((e) => e.b)).toEqual(b.map((e) => e.b));
    expect(a.map((e) => e.c)).toEqual(b.map((e) => e.c));
    expect(a.map((e) => e.result)).toEqual(b.map((e) => e.result));
  });

  it("seeds distintas producen sesiones distintas (probabilísticamente)", () => {
    const a = generateSession("medium", 1);
    const b = generateSession("medium", 999);
    const allSame = a.every(
      (e, i) => e.a === b[i]?.a && e.b === b[i]?.b && e.c === b[i]?.c && e.result === b[i]?.result,
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

  it("validateSteps exige mid y resultado correctos", () => {
    const ex = generateSession("easy", 1)[0]!;
    expect(validateSteps(ex, String(ex.mid), String(ex.result))).toBe(true);
    expect(validateSteps(ex, String(ex.mid + 1), String(ex.result))).toBe(false);
    expect(validateSteps(ex, String(ex.mid), String(ex.result + 1))).toBe(false);
  });

  it("todas las respuestas correctas son números positivos", () => {
    const sess = generateSession("expert", 555);
    for (const ex of sess) {
      expect(Number(ex.correctAnswer)).toBeGreaterThan(0);
    }
  });

  it("no hay ejercicios duplicados (mismo type-a-b-c) en una sesión", () => {
    const sess = generateSession("medium", 666);
    const keys = sess.map((e) => `${e.type}-${e.a}-${e.b}-${e.c}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("easy usa números hasta 20, medium hasta 50, hard hasta 100, expert hasta 200", () => {
    const easy = generateSession("easy", 1);
    const medium = generateSession("medium", 1);
    const hard = generateSession("hard", 1);
    const expert = generateSession("expert", 1);
    for (const ex of easy) expect(ex.result).toBeLessThanOrEqual(20);
    for (const ex of medium) expect(ex.result).toBeLessThanOrEqual(50);
    for (const ex of hard) expect(ex.result).toBeLessThanOrEqual(100);
    for (const ex of expert) expect(ex.result).toBeLessThanOrEqual(200);
  });

  it("easy tiene 2 tipos, medium 3, hard/expert 4", () => {
    const easyTypes = new Set(generateSession("easy", 1).map((e) => e.type));
    const mediumTypes = new Set(generateSession("medium", 1).map((e) => e.type));
    const hardTypes = new Set(generateSession("hard", 1).map((e) => e.type));
    expect(easyTypes.size).toBe(2);
    expect(mediumTypes.size).toBe(3);
    expect(hardTypes.size).toBe(4);
  });
});
