import type { Series3CifrasSheetExercise, SeriesNumericasSheetExercise } from "../../types";

export type SeriesSheetExercise = SeriesNumericasSheetExercise | Series3CifrasSheetExercise;

export interface SeriesRendererProps {
  ex: SeriesSheetExercise;
  showAnswer: boolean;
}

/**
 * Ficha de series: misma secuencia visual que la pizarra (cajas + flechas).
 * Soluciones: solo el número de la respuesta.
 */
export function SeriesRenderer({ ex, showAnswer }: SeriesRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  return (
    <div className="ficha-series">
      <p className="ficha-series__question">{ex.question}</p>
      <div className="ficha-series__sequence" aria-label="Serie numérica">
        {ex.sequence.map((n, i) => {
          const blank = n === -1 || i === ex.blankIndex;
          return (
            <div key={i} className={`ficha-series__box${blank ? " ficha-series__box--blank" : ""}`}>
              {blank ? "" : n}
              {i < ex.sequence.length - 1 && (
                <span className="ficha-series__arrow" aria-hidden="true">
                  {ex.ascending ? "→" : "←"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
