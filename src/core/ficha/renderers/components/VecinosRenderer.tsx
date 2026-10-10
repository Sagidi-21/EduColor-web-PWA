import type { VecinosNumeroSheetExercise } from "../../types";

export interface VecinosRendererProps {
  ex: VecinosNumeroSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: pregunta + vía de 3 casas (antes / número / después) con hueco(s) + • opciones.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function VecinosRenderer({ ex, showAnswer }: VecinosRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const hasTrack = ex.number !== undefined && ex.askType !== undefined;
  const ambos = ex.askType === "ambos";
  const blankLeft = ambos || ex.askType === "anterior";
  const blankRight = ambos || ex.askType === "posterior";
  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-vecinos">
      <p className="ficha-vecinos__question">
        {ex.question} <span className="ficha-vecinos__hint">(redondea la correcta)</span>
      </p>
      {hasTrack && (
        <div className="ficha-vecinos__track" aria-label="Antes, número y después">
          <div className="ficha-vecinos__house">
            <span className={`ficha-vecinos__box${blankLeft ? " ficha-vecinos__box--blank" : ""}`}>
              {blankLeft ? "" : ex.anterior}
            </span>
            <span className="ficha-vecinos__label">antes</span>
          </div>
          <span className="ficha-vecinos__arrow" aria-hidden>
            ←
          </span>
          <div className="ficha-vecinos__house">
            <span className="ficha-vecinos__box ficha-vecinos__box--center">{ex.number}</span>
            <span className="ficha-vecinos__label">el número</span>
          </div>
          <span className="ficha-vecinos__arrow" aria-hidden>
            →
          </span>
          <div className="ficha-vecinos__house">
            <span className={`ficha-vecinos__box${blankRight ? " ficha-vecinos__box--blank" : ""}`}>
              {blankRight ? "" : ex.posterior}
            </span>
            <span className="ficha-vecinos__label">después</span>
          </div>
        </div>
      )}
      {choices.length > 0 && (
        <div className="ficha-vecinos__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-vecinos__choice">
              <span className="ficha-vecinos__choice-mark" aria-hidden>
                •
              </span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
