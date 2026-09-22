import { useEffect, useRef, useState, type ReactNode } from "react";
import { getViewportSize } from "./portalImageFit";

/** Lee el zoom efectivo del `body` (1 si no está definido). */
function getBodyZoom(): number {
  if (typeof document === "undefined") return 1;
  return parseFloat(getComputedStyle(document.body).zoom) || 1;
}

/**
 * Devuelve las dimensiones en píxeles CSS que debe tener el overlay para
 * ocupar el viewport visible, compensando el zoom del `body`.
 *
 * Cuando `document.body` tiene `zoom: z > 1`, un elemento con
 * `width: 100vw` se renderiza a `100vw × z` device-pixels, lo que
 * provoca que se salga del viewport. Dividir entre `z` corrige esto:
 * el CSS calcula `100vw / z` y luego el zoom del body lo multiplica
 * por `z`, dando el tamaño visual correcto.
 */
function getZoomCorrectedViewport(): { width: string; height: string } {
  const z = getBodyZoom();
  const w = window.innerWidth / z;
  const h = window.innerHeight / z;
  return { width: `${w}px`, height: `${h}px` };
}

export interface PortalTransitionProps {
  label: string;
  image: string;
  dissolving: boolean;
  type: "theme" | "character" | "personalidad" | "nombre" | "visual_style";
  /** Ancho de la pantalla "expandida". Se usa para cambiar el texto del banner. */
  expandedWidth?: number;
  /** Nombre del niño cuando type === "nombre" y nameMode === "teacher" */
  teacherName?: string;
  /** Modo de nombre actual ("ai" | "teacher") */
  nameMode?: "ai" | "teacher";
  /** Contenido adicional que se muestra en el banner (por ejemplo, inputs) */
  bannerExtra?: ReactNode;
  /** Callback cuando la animación de disolución termina */
  onDissolved?: () => void;
}

/**
 * Componente puro que muestra la imagen de una tarjeta ampliada a pantalla
 * completa con una animación de "disolución" (pixelado).
 *
 * La imagen se ajusta con `object-fit: contain` y se centra, por lo que
 * nunca se corta ni se deforma, independientemente del zoom de la app
 * (normal, grande, súper grande) o del tamaño de la ventana.
 */
export function PortalTransition({
  label,
  image,
  dissolving,
  type,
  expandedWidth = 1024,
  teacherName,
  nameMode = "ai",
  bannerExtra,
  onDissolved,
}: PortalTransitionProps) {
  const dissolveCanvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState(getViewportSize);

  useEffect(() => {
    const onResize = () => setViewport(getViewportSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Mantener el canvas del dissolve alineado con el tamaño real de pantalla
  useEffect(() => {
    if (!dissolving) return;
    const canvas = dissolveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = viewport.width;
    const h = viewport.height;
    canvas.width = w;
    canvas.height = h;

    const cell = 16;
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    let raf = 0;
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      const tmp = document.createElement("canvas");
      const tctx = tmp.getContext("2d");
      if (!tctx) return;
      tctx.imageSmoothingEnabled = false;
      tmp.width = cols;
      tmp.height = rows;
      tctx.drawImage(img, 0, 0, cols, rows);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tmp, 0, 0, w, h);

      const cells: { x: number; y: number }[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({ x: c, y: r });
        }
      }
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }

      const duration = 900;
      let done = 0;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const target = Math.floor(progress * cells.length);
        while (done < target) {
          ctx.clearRect(cells[done].x * cell, cells[done].y * cell, cell, cell);
          done++;
        }
        if (progress < 1) {
          raf = requestAnimationFrame(step);
        } else {
          onDissolved?.();
        }
      };
      raf = requestAnimationFrame(step);
    };

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [dissolving, image, viewport, onDissolved]);

  const isExpanded = viewport.width >= expandedWidth;
  const viewportSize = getZoomCorrectedViewport();

  return (
    <div
      className="portal-transition"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        ...viewportSize,
      }}
    >
      <img className="portal-transition__image" src={image} alt="" />
      {dissolving && <canvas className="portal-dissolve__canvas" ref={dissolveCanvasRef} />}
      <div className="portal-transition__banner">
        {type === "theme" ? (
          <>
            Has seleccionado el portal de <span className="portal-transition__name">{label}</span>
          </>
        ) : type === "visual_style" ? (
          <>
            El estilo de tu compañero será <span className="portal-transition__name">{label}</span>
          </>
        ) : type === "personalidad" && isExpanded ? (
          <>
            Su personalidad será <span className="portal-transition__name">{label}</span>
          </>
        ) : type === "nombre" && isExpanded ? (
          nameMode === "ai" ? (
            <>
              El nombre será <span className="portal-transition__name">inventado por la IA</span>
            </>
          ) : (
            <>
              El nombre elegido es{" "}
              <span className="portal-transition__name">{teacherName ?? label}</span>
            </>
          )
        ) : (
          <>
            Tu compañero será <span className="portal-transition__name">{label}</span>
          </>
        )}
        {bannerExtra}
      </div>
    </div>
  );
}
