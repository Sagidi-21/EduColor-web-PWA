import type { TablaNumericaSheetCell, TablaNumericaSheetExercise } from "../../types";

export interface TablaNumericaRendererProps {
  ex: TablaNumericaSheetExercise;
  showAnswer: boolean;
}

function cellClass(cell: TablaNumericaSheetCell): string {
  return `ficha-tabla__cell ficha-tabla__cell--${cell.state}`;
}

function cellContent(cell: TablaNumericaSheetCell): string {
  switch (cell.state) {
    case "blank":
      return "";
    case "target":
      return "?";
    case "symbol":
      return cell.symbol ?? "?";
    default:
      return String(cell.value);
  }
}

/**
 * Alumno: tabla 10×10 del 0 al 99 como en pizarra (visible / hueco / casilla amarilla / símbolo).
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function TablaNumericaRenderer({ ex, showAnswer }: TablaNumericaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const rows: TablaNumericaSheetCell[][] = [];
  for (let r = 0; r < ex.rows; r += 1) {
    rows.push(ex.cells.slice(r * ex.cols, (r + 1) * ex.cols));
  }
  const needsAnswerBox = ex.variant !== "colorear";

  return (
    <table className="ficha-tabla" cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        <tr>
          <td className="ficha-tabla__info" valign="top">
            <p className="ficha-tabla__question">{ex.question}</p>
            {ex.variant === "symbol" && ex.targetSymbol ? (
              <p className="ficha-tabla__symbol" aria-hidden>
                {ex.targetSymbol}
              </p>
            ) : null}
            {ex.variant === "colorear" && ex.ruleLabel ? (
              <p className="ficha-tabla__rule">{ex.ruleLabel}</p>
            ) : null}
            {needsAnswerBox ? (
              <span className="ficha-tabla__blank" aria-label="Espacio para la respuesta" />
            ) : null}
          </td>
          <td className="ficha-tabla__grid-cell" valign="top">
            <table className="ficha-tabla__grid" cellPadding={0} cellSpacing={0}>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell) => (
                      <td key={cell.value} className={cellClass(cell)}>
                        {cellContent(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
