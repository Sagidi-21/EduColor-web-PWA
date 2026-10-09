import type { TresSumandosSheetExercise } from "../../types";

export interface TresSumandosRendererProps {
  ex: TresSumandosSheetExercise;
  showAnswer: boolean;
}

export function TresSumandosRenderer({ ex, showAnswer }: TresSumandosRendererProps): JSX.Element {
  return (
    <div>
      <div className="ficha-vertical">
        {ex.a}
        {"\n"}+{ex.b}
        {"\n"}+{ex.c}
        {"\n"}───
      </div>
      {showAnswer && ex.answer !== undefined && <div className="ficha-answer">{ex.answer}</div>}
    </div>
  );
}
