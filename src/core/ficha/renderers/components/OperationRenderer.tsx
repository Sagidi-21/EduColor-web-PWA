import type { OperationSheetExercise } from "../../types";

export interface OperationRendererProps {
  ex: OperationSheetExercise;
  showAnswer: boolean;
}

export function OperationRenderer({ ex, showAnswer }: OperationRendererProps): JSX.Element {
  const op = ex.op === "+" ? "+" : "−";
  return (
    <div>
      <div className="ficha-vertical">
        {ex.a}
        {"\n"}
        {op}
        {ex.b}
        {"\n"}───
      </div>
      {showAnswer && ex.answer !== undefined && <div className="ficha-answer">{ex.answer}</div>}
    </div>
  );
}
