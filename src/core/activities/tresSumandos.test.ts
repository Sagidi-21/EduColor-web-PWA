import { describe, it, expect } from "vitest";
import type { ActivityDifficulty } from "../content/contracts";
import {
  generateSession,
  showImageSupport,
  validateAnswer,
  type TresSumandosExercise,
} from "./tresSumandos";

describe("generateSession", () => {
  it("produces up to the configured number of exercises per difficulty", () => {
    for (const diff of ["easy", "medium", "hard", "expert"] as const) {
      const session = generateSession(diff, 42);
      expect(session.length).toBeLessThanOrEqual(10);
      expect(session.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic with the same seed", () => {
    const a = generateSession("medium", 123);
    const b = generateSession("medium", 123);
    expect(a).toEqual(b);
  });

  it("differs with a different seed", () => {
    const a = generateSession("hard", 1);
    const b = generateSession("hard", 2);
    expect(a).not.toEqual(b);
  });

  it("produces unique exercises (no duplicate triplets)", () => {
    const session = generateSession("expert", 99);
    const keys = session.map((e) => `${e.a}-${e.b}-${e.c}`);
    expect(new Set(keys)).toHaveLength(keys.length);
  });

  it("respects the sum limit for each difficulty", () => {
    const limits: Record<ActivityDifficulty, number> = {
      easy: 5,
      medium: 10,
      hard: 15,
      expert: 20,
    };
    for (const [diff, max] of Object.entries(limits) as [ActivityDifficulty, number][]) {
      const session = generateSession(diff, 7);
      for (const e of session) {
        expect(e.a + e.b + e.c).toBeLessThanOrEqual(max);
        expect(e.answer).toBe(e.a + e.b + e.c);
      }
    }
  });

  it("respects the per-term limit for each difficulty", () => {
    const limits: Record<ActivityDifficulty, number> = {
      easy: 2,
      medium: 4,
      hard: 6,
      expert: 8,
    };
    for (const [diff, max] of Object.entries(limits) as [ActivityDifficulty, number][]) {
      const session = generateSession(diff, 7);
      for (const e of session) {
        expect(e.a).toBeLessThanOrEqual(max);
        expect(e.b).toBeLessThanOrEqual(max);
        expect(e.c).toBeLessThanOrEqual(max);
      }
    }
  });

  it("shows images only on easy difficulty", () => {
    expect(showImageSupport("easy")).toBe(true);
    expect(showImageSupport("medium")).toBe(false);
    expect(showImageSupport("hard")).toBe(false);
    expect(showImageSupport("expert")).toBe(false);
  });

  it("includes image URLs when showImage is true", () => {
    const session = generateSession("easy", 42);
    for (const e of session) {
      expect(e.imageUrl).toBeTruthy();
    }
  });

  it("has empty image URLs when showImage is false", () => {
    const session = generateSession("medium", 42);
    for (const e of session) {
      expect(e.imageUrl).toBe("");
    }
  });

  it("uses default seed when not provided", () => {
    const a = generateSession("easy");
    const b = generateSession("easy", 42);
    expect(a).toEqual(b);
  });
});

describe("validateAnswer", () => {
  it("returns true for the correct answer", () => {
    const ex: TresSumandosExercise = { a: 1, b: 2, c: 3, answer: 6, imageUrl: "" };
    expect(validateAnswer(ex, "6")).toBe(true);
  });

  it("returns false for an incorrect answer", () => {
    const ex: TresSumandosExercise = { a: 1, b: 2, c: 3, answer: 6, imageUrl: "" };
    expect(validateAnswer(ex, "7")).toBe(false);
  });

  it("handles multi-digit answers", () => {
    const ex: TresSumandosExercise = { a: 5, b: 5, c: 5, answer: 15, imageUrl: "" };
    expect(validateAnswer(ex, "15")).toBe(true);
    expect(validateAnswer(ex, "14")).toBe(false);
  });

  it("returns false for non-numeric input", () => {
    const ex: TresSumandosExercise = { a: 1, b: 2, c: 3, answer: 6, imageUrl: "" };
    expect(validateAnswer(ex, "abc")).toBe(false);
  });
});
