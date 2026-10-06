import { describe, it, expect } from "vitest";
import { generateSeries3CifrasSession, validateSeries3CifrasAnswer } from "./series3cifras";

describe("Series3Cifras engine", () => {
  it("generates 10 exercises for easy difficulty", () => {
    const session = generateSeries3CifrasSession(1234, "easy");
    expect(session).toHaveLength(10);
    expect(session[0].options).toHaveLength(4);
    expect(session[0].sequence).toHaveLength(5);
    expect(session[0].sequence.filter((n) => n === -1)).toHaveLength(1);
  });

  it("ensures all numbers are 3 digits (100-999)", () => {
    const session = generateSeries3CifrasSession(5678, "expert");
    for (const ex of session) {
      for (const n of ex.sequence) {
        if (n !== -1) {
          expect(n).toBeGreaterThanOrEqual(100);
          expect(n).toBeLessThanOrEqual(999);
        }
      }
      for (const opt of ex.options) {
        const val = parseInt(opt, 10);
        expect(val).toBeGreaterThanOrEqual(100);
        expect(val).toBeLessThanOrEqual(999);
      }
    }
  });

  it("validates correct answer", () => {
    const session = generateSeries3CifrasSession(1234, "easy");
    const ex = session[0];
    expect(validateSeries3CifrasAnswer(ex, ex.correctAnswer)).toBe(true);
    const wrong = ex.options.find((o) => o !== ex.correctAnswer)!;
    expect(validateSeries3CifrasAnswer(ex, wrong)).toBe(false);
  });
});
