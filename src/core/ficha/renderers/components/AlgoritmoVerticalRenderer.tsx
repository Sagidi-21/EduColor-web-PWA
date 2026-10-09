import type { AlgoritmoVerticalSheetExercise } from "../../types";

export interface AlgoritmoVerticalRendererProps {
  ex: AlgoritmoVerticalSheetExercise;
  showAnswer: boolean;
}

export function AlgoritmoVerticalRenderer({
  ex,
  showAnswer,
}: AlgoritmoVerticalRendererProps): JSX.Element {
  const op = ex.op === "-" ? "−" : "+";
  return (
    <div>
      <div className="ficha-vertical">
        {String(ex.a).padStart(3)}
        {"\n"}
        {op}
        {String(ex.b).padStart(2)}
        {"\n"}───
      </div>
      {showAnswer && ex.answer !== undefined && <div className="ficha-answer">{ex.answer}</div>}
    </div>
  );
}
