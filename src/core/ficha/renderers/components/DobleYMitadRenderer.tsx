import type { ReactNode } from "react";
import type { DobleYMitadSheetExercise } from "../../types";

export interface DobleYMitadRendererProps {
  ex: DobleYMitadSheetExercise;
  showAnswer: boolean;
}

/** Resalta cifras del enunciado con el color de clase. */
function questionWithNumbers(question: string): ReactNode {
  const parts = question.split(/(\d+)/);
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="ficha-doble__q-num">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Operación que el niño debe hacer: si el dato es el resultado (find-original),
 * se muestra la inversa (÷2 / ×2) para hallar el número de partida.
 */
function workOp(ex: DobleYMitadSheetExercise): "×" | "÷" {
  const forward = ex.operacion === "div2" ? "÷" : "×";
  if (ex.conocido === "resultado") return forward === "×" ? "÷" : "×";
  return forward;
}

/**
 * Alumno:
 * - easy: pregunta + cajas Número ×2/÷2 Doble|Mitad + • opciones centradas.
 * - medium+: pregunta + operación en vertical + hueco en blanco (sin opciones ni recuadros).
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function DobleYMitadRenderer({ ex, showAnswer }: DobleYMitadRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const hasBoxes =
    !ex.verticalOp &&
    ex.number !== undefined &&
    ex.operacion !== undefined &&
    ex.conocido !== undefined;
  const huecoEnResultado = ex.conocido === "original";
  const flecha = ex.operacion === "x2" ? "×2" : "÷2";
  const etiquetaResultado = ex.operacion === "x2" ? "Doble" : "Mitad";
  const choices = ex.choiceLabels ?? [];
  const choicesClass =
    choices.length >= 4
      ? "ficha-doble__choices ficha-doble__choices--spread"
      : "ficha-doble__choices ficha-doble__choices--center";
  const showVertical =
    Boolean(ex.verticalOp) && ex.number !== undefined && ex.operacion !== undefined;
  const opSymbol = workOp(ex);

  return (
    <div className={`ficha-doble${ex.verticalOp ? " ficha-doble--vertical" : ""}`}>
      <p className="ficha-doble__question">
        {questionWithNumbers(ex.question)}
        {choices.length > 0 ? (
          <span className="ficha-doble__hint"> (redondea la correcta)</span>
        ) : null}
      </p>
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
      {showVertical && opSymbol === "÷" ? (
        <div className="ficha-doble__casita" aria-label={`${ex.number} ÷ 2`}>
          <span className="ficha-doble__casita-dividend">{ex.number}</span>
          <span className="ficha-doble__casita-divisor">2</span>
          <span className="ficha-doble__casita-work" aria-hidden />
        </div>
      ) : null}
      {showVertical && opSymbol === "×" ? (
        <div className="ficha-doble__col" aria-label={`${ex.number} × 2`}>
          <span className="ficha-doble__col-num">{ex.number}</span>
          <span className="ficha-doble__col-op">
            × <span className="ficha-doble__col-factor">2</span>
          </span>
          <span className="ficha-doble__col-sep" />
        </div>
      ) : null}
      {choices.length > 0 && (
        <div className={choicesClass}>
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
