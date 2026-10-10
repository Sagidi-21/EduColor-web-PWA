import type { DatosInnecesariosSheetExercise } from "../../types";

export interface DatosInnecesariosRendererProps {
  ex: DatosInnecesariosSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: pregunta + frases numeradas con • para marcar la que sobra (como pizarra).
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
      {ex.question ? <p className="ficha-datos-innec__question">{ex.question}</p> : null}
      <p className="ficha-datos-innec__hint">Tacha la frase que no hace falta:</p>
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
