/**
 * Descarga la ficha como PDF real (archivo .pdf).
 * No abre el diálogo de impresión ni intenta conectar con impresoras.
 *
 * - Ordenar: foreignObjectRendering solo aquí (centra números); FO+JPEG envejece en negro.
 * - Relacionar / series / soluciones: sin FO; fondo blanco bajo el canvas antes del JPEG.
 * - Todas las hojas: caja A4 fija a ancho completo (márgenes laterales iguales).
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { inlineImagesInHtml } from "./wordHtmlExport";
import printCssFallback from "./renderers/print/print-bundle";
import { A4_HEIGHT_MM, A4_WIDTH_MM, buildPrintDocumentHtml } from "./printDocument";

/** Solo badges de Relacionar/similares (NO Ordenar: ese iba bien con CSS del commit). */
const RELACIONAR_BADGE_SELECTORS = [
  ".ficha-relacionar__num-value",
  ".ficha-relacionar__letter",
  ".ficha-relcant__letter",
  ".ficha-compare__letter",
].join(", ");

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

function waitForImages(root: ParentNode): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  ).then(() => undefined);
}

/**
 * Relacionar: mismo truco que Ordenar (block + line-height = height + text-align).
 * html2canvas sin foreignObject no centra flex; table-cell dejaba el texto a la izquierda.
 */
function centerRelacionarBadgesInClone(clonedDoc: Document, liveRoot: HTMLElement): void {
  const liveBadges = Array.from(liveRoot.querySelectorAll<HTMLElement>(RELACIONAR_BADGE_SELECTORS));
  const clonedBadges = Array.from(
    clonedDoc.querySelectorAll<HTMLElement>(RELACIONAR_BADGE_SELECTORS),
  );
  const liveWin = liveRoot.ownerDocument.defaultView;

  clonedBadges.forEach((el, index) => {
    const live = liveBadges[index];
    const raw = (el.textContent ?? "").trim();
    const liveStyle = live && liveWin ? liveWin.getComputedStyle(live) : null;
    const rect = live?.getBoundingClientRect();
    const w = rect && rect.width > 0 ? Math.round(rect.width) : 0;
    const h = rect && rect.height > 0 ? Math.round(rect.height) : 0;
    const widthPx = w > 0 ? `${w}px` : liveStyle?.width || "32px";
    const heightPx = h > 0 ? `${h}px` : liveStyle?.height || "32px";
    const linePx = h > 0 ? `${h}px` : heightPx;

    el.textContent = raw.length > 0 ? raw : "\u00a0";
    el.style.display = "block";
    el.style.padding = "0";
    el.style.margin = "0";
    el.style.boxSizing = "border-box";
    el.style.textAlign = "center";
    el.style.width = widthPx;
    el.style.minWidth = widthPx;
    el.style.maxWidth = widthPx;
    el.style.height = heightPx;
    el.style.minHeight = heightPx;
    el.style.lineHeight = linePx;
    el.style.alignItems = "unset";
    el.style.justifyContent = "unset";
    if (liveStyle?.border) el.style.border = liveStyle.border;
    if (liveStyle?.borderRadius) el.style.borderRadius = liveStyle.borderRadius;
    if (liveStyle?.backgroundColor) el.style.background = liveStyle.backgroundColor;
    if (liveStyle?.fontSize) el.style.fontSize = liveStyle.fontSize;
    if (liveStyle?.fontWeight) el.style.fontWeight = liveStyle.fontWeight;
    if (liveStyle?.color) el.style.color = liveStyle.color;
  });
}

function addCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement, pageIndex: number): void {
  // JPEG no soporta transparencia: si FO deja píxeles vacíos, salen negros.
  // Pintamos fondo blanco debajo antes de serializar.
  const flattened = document.createElement("canvas");
  flattened.width = canvas.width;
  flattened.height = canvas.height;
  const ctx = flattened.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, flattened.width, flattened.height);
    ctx.drawImage(canvas, 0, 0);
  }
  const imgData = (ctx ? flattened : canvas).toDataURL("image/jpeg", 0.95);
  if (pageIndex > 0) pdf.addPage();
  pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
}

export async function downloadHtmlAsPdf(input: DownloadHtmlAsPdfInput): Promise<void> {
  const bodyHtml = await inlineImagesInHtml(input.html);
  const css = input.css?.trim() ? input.css : printCssFallback;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "ficha-pdf");
  iframe.setAttribute("aria-hidden", "true");
  // Alto grande: si el iframe es solo 297mm, las páginas 2+ salen negras.
  iframe.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${A4_WIDTH_MM}mm`,
    "height:1px",
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:2147483646",
  ].join(";");

  document.body.appendChild(iframe);

  const documentHtml = buildPrintDocumentHtml({
    html: bodyHtml,
    css,
    variant: "pdf",
  });

  try {
    const doc = await loadIframeDocument(iframe, documentHtml);
    await waitForImages(doc);
    await waitFrames(3);

    const pages = Array.from(doc.querySelectorAll<HTMLElement>(".ficha-page"));
    if (pages.length === 0) {
      throw new Error("No hay páginas de ficha para exportar a PDF.");
    }

    iframe.style.height = `${Math.max(doc.body.scrollHeight, pages.length * 1200)}px`;
    await waitFrames(2);

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i]!;
      page.scrollIntoView({ block: "start" });
      await waitForImages(page);
      await waitFrames(1);

      const hasRelacionar = Boolean(page.querySelector(".ficha-relacionar, .ficha-relcant"));
      const hasOrdenar = Boolean(page.querySelector(".ficha-ordenar"));
      const imgCount = page.querySelectorAll("img").length;
      // FO solo para Ordenar (centrado). En soluciones u otras hojas con pocas
      // imágenes (solo logo) FO + JPEG pintaba la página entera de negro.
      const useForeignObject = hasOrdenar && !hasRelacionar && imgCount <= 4;

      const w = Math.max(1, page.offsetWidth);
      const h = Math.max(1, page.offsetHeight);

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
        scrollX: 0,
        scrollY: 0,
        foreignObjectRendering: useForeignObject,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll<HTMLElement>(".ficha-page").forEach((p) => {
            p.style.background = "#ffffff";
            p.style.width = `${A4_WIDTH_MM}mm`;
            p.style.height = `${A4_HEIGHT_MM}mm`;
            p.style.overflow = "hidden";
          });
          if (hasRelacionar) {
            centerRelacionarBadgesInClone(clonedDoc, page);
          }
        },
      });
      addCanvasToPdf(pdf, canvas, i);
    }

    pdf.save(ensurePdfFilename(input.filename));
  } finally {
    iframe.remove();
  }
}
