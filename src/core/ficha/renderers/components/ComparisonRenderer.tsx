import type { ComparisonSheetExercise } from "../../types";

export interface ComparisonRendererProps {
  ex: ComparisonSheetExercise;
  showAnswer: boolean;
}

export function ComparisonRenderer({ ex, showAnswer }: ComparisonRendererProps): JSX.Element {
  const q = ex.questionType === "mas" ? "¿Dónde hay más?" : "¿Dónde hay menos?";
  return (
    <div>
      <p style={{ margin: 0 }}>{q}</p>
      <p style={{ margin: "4px 0 0" }}>
        A: {ex.countA} {ex.objectLabel} · B: {ex.countB} {ex.objectLabel}
      </p>
      {showAnswer && ex.answer && <div className="ficha-answer">Grupo {ex.answer}</div>}
    </div>
  );
}
