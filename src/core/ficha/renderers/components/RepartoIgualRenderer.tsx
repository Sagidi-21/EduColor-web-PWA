import type { RepartoIgualSheetExercise } from "../../types";

export interface RepartoIgualRendererProps {
  ex: RepartoIgualSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: enunciado + puntos + cajas de grupo (easy/medium) o casilla de respuesta (hard/expert).
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function RepartoIgualRenderer({ ex, showAnswer }: RepartoIgualRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  return (
    <div className="ficha-reparto">
      <p className="ficha-reparto__text">
        Tenemos <strong className="ficha-reparto__num">{ex.total}</strong> objetos y queremos
        repartirlos en <strong className="ficha-reparto__num">{ex.groups}</strong> grupos iguales.
      </p>
      {ex.showVisual ? (
        <div className="ficha-reparto__visual">
          <div className="ficha-reparto__items" aria-hidden>
            {Array.from({ length: ex.total }, (_, i) => (
              <span key={`item-${i}`} className="ficha-reparto__item" />
            ))}
          </div>
          <div className="ficha-reparto__groups" aria-hidden>
            {Array.from({ length: ex.groups }, (_, i) => (
              <span key={`group-${i}`} className="ficha-reparto__group-box" />
            ))}
          </div>
        </div>
      ) : (
        <div className="ficha-reparto__answer-row">
          <span>A cada grupo le tocan:</span>
          <span className="ficha-reparto__input" />
        </div>
      )}
    </div>
  );
}
