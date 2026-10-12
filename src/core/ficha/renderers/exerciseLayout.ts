import type { SheetExercise } from "../types";

/** Celda de la rejilla de ficha (antes de emparejar en filas). */
export interface ExerciseGridCell {
  ex: SheetExercise;
  number: number;
  full: boolean;
  variant: string;
}

/** Clase explícita por tipo de ejercicio para CSS Word-safe. */
export function exerciseCardVariant(
  ex: SheetExercise,
  options: { showAnswer?: boolean } = {},
): string {
  switch (ex.kind) {
    case "counting":
      return "counting";
    case "comparison":
      return "compare";
    case "seriesNumericas":
    case "series3Cifras":
      return "series";
    case "ordenar":
      return "ordenar";
    case "relacionar":
      return "relacionar";
    case "multiplicacion":
      return "multiplicacion";
    case "amigos10":
      return "amigos10";
    case "tablaNumerica":
      return "tabla";
    case "algoritmoVertical":
    case "tresSumandosColumna":
      // Alumno: caja alta. Soluciones: tarjeta compacta (solo el número).
      return options.showAnswer ? "" : "algcol";
    case "sumaLlevando":
      return options.showAnswer ? "" : "sumall";
    case "relacionSumaResta":
      return options.showAnswer ? "" : "fam";
    case "laberintoMatematico":
      return "laberinto";
    default:
      return "";
  }
}

/** Columnas por fila en alumno (p. ej. sumas en columna → 3). */
export function columnsPerRow(ex: SheetExercise): number {
  if (
    ex.kind === "algoritmoVertical" ||
    ex.kind === "tresSumandosColumna" ||
    ex.kind === "sumaLlevando"
  ) {
    return 3;
  }
  return 2;
}

/**
 * Empaqueta celdas en filas. Full-width ocupa fila sola; el resto usa
 * `columnsPerRow` del primer ejercicio de la fila.
 */
export function pairIntoRows(cells: ExerciseGridCell[]): ExerciseGridCell[][] {
  const rows: ExerciseGridCell[][] = [];
  let i = 0;
  while (i < cells.length) {
    const cur = cells[i]!;
    if (cur.full) {
      rows.push([cur]);
      i += 1;
      continue;
    }
    const cols = columnsPerRow(cur.ex);
    const row: ExerciseGridCell[] = [cur];
    i += 1;
    while (row.length < cols && i < cells.length) {
      const next = cells[i]!;
      if (next.full || columnsPerRow(next.ex) !== cols) break;
      row.push(next);
      i += 1;
    }
    rows.push(row);
  }
  return rows;
}
