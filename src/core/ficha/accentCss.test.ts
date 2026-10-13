import { buildAccentCssVars } from "./accentCss";

describe("buildAccentCssVars", () => {
  it("inyecta solo --color-primary desde el color de clase", () => {
    const css = buildAccentCssVars("#ff0000");
    expect(css).toContain("--color-primary:#ff0000");
    expect(css).not.toContain("--color-primary-dark");
  });

  it("devuelve vacío si el color no es hex válido", () => {
    expect(buildAccentCssVars(undefined)).toBe("");
    expect(buildAccentCssVars("naranja")).toBe("");
    expect(buildAccentCssVars("#fff")).toBe("");
  });
});
