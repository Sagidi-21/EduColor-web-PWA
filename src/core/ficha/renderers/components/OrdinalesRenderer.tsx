import type { OrdinalesSheetExercise } from "../../types";

export interface OrdinalesRendererProps {
  ex: OrdinalesSheetExercise;
  showAnswer: boolean;
}

const ORDINAL_LABELS = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"];

/**
 * Alumno: dirección (si fromRight) + fila con etiquetas ordinales + casilla de respuesta.
 */
export function OrdinalesRenderer({ ex, showAnswer }: OrdinalesRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const showLabels = ex.count <= 7;

  return (
    <div className="ficha-ordinales">
      {ex.fromRight && (
        <p className="ficha-ordinales__direction">
          <span aria-hidden>→</span> Desde la derecha
        </p>
      )}
      {ex.emoji && ex.count > 0 && (
        <div className="ficha-ordinales__row" aria-label="Fila de objetos">
          {Array.from({ length: ex.count }, (_, i) => {
            const pos = i + 1;
            const star = pos === ex.target;
            return (
              <div
                key={i}
                className={`ficha-ordinales__item${star ? " ficha-ordinales__item--star" : ""}`}
              >
                <span className="ficha-ordinales__cell">{star ? "⭐" : ex.emoji}</span>
                {showLabels && (
                  <span className="ficha-ordinales__pos">
                    {ORDINAL_LABELS[pos - 1] ?? `${pos}º`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="ficha-ordinales__question">{ex.question}</p>
      <span className="ficha-ordinales__blank" aria-label="Espacio para la respuesta" />
    </div>
  );
}
