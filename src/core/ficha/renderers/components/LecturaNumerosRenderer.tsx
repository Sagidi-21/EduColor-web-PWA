import type { LecturaNumerosSheetExercise } from "../../types";

export interface LecturaNumerosRendererProps {
  ex: LecturaNumerosSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: consigna + número o palabra en grande + ○ opciones.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function LecturaNumerosRenderer({
  ex,
  showAnswer,
}: LecturaNumerosRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const isWord = ex.variant === "palabra-to-cifra";
  return (
    <div className="ficha-lectura">
      <p className="ficha-lectura__question">{ex.question}</p>
      <div className={`ficha-lectura__display${isWord ? " ficha-lectura__display--word" : ""}`}>
        {ex.display}
      </div>
      <div className="ficha-lectura__choices">
        {ex.choiceLabels.map((label, i) => (
          <span key={`${label}-${i}`} className="ficha-lectura__choice">
            <span className="ficha-lectura__choice-mark" aria-hidden>
              ○
            </span>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
