import type { SheetExercise } from "../../types";
import { columnsPerRow, exerciseCardVariant, pairIntoRows } from "../exerciseLayout";
import { isFullWidthExercise } from "../pageLayout";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseRenderer } from "./ExerciseRenderer";

export interface ExerciseGridProps {
  exercises: SheetExercise[];
  /** Índice global del primer ejercicio de la página (0-based). */
  pageOffset: number;
  showAnswer: boolean;
}

/**
 * Rejilla Word-safe: tabla HTML de 2 o 3 columnas (Word entiende tables; no CSS Grid).
 */
export function ExerciseGrid({
  exercises,
  pageOffset,
  showAnswer,
}: ExerciseGridProps): JSX.Element {
  const pageOpts = { showAnswer };
  const cells = exercises.map((ex, i) => ({
    ex,
    number: pageOffset + i + 1,
    full: isFullWidthExercise(ex, pageOpts),
    variant: exerciseCardVariant(ex),
  }));
  const rows = pairIntoRows(cells);

  return (
    <table className="ficha-grid" cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        {rows.map((row, ri) => {
          const first = row[0]!;
          const cols = first.full ? 1 : columnsPerRow(first.ex);
          const cellWidth = first.full ? "100%" : `${Math.floor(100 / cols)}%`;
          const empties = first.full ? 0 : Math.max(0, cols - row.length);
          return (
            <tr key={ri}>
              {row.map((cell) => (
                <td
                  key={cell.number}
                  className={
                    cell.full ? "ficha-grid__cell ficha-grid__cell--full" : "ficha-grid__cell"
                  }
                  colSpan={cell.full ? cols : 1}
                  width={cellWidth}
                >
                  <ExerciseCard number={cell.number} full={cell.full} variant={cell.variant}>
                    <ExerciseRenderer ex={cell.ex} showAnswer={showAnswer} />
                  </ExerciseCard>
                </td>
              ))}
              {Array.from({ length: empties }, (_, ei) => (
                <td
                  key={`empty-${ri}-${ei}`}
                  className="ficha-grid__cell ficha-grid__cell--empty"
                  width={cellWidth}
                />
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
