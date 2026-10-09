import { afterEach, describe, expect, it, vi } from "vitest";
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
    // addImage(img, format, x, y, w, h) — proporción del canvas, sin estirar.
    const first = mocks.addImage.mock.calls[0]!;
    expect(first[2]).toBeCloseTo(0);
    expect(first[3]).toBeCloseTo(0);
    expect(first[4]).toBeCloseTo(210);
    expect(first[5]).toBeCloseTo(297);
  });
});
