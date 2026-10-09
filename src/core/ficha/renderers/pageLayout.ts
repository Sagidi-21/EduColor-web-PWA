import type { RelacionarSheetExercise, SheetExercise } from "../types";

/** Parte un array en páginas de tamaño fijo. */
export function chunkByPageSize<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const pageSize = Math.max(1, size);
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

/**
 * Cuántos ejercicios caben por página A4 según el contenido.
 * Relacionar necesita más altura (filas de figuras); en soluciones solo van
 * las respuestas y caben muchas más. El resto sigue en una sola hoja lógica.
 */
export function pageSizeForExercises(
  exercises: SheetExercise[],
  options: { showAnswer?: boolean } = {},
): number {
  const first = exercises[0];
  if (!first) return 1;
  if (first.kind === "relacionar") {
    if (options.showAnswer) return 12;
    const ex = first as RelacionarSheetExercise;
    const maxCount = Math.max(0, ...ex.right.map((r) => r.count));
    const pairs = ex.left.length;
    if (pairs >= 5 || maxCount >= 12) return 4;
    if (pairs >= 4 || maxCount >= 8) return 5;
    return 6;
  }
  return exercises.length || 1;
}

/** Ancho completo solo en la ficha de alumno (tablero con figuras). */
export function isFullWidthExercise(
  ex: SheetExercise,
  options: { showAnswer?: boolean } = {},
): boolean {
  if (ex.kind === "relacionar") return !options.showAnswer;
  return false;
}
