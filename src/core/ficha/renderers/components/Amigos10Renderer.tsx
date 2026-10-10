import type { Amigos10SheetExercise } from "../../types";

export interface Amigos10RendererProps {
  ex: Amigos10SheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: pregunta + ten-frame (si showVisual) + ecuación con hueco.
 * Soluciones: las maneja ExerciseRenderer (solo el número).
 */
export function Amigos10Renderer({ ex, showAnswer }: Amigos10RendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const given = Math.max(0, Math.min(10, ex.given));

  return (
    <div className="ficha-amigos10">
      <p className="ficha-amigos10__question">{ex.question}</p>
      {ex.showVisual ? (
        <div className="ficha-amigos10__row">
          <div className="ficha-amigos10__tenframe" aria-label={`${given} de 10`}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`ficha-amigos10__cell${i < given ? " ficha-amigos10__cell--given" : ""}`}
              >
                {i < given ? <span className="ficha-amigos10__dot" /> : null}
              </div>
            ))}
          </div>
          <div className="ficha-amigos10__eq" aria-label={`${given} más cuánto es 10`}>
            <span className="ficha-amigos10__eq-n">{given}</span>
            <span className="ficha-amigos10__eq-op">+</span>
            <span className="ficha-amigos10__eq-blank" aria-label="Espacio para la respuesta" />
            <span className="ficha-amigos10__eq-op">=</span>
            <span className="ficha-amigos10__eq-n">10</span>
          </div>
        </div>
      ) : (
        <div
          className="ficha-amigos10__eq-blank ficha-amigos10__eq-blank--solo"
          aria-label="Espacio para la respuesta"
        />
      )}
    </div>
  );
}
