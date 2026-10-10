import type {
  Numeracion1119SheetExercise,
  Numeracion4059SheetExercise,
  Numeracion6099SheetExercise,
} from "../../types";
import { TensBlocksSvg } from "./TensBlocksSvg";

export type NumeracionSheetExercise =
  Numeracion1119SheetExercise | Numeracion4059SheetExercise | Numeracion6099SheetExercise;

export interface NumeracionRendererProps {
  ex: NumeracionSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno:
 * - MC: enunciado arriba; imagen + opciones a la derecha (11–19 sin ○).
 * - 11–19 medium+: imagen y enunciado debajo (sin casillas).
 * - Resto sin MC: casillas discontinuas si `showAnswerBoxes !== false`.
 */
export function NumeracionRenderer({ ex, showAnswer }: NumeracionRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  const digits = Math.max(1, String(ex.answer ?? "00").length);
  const showChoiceMarks = ex.kind !== "numeracion1119";
  const hasChoices = choices.length > 0;
  const questionBelow = Boolean(ex.questionBelowImage);
  const showBoxes = !hasChoices && ex.showAnswerBoxes !== false;

  const questionEl = <p className="ficha-numeracion__question">{ex.question}</p>;
  const blocksEl = ex.showBlocks ? (
    <div className="ficha-numeracion__blocks">
      <TensBlocksSvg number={ex.number} />
    </div>
  ) : null;

  if (hasChoices) {
    return (
      <div className={`ficha-numeracion ficha-numeracion--${ex.kind}`}>
        {questionEl}
        <div className="ficha-numeracion__body">
          {blocksEl}
          <div className="ficha-numeracion__choices">
            {choices.map((label, i) => (
              <span key={`${label}-${i}`} className="ficha-numeracion__choice">
                {showChoiceMarks && (
                  <span className="ficha-numeracion__choice-mark" aria-hidden>
                    ○
                  </span>
                )}
                <span>{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ficha-numeracion ficha-numeracion--${ex.kind}${
        questionBelow ? " ficha-numeracion--prompt-below" : ""
      }`}
    >
      {questionBelow ? (
        <>
          {blocksEl}
          {questionEl}
        </>
      ) : (
        <>
          {questionEl}
          {blocksEl}
        </>
      )}
      {showBoxes && (
        <div className="ficha-numeracion__boxes" aria-label="Espacio para la respuesta">
          {Array.from({ length: digits }, (_, i) => (
            <span key={i} className="ficha-numeracion__box" />
          ))}
        </div>
      )}
    </div>
  );
}
