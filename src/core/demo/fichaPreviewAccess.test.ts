import { describe, expect, it } from "vitest";
import { isFichaPreviewAllowed, isFichaPreviewPath } from "./fichaPreviewAccess";

describe("fichaPreviewAccess", () => {
  it("reconoce /ficha-preview y variantes con barra", () => {
    expect(isFichaPreviewPath("/ficha-preview")).toBe(true);
    expect(isFichaPreviewPath("/ficha-preview/")).toBe(true);
    expect(isFichaPreviewPath("/app/ficha-preview")).toBe(true);
    expect(isFichaPreviewPath("/")).toBe(false);
    expect(isFichaPreviewPath("/mathematics")).toBe(false);
  });

  it("bloquea la ruta en producción y la permite fuera de prod", () => {
    expect(isFichaPreviewAllowed(true)).toBe(false);
    expect(isFichaPreviewAllowed(false)).toBe(true);
  });
});
