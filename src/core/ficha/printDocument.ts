/**
 * Documento HTML canónico de ficha (preview = PDF).
 * Misma caja A4, overflow y overrides de centrado en ambos sitios.
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

/** CSS de shell A4 + overrides compartidos preview/PDF. */
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
    /*
     * Ordenar / Relacionar — line-height = height (html2canvas no centra flex).
     * También en preview para que WYSIWYG coincida con el PDF.
     */
    .ficha-ordenar__card,
    .ficha-ordenar__slot {
      display: block !important;
      width: 100% !important;
      max-width: 56px !important;
      height: 40px !important;
      min-height: 40px !important;
      line-height: 40px !important;
      padding: 0 !important;
      margin: 0 auto !important;
      text-align: center !important;
      font-size: 22px !important;
      font-weight: 800 !important;
      box-sizing: border-box !important;
    }
    .ficha-relacionar__num-value,
    .ficha-relacionar__letter {
      display: block !important;
      padding: 0 !important;
      margin: 0 !important;
      text-align: center !important;
      box-sizing: border-box !important;
      align-items: unset !important;
      justify-content: unset !important;
    }
    .ficha-relacionar__strip {
      flex-wrap: wrap !important;
      overflow: visible !important;
    }
    .ficha-answer {
      color: #0f172a !important;
      font-size: 22px !important;
      font-weight: 800 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
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
