/**
 * Layout de la zona útil de escritura sobre `pizarra.png`.
 * Se expresa en % del tamaño renderizado de la imagen para que el listado
 * quede dentro del marco verde en cualquier viewport.
 */

/** Tamaño intrínseco de `pizarra.png`. */
export const PIZARRA_NATURAL = { width: 1376, height: 768 } as const;

/**
 * Caja de escritura (verde interior), calibrada sobre el PNG real.
 * El tablero verde útil ~ y 118–611, x 257–1115; esta caja deja margen al marco.
 */
export const CONTENT_BOX_NATURAL = {
  /* Un poco más arriba: el bloque útil empezaba demasiado bajo en aula */
  top: 118,
  left: 290,
  width: 790,
  height: 450,
} as const;

/** Misma caja en porcentaje del ancho/alto de la imagen. */
export const PIZARRA_CONTENT_PCT = {
  top: (CONTENT_BOX_NATURAL.top / PIZARRA_NATURAL.height) * 100,
  left: (CONTENT_BOX_NATURAL.left / PIZARRA_NATURAL.width) * 100,
  width: (CONTENT_BOX_NATURAL.width / PIZARRA_NATURAL.width) * 100,
  height: (CONTENT_BOX_NATURAL.height / PIZARRA_NATURAL.height) * 100,
} as const;

export type FitRect = { left: number; top: number; width: number; height: number };

/** Encaja la pizarra en el stage con letterbox (object-fit: contain). */
export function fitPizarraInStage(
  stageW: number,
  stageH: number,
  natural = PIZARRA_NATURAL,
): FitRect | null {
  if (stageW < 2 || stageH < 2) return null;
  const scale = Math.min(stageW / natural.width, stageH / natural.height);
  const width = natural.width * scale;
  const height = natural.height * scale;
  return {
    width,
    height,
    left: (stageW - width) / 2,
    top: (stageH - height) / 2,
  };
}
