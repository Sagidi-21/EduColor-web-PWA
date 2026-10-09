import type { OrdinalesSheetExercise } from "../../types";

export interface OrdinalesRendererProps {
  ex: OrdinalesSheetExercise;
  showAnswer: boolean;
}

export function OrdinalesRenderer({ ex, showAnswer }: OrdinalesRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-ordinales">
        <p className="ficha-ordinales__question">{ex.question}</p>
        <div className="ficha-answer">{ex.answer ?? "?"}</div>
      </div>
    );
  }

  return (
    <div className="ficha-ordinales">
      <p className="ficha-ordinales__question">{ex.question}</p>
      {ex.emoji && ex.count > 0 && (
        <div className="ficha-ordinales__row" aria-label="Fila de objetos">
          {Array.from({ length: ex.count }, (_, i) => {
            const pos = i + 1;
            const star = pos === ex.target;
            return (
              <span
                key={i}
                className={`ficha-ordinales__cell${star ? " ficha-ordinales__cell--star" : ""}`}
              >
                {star ? "⭐" : ex.emoji}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
