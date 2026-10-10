import { describe, expect, it } from "vitest";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  buildPrintDocumentHtml,
  buildPrintDocumentShellCss,
} from "./printDocument";

describe("buildPrintDocumentHtml", () => {
  const body = '<div class="ficha-page">hola</div>';
  const css = ".ficha-page{color:red}";

  it("incluye caja A4 fija y overflow hidden (recorte = PDF)", () => {
    const html = buildPrintDocumentHtml({ html: body, css, variant: "pdf" });
    expect(html).toContain(`width: ${A4_WIDTH_MM}mm`);
    expect(html).toContain(`height: ${A4_HEIGHT_MM}mm`);
    expect(html).toContain("overflow: hidden");
    expect(html).toContain(body);
    expect(html).toContain(css);
  });

  it("preview y pdf comparten el shell de recorte A4", () => {
    const pdfCss = buildPrintDocumentShellCss(css, "pdf");
    const previewCss = buildPrintDocumentShellCss(css, "preview");
    expect(pdfCss).toContain("overflow: hidden");
    expect(previewCss).toContain("overflow: hidden");
    expect(pdfCss).toContain(`max-height: ${A4_HEIGHT_MM}mm`);
    expect(previewCss).toContain(`max-height: ${A4_HEIGHT_MM}mm`);
    // Sin overrides de ejercicio: tamaños solo en *Renderer.print.css
    expect(pdfCss).not.toContain(".ficha-ordenar__");
    expect(pdfCss).not.toContain(".ficha-relacionar__");
    expect(pdfCss).not.toContain(".ficha-answer");
    expect(previewCss).not.toContain(".ficha-ordenar__");
    expect(previewCss).not.toContain(".ficha-relacionar__");
  });

  it("preview añade chrome visual sin quitar overflow hidden", () => {
    const html = buildPrintDocumentHtml({ html: body, css, variant: "preview" });
    expect(html).toContain("overflow: hidden");
    expect(html).toContain("#e2e8f0");
    expect(html).toContain("box-shadow");
  });

  it("oculta separadores de impresión en ambos variantes", () => {
    const pdf = buildPrintDocumentHtml({ html: body, css, variant: "pdf" });
    const preview = buildPrintDocumentHtml({ html: body, css, variant: "preview" });
    expect(pdf).toContain(".ficha-print-break { display: none");
    expect(preview).toContain(".ficha-print-break { display: none");
  });
});
