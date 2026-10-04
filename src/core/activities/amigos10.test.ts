import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, SESSION_SIZE } from "./amigos10";

describe("amigos10", () => {
  it("should generate a full session with correct types", () => {
    const session = generateSession("hard", 42);
    expect(session.length).toBe(SESSION_SIZE);

    for (const ex of session) {
      expect(ex.given).toBeGreaterThanOrEqual(1);
      expect(ex.given).toBeLessThanOrEqual(9);
      expect(ex.complement + ex.given).toBe(10);
      expect(ex.options.length).toBe(4);
      expect(ex.options).toContain(ex.correctAnswer);

      const allUniqueOptions = new Set(ex.options);
      expect(allUniqueOptions.size).toBe(4);
    }
  });

  it("should restrict given to 1-5 for easy difficulty", () => {
    const session = generateSession("easy", 123);
    // En easy, maxGiven=5 y type siempre "complement" → solo 5 combinaciones posibles
    expect(session.length).toBeGreaterThanOrEqual(1);
    expect(session.length).toBeLessThanOrEqual(5);

    for (const ex of session) {
      expect(ex.given).toBeGreaterThanOrEqual(1);
      expect(ex.given).toBeLessThanOrEqual(5);
      expect(ex.type).toBe("complement");
    }
  });

  it("validateAnswer checks against correctAnswer", () => {
    const session = generateSession("medium", 42);
    const ex = session[0];

    expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);

    const wrongAnswer = ex.options.find((o) => o !== ex.correctAnswer)!;
    expect(validateAnswer(ex, wrongAnswer)).toBe(false);
  });

  it("is deterministic based on seed", () => {
    const sessionA = generateSession("expert", 42);
    const sessionB = generateSession("expert", 42);
    expect(sessionA).toEqual(sessionB);
  });
});
