/**
 * Documento HTML canónico de ficha (preview = PDF).
 * Solo caja A4 / saltos / chrome de preview.
 * Tamaños y layout de cada ejercicio: su `*Renderer.print.css` (un solo sitio).
 */

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export type PrintDocumentVariant = "pdf" | "preview";

export interface BuildPrintDocumentHtmlInput {
  /** Cuerpo HTML (páginas `.ficha-page`). */
  html: string;
  /** CSS de ficha (print-bundle). */
  css: string;
  /**
   * `pdf`: sin chrome extra (captura html2canvas).
   * `preview`: fondo gris + sombra entre hojas (no cambia el recorte A4).
   */
  variant?: PrintDocumentVariant;
}

/** CSS de shell A4 compartido preview/PDF (sin overrides por ejercicio). */
export function buildPrintDocumentShellCss(
  printCss: string,
  variant: PrintDocumentVariant = "pdf",
): string {
  const previewChrome =
    variant === "preview"
      ? `
    html, body {
      background: #e2e8f0 !important;
    }
    body {
      padding: 12px 0 24px !important;
    }
    .ficha-page {
      margin: 0 auto 20px !important;
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.18) !important;
    }
    .ficha-page:last-child {
      margin-bottom: 0 !important;
    }
  `
      : "";

  return `
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      width: ${A4_WIDTH_MM}mm;
    }
    ${printCss}
    .ficha-page {
      width: ${A4_WIDTH_MM}mm !important;
      height: ${A4_HEIGHT_MM}mm !important;
      min-height: ${A4_HEIGHT_MM}mm !important;
      max-height: ${A4_HEIGHT_MM}mm !important;
      margin: 0 !important;
      overflow: hidden !important;
      box-shadow: none !important;
      background: #fff !important;
      box-sizing: border-box !important;
    }
    .ficha-print-break { display: none !important; }
    ${previewChrome}
  `;
}

/** Documento completo listo para iframe srcdoc o html2canvas. */
export function buildPrintDocumentHtml(input: BuildPrintDocumentHtmlInput): string {
  const variant = input.variant ?? "pdf";
  const css = buildPrintDocumentShellCss(input.css, variant);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
${css}
  </style>
</head>
<body>
${input.html}
</body>
</html>`;
}
