import type { CountingSheetExercise } from "../../types";

export interface CountingRendererProps {
  ex: CountingSheetExercise;
  showAnswer: boolean;
}

function densityClass(count: number): string {
  if (count >= 15) return "ficha-counting--dense";
  if (count >= 8) return "ficha-counting--compact";
  return "";
}

/**
 * Alumno: figuras + pregunta + casilla.
 * Soluciones: las maneja ExerciseRenderer (solo el número).
 */
export function CountingRenderer({ ex, showAnswer }: CountingRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? ex.count}</div>;
  }

  return (
    <div className={`ficha-counting ${densityClass(ex.count)}`.trim()}>
      <div className="ficha-counting__objects" aria-label={`${ex.count} ${ex.objectLabel}`}>
        {ex.imageUrl
          ? Array.from({ length: ex.count }, (_, i) => (
              <img key={i} src={ex.imageUrl} alt="" className="ficha-counting__thumb" />
            ))
          : Array.from({ length: ex.count }, (_, i) => (
              <span key={i} className="ficha-counting__placeholder" aria-hidden="true" />
            ))}
      </div>

      <p className="ficha-counting__question">{ex.question}</p>
      <div className="ficha-counting__answer-blank" aria-label="Espacio para la respuesta" />
    </div>
  );
}
