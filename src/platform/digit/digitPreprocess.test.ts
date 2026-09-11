import { describe, it, expect } from "vitest";
import { preprocessGray, PROC_SIZE } from "./digitPreprocess";

describe("preprocessGray", () => {
  it("devuelve imagen blanca para canvas vacío", () => {
    const blank = new Float32Array(32 * 32).fill(1.0); // todo blanco
    const result = preprocessGray(blank, 32, 32);
    expect(result).toHaveLength(PROC_SIZE * PROC_SIZE);
    expect(result.every((v) => v === 1.0)).toBe(true);
  });

  it("devuelve array de PROC_SIZE×PROC_SIZE", () => {
    const gray = new Float32Array(100 * 100).fill(1.0);
    // Añadir un trazo mínimo en el centro
    gray[50 * 100 + 50] = 0.0;
    const result = preprocessGray(gray, 100, 100);
    expect(result).toHaveLength(PROC_SIZE * PROC_SIZE);
  });

  it("preserva aspect ratio: un trazo fino no se estira", () => {
    // Dibuja un trazo vertical (1px ancho, 20px alto) en imagen 32×32
    const gray = new Float32Array(32 * 32).fill(1.0);
    for (let y = 6; y <= 25; y++) gray[y * 32 + 16] = 0.0;
    const result = preprocessGray(gray, 32, 32);
    // Contar píxeles oscuros en el resultado — deben ser pocos (trazo fino)
    const darkPixels = Array.from(result).filter((v) => v < 0.5).length;
    expect(darkPixels).toBeLessThan(60); // un trazo fino no debería llenar la imagen
  });

  it("centra el contenido por centro de masa", () => {
    // Dígito en la esquina superior izquierda
    const gray = new Float32Array(32 * 32).fill(1.0);
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++) gray[y * 32 + x] = 0.0;
    const result = preprocessGray(gray, 32, 32);
    // El centro de masa debería estar cerca del centro de la imagen resultante
    let mx = 0, my = 0, mt = 0;
    for (let y = 0; y < PROC_SIZE; y++)
      for (let x = 0; x < PROC_SIZE; x++) {
        const m = 1 - result[y * PROC_SIZE + x];
        mx += m * x; my += m * y; mt += m;
      }
    if (mt > 0) {
      const cx = mx / mt, cy = my / mt;
      const center = (PROC_SIZE - 1) / 2;
      // El centro de masa debe estar a menos de 4 px del centro
      expect(Math.abs(cx - center)).toBeLessThan(4);
      expect(Math.abs(cy - center)).toBeLessThan(4);
    }
  });
});
