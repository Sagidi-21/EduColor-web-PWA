import type { IntervalosTiempoSheetExercise } from "../../types";

export interface IntervalosTiempoRendererProps {
  ex: IntervalosTiempoSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: enunciado + tarjetas (con barras opcionales en color de clase) + opciones •.
 * Soluciones: ExerciseRenderer (solo la respuesta).
 */
export function IntervalosTiempoRenderer({
  ex,
  showAnswer,
}: IntervalosTiempoRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const maxSec = Math.max(1, ...ex.activities.map((a) => a.seconds), 3600);
  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-intervalos">
      <p className="ficha-intervalos__question">
        {ex.question}
        {choices.length > 0 && (
          <span className="ficha-intervalos__hint"> (redondea la correcta)</span>
        )}
      </p>
      <div className="ficha-intervalos__acts">
        {ex.activities.map((act, i) => (
          <div key={i} className="ficha-intervalos__card">
            <span className="ficha-intervalos__emoji">{act.emoji}</span>
            <span className="ficha-intervalos__name">{act.name}</span>
            <span className="ficha-intervalos__label">{act.label}</span>
            {ex.showBars && (
              <div className="ficha-intervalos__bar-track">
                <div
                  className="ficha-intervalos__bar-fill"
                  style={{ width: `${Math.max(8, Math.round((act.seconds / maxSec) * 100))}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {choices.length > 0 && (
        <div className="ficha-intervalos__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-intervalos__choice">
              <span className="ficha-intervalos__choice-mark" aria-hidden>
                •
              </span>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
