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
  if (first.kind === "poligonos") {
    // Alumno: figura + opciones de texto (más altos). Soluciones: solo etiqueta.
    return options.showAnswer ? 16 : 8;
  }
  if (
    first.kind === "simetria" ||
    first.kind === "cuerpos3d" ||
    first.kind === "circuloCircunferencia" ||
    first.kind === "problemas2pasos" ||
    first.kind === "repartoIgual"
  ) {
    // Alumno: figura/diagrama + opciones (más altos). Soluciones: solo la respuesta.
    return options.showAnswer ? exercises.length || 1 : 8;
  }
  if (first.kind === "tablaNumerica") {
    // Alumno: rejilla 10×10 a ancho completo (pocos por hoja). Soluciones: solo respuesta.
    return options.showAnswer ? 16 : 4;
  }
  if (first.kind === "abaco3Cifras") {
    return options.showAnswer ? 16 : 8;
  }
  if (first.kind === "laberintoMatematico") {
    // Alumno y soluciones: 2 laberintos grandes por hoja (tablero dibujado).
    return 2;
  }
  if (first.kind === "rutaCuadricula") {
    // Alumno y soluciones dibujan la cuadrícula → misma densidad.
    return 8;
  }
  if (first.kind === "capacidad") {
    return options.showAnswer ? 16 : 8;
  }
  if (first.kind === "posicionesAula" || first.kind === "probabilidad") {
    return options.showAnswer ? 16 : 8;
  }
  if (first.kind === "reloj" || first.kind === "leftRight") {
    return options.showAnswer ? 16 : 8;
  }
  if (first.kind === "multiplicacion") {
    // Alumno: bloque de unir (≤5 filas) a media columna. Soluciones: solo parejas.
    return options.showAnswer ? 12 : 8;
  }
  if (first.kind === "rectaNumerica") {
    // easy/medium: 2 cols. hard/expert: 1 por fila (recta ancha); soluciones también dibujan.
    const wide = first.max >= 50;
    return wide ? 6 : 10;
  }
  if (first.kind === "lecturaNumeros") {
    // easy/medium: 2 cols. hard/expert: 1 por fila (más ancho para opciones).
    const wide = first.difficulty === "hard" || first.difficulty === "expert";
    return options.showAnswer ? 16 : wide ? 8 : 10;
  }
  if (first.kind === "sumaLlevando") {
    // Alumno: 3 por fila (9/hoja). Soluciones: solo el número.
    return options.showAnswer ? 18 : 9;
  }
  if (first.kind === "algoritmo3Cifras") {
    // Alumno: 3 por fila, hueco bajo la línea. Soluciones: solo el número.
    return options.showAnswer ? 18 : 9;
  }
  if (first.kind === "algoritmoVertical") {
    // Alumno: 3 por fila, cajas más altas. Soluciones: solo el número.
    return options.showAnswer ? 18 : 9;
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
  if (ex.kind === "tablaNumerica") return !options.showAnswer;
  if (ex.kind === "comparison") return !options.showAnswer;
  // Ordinales: easy/medium 2 por fila; hard/expert 1 (casilla a la derecha).
  if (ex.kind === "ordinales") {
    const wide = ex.difficulty === "hard" || ex.difficulty === "expert";
    return !options.showAnswer && wide;
  }
  if (ex.kind === "graficoBarras" || ex.kind === "balanza" || ex.kind === "intervalosTiempo") {
    return !options.showAnswer;
  }
  // Laberinto: ancho completo en alumno y soluciones (tablero grande).
  if (ex.kind === "laberintoMatematico") return true;
  if (ex.kind === "leftRight") {
    return !options.showAnswer && ex.variant !== undefined && ex.variant.startsWith("char-");
  }
  // hard/expert: una recta por fila (alumno y soluciones).
  if (ex.kind === "rectaNumerica") return ex.max >= 50;
  // hard/expert: un ejercicio de lectura por fila (alumno).
  if (ex.kind === "lecturaNumeros") {
    return !options.showAnswer && (ex.difficulty === "hard" || ex.difficulty === "expert");
  }
  return false;
}
