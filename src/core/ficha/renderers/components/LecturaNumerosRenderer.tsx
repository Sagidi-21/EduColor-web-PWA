import type { LecturaNumerosSheetExercise } from "../../types";

export interface LecturaNumerosRendererProps {
  ex: LecturaNumerosSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: consigna (mitad izq.) + número a la derecha; • opciones a ancho completo debajo.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 * Tamaños: editar `LecturaNumerosRenderer.print.css` (base, --word, --hard/--expert).
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
    <div className={`ficha-lectura ficha-lectura--${ex.difficulty}`}>
      <div className="ficha-lectura__top">
        <p className="ficha-lectura__question">
          {ex.question} <span className="ficha-lectura__hint">(redondea la correcta)</span>
        </p>
        <div className="ficha-lectura__display-slot">
          <div className={`ficha-lectura__display${isWord ? " ficha-lectura__display--word" : ""}`}>
            {ex.display}
          </div>
        </div>
      </div>
      <div className="ficha-lectura__choices">
        {ex.choiceLabels.map((label, i) => (
          <span key={`${label}-${i}`} className="ficha-lectura__choice">
            <span className="ficha-lectura__choice-mark" aria-hidden>
              •
            </span>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
