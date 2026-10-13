import type { CintaMetricaSheetExercise } from "../../types";

export interface CintaMetricaRendererProps {
  ex: CintaMetricaSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno:
 * - choose-unit: enunciado «Elige entre cm y m» + icono + «Una … mide N ___» (sin cinta).
 * - estimate: pregunta + • opciones.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function CintaMetricaRenderer({ ex, showAnswer }: CintaMetricaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const chooseUnit = ex.exerciseType !== "estimate";
  const choices = ex.choiceLabels ?? [];

  return (
    <div className={`ficha-cinta${chooseUnit ? " ficha-cinta--unit" : " ficha-cinta--estimate"}`}>
      {chooseUnit ? <p className="ficha-cinta__instruction">Elige entre cm y m</p> : null}
      <div className="ficha-cinta__object">
        <span className="ficha-cinta__emoji">{ex.emoji}</span>
      </div>
      <p className="ficha-cinta__question">{ex.question}</p>
      {choices.length > 0 ? (
        <div className="ficha-cinta__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-cinta__choice">
              <span className="ficha-cinta__choice-mark" aria-hidden>
                •
              </span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
