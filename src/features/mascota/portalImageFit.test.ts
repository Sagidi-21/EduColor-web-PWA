import { describe, it, expect } from "vitest";
import { computeContainFit } from "./portalImageFit";

describe("computeContainFit", () => {
  it("fits a wide image inside a square container", () => {
    const r = computeContainFit(2000, 1000, 800, 800);
    expect(r.width).toBeCloseTo(800, 0);
    expect(r.height).toBeCloseTo(400, 0);
    expect(r.left).toBeCloseTo(0, 0);
    expect(r.top).toBeCloseTo(200, 0);
  });

  it("fits a tall image inside a square container", () => {
    const r = computeContainFit(1000, 2000, 800, 800);
    expect(r.width).toBeCloseTo(400, 0);
    expect(r.height).toBeCloseTo(800, 0);
    expect(r.left).toBeCloseTo(200, 0);
    expect(r.top).toBeCloseTo(0, 0);
  });

  it("fits a square image inside a square container", () => {
    const r = computeContainFit(500, 500, 800, 800);
    expect(r.width).toBeCloseTo(800, 0);
    expect(r.height).toBeCloseTo(800, 0);
    expect(r.left).toBeCloseTo(0, 0);
    expect(r.top).toBeCloseTo(0, 0);
  });

  it("never exceeds container bounds", () => {
    for (const [iw, ih] of [
      [100, 200],
      [200, 100],
      [500, 500],
      [3000, 2000],
      [2000, 3000],
    ]) {
      for (const [cw, ch] of [
        [800, 600],
        [600, 800],
        [1024, 768],
        [1920, 1080],
        [768, 1024],
      ]) {
        const r = computeContainFit(iw, ih, cw, ch);
        expect(r.width).toBeLessThanOrEqual(cw + 1e-6);
        expect(r.height).toBeLessThanOrEqual(ch + 1e-6);
        expect(r.left).toBeGreaterThanOrEqual(-1e-6);
        expect(r.top).toBeGreaterThanOrEqual(-1e-6);
        expect(r.left + r.width).toBeLessThanOrEqual(cw + 1e-6);
        expect(r.top + r.height).toBeLessThanOrEqual(ch + 1e-6);
      }
    }
  });

  it("preserves aspect ratio", () => {
    const r = computeContainFit(300, 200, 800, 800);
    expect(Math.abs(r.width / r.height - 300 / 200)).toBeLessThan(1e-6);
  });
});
