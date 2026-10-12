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
  const askedSymbols =
    ex.variant === "symbol"
      ? ex.targetSymbols?.length
        ? ex.targetSymbols
        : ex.targetSymbol
          ? ex.targetSymbol.split(/\s+/).filter(Boolean)
          : []
      : [];
  const blankCount =
    ex.variant === "symbol" ? Math.max(1, askedSymbols.length) : ex.variant === "missing" ? 1 : 0;

  return (
    <table className="ficha-tabla" cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        <tr>
          <td className="ficha-tabla__info" valign="top">
            <p className="ficha-tabla__question">{ex.question}</p>
            {ex.variant === "colorear" && ex.ruleLabel ? (
              <p className="ficha-tabla__rule">{ex.ruleLabel}</p>
            ) : null}
            {blankCount > 0 ? (
              <span className="ficha-tabla__blanks">
                {Array.from({ length: blankCount }, (_, i) => (
                  <span key={i} className="ficha-tabla__answer-slot">
                    {askedSymbols[i] ? (
                      <span className="ficha-tabla__symbol" aria-hidden>
                        {askedSymbols[i]}
                      </span>
                    ) : null}
                    <span
                      className="ficha-tabla__blank"
                      aria-label={
                        askedSymbols[i]
                          ? `Casilla del símbolo ${askedSymbols[i]}`
                          : "Espacio para la respuesta"
                      }
                    />
                  </span>
                ))}
              </span>
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
