import type { SheetExercise } from "../types";

/** Celda de la rejilla de ficha (antes de emparejar en filas). */
export interface ExerciseGridCell {
  ex: SheetExercise;
  number: number;
  full: boolean;
  variant: string;
}

/** Clase explícita por tipo de ejercicio para CSS Word-safe. */
export function exerciseCardVariant(ex: SheetExercise): string {
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
    default:
      return "";
  }
}

/** Empareja celdas en filas de 2; full-width ocupa fila completa. */
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
    const next = cells[i + 1];
    if (next && !next.full) {
      rows.push([cur, next]);
      i += 2;
    } else {
      rows.push([cur]);
      i += 1;
    }
  }
  return rows;
}
