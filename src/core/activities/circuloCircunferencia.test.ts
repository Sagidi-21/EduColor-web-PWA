import { describe, it, expect } from "vitest";
import { generateCCSession, validateCCAnswer } from "./circuloCircunferencia";

describe("CirculoCircunferencia engine", () => {
  it("easy genera 4 ejercicios (solo dos clases posibles)", () => {
    const session = generateCCSession(1234, "easy");
    expect(session).toHaveLength(4);
    expect(session[0].options).toHaveLength(2);
    expect(["classify-shape", "real-object"]).toContain(session[0].type);
  });

  it("easy only produces classify-shape exercises with distinct questions", () => {
    const session = generateCCSession(4321, "easy");
    for (const ex of session) {
      expect(ex.type).toBe("classify-shape");
      expect(["Círculo", "Circunferencia"]).toContain(ex.correctAnswer);
    }
    const questions = session.map((ex) => ex.question);
    expect(new Set(questions).size).toBe(questions.length);
    const circulos = session.filter((ex) => ex.shapeType === "circulo").length;
    const circunferencias = session.filter((ex) => ex.shapeType === "circunferencia").length;
    expect(circulos).toBe(2);
    expect(circunferencias).toBe(2);
  });

  it("medium mixes shapes and real objects without repeating real objects", () => {
    const session = generateCCSession(5555, "medium");
    expect(session).toHaveLength(10);
    const shapes = session.filter((ex) => ex.type === "classify-shape");
    const reals = session.filter((ex) => ex.type === "real-object");
    expect(shapes).toHaveLength(4);
    expect(reals).toHaveLength(6);
    const names = reals.map((ex) => ex.objectName);
    expect(new Set(names).size).toBe(names.length);
    const shapeQuestions = shapes.map((ex) => ex.question);
    expect(new Set(shapeQuestions).size).toBe(shapeQuestions.length);
  });

  it("expert only produces real-object exercises", () => {
    const session = generateCCSession(9999, "expert");
    for (const ex of session) {
      expect(ex.type).toBe("real-object");
      expect(ex.objectName).toBeTruthy();
      expect(ex.objectEmoji).toBeTruthy();
    }
  });

  it("does not repeat the same real object in a session", () => {
    const session = generateCCSession(7777, "expert");
    const names = session.map((ex) => ex.objectName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("validates correct answer and rejects wrong", () => {
    const session = generateCCSession(1234, "easy");
    const ex = session[0];
    expect(validateCCAnswer(ex, ex.correctAnswer)).toBe(true);
    const wrong = ex.options.find((o) => o !== ex.correctAnswer)!;
    expect(validateCCAnswer(ex, wrong)).toBe(false);
    // case-insensitive
    expect(validateCCAnswer(ex, ex.correctAnswer.toLowerCase())).toBe(true);
  });
});
