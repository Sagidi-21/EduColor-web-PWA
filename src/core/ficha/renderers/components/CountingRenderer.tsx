import type { CountingSheetExercise } from "../../types";

export interface CountingRendererProps {
  ex: CountingSheetExercise;
  showAnswer: boolean;
}

export function CountingRenderer({ ex, showAnswer }: CountingRendererProps): JSX.Element {
  return (
    <div>
      <p style={{ margin: 0, fontWeight: 600 }}>
        {ex.objectLabel} {ex.count}
      </p>
      {ex.imageUrl && (
        <img src={ex.imageUrl} alt={ex.objectLabel} className="ficha-exercise__image" />
      )}
      {showAnswer && <div className="ficha-answer">{ex.answer ?? ex.count}</div>}
    </div>
  );
}
