"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getViewportSize } from "./portalImageFit";

/** Lee el zoom efectivo del `body` (1 si no está definido). */
function getBodyZoom(): number {
  if (typeof document === "undefined") return 1;
  return parseFloat(getComputedStyle(document.body).zoom) || 1;
}

/** Devuelve las dimensiones en píxeles CSS que debe tener el overlay para
 * ocupar el viewport visible, compensando el zoom del `body`. */
function getZoomCorrectedViewport(): { width: string; height: string } {
  const z = getBodyZoom();
  const w = window.innerWidth / z;
  const h = window.innerHeight / z;
  return { width: `${w}px`, height: `${h}px` };
}

export interface PortalTransitionImageOnlyProps {
  label: string;
  image: string;
  type: "theme" | "character" | "personalidad" | "nombre";
  expandedWidth?: number;
  teacherName?: string;
  nameMode?: "ai" | "teacher";
  bannerExtra?: ReactNode;
}

/**
 * Componente para pruebas de diagnóstico - solo la imagen sin canvas
 * Versión mínima para verificar problemas de posicionamiento/zoom sin canvas.
 */
export function PortalTransitionImageOnly({
  label,
  image,
  type,
  expandedWidth = 1024,
  teacherName,
  nameMode = "ai",
  bannerExtra,
}: PortalTransitionImageOnlyProps) {
  const [viewport, setViewport] = useState(getViewportSize);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Log diagnóstico en mount y cambios
  useEffect(() => {
    const now = Date.now();
    const bodyStyle = getComputedStyle(document.body);
    const bodyZoom = parseFloat(bodyStyle.zoom) || 1;
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    const imageRect = imageRef.current?.getBoundingClientRect();

    const diagnostics = {
      timestamp: now,
      zoom: bodyZoom,
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      visualViewportWidth: window.visualViewport?.width,
      visualViewportHeight: window.visualViewport?.height,
      devicePixelRatio: window.devicePixelRatio,
      overlayRect: overlayRect && {
        x: overlayRect.left,
        y: overlayRect.top,
        width: overlayRect.width,
        height: overlayRect.height,
        right: overlayRect.right,
        bottom: overlayRect.bottom,
      },
      imageRect: imageRect && {
        x: imageRect.left,
        y: imageRect.top,
        width: imageRect.width,
        height: imageRect.height,
        right: imageRect.right,
        bottom: imageRect.bottom,
      },
    };

    console.log("=== DIAGNÓSTICO DE IMAGEN ÚNICAMENTE ===", JSON.stringify(diagnostics, null, 2));

    const onResize = () => {
      const newViewport = getViewportSize();
      setViewport(newViewport);
      const overlayRect = overlayRef.current?.getBoundingClientRect();
      const imageRect = imageRef.current?.getBoundingClientRect();

      const resizeDiagnostics = {
        timestamp: Date.now(),
        type: "resize",
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
        viewport: {
          width: newViewport.width,
          height: newViewport.height,
        },
        overlayRect: overlayRect && {
          x: overlayRect.left,
          y: overlayRect.top,
          width: overlayRect.width,
          height: overlayRect.height,
        },
        imageRect: imageRect && {
          x: imageRect.left,
          y: imageRect.top,
          width: imageRect.width,
          height: imageRect.height,
        },
      };

      console.log("=== CAMBIO DE TAMAÑO ===", JSON.stringify(resizeDiagnostics, null, 2));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isExpanded = viewport.width >= expandedWidth;
  const viewportSize = getZoomCorrectedViewport();

  return (
        <div
          ref={overlayRef}
          className="portal-transition"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            ...viewportSize,
            background: "#000",
            zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <img
        ref={imageRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          transform: "scale(1)",
          opacity: 1,
        }}
        src={image}
        alt=""
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          padding: "32px 16px",
          fontSize: "clamp(18px, 2.5vw, 24px)",
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
          background: "linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)",
        }}
      >
        {type === "theme" ? (
          <>Has seleccionado el portal de <span style={{ fontFamily: "var(--font-fredoka, 'Fredoka', sans-serif)", fontSize: "clamp(24px, 3.2vw, 34px)", fontWeight: 700, color: "#facc15"}}>{label}</span></>
        ) : type === "personalidad" && isExpanded ? (
          <>Su personalidad será <span style={{ fontFamily: "var(--font-fredoka, 'Fredoka', sans-serif)", fontSize: "clamp(24px, 3.2vw, 34px)", fontWeight: 700, color: "#facc15"}}>{label}</span></>
        ) : type === "nombre" && isExpanded ? (
          nameMode === "ai" ? (
            <>El nombre será <span style={{ fontFamily: "var(--font-fredoka, 'Fredoka', sans-serif)", fontSize: "clamp(24px, 3.2vw, 34px)", fontWeight: 700, color: "#facc15"}}>inventado por la IA</span></>
          ) : (
            <>El nombre elegido es <span style={{ fontFamily: "var(--font-fredoka, 'Fredoka', sans-serif)", fontSize: "clamp(24px, 3.2vw, 34px)", fontWeight: 700, color: "#facc15"}}>{teacherName ?? label}</span></>
          )
        ) : (
          <>Tu compañero será <span style={{ fontFamily: "var(--font-fredoka, 'Fredoka', sans-serif)", fontSize: "clamp(24px, 3.2vw, 34px)", fontWeight: 700, color: "#facc15"}}>{label}</span></>
        )}
      </div>
    </div>
  );
}