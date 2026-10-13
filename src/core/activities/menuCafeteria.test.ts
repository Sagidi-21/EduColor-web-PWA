import { describe, expect, it } from "vitest";
import { generateSession, validateAnswer, MENU } from "./menuCafeteria";

describe("menuCafeteria core", () => {
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
    const sess = generateSession("easy", 456);
    for (const ex of sess) {
      expect(ex.menuItems).toBeDefined();
      expect(Array.isArray(ex.menuItems)).toBe(true);
      expect(ex.tray).toBeDefined();
      expect(Array.isArray(ex.tray)).toBe(true);
      expect(ex.question).toBeTypeOf("string");
      expect(ex.correctAnswer).toBeTypeOf("string");
      expect(Array.isArray(ex.options)).toBe(true);
      expect(ex.options.length).toBeGreaterThanOrEqual(4);
      expect(ex.options).toContainEqual(expect.objectContaining({ value: ex.correctAnswer }));
    }
  });

  it("easy: pregunta de suma, 4 opciones", () => {
    const sess = generateSession("easy", 789);
    for (const ex of sess) {
      expect(ex.question).toContain("¿Cuánto pago en total?");
      expect(ex.options.length).toBe(4);
      expect(ex.correctAnswer).toMatch(/^\d+€$/);
    }
  });

  it("medium: 2 platos y presupuesto, 2 opciones (yes/no)", () => {
    const sess = generateSession("medium", 789);
    for (const ex of sess) {
      expect(ex.tray).toHaveLength(2);
      expect(ex.question).toMatch(/^Tengo \d+€\. ¿Puedo pedir /);
      expect(ex.question).toContain("¿Puedo pedir");
      expect(ex.question).not.toContain("¿Cuánto pago en total?");
      expect(ex.options.length).toBe(2);
      expect(["yes", "no"]).toContain(ex.correctAnswer);
    }
  });

  it("hard: 3 platos, mezcla suma y presupuesto", () => {
    const sess = generateSession("hard", 789);
    const sums = sess.filter((ex) => ex.question.includes("¿Cuánto pago en total?"));
    const budgets = sess.filter((ex) => ex.question.includes("¿Puedo pedir"));
    expect(sums.length).toBeGreaterThan(0);
    expect(budgets.length).toBeGreaterThan(0);
    expect(sums.length + budgets.length).toBe(sess.length);
    for (const ex of sess) {
      expect(ex.tray).toHaveLength(3);
    }
    for (const ex of sums) {
      expect(ex.options.length).toBe(4);
      expect(ex.correctAnswer).toMatch(/^\d+€$/);
    }
    for (const ex of budgets) {
      expect(ex.options.length).toBe(2);
      expect(["yes", "no"]).toContain(ex.correctAnswer);
      expect(ex.question).not.toMatch(/=\s*\d+€\s*en total/);
    }
  });

  it("expert: pregunta de cambio, 4 opciones", () => {
    const sess = generateSession("expert", 789);
    for (const ex of sess) {
      expect(ex.question).toContain("¿Cuánto me devuelven?");
      expect(ex.options.length).toBe(4);
      expect(ex.correctAnswer).toMatch(/^\d+€$/);
    }
  });

  it("tray items count: easy/medium=2, hard/expert=3", () => {
    for (const diff of ["easy", "medium"] as const) {
      const sess = generateSession(diff, 1);
      for (const ex of sess) {
        expect(ex.tray.length).toBe(2);
      }
    }
    for (const diff of ["hard", "expert"] as const) {
      const sess = generateSession(diff, 1);
      for (const ex of sess) {
        expect(ex.tray.length).toBe(3);
      }
    }
  });

  it("menuSubset tiene 8 items únicos por sesión", () => {
    const sess = generateSession("medium", 999);
    for (const ex of sess) {
      const names = new Set(ex.menuItems.map((m) => m.name));
      expect(names.size).toBe(8);
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
    const opt = ex.options.find((o) => o.value === ex.correctAnswer);
    expect(validateAnswer(ex, opt!.value)).toBe(true);
  });

  it("validateAnswer devuelve false para respuesta incorrecta", () => {
    const sess = generateSession("easy", 1);
    const ex = sess[0];
    const wrong = ex.options.find((o) => o.value !== ex.correctAnswer);
    expect(validateAnswer(ex, wrong!.value)).toBe(false);
  });

  it("respuesta correcta sensible a mayúsculas/minúsculas en hard (yes/no)", () => {
    const sess = generateSession("hard", 1);
    const ex = sess[0];
    // hard uses "yes"/"no" answers which are case sensitive
    expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);
    expect(validateAnswer(ex, "YES")).toBe(false);
    expect(validateAnswer(ex, "NO")).toBe(false);
  });

  it("todas las respuestas correctas son cadenas no vacías", () => {
    const sess = generateSession("expert", 222);
    for (const ex of sess) {
      expect(ex.correctAnswer.length).toBeGreaterThan(0);
    }
  });

  it("pregunta menciona los nombres de los items del tray", () => {
    const sess = generateSession("easy", 333);
    for (const ex of sess) {
      for (const item of ex.tray) {
        expect(ex.question).toContain(item.name);
      }
    }
  });

  it("todos los items del menú tienen propiedades requeridas", () => {
    for (const item of MENU) {
      expect(item.emoji).toBeTypeOf("string");
      expect(item.name).toBeTypeOf("string");
      expect(item.price).toBeTypeOf("number");
      expect(item.price).toBeGreaterThan(0);
      expect(["primer", "segundo", "bebida", "postre"]).toContain(item.category);
    }
  });
});
