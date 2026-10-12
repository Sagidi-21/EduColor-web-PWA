import type { PoligonosSheetExercise } from "../../types";
import { ShapeSvg } from "./ShapeSvg";

export interface PoligonosRendererProps {
  ex: PoligonosSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: figura/foto + pregunta + opciones (texto), o solo enunciado + figuras
 * a redondear (expert). Soluciones: ExerciseRenderer (solo la respuesta).
 */
export function PoligonosRenderer({ ex, showAnswer }: PoligonosRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const hasChoiceLabels = Boolean(ex.choiceLabels && ex.choiceLabels.length > 0);
  const hasFigureOptions = Boolean(ex.optionsList && ex.optionsList.length > 0);
  const showReference = Boolean(ex.imageUrl || ex.shape);

  return (
    <div className={`ficha-poligonos${hasFigureOptions ? " ficha-poligonos--expert" : ""}`}>
      {ex.question ? (
        <p className="ficha-poligonos__question">
          {ex.question}
          <span className="ficha-poligonos__hint"> (redondea la correcta)</span>
        </p>
      ) : null}
      {showReference || hasChoiceLabels ? (
        <div className="ficha-poligonos__body">
          {ex.imageUrl ? (
            <div className="ficha-poligonos__figure">
              <img src={ex.imageUrl} alt="" className="ficha-poligonos__photo" />
            </div>
          ) : (
            ex.shape && (
              <div className="ficha-poligonos__figure">
                <ShapeSvg shape={ex.shape} size={72} />
              </div>
            )
          )}
          {hasChoiceLabels && (
            <div
              className={`ficha-poligonos__choices ficha-poligonos__choices--${ex.choiceLabels!.length}`}
            >
              {ex.choiceLabels!.map((label, i) => (
                <div key={`${label}-${i}`} className="ficha-poligonos__choice">
                  <span className="ficha-poligonos__choice-mark" aria-hidden>
                    •
                  </span>
                  <span className="ficha-poligonos__choice-text">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
      {!hasChoiceLabels && hasFigureOptions && (
        <div className="ficha-poligonos__options">
          {ex.optionsList!.map((opt, i) => (
            <div key={i} className="ficha-poligonos__option">
              <span className="ficha-poligonos__opt-label">{String.fromCharCode(65 + i)}</span>
              <ShapeSvg shape={opt} size={48} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
