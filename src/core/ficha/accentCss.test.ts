import { describe, expect, it } from "vitest";
import { buildAccentCssVars } from "./accentCss";

describe("buildAccentCssVars", () => {
  it("inyecta primary y primary-dark desde el color de clase", () => {
    const css = buildAccentCssVars("#ff0000");
    expect(css).toContain("--color-primary:#ff0000");
    expect(css).toContain("--color-primary-dark:#990000");
  });

  it("ignora valores inválidos", () => {
    expect(buildAccentCssVars(undefined)).toBe("");
    expect(buildAccentCssVars("rojo")).toBe("");
    expect(buildAccentCssVars("#fff")).toBe("");
  });
});
