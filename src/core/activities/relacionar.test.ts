import { describe, it, expect } from "vitest";
import { generateSession } from "./relacionar";

describe("generateSession", () => {
  it("generates the correct number of rounds", () => {
    const rounds = generateSession("easy", 42, 5);
    expect(rounds).toHaveLength(5);
  });

  it("is deterministic with the same seed", () => {
    const a = generateSession("medium", 123, 3);
    const b = generateSession("medium", 123, 3);
    expect(a).toEqual(b);
  });

  it("differs with a different seed", () => {
    const a = generateSession("hard", 1, 3);
    const b = generateSession("hard", 2, 3);
    expect(a).not.toEqual(b);
  });

  it("produces pairs with unique ids in each round", () => {
    const rounds = generateSession("easy", 42, 5);
    for (const round of rounds) {
      const ids = round.pairs.map((p) => p.id);
      expect(new Set(ids)).toHaveLength(ids.length);
    }
  });

  it("has leftColumn and rightColumn with the same pairs (different order)", () => {
    const rounds = generateSession("medium", 7, 4);
    for (const round of rounds) {
      expect(round.leftColumn).toHaveLength(round.rightColumn.length);
      const leftIds = new Set(round.leftColumn.map((p) => p.id));
      const rightIds = new Set(round.rightColumn.map((p) => p.id));
      expect(leftIds).toEqual(rightIds);
    }
  });

  it("uses distinct numbers in each round", () => {
    const rounds = generateSession("expert", 99, 5);
    for (const round of rounds) {
      const nums = round.pairs.map((p) => p.number);
      expect(new Set(nums)).toHaveLength(nums.length);
    }
  });

  it("respects difficulty configs (easy: 3 pairs, 1-5)", () => {
    const rounds = generateSession("easy", 1, 1);
    expect(rounds[0].pairs).toHaveLength(3);
    for (const p of rounds[0].pairs) {
      expect(p.number).toBeGreaterThanOrEqual(1);
      expect(p.number).toBeLessThanOrEqual(5);
      expect(p.scattered).toBe(false);
    }
  });

  it("respects medium (4 pairs, 1-9)", () => {
    const rounds = generateSession("medium", 1, 1);
    expect(rounds[0].pairs).toHaveLength(4);
    for (const p of rounds[0].pairs) {
      expect(p.number).toBeGreaterThanOrEqual(1);
      expect(p.number).toBeLessThanOrEqual(9);
    }
  });

  it("respects hard (5 pairs, 1-9)", () => {
    const rounds = generateSession("hard", 1, 1);
    expect(rounds[0].pairs).toHaveLength(5);
    for (const p of rounds[0].pairs) {
      expect(p.number).toBeGreaterThanOrEqual(1);
      expect(p.number).toBeLessThanOrEqual(9);
    }
  });

  it("respects expert (5 pairs, 5-15, scattered, multi-image)", () => {
    const rounds = generateSession("expert", 1, 1);
    expect(rounds[0].pairs).toHaveLength(5);
    for (const p of rounds[0].pairs) {
      expect(p.number).toBeGreaterThanOrEqual(5);
      expect(p.number).toBeLessThanOrEqual(15);
      expect(p.scattered).toBe(true);
      expect(p.imageUrl).toBeTruthy();
    }
  });

  it("uses the same image for all pairs in non-expert difficulties", () => {
    const rounds = generateSession("easy", 42, 1);
    const urls = new Set(rounds[0].pairs.map((p) => p.imageUrl));
    expect(urls.size).toBe(1);
  });

  it("uses different images for pairs in expert mode", () => {
    const rounds = generateSession("expert", 42, 1);
    const urls = new Set(rounds[0].pairs.map((p) => p.imageUrl));
    expect(urls.size).toBeGreaterThan(1);
  });

  it("leftColumn and rightColumn are shuffled independently", () => {
    const rounds = generateSession("medium", 42, 1);
    const round = rounds[0];
    const leftIds = round.leftColumn.map((p) => p.id);
    const rightIds = round.rightColumn.map((p) => p.id);
    expect(leftIds).not.toEqual(rightIds);
    expect(leftIds.sort()).toEqual(rightIds.sort());
  });

  it("returns empty array for totalRounds=0", () => {
    const rounds = generateSession("easy", 42, 0);
    expect(rounds).toHaveLength(0);
  });

  it("uses default seed when not provided", () => {
    const a = generateSession("easy");
    const b = generateSession("easy", 42, 5);
    expect(a).toEqual(b);
  });
});
