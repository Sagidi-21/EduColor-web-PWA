import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { generatePDF } from "./pdf";

describe("generatePDF", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll("iframe[aria-hidden='true']").forEach((el) => el.remove());
  });

  it("inyecta la ficha en un iframe oculto y dispara print (no la UI de la app)", () => {
    const write = vi.fn();
    const close = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();
    const frameWindow = {
      focus,
      print,
      document: { open: vi.fn(), write, close },
    };
    const iframe = document.createElement("iframe");
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      get: () => frameWindow,
    });
    Object.defineProperty(iframe, "contentDocument", {
      configurable: true,
      get: () => frameWindow.document,
    });

    const createEl = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "iframe") return iframe;
      return document.createElement(tag);
    });
    const append = vi.spyOn(document.body, "appendChild");

    generatePDF("<div class='ficha-page'>hola</div>", "ficha-suma.pdf", {
      title: "Suma",
      extraCss: ".ficha-page{color:red}",
    });

    expect(createEl).toHaveBeenCalledWith("iframe");
    expect(append).toHaveBeenCalledWith(iframe);
    expect(write).toHaveBeenCalled();
    const html = String(write.mock.calls[0]?.[0] ?? "");
    expect(html).toContain("ficha-page");
    expect(html).toContain("hola");
    expect(html).toContain("window.print()");
    expect(html).not.toContain("ficha-modal");
    expect(close).toHaveBeenCalled();
  });

  it("si el iframe falla, usa popup sin noopener (no imprime window actual)", () => {
    const write = vi.fn();
    const close = vi.fn();
    const open = vi.spyOn(window, "open").mockReturnValue({
      document: { open: vi.fn(), write, close, title: "" },
      opener: window,
    } as unknown as Window);

    const badIframe = document.createElement("iframe");
    Object.defineProperty(badIframe, "contentWindow", { get: () => null });
    Object.defineProperty(badIframe, "contentDocument", { get: () => null });
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "iframe") return badIframe;
      return document.createElement(tag);
    });

    const print = vi.fn();
    Object.defineProperty(window, "print", {
      configurable: true,
      writable: true,
      value: print,
    });

    generatePDF("<div class='ficha-page'>ok</div>", "x.pdf", { title: "Test" });

    expect(open).toHaveBeenCalled();
    const features = String(open.mock.calls[0]?.[2] ?? "");
    expect(features).not.toContain("noopener");
    expect(write).toHaveBeenCalled();
    expect(String(write.mock.calls[0]?.[0] ?? "")).toContain("ficha-page");
    expect(print).not.toHaveBeenCalled();
  });

  it("si no hay iframe ni popup, lanza error en lugar de imprimir la app", () => {
    const badIframe = document.createElement("iframe");
    Object.defineProperty(badIframe, "contentWindow", { get: () => null });
    Object.defineProperty(badIframe, "contentDocument", { get: () => null });
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "iframe") return badIframe;
      return document.createElement(tag);
    });
    vi.spyOn(window, "open").mockReturnValue(null);

    expect(() => generatePDF("<div/>", "x.pdf")).toThrow(/impresión|emergentes|Vista previa/i);
  });
});
