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
 * Relacionar / counting necesitan más altura con figuras; en soluciones de
 * relacionar solo van respuestas. El resto sigue en una sola hoja lógica.
 */
export function pageSizeForExercises(
  exercises: SheetExercise[],
  options: { showAnswer?: boolean } = {},
): number {
  const first = exercises[0];
  if (!first) return 1;
  if (first.kind === "relacionar") {
    if (options.showAnswer) return 12;
    // Heurístico de respaldo (sin DOM). La paginación real mide alturas en pagePacking.
    const ex = first as RelacionarSheetExercise;
    const maxCount = Math.max(0, ...ex.right.map((r) => r.count));
    const pairs = ex.left.length;
    if (pairs >= 5 || maxCount >= 12) return 3;
    if (pairs >= 4 || maxCount >= 8) return 4;
    return 5;
  }
  if (first.kind === "relacionarCantidades") {
    return options.showAnswer ? 8 : 2;
  }
  if (first.kind === "elKilo" || first.kind === "elLitro" || first.kind === "monedasBilletes") {
    return options.showAnswer ? 12 : 8;
  }
  if (first.kind === "ordinales" || first.kind === "parImpar") {
    return options.showAnswer ? 16 : 10;
  }
  if (first.kind === "graficoBarras") {
    return options.showAnswer ? 10 : 4;
  }
  if (
    first.kind === "balanza" ||
    first.kind === "menuCafeteria" ||
    first.kind === "inventarProblema" ||
    first.kind === "intervalosTiempo" ||
    first.kind === "cintaMetrica"
  ) {
    return options.showAnswer ? 14 : 8;
  }
  if (first.kind === "counting") {
    // Siempre 10 por hoja A4 (todos los niveles); el CSS densifica figuras.
    return 10;
  }
  if (first.kind === "comparison") {
    // Alumno: una fila con dibujos (10/hoja). Soluciones: solo texto (más densas).
    return options.showAnswer ? 12 : 10;
  }
  if (first.kind === "seriesNumericas" || first.kind === "series3Cifras") {
    // Alumno: 2 por fila (10/hoja). Soluciones: solo el número (más densas).
    return options.showAnswer ? 20 : 10;
  }
  if (first.kind === "ordenar") {
    // Siempre 10 por hoja A4 (2×5), alumno y soluciones.
    return 10;
  }
  return exercises.length || 1;
}

/**
 * Ancho completo: relacionar (alumno) y comparison (A|B en una sola línea).
 */
export function isFullWidthExercise(
  ex: SheetExercise,
  options: { showAnswer?: boolean } = {},
): boolean {
  if (ex.kind === "relacionar") return !options.showAnswer;
  if (ex.kind === "relacionarCantidades") return !options.showAnswer;
  if (ex.kind === "comparison") return !options.showAnswer;
  if (ex.kind === "elKilo" || ex.kind === "elLitro" || ex.kind === "ordinales") {
    return !options.showAnswer;
  }
  if (ex.kind === "graficoBarras" || ex.kind === "balanza" || ex.kind === "intervalosTiempo") {
    return !options.showAnswer;
  }
  return false;
}
