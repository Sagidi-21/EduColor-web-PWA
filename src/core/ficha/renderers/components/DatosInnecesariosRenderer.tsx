import type { DatosInnecesariosSheetExercise } from "../../types";

export interface DatosInnecesariosRendererProps {
  ex: DatosInnecesariosSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: instrucción de tachar primero + pregunta como contexto + frases con •.
 * Soluciones: solo la frase innecesaria (regla ficha-soluciones).
 */
export function DatosInnecesariosRenderer({
  ex,
  showAnswer,
}: DatosInnecesariosRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  return (
    <div className="ficha-datos-innec">
      <p className="ficha-datos-innec__task">Tacha con una raya la frase que no hace falta.</p>
      {ex.question ? (
        <p className="ficha-datos-innec__question">
          <span className="ficha-datos-innec__question-label">Para este problema:</span>{" "}
          {ex.question}
        </p>
      ) : null}
      <div className="ficha-datos-innec__frases">
        {ex.story.map((frase, i) => (
          <div key={i} className="ficha-datos-innec__frase">
            <span className="ficha-datos-innec__mark" aria-hidden>
              •
            </span>
            <span className="ficha-datos-innec__num">{i + 1}.</span>
            <span className="ficha-datos-innec__texto">{frase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
