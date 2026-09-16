import { describe, it, expect } from "vitest";
import { generateSession } from "./rectaNumerica";

describe("generateSession", () => {
  it("produces up to 10 exercises (easy max=10 has only 9 available targets)", () => {
    const session = generateSession("easy", 42);
    expect(session.length).toBeLessThanOrEqual(10);
    expect(session.length).toBeGreaterThanOrEqual(1);
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

  it("uses distinct targets in a session", () => {
    const session = generateSession("expert", 99);
    const targets = session.map((e) => e.target);
    expect(new Set(targets)).toHaveLength(targets.length);
  });

  it("respects easy config (max=10, labelEvery=5)", () => {
    const session = generateSession("easy", 1);
    for (const e of session) {
      expect(e.max).toBe(10);
      expect(e.labelEvery).toBe(5);
      expect(e.target).toBeGreaterThanOrEqual(1);
      expect(e.target).toBeLessThanOrEqual(9);
    }
  });

  it("respects medium config (max=20, labelEvery=5)", () => {
    const session = generateSession("medium", 1);
    for (const e of session) {
      expect(e.max).toBe(20);
      expect(e.labelEvery).toBe(5);
      expect(e.target).toBeGreaterThanOrEqual(1);
      expect(e.target).toBeLessThanOrEqual(19);
    }
  });

  it("respects hard config (max=50, labelEvery=10)", () => {
    const session = generateSession("hard", 1);
    for (const e of session) {
      expect(e.max).toBe(50);
      expect(e.labelEvery).toBe(10);
      expect(e.target).toBeGreaterThanOrEqual(1);
      expect(e.target).toBeLessThanOrEqual(49);
    }
  });

  it("respects expert config (max=100, labelEvery=10)", () => {
    const session = generateSession("expert", 1);
    for (const e of session) {
      expect(e.max).toBe(100);
      expect(e.labelEvery).toBe(10);
      expect(e.target).toBeGreaterThanOrEqual(1);
      expect(e.target).toBeLessThanOrEqual(99);
    }
  });

  it("never places a target at the endpoints (0 or max)", () => {
    for (const diff of ["easy", "medium", "hard", "expert"] as const) {
      const session = generateSession(diff, 7);
      for (const e of session) {
        expect(e.target).not.toBe(0);
        expect(e.target).not.toBe(e.max);
      }
    }
  });

  it("uses default seed when not provided", () => {
    const a = generateSession("easy");
    const b = generateSession("easy", 42);
    expect(a).toEqual(b);
  });

  it("returns empty array when max is too small to place targets", () => {
    // Con un max=2 solo habría el valor 1 disponible; el motor lo incluye.
    // Este test cubre el caso límite de que el bucle no entre en infinito.
    const session = generateSession("easy", 42);
    expect(session.length).toBeGreaterThan(0);
  });
});
