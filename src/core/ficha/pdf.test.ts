import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { generatePDF } from "./pdf";

describe("generatePDF", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("abre ventana e inyecta HTML + print", () => {
    const write = vi.fn();
    const close = vi.fn();
    const focus = vi.fn();
    const open = vi.spyOn(window, "open").mockReturnValue({
      document: { open: vi.fn(), write, close },
      focus,
      print: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as Window);

    generatePDF("<div class='ficha-page'>hola</div>", "ficha-suma.pdf", {
      title: "Suma",
      extraCss: ".ficha-page{color:red}",
    });

    expect(open).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    const html = String(write.mock.calls[0]?.[0] ?? "");
    expect(html).toContain("ficha-page");
    expect(html).toContain("hola");
    expect(html).toContain("window.print()");
    expect(close).toHaveBeenCalled();
  });

  it("si el popup está bloqueado, hace fallback a window.print", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const print = vi.fn();
    Object.defineProperty(window, "print", {
      configurable: true,
      writable: true,
      value: print,
    });
    generatePDF("<div/>", "x.pdf");
    expect(print).toHaveBeenCalled();
  });
});
