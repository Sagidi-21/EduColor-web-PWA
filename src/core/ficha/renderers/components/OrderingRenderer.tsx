import type { OrderingSheetExercise } from "../../types";

export interface OrderingRendererProps {
  ex: OrderingSheetExercise;
  showAnswer: boolean;
}

/**
 * Ordenar: tabla de una fila para números y otra para huecos.
 * Evita el wrap 4+1 de flex/inline-block en celdas estrechas y Word.
 */
export function OrderingRenderer({ ex, showAnswer }: OrderingRendererProps): JSX.Element {
  const ascending = ex.direction === "ascending";
  const instruction = ascending ? "Ordena de menor a mayor →" : "Ordena de mayor a menor →";
  const n = ex.numbers.length;
  const cellWidth = `${Math.floor(100 / Math.max(n, 1))}%`;

  return (
    <div className="ficha-ordenar">
      <p className="ficha-ordenar__instruction">{instruction}</p>
      <table
        className="ficha-ordenar__table"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        aria-label="Números dados"
      >
        <tbody>
          <tr>
            {ex.numbers.map((num, i) => (
              <td key={`n-${num}-${i}`} className="ficha-ordenar__td" width={cellWidth}>
                <span className="ficha-ordenar__card">{num}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <table
        className="ficha-ordenar__table ficha-ordenar__table--slots"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        aria-label="Espacio para ordenar"
      >
        <tbody>
          <tr>
            {ex.numbers.map((_, i) => (
              <td key={`s-${i}`} className="ficha-ordenar__td" width={cellWidth}>
                <span className="ficha-ordenar__slot">
                  {showAnswer && ex.answer ? ex.answer[i] : "\u00a0"}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
