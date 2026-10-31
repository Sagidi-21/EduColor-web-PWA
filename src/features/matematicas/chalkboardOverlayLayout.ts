/**
 * Layout de la zona útil de escritura sobre `pizarra.png`.
 * Se expresa en % del tamaño renderizado de la imagen para que el listado
 * quede centrado en cualquier viewport (PC, portátil, tablet) sin recalibrar
 * píxeles fijos del monitor de desarrollo.
 */

/** Tamaño intrínseco de `pizarra.png`. */
export const PIZARRA_NATURAL = { width: 1376, height: 768 } as const;

/**
 * Caja calibrada a tamaño natural (marco verde de la pizarra).
 * Origen: geometría que ya usaba el overlay antes del ajuste responsive.
 */
export const CONTENT_BOX_NATURAL = {
  top: 49,
  left: 229,
  width: 818,
  height: 481,
} as const;

/** Misma caja en porcentaje del ancho/alto de la imagen. */
export const PIZARRA_CONTENT_PCT = {
  top: (CONTENT_BOX_NATURAL.top / PIZARRA_NATURAL.height) * 100,
  left: (CONTENT_BOX_NATURAL.left / PIZARRA_NATURAL.width) * 100,
  width: (CONTENT_BOX_NATURAL.width / PIZARRA_NATURAL.width) * 100,
  height: (CONTENT_BOX_NATURAL.height / PIZARRA_NATURAL.height) * 100,
} as const;
