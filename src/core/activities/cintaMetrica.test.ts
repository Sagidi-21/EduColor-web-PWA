import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./cintaMetrica";

describe("cintaMetrica engine", () => {
  it("generateSession crea 10 ejercicios con seed estable", () => {
    const session1 = generateSession("easy", 42);
    const session2 = generateSession("easy", 42);

    expect(session1).toHaveLength(10);
    expect(session1).toEqual(session2);
  });

  it("difficulty 'easy' solo devuelve type 'choose-unit'", () => {
    const session = generateSession("easy", 123);
    for (const ex of session) {
      expect(ex.type).toBe("choose-unit");
      expect(ex.options).toEqual(["cm", "m"]);
    }
  });

  it("otras dificultades pueden devolver 'estimate'", () => {
    // Generate many to ensure we get at least one 'estimate'
    const session = [
      ...generateSession("medium", 1),
      ...generateSession("hard", 2),
      ...generateSession("expert", 3),
    ];

    const estimateEx = session.find((ex) => ex.type === "estimate");
    expect(estimateEx).toBeDefined();
    expect(estimateEx!.options).toHaveLength(3);
  });

  it("no repite items en una sesion", () => {
    const session = generateSession("expert", 999);
    const names = session.map((s) => s.item.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("validateAnswer ignora mayusculas y espacios", () => {
    const ex = generateSession("easy", 42)[0];
    const correct = ex.correctAnswer;

    expect(validateAnswer(ex, correct)).toBe(true);
    expect(validateAnswer(ex, ` ${correct.toUpperCase()} `)).toBe(true);
    expect(validateAnswer(ex, "wrong_answer")).toBe(false);
  });
});
