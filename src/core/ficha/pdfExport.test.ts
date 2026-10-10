import { afterEach, describe, expect, it, vi } from "vitest";
import html2canvas from "html2canvas";
import { downloadHtmlAsPdf } from "./pdfExport";

vi.mock("html2canvas", () => ({
  default: vi.fn(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 210;
    canvas.height = 297;
    canvas.toDataURL = () => "data:image/jpeg;base64,xx";
    return canvas;
  }),
}));

vi.mock("jspdf", () => {
  const save = vi.fn();
  const addImage = vi.fn();
  const addPage = vi.fn();
  return {
    jsPDF: vi.fn(function (this: {
      save: typeof save;
      addImage: typeof addImage;
      addPage: typeof addPage;
    }) {
      this.save = save;
      this.addImage = addImage;
      this.addPage = addPage;
    }),
    __mocks: { save, addImage, addPage },
  };
});

describe("downloadHtmlAsPdf", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('iframe[title="ficha-pdf"]').forEach((el) => el.remove());
  });

  it("genera PDF y llama save sin window.print ni estirar a 210x297 a ciegas", async () => {
    const print = vi.fn();
    Object.defineProperty(window, "print", {
      configurable: true,
      writable: true,
      value: print,
    });

    const jspdfMod = await import("jspdf");
    const mocks = (
      jspdfMod as unknown as {
        __mocks: {
          save: ReturnType<typeof vi.fn>;
          addImage: ReturnType<typeof vi.fn>;
        };
      }
    ).__mocks;

    await downloadHtmlAsPdf({
      html: '<div class="ficha-page">hola</div><div class="ficha-page">dos</div>',
      css: ".ficha-page{color:red}",
      filename: "ficha-suma-alumno.pdf",
    });

    expect(mocks.save).toHaveBeenCalledWith("ficha-suma-alumno.pdf");
    expect(print).not.toHaveBeenCalled();
    // Proporción del canvas mock 210x297 → drawW=210, drawH=297
    expect(mocks.addImage).toHaveBeenCalled();
    // addImage(img, format, x, y, w, h) — siempre A4 a ancho completo.
    const first = mocks.addImage.mock.calls[0]!;
    expect(first[2]).toBe(0);
    expect(first[3]).toBe(0);
    expect(first[4]).toBe(210);
    expect(first[5]).toBe(297);
  });

  it("no activa foreignObject en soluciones (pocas imgs) para evitar páginas negras", async () => {
    const h2c = vi.mocked(html2canvas);
    h2c.mockClear();

    await downloadHtmlAsPdf({
      html: `
        <div class="ficha-page">
          <div class="ficha-answer">Grupo A</div>
          <div class="ficha-answer">Grupo B</div>
        </div>
      `,
      css: "",
      filename: "comparison-soluciones.pdf",
    });

    expect(h2c).toHaveBeenCalled();
    const opts = h2c.mock.calls[0]?.[1] as { foreignObjectRendering?: boolean };
    expect(opts.foreignObjectRendering).toBe(false);
  });

  it("sí activa foreignObject en Ordenar (pocas imgs)", async () => {
    const h2c = vi.mocked(html2canvas);
    h2c.mockClear();

    await downloadHtmlAsPdf({
      html: `
        <div class="ficha-page">
          <div class="ficha-ordenar"><span class="ficha-ordenar__card">3</span></div>
        </div>
      `,
      css: "",
      filename: "ordenar-alumno.pdf",
    });

    const opts = h2c.mock.calls[0]?.[1] as { foreignObjectRendering?: boolean };
    expect(opts.foreignObjectRendering).toBe(true);
  });

  it("series (continuación + soluciones) no usan foreignObject — evita hojas negras", async () => {
    const h2c = vi.mocked(html2canvas);
    h2c.mockClear();

    const jspdfMod = await import("jspdf");
    const mocks = (
      jspdfMod as unknown as {
        __mocks: { addPage: ReturnType<typeof vi.fn>; addImage: ReturnType<typeof vi.fn> };
      }
    ).__mocks;
    mocks.addPage.mockClear();
    mocks.addImage.mockClear();

    await downloadHtmlAsPdf({
      html: `
        <div class="ficha-page">
          <div class="ficha-series"><p class="ficha-series__question">¿Qué número falta?</p></div>
        </div>
        <div class="ficha-page ficha-page--continued">
          <p class="ficha-page__continued">continuación</p>
          <div class="ficha-series"><p class="ficha-series__question">¿Qué número falta?</p></div>
        </div>
        <div class="ficha-page">
          <div class="ficha-answer">7</div>
          <div class="ficha-answer">12</div>
        </div>
      `,
      css: "",
      filename: "ficha-seriesNumericas-alumno+soluciones.pdf",
    });

    expect(h2c).toHaveBeenCalledTimes(3);
    for (const call of h2c.mock.calls) {
      const opts = call[1] as { foreignObjectRendering?: boolean };
      expect(opts.foreignObjectRendering).toBe(false);
    }
    expect(mocks.addPage).toHaveBeenCalledTimes(2);
    expect(mocks.addImage).toHaveBeenCalledTimes(3);
  });
});
