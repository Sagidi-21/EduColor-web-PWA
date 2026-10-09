import type { InventarProblemaSheetExercise } from "../../types";

export interface InventarProblemaRendererProps {
  ex: InventarProblemaSheetExercise;
  showAnswer: boolean;
}

export function InventarProblemaRenderer({
  ex,
  showAnswer,
}: InventarProblemaRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-inventar">
        <p className="ficha-inventar__question">{ex.question}</p>
        <div className="ficha-answer">{ex.answer ?? "?"}</div>
      </div>
    );
  }

  return (
    <div className="ficha-inventar">
      <p className="ficha-inventar__question">{ex.question}</p>
      {ex.budget !== undefined && (
        <p className="ficha-inventar__budget">💰 Presupuesto: {ex.budget}€</p>
      )}
      <div className="ficha-inventar__items">
        {ex.items.map((item, i) => (
          <div key={i} className="ficha-inventar__card">
            <span className="ficha-inventar__emoji">{item.emoji}</span>
            <span className="ficha-inventar__name">{item.name}</span>
            <span className="ficha-inventar__price">{item.price}€</span>
          </div>
        ))}
      </div>
    </div>
  );
}
