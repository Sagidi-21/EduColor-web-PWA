import { describe, expect, it } from "vitest";
import {
  CONTENT_BOX_NATURAL,
  fitPizarraInStage,
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

  it("coloca la zona útil dentro del tablero verde (no en el marco de madera)", () => {
    // Verde interior ~ y≥118; la caja no puede empezar en el listón superior.
    expect(CONTENT_BOX_NATURAL.top).toBeGreaterThanOrEqual(110);
    expect(CONTENT_BOX_NATURAL.left).toBeGreaterThanOrEqual(250);
    expect(CONTENT_BOX_NATURAL.top + CONTENT_BOX_NATURAL.height).toBeLessThanOrEqual(620);
  });

  it("expresa la zona útil en porcentajes coherentes", () => {
    expect(PIZARRA_CONTENT_PCT.top).toBeCloseTo(15.36, 1);
    expect(PIZARRA_CONTENT_PCT.left).toBeCloseTo(21.08, 1);
    expect(PIZARRA_CONTENT_PCT.width).toBeCloseTo(57.41, 1);
    expect(PIZARRA_CONTENT_PCT.height).toBeCloseTo(58.59, 1);
  });

  it("reconstruye los píxeles naturales al aplicar el %", () => {
    expect(Math.round((PIZARRA_CONTENT_PCT.left / 100) * PIZARRA_NATURAL.width)).toBe(
      CONTENT_BOX_NATURAL.left,
    );
    expect(Math.round((PIZARRA_CONTENT_PCT.top / 100) * PIZARRA_NATURAL.height)).toBe(
      CONTENT_BOX_NATURAL.top,
    );
  });

  it("centra la pizarra en el stage con letterbox", () => {
    const fit = fitPizarraInStage(1920, 1080);
    expect(fit).not.toBeNull();
    expect(fit!.width / fit!.height).toBeCloseTo(PIZARRA_NATURAL.width / PIZARRA_NATURAL.height, 5);
    expect(fit!.left + fit!.width / 2).toBeCloseTo(960, 0);
    expect(fit!.top + fit!.height / 2).toBeCloseTo(540, 0);
  });
});
