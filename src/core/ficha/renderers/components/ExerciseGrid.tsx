import type { SheetExercise } from "../../types";
import { isFullWidthExercise } from "../pageLayout";
import { ExerciseCard, exerciseCardVariant } from "./ExerciseCard";
import { ExerciseRenderer } from "./ExerciseRenderer";

export interface ExerciseGridProps {
  exercises: SheetExercise[];
  /** Índice global del primer ejercicio de la página (0-based). */
  pageOffset: number;
  showAnswer: boolean;
}

interface GridCell {
  ex: SheetExercise;
  number: number;
  full: boolean;
  variant: string;
}

/** Empareja celdas en filas de 2; full-width ocupa fila completa. */
export function pairIntoRows(cells: GridCell[]): GridCell[][] {
  const rows: GridCell[][] = [];
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

/**
 * Rejilla Word-safe: tabla HTML de 2 columnas (Word entiende tables; no CSS Grid).
 */
export function ExerciseGrid({
  exercises,
  pageOffset,
  showAnswer,
}: ExerciseGridProps): JSX.Element {
  const pageOpts = { showAnswer };
  const cells: GridCell[] = exercises.map((ex, i) => ({
    ex,
    number: pageOffset + i + 1,
    full: isFullWidthExercise(ex, pageOpts),
    variant: exerciseCardVariant(ex),
  }));
  const rows = pairIntoRows(cells);

  return (
    <table className="ficha-grid" cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell) => (
              <td
                key={cell.number}
                className={
                  cell.full ? "ficha-grid__cell ficha-grid__cell--full" : "ficha-grid__cell"
                }
                colSpan={cell.full ? 2 : 1}
                width={cell.full ? "100%" : "50%"}
              >
                <ExerciseCard number={cell.number} full={cell.full} variant={cell.variant}>
                  <ExerciseRenderer ex={cell.ex} showAnswer={showAnswer} />
                </ExerciseCard>
              </td>
            ))}
            {row.length === 1 && !row[0]!.full ? (
              <td className="ficha-grid__cell ficha-grid__cell--empty" width="50%" />
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
