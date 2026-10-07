import { describe, it, expect } from "vitest";
import { generateCCSession, validateCCAnswer } from "./circuloCircunferencia";

describe("CirculoCircunferencia engine", () => {
  it("generates 10 exercises for easy difficulty", () => {
    const session = generateCCSession(1234, "easy");
    expect(session).toHaveLength(10);
    expect(session[0].options).toHaveLength(2);
    expect(["classify-shape", "real-object"]).toContain(session[0].type);
  });

  it("easy only produces classify-shape exercises", () => {
    const session = generateCCSession(4321, "easy");
    for (const ex of session) {
      expect(ex.type).toBe("classify-shape");
      expect(["Círculo", "Circunferencia"]).toContain(ex.correctAnswer);
    }
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
