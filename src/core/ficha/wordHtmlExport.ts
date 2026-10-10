/**
 * Descarga la ficha como archivo Word (.doc) con el **mismo HTML/CSS**
 * que la vista previa imprimible. No usa el maquetador tipo Electron.
 *
 * Formato: HTML que Word / LibreOffice abren como documento (.doc).
 */

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(blob);
  });
}

/** Sustituye `src` relativos/absolutos de `<img>` por data URLs para que Word los vea. */
export async function inlineImagesInHtml(html: string): Promise<string> {
  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) return html;

  const imgs = Array.from(root.querySelectorAll("img"));
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        // Word no resuelve rutas relativas tipo /logo-ficha.png → absolutas + data URL.
        const absolute =
          src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:")
            ? src
            : origin
              ? new URL(src, origin).href
              : src;
        const res = await fetch(absolute);
        if (!res.ok) return;
        const dataUrl = await blobToDataUrl(await res.blob());
        img.setAttribute("src", dataUrl);
      } catch {
        // Si falla el fetch, se deja el src original.
      }
    }),
  );

  return root.innerHTML;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

export interface DownloadHtmlAsWordInput {
  /** Cuerpo HTML (p. ej. una o más `.ficha-page`). */
  html: string;
  /** CSS de impresión (bundle print-base + ejercicios). */
  css: string;
  filename: string;
}

/**
 * Empaqueta el HTML de la ficha + CSS en un .doc descargable.
 * El aspecto es el de la vista previa, no el DOCX de Electron.
 */
export async function downloadHtmlAsWord(input: DownloadHtmlAsWordInput): Promise<void> {
  const bodyHtml = await inlineImagesInHtml(input.html);
  const documentHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"
      lang="es">
<head>
  <meta charset="utf-8" />
  <title></title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    ${input.css}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  const blob = new Blob(["\ufeff", documentHtml], {
    type: "application/msword;charset=utf-8",
  });
  triggerDownload(blob, input.filename);
}
