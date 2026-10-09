import type { RelojSheetExercise } from "../../types";
import { ClockSvg } from "./ClockSvg";
import { QuestionRenderer } from "./QuestionRenderer";

export interface RelojRendererProps {
  ex: RelojSheetExercise;
  showAnswer: boolean;
}

export function RelojRenderer({ ex, showAnswer }: RelojRendererProps): JSX.Element {
  return (
    <div className="ficha-reloj">
      <QuestionRenderer question={ex.question} answer={ex.answer} showAnswer={showAnswer} />
      <ClockSvg hours={ex.hours} minutes={ex.minutes} showHands={ex.showHands} size={84} />
    </div>
  );
}
