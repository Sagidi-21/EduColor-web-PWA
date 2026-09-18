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
      const session = generateSession(diff, undefined, 42);
      expect(session.length).toBeLessThanOrEqual(10);
      expect(session.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic with the same seed", () => {
    const a = generateSession("medium", undefined, 123);
    const b = generateSession("medium", undefined, 123);
    expect(a).toEqual(b);
  });

  it("differs with a different seed", () => {
    const a = generateSession("hard", undefined, 1);
    const b = generateSession("hard", undefined, 2);
    expect(a).not.toEqual(b);
  });

  it("produces unique exercises (no duplicate triplets)", () => {
    const session = generateSession("expert", undefined, 99);
    const keys = session.map((e) => `${e.a}-${e.b}-${e.c}`);
    expect(new Set(keys)).toHaveLength(keys.length);
  });

  it("respects the sum limit for each difficulty", () => {
    const limits: Record<ActivityDifficulty, number> = {
      easy: 9,
      medium: 20,
      hard: 50,
      expert: 100,
    };
    for (const [diff, max] of Object.entries(limits) as [ActivityDifficulty, number][]) {
      const session = generateSession(diff, undefined, 7);
      for (const e of session) {
        expect(e.a + e.b + e.c).toBeLessThanOrEqual(max);
        expect(e.answer).toBe(e.a + e.b + e.c);
      }
    }
  });

  it("respects the per-term limit for each difficulty", () => {
    const limits: Record<ActivityDifficulty, number> = {
      easy: 3,
      medium: 9,
      hard: 20,
      expert: 50,
    };
    for (const [diff, max] of Object.entries(limits) as [ActivityDifficulty, number][]) {
      const session = generateSession(diff, undefined, 7);
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
    const session = generateSession("easy", undefined, 42);
    for (const e of session) {
      expect(e.imageUrl).toBeTruthy();
    }
  });

  it("has empty image URLs when showImage is false", () => {
    const session = generateSession("medium", undefined, 42);
    for (const e of session) {
      expect(e.imageUrl).toBe("");
    }
  });

  it("uses default seed when not provided", () => {
    const a = generateSession("easy");
    const b = generateSession("easy", undefined, 42);
    expect(a).toEqual(b);
  });
});

describe("curriculum level logic", () => {
  function getCarries(a: number, b: number, c: number) {
    const uA = a % 10,
      uB = b % 10,
      uC = c % 10;
    const tA = Math.floor(a / 10) % 10,
      tB = Math.floor(b / 10) % 10,
      tC = Math.floor(c / 10) % 10;
    const hA = Math.floor(a / 100) % 10,
      hB = Math.floor(b / 100) % 10,
      hC = Math.floor(c / 100) % 10;
    const sumU = uA + uB + uC;
    const unitsCarry = sumU >= 10;
    const sumT = tA + tB + tC + Math.floor(sumU / 10);
    const tensCarry = sumT >= 10;
    const sumH = hA + hB + hC + Math.floor(sumT / 10);
    const hundredsCarry = sumH >= 10;
    return { unitsCarry, tensCarry, hundredsCarry };
  }

  it("respects 1-L1 constraints: max 9, no carry", () => {
    const session = generateSession("easy", "1-L1", 42);
    for (const e of session) {
      expect(e.a + e.b + e.c).toBeLessThanOrEqual(9);
      const { unitsCarry, tensCarry } = getCarries(e.a, e.b, e.c);
      expect(unitsCarry).toBe(false);
      expect(tensCarry).toBe(false);
    }
  });

  it("respects 1-L2 constraints: max 20, at least one carry", () => {
    const session = generateSession("easy", "1-L2", 42);
    for (const e of session) {
      expect(e.a + e.b + e.c).toBeLessThanOrEqual(20);
      const { unitsCarry, tensCarry } = getCarries(e.a, e.b, e.c);
      expect(unitsCarry || tensCarry).toBe(true);
    }
  });

  it("respects 2-L1 constraints: 2-digit numbers, no carry", () => {
    const session = generateSession("easy", "2-L1", 42);
    for (const e of session) {
      expect(e.a).toBeGreaterThanOrEqual(10);
      expect(e.b).toBeGreaterThanOrEqual(10);
      expect(e.c).toBeGreaterThanOrEqual(10);
      const { unitsCarry, tensCarry, hundredsCarry } = getCarries(e.a, e.b, e.c);
      expect(unitsCarry || tensCarry || hundredsCarry).toBe(false);
    }
  });

  it("respects 2-L2 constraints: 2-digit numbers, at least one carry", () => {
    const session = generateSession("easy", "2-L2", 42);
    for (const e of session) {
      expect(e.a).toBeGreaterThanOrEqual(10);
      expect(e.b).toBeGreaterThanOrEqual(10);
      expect(e.c).toBeGreaterThanOrEqual(10);
      const { unitsCarry, tensCarry, hundredsCarry } = getCarries(e.a, e.b, e.c);
      expect(unitsCarry || tensCarry || hundredsCarry).toBe(true);
    }
  });

  it("respects 2-L3 constraints: 3-digit numbers, no carry", () => {
    const session = generateSession("easy", "2-L3", 42);
    for (const e of session) {
      expect(e.a).toBeGreaterThanOrEqual(100);
      expect(e.b).toBeGreaterThanOrEqual(100);
      expect(e.c).toBeGreaterThanOrEqual(100);
      const { unitsCarry, tensCarry, hundredsCarry } = getCarries(e.a, e.b, e.c);
      expect(unitsCarry || tensCarry || hundredsCarry).toBe(false);
    }
  });

  it("respects 1-L3 constraints: 2-digit column, no carry", () => {
    const session = generateSession("easy", "1-L3", 42);
    for (const e of session) {
      expect(e.a).toBeGreaterThanOrEqual(10);
      expect(e.b).toBeGreaterThanOrEqual(10);
      expect(e.c).toBeGreaterThanOrEqual(10);
      const { unitsCarry, tensCarry, hundredsCarry } = getCarries(e.a, e.b, e.c);
      expect(unitsCarry || tensCarry || hundredsCarry).toBe(false);
    }
  });

  it("respects 1-L4 constraints: 2-digit column, units carry only", () => {
    const session = generateSession("easy", "1-L4", 42);
    for (const e of session) {
      expect(e.a).toBeGreaterThanOrEqual(10);
      expect(e.b).toBeGreaterThanOrEqual(10);
      expect(e.c).toBeGreaterThanOrEqual(10);
      const { unitsCarry, tensCarry, hundredsCarry } = getCarries(e.a, e.b, e.c);
      expect(unitsCarry).toBe(true);
      expect(tensCarry || hundredsCarry).toBe(false);
    }
  });

  it("respects 2-L4 constraints: 3-digit numbers, at least one carry", () => {
    const session = generateSession("easy", "2-L4", 42);
    for (const e of session) {
      expect(e.a).toBeGreaterThanOrEqual(100);
      expect(e.b).toBeGreaterThanOrEqual(100);
      expect(e.c).toBeGreaterThanOrEqual(100);
      const { unitsCarry, tensCarry, hundredsCarry } = getCarries(e.a, e.b, e.c);
      expect(unitsCarry || tensCarry || hundredsCarry).toBe(true);
    }
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
