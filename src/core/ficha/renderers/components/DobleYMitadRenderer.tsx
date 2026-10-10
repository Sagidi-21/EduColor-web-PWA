import type { DobleYMitadSheetExercise } from "../../types";

export interface DobleYMitadRendererProps {
  ex: DobleYMitadSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: pregunta + cajas Número ×2/÷2 Doble|Mitad (hueco donde falta el dato) + • opciones.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function DobleYMitadRenderer({ ex, showAnswer }: DobleYMitadRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const hasBoxes =
    ex.number !== undefined && ex.operacion !== undefined && ex.conocido !== undefined;
  const huecoEnResultado = ex.conocido === "original";
  const flecha = ex.operacion === "x2" ? "×2" : "÷2";
  const etiquetaResultado = ex.operacion === "x2" ? "Doble" : "Mitad";
  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-doble">
      <p className="ficha-doble__question">{ex.question}</p>
      {hasBoxes && (
        <div className="ficha-doble__visual">
          <div className="ficha-doble__item">
            <span
              className={`ficha-doble__box${huecoEnResultado ? "" : " ficha-doble__box--blank"}`}
            >
              {huecoEnResultado ? ex.number : ""}
            </span>
            <span className="ficha-doble__label">Número</span>
          </div>
          <span className="ficha-doble__arrow" aria-hidden>
            {flecha}
          </span>
          <div className="ficha-doble__item">
            <span
              className={`ficha-doble__box${huecoEnResultado ? " ficha-doble__box--blank" : ""}`}
            >
              {huecoEnResultado ? "" : ex.number}
            </span>
            <span className="ficha-doble__label">{etiquetaResultado}</span>
          </div>
        </div>
      )}
      {choices.length > 0 && (
        <div className="ficha-doble__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-doble__choice">
              <span className="ficha-doble__choice-mark" aria-hidden>
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
