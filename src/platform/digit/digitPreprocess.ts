/**
 * digitPreprocess.ts
 * Pipeline de normalización para dígitos manuscritos.
 * Usado tanto en entrenamiento (TrainerModal) como en inferencia (digitModel).
 *
 * Orden: escala de grises → binarización → bounding box → recorte + margen
 *        → escala bilineal con aspect ratio preservado → centrado por centro de masa
 *
 * IMPORTANTE: preservar el aspect ratio es clave para que "1" (trazo fino) no
 * se confunda con "4" (trazo grueso). Sin preservación el bbox de "1" se estira
 * a 32×32 y el modelo lo clasifica como "4".
 */

export const PROC_SIZE = 32;
const MARGIN = 4; // margen en píxeles alrededor del bbox detectado
const PAD = 2; // padding interior tras escalar (deja espacio en los bordes)

/**
 * Normaliza un array grayscale (float32, 0=negro 1=blanco) de tamaño w×h
 * y devuelve un Float32Array de PROC_SIZE×PROC_SIZE listo para la CNN.
 */
export function preprocessGray(gray: Float32Array, w: number, h: number): Float32Array {
  // 1. Bounding box: buscar píxeles del dígito (incluyendo bordes anti-aliased)
  // Threshold 0.9 (= 230/255) porque los trazos son anti-aliased
  let x0 = w,
    x1 = -1,
    y0 = h,
    y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (gray[y * w + x] < 0.9) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  // Sin dígito → imagen blanca
  if (x1 < 0) {
    const blank = new Float32Array(PROC_SIZE * PROC_SIZE);
    blank.fill(1.0);
    return blank;
  }

  // 2. Añadir margen al bbox
  x0 = Math.max(0, x0 - MARGIN);
  y0 = Math.max(0, y0 - MARGIN);
  x1 = Math.min(w - 1, x1 + MARGIN);
  y1 = Math.min(h - 1, y1 + MARGIN);
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;

  // 3. Escala bilineal preservando aspect ratio
  // El dígito cabe en un área interior de (PROC_SIZE - 2*PAD)².
  // Así "1" sigue siendo fino y "4" sigue siendo ancho → menos confusión.
  const inner = PROC_SIZE - 2 * PAD;
  const scale = Math.min(inner / cw, inner / ch);
  const newW = Math.max(1, Math.round(cw * scale));
  const newH = Math.max(1, Math.round(ch * scale));
  const offX = Math.round((PROC_SIZE - newW) / 2);
  const offY = Math.round((PROC_SIZE - newH) / 2);

  const scaled = new Float32Array(PROC_SIZE * PROC_SIZE);
  scaled.fill(1.0);
  for (let py = 0; py < newH; py++) {
    for (let px = 0; px < newW; px++) {
      const sx = newW > 1 ? (px / (newW - 1)) * (cw - 1) : 0;
      const sy = newH > 1 ? (py / (newH - 1)) * (ch - 1) : 0;
      const ix = Math.floor(sx),
        iy = Math.floor(sy);
      const fx = sx - ix,
        fy = sy - iy;
      const ix1 = Math.min(ix + 1, cw - 1);
      const iy1 = Math.min(iy + 1, ch - 1);
      scaled[(offY + py) * PROC_SIZE + (offX + px)] =
        gray[(y0 + iy) * w + (x0 + ix)] * (1 - fx) * (1 - fy) +
        gray[(y0 + iy) * w + (x0 + ix1)] * fx * (1 - fy) +
        gray[(y0 + iy1) * w + (x0 + ix)] * (1 - fx) * fy +
        gray[(y0 + iy1) * w + (x0 + ix1)] * fx * fy;
    }
  }

  // 4. Centrar por centro de masa (oscuridad = masa)
  let mx = 0,
    my = 0,
    mt = 0;
  for (let y = 0; y < PROC_SIZE; y++) {
    for (let x = 0; x < PROC_SIZE; x++) {
      const m = 1.0 - scaled[y * PROC_SIZE + x];
      mx += m * x;
      my += m * y;
      mt += m;
    }
  }
  if (mt < 1e-6) return scaled;

  const center = (PROC_SIZE - 1) / 2.0;
  const dx = Math.round(center - mx / mt);
  const dy = Math.round(center - my / mt);
  if (dx === 0 && dy === 0) return scaled;

  const out = new Float32Array(PROC_SIZE * PROC_SIZE);
  out.fill(1.0);
  for (let y = 0; y < PROC_SIZE; y++) {
    for (let x = 0; x < PROC_SIZE; x++) {
      const sx = x - dx,
        sy = y - dy;
      if (sx >= 0 && sx < PROC_SIZE && sy >= 0 && sy < PROC_SIZE)
        out[y * PROC_SIZE + x] = scaled[sy * PROC_SIZE + sx];
    }
  }
  return out;
}
