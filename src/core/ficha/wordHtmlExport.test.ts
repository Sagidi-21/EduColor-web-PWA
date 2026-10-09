import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadHtmlAsWord, inlineImagesInHtml } from "./wordHtmlExport";

describe("wordHtmlExport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("inlineImagesInHtml deja data: y convierte src fetchables", async () => {
    const data = "data:image/png;base64,aaa";
    const html = `<img src="${data}" /><img src="/logo-ficha.png" />`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        blob: async () => new Blob(["x"], { type: "image/png" }),
      })),
    );
    const FileReaderMock = vi.fn(function (this: {
      result: string | null;
      onload: null | (() => void);
      readAsDataURL: (blob: Blob) => void;
    }) {
      this.result = null;
      this.onload = null;
      this.readAsDataURL = () => {
        this.result = "data:image/png;base64,bbb";
        this.onload?.();
      };
    });
    vi.stubGlobal("FileReader", FileReaderMock);

    const out = await inlineImagesInHtml(html);
    expect(out).toContain(data);
    expect(out).toContain("data:image/png;base64,bbb");
  });

  it("downloadHtmlAsWord dispara descarga .doc con el HTML dado", async () => {
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    const createElement = vi.spyOn(document, "createElement").mockImplementation(() => {
      return {
        href: "",
        download: "",
        style: { display: "" },
        click,
        remove: vi.fn(),
      } as unknown as HTMLAnchorElement;
    });
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    await downloadHtmlAsWord({
      html: '<div class="ficha-page">hola</div>',
      css: ".ficha-page{color:red}",
      filename: "ficha-suma-alumno.doc",
    });

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe("ficha-suma-alumno.doc");
    expect(appendChild).toHaveBeenCalled();
  });
});
