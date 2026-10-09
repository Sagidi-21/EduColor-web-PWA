/**
 * Descarga la ficha como PDF real (archivo .pdf).
 * No abre el diálogo de impresión ni intenta conectar con impresoras.
 *
 * Cada página se maqueta en un iframe A4 (mismo CSS que la preview) y se
 * inserta en el PDF **sin estirar** (se respeta la proporción del canvas).
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { inlineImagesInHtml } from "./wordHtmlExport";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export interface DownloadHtmlAsPdfInput {
  html: string;
  css: string;
  filename: string;
}

function ensurePdfFilename(name: string): string {
  return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
}

function waitFrames(n = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(n);
  });
}

function loadIframeDocument(iframe: HTMLIFrameElement, html: string): Promise<Document> {
  return new Promise((resolve, reject) => {
    const onLoad = () => {
      iframe.removeEventListener("load", onLoad);
      const doc = iframe.contentDocument;
      if (!doc) {
        reject(new Error("No se pudo preparar el documento PDF."));
        return;
      }
      resolve(doc);
    };
    iframe.addEventListener("load", onLoad);
    const doc = iframe.contentDocument;
    if (!doc) {
      reject(new Error("No se pudo preparar el documento PDF."));
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    // Algunos navegadores no disparan load tras document.write
    queueMicrotask(() => {
      if (iframe.contentDocument?.readyState === "complete") {
        iframe.removeEventListener("load", onLoad);
        resolve(iframe.contentDocument);
      }
    });
  });
}

/**
 * Inserta la imagen en A4 manteniendo proporción (nunca estira el texto).
 */
function addCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement, pageIndex: number): void {
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  if (pageIndex > 0) pdf.addPage();

  const ratio = canvas.height / Math.max(1, canvas.width);
  let drawW = A4_WIDTH_MM;
  let drawH = drawW * ratio;

  if (drawH > A4_HEIGHT_MM) {
    // Encaje uniforme (misma escala en X e Y) — evita el “letter-spacing” falso.
    const scale = A4_HEIGHT_MM / drawH;
    drawW *= scale;
    drawH = A4_HEIGHT_MM;
  }

  const x = (A4_WIDTH_MM - drawW) / 2;
  pdf.addImage(imgData, "JPEG", x, 0, drawW, drawH);
}

/**
 * Renderiza el HTML de la ficha, captura cada `.ficha-page` y descarga un PDF.
 * Sin `window.print()`.
 */
export async function downloadHtmlAsPdf(input: DownloadHtmlAsPdfInput): Promise<void> {
  const bodyHtml = await inlineImagesInHtml(input.html);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "ficha-pdf");
  iframe.setAttribute("aria-hidden", "true");
  // Tamaño A4 real en el iframe → mismo layout que la vista previa.
  iframe.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${A4_WIDTH_MM}mm`,
    `height:${A4_HEIGHT_MM}mm`,
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:2147483646",
  ].join(";");

  document.body.appendChild(iframe);

  const documentHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      width: ${A4_WIDTH_MM}mm;
    }
    ${input.css}
    .ficha-page {
      width: ${A4_WIDTH_MM}mm !important;
      min-height: ${A4_HEIGHT_MM}mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      background: #fff !important;
      box-sizing: border-box !important;
    }
    .ficha-print-break { display: none !important; }
    /*
     * html2canvas centra mal el texto con display:flex.
     * En PDF usamos caja con line-height = height (la preview sigue con flex).
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
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  try {
    const doc = await loadIframeDocument(iframe, documentHtml);
    await waitFrames(3);

    const pages = Array.from(doc.querySelectorAll<HTMLElement>(".ficha-page"));
    if (pages.length === 0) {
      throw new Error("No hay páginas de ficha para exportar a PDF.");
    }

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i]!;
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        // Mejor fiel al layout del iframe (flex/centrado) cuando el motor lo soporta.
        foreignObjectRendering: true,
      });
      addCanvasToPdf(pdf, canvas, i);
    }

    pdf.save(ensurePdfFilename(input.filename));
  } finally {
    iframe.remove();
  }
}
