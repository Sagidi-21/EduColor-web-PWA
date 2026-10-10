import type { ProblemaSheetExercise } from "../../types";

export interface ProblemaRendererProps {
  ex: ProblemaSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: emoji del tema + historia + pregunta + ecuación `a ± b = □` (como pizarra).
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function ProblemaRenderer({ ex, showAnswer }: ProblemaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const hasEquation = ex.a !== undefined && ex.b !== undefined && ex.op !== undefined;
  const text = [...(ex.story ?? []), ex.question].filter(Boolean).join("\n");

  return (
    <div className="ficha-problema">
      <div className="ficha-problema__card">
        {ex.emoji ? (
          <span className="ficha-problema__emoji" aria-hidden>
            {ex.emoji}
          </span>
        ) : null}
        <p className="ficha-problema__text">{text}</p>
      </div>
      {hasEquation && (
        <div className="ficha-problema__eq" aria-label="Operación">
          <span className="ficha-problema__eq-n">{ex.a}</span>
          <span className="ficha-problema__eq-op">{ex.op === "-" ? "−" : "+"}</span>
          <span className="ficha-problema__eq-n">{ex.b}</span>
          <span className="ficha-problema__eq-op">=</span>
          <span className="ficha-problema__eq-blank" aria-label="Espacio para la respuesta" />
        </div>
      )}
    </div>
  );
}
