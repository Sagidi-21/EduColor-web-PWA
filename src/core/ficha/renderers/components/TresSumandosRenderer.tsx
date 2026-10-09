import type { TresSumandosSheetExercise } from "../../types";
import { ObjectImageRow } from "./ObjectImageRow";

export interface TresSumandosRendererProps {
  ex: TresSumandosSheetExercise;
  showAnswer: boolean;
}

export function TresSumandosRenderer({ ex, showAnswer }: TresSumandosRendererProps): JSX.Element {
  const showImages = !showAnswer && Boolean(ex.imageUrl);

  return (
    <div className="ficha-operation">
      {showImages && (
        <div className="ficha-operation__images">
          <ObjectImageRow count={ex.a} imageUrl={ex.imageUrl} />
          <ObjectImageRow count={ex.b} imageUrl={ex.imageUrl} />
          <ObjectImageRow count={ex.c} imageUrl={ex.imageUrl} />
        </div>
      )}
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
