import type { TablaNumericaSheetExercise } from "../../types";

export interface TablaNumericaRendererProps {
  ex: TablaNumericaSheetExercise;
  showAnswer: boolean;
}

export function TablaNumericaRenderer({ ex, showAnswer }: TablaNumericaRendererProps): JSX.Element {
  const cells = showAnswer && ex.answer ? ex.answer : ex.cells;
  const rows: (number | null)[][] = [];
  for (let r = 0; r < ex.rows; r += 1) {
    rows.push(cells.slice(r * ex.cols, (r + 1) * ex.cols));
  }
  return (
    <table className="ficha-table">
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci}>{cell === null || cell === undefined ? "·" : cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
