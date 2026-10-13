import type { ReactNode } from "react";
import type { Problemas2PasosSheetExercise } from "../../types";

export interface Problemas2PasosRendererProps {
  ex: Problemas2PasosSheetExercise;
  showAnswer: boolean;
}

function opSymbol(op: "+" | "-"): string {
  return op === "+" ? "+" : "−";
}

/** Resalta cifras del enunciado con el color de clase. */
function textWithKeyNumbers(text: string, highlight: boolean): ReactNode {
  if (!highlight) return text;
  const parts = text.split(/(\d+)/);
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="ficha-p2p__key-num">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Alumno: historia + tracker de pasos + pregunta + hueco para escribir.
 * Sin opciones en ningún nivel (el niño hace las operaciones a mano).
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
  const highlight = Boolean(ex.highlightKeyNumbers);
  const highlightSteps = Boolean(ex.highlightStepNumbers);
  const writeArea = Boolean(ex.showWriteArea);
  const letters = Boolean(ex.useStepLetters);
  const stepNum = (n: number) =>
    highlightSteps ? <span className="ficha-p2p__key-num">{n}</span> : n;
  const stepLetter = (ch: "A" | "B") => (
    <span className={`ficha-p2p__letter ficha-p2p__letter--${ch.toLowerCase()}`}>{ch}</span>
  );
  // Easy/medium/hard: A enlaza ambos pasos; B es el resultado final. Expert: ?.
  const midSlot = () => (letters ? stepLetter("A") : "?");
  const finalSlot = () => (letters ? stepLetter("B") : "?");

  return (
    <div className={`ficha-p2p${writeArea ? " ficha-p2p--write" : ""}`}>
      <div className="ficha-p2p__story">
        {ex.story.map((line, i) => (
          <p key={i} className="ficha-p2p__story-line">
            {textWithKeyNumbers(line, highlight)}
          </p>
        ))}
      </div>
      {steps && (
        <div className="ficha-p2p__steps">
          <div className="ficha-p2p__step">
            <span className="ficha-p2p__step-label">Paso 1</span>
            <span className="ficha-p2p__step-num">
              {stepNum(steps.a)} {opSymbol(steps.op1)} {stepNum(steps.b)} = {midSlot()}
            </span>
          </div>
          <span className="ficha-p2p__arrow" aria-hidden>
            →
          </span>
          <div className="ficha-p2p__step">
            <span className="ficha-p2p__step-label">Paso 2</span>
            <span className="ficha-p2p__step-num">
              {midSlot()} {opSymbol(steps.op2)} {stepNum(steps.c)} = {finalSlot()}
            </span>
          </div>
        </div>
      )}
      {writeArea ? (
        <div className="ficha-p2p__work" aria-label="Espacio para hacer las operaciones" />
      ) : null}
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
      {ex.question ? (
        <div className="ficha-p2p__final">
          <p className="ficha-p2p__question">{textWithKeyNumbers(ex.question, highlight)}</p>
          <span className="ficha-p2p__answer-line" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}
