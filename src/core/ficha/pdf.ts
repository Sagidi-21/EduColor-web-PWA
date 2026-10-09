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

/**
 * Abre una ventana con el HTML dado y lanza `window.print()`.
 * El usuario puede guardar como PDF desde el diálogo del sistema.
 */
export function generatePDF(
  html: string,
  filename = "ficha.pdf",
  options: PrintOptions = {},
): void {
  const title = options.title ?? filename.replace(/\.pdf$/i, "");
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
  if (!printWindow) {
    // Fallback: imprimir el documento actual si el popup está bloqueado
    window.print();
    return;
  }

  const scriptClose = "</" + "script>";
  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    html, body { margin: 0; padding: 0; background: #fff; }
    ${options.extraCss ?? ""}
  </style>
</head>
<body>
${html}
<script>
  window.addEventListener('load', function () {
    setTimeout(function () {
      window.focus();
      window.print();
    }, 250);
  });
${scriptClose}
</body>
</html>`);
  printWindow.document.close();
}

/** Imprime el elemento del DOM actual (p. ej. vista previa embebida). */
export function printElement(element: HTMLElement, title = "Ficha EduColor"): void {
  const html = element.outerHTML;
  const styles = collectStylesheets();
  generatePDF(html, `${title}.pdf`, { title, extraCss: styles });
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
