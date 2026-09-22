import { useEffect, useState } from "react";

/**
 * Calcula el tamaño y centrado óptimos para una imagen que debe caber
 * completo dentro de un contenedor, manteniendo su aspect ratio,
 * sin deformarse y sin cortarse.
 *
 * Útil para overlays/paneles de imagen a pantalla completa que deben
 * adaptarse a cualquier tamaño de interfaz (zoom normal, grande, súper grande).
 */
export interface FitImageResult {
  width: number;
  height: number;
  /** Desplazamiento horizontal para centrar (px) */
  left: number;
  /** Desplazamiento vertical para centrar (px) */
  top: number;
}

/**
 * Devuelve las dimensiones máximas disponibles en el eje X e Y.
 * En un navegador real equivale a window.innerWidth / innerHeight.
 * En entorno de test (happy-dom) se usa `visualViewport` si existe.
 */
export function getViewportSize(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // visualViewport puede dar valores más precisos en móviles/PWA
  // (tiene en cuenta la barra de direcciones, safe areas, etc.)
  const vv = (window as unknown as { visualViewport?: { width: number; height: number } })
    .visualViewport;
  if (vv && vv.width > 0 && vv.height > 0) {
    return { width: vv.width, height: vv.height };
  }
  return { width: vw, height: vh };
}

/**
 * Calcula el fit "contain" manual (sin depender de CSS object-fit)
 * para una imagen de dimensiones imgW x imgH dentro de un contenedor
 * containerW x containerH.
 *
 * La imagen se escala uniformemente para que quepa completa,
 * dejando márgenes si la proporción no coincide.
 */
export function computeContainFit(
  imgW: number,
  imgH: number,
  containerW: number,
  containerH: number,
): FitImageResult {
  if (!Number.isFinite(imgW) || imgW <= 0 || !Number.isFinite(imgH) || imgH <= 0) {
    return { width: containerW, height: containerH, left: 0, top: 0 };
  }
  const scale = Math.min(containerW / imgW, containerH / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  return {
    width,
    height,
    left: (containerW - width) / 2,
    top: (containerH - height) / 2,
  };
}

/**
 * Calcula el fit "cover" manual para una imagen (se escala hasta cubrir
 * el contenedor, recortando lo que sobre). Útil para fondos.
 */
export function computeCoverFit(
  imgW: number,
  imgH: number,
  containerW: number,
  containerH: number,
): { width: number; height: number } {
  if (!Number.isFinite(imgW) || imgW <= 0 || !Number.isFinite(imgH) || imgH <= 0) {
    return { width: containerW, height: containerH };
  }
  const scale = Math.max(containerW / imgW, containerH / imgH);
  return { width: imgW * scale, height: imgH * scale };
}

/** Hook que calcula el fit "contain" de una imagen según el viewport actual (se actualiza al redimensionar). */
export function usePortalImageFit(imageW: number, imageH: number) {
  const [viewport, setViewport] = useState(getViewportSize);
  useEffect(() => {
    const onResize = () => setViewport(getViewportSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return computeContainFit(imageW, imageH, viewport.width, viewport.height);
}
