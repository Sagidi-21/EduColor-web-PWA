import { describe, expect, it } from "vitest";
import {
  CONTENT_BOX_NATURAL,
  PIZARRA_CONTENT_PCT,
  PIZARRA_NATURAL,
} from "./chalkboardOverlayLayout";

describe("chalkboardOverlayLayout", () => {
  it("mantiene la caja natural dentro de la pizarra", () => {
    expect(CONTENT_BOX_NATURAL.left + CONTENT_BOX_NATURAL.width).toBeLessThanOrEqual(
      PIZARRA_NATURAL.width,
    );
    expect(CONTENT_BOX_NATURAL.top + CONTENT_BOX_NATURAL.height).toBeLessThanOrEqual(
      PIZARRA_NATURAL.height,
    );
  });

  it("expresa la zona útil en porcentajes equivalentes al tamaño natural", () => {
    expect(PIZARRA_CONTENT_PCT.left).toBeCloseTo(16.64, 1);
    expect(PIZARRA_CONTENT_PCT.top).toBeCloseTo(6.38, 1);
    expect(PIZARRA_CONTENT_PCT.width).toBeCloseTo(59.45, 1);
    expect(PIZARRA_CONTENT_PCT.height).toBeCloseTo(62.63, 1);
  });

  it("reconstruye los píxeles naturales al aplicar el % sobre 1376×768", () => {
    expect(Math.round((PIZARRA_CONTENT_PCT.left / 100) * PIZARRA_NATURAL.width)).toBe(
      CONTENT_BOX_NATURAL.left,
    );
    expect(Math.round((PIZARRA_CONTENT_PCT.top / 100) * PIZARRA_NATURAL.height)).toBe(
      CONTENT_BOX_NATURAL.top,
    );
    expect(Math.round((PIZARRA_CONTENT_PCT.width / 100) * PIZARRA_NATURAL.width)).toBe(
      CONTENT_BOX_NATURAL.width,
    );
    expect(Math.round((PIZARRA_CONTENT_PCT.height / 100) * PIZARRA_NATURAL.height)).toBe(
      CONTENT_BOX_NATURAL.height,
    );
  });
});
