import type { OrderingSheetExercise } from "../../types";

export interface OrderingRendererProps {
  ex: OrderingSheetExercise;
  showAnswer: boolean;
}

export function OrderingRenderer({ ex, showAnswer }: OrderingRendererProps): JSX.Element {
  const ascending = ex.direction === "ascending";
  const instruction = ascending ? "Ordena de menor a mayor →" : "Ordena de mayor a menor →";

  return (
    <div className="ficha-ordenar">
      <p className="ficha-ordenar__instruction">{instruction}</p>
      <div className="ficha-ordenar__pool" aria-label="Números dados">
        {ex.numbers.map((n, i) => (
          <span key={`${n}-${i}`} className="ficha-ordenar__card">
            {n}
          </span>
        ))}
      </div>
      <div className="ficha-ordenar__slots" aria-label="Espacio para ordenar">
        {ex.numbers.map((_, i) => (
          <span key={i} className="ficha-ordenar__slot">
            {showAnswer && ex.answer ? ex.answer[i] : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
