/**
 * Generación de PDF vía diálogo nativo de impresión del navegador.
 * Sin dependencias runtime: 100% client-side y offline-capable.
 */

export interface PrintOptions {
  /** Título de la ventana / documento. */
  title?: string;
  /** Estilos CSS adicionales a inyectar en la ventana de impresión. */
  extraCss?: string;
}

function buildPrintDocument(html: string, title: string, extraCss: string): string {
  const scriptClose = "</" + "script>";
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    html, body { margin: 0; padding: 0; background: #fff; }
    ${extraCss}
  </style>
</head>
<body>
${html}
<script>
  window.addEventListener('afterprint', function () {
    setTimeout(function () {
      if (window.frameElement && window.frameElement.parentNode) {
        window.frameElement.parentNode.removeChild(window.frameElement);
      } else {
        window.close();
      }
    }, 100);
  });
  setTimeout(function () {
    window.focus();
    window.print();
  }, 250);
${scriptClose}
</body>
</html>`;
}

/**
 * Abre el diálogo de impresión / guardar PDF con el HTML de la ficha.
 * Usa un iframe oculto (no imprime la UI de la app ni depende de popups).
 */
export function generatePDF(
  html: string,
  filename = "ficha.pdf",
  options: PrintOptions = {},
): void {
  // Cabecera del navegador: título vacío a propósito (sin nombre de actividad ni modos).
  void filename;
  void options.title;
  const documentHtml = buildPrintDocument(html, "", options.extraCss ?? "");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Ficha");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument ?? frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    iframe.remove();
    printViaPopup(documentHtml);
    return;
  }

  frameDocument.open();
  frameDocument.write(documentHtml);
  frameDocument.close();
}

/** Fallback si el iframe no está disponible (entornos muy restringidos). */
function printViaPopup(documentHtml: string): void {
  // No usar "noopener": en varios navegadores hace que window.open devuelva null.
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) {
    throw new Error(
      "No se pudo abrir la impresión. Permite ventanas emergentes o usa Vista previa.",
    );
  }
  try {
    printWindow.opener = null;
  } catch {
    // Algunos navegadores bloquean asignar opener
  }
  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
}

/** Imprime el elemento del DOM actual (p. ej. vista previa embebida). */
export function printElement(element: HTMLElement): void {
  const html = element.outerHTML;
  const styles = collectStylesheets();
  generatePDF(html, "ficha.pdf", { extraCss: styles });
}

function collectStylesheets(): string {
  const parts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        parts.push(rule.cssText);
      }
    } catch {
      // Hojas cross-origin: ignorar
    }
  }
  return parts.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
