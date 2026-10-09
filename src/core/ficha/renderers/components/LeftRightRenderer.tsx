import type { LeftRightSheetExercise } from "../../types";
import { QuestionRenderer } from "./QuestionRenderer";

export interface LeftRightRendererProps {
  ex: LeftRightSheetExercise;
  showAnswer: boolean;
}

export function LeftRightRenderer({ ex, showAnswer }: LeftRightRendererProps): JSX.Element {
  return (
    <div className="ficha-leftright">
      <QuestionRenderer question={ex.question} answer={ex.answer} showAnswer={showAnswer} />
      <div className="ficha-leftright__pair">
        <div className="ficha-leftright__side">
          <span>Izq.</span>
          {ex.leftImgUrl ? (
            <img src={ex.leftImgUrl} alt={ex.leftObj} className="ficha-exercise__image" />
          ) : (
            <span>{ex.leftObj}</span>
          )}
        </div>
        <div className="ficha-leftright__side">
          <span>Der.</span>
          {ex.rightImgUrl ? (
            <img src={ex.rightImgUrl} alt={ex.rightObj} className="ficha-exercise__image" />
          ) : (
            <span>{ex.rightObj}</span>
          )}
        </div>
      </div>
    </div>
  );
}
