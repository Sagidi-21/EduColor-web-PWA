import type { Problemas2PasosSheetExercise } from "../../types";

export interface Problemas2PasosRendererProps {
  ex: Problemas2PasosSheetExercise;
  showAnswer: boolean;
}

function opSymbol(op: "+" | "-"): string {
  return op === "+" ? "+" : "−";
}

/**
 * Alumno: historia + tracker de pasos con huecos (como en pizarra) + pregunta + opciones •.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function Problemas2PasosRenderer({
  ex,
  showAnswer,
}: Problemas2PasosRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  const steps = ex.steps;

  return (
    <div className="ficha-p2p">
      <div className="ficha-p2p__story">
        {ex.story.map((line, i) => (
          <p key={i} className="ficha-p2p__story-line">
            {line}
          </p>
        ))}
      </div>
      {steps && (
        <div className="ficha-p2p__steps">
          <div className="ficha-p2p__step">
            <span className="ficha-p2p__step-label">Paso 1</span>
            <span className="ficha-p2p__step-num">
              {steps.a} {opSymbol(steps.op1)} {steps.b} = ?
            </span>
          </div>
          <span className="ficha-p2p__arrow" aria-hidden>
            →
          </span>
          <div className="ficha-p2p__step">
            <span className="ficha-p2p__step-label">Paso 2</span>
            <span className="ficha-p2p__step-num">
              ? {opSymbol(steps.op2)} {steps.c} = ?
            </span>
          </div>
        </div>
      )}
      {ex.question ? <p className="ficha-p2p__question">{ex.question}</p> : null}
      {choices.length > 0 && (
        <div className="ficha-p2p__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-p2p__choice">
              <span className="ficha-p2p__choice-mark" aria-hidden>
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
