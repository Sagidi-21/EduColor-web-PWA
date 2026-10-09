import type { OperationSheetExercise } from "../../types";
import { ObjectImageRow } from "./ObjectImageRow";

export interface OperationRendererProps {
  ex: OperationSheetExercise;
  showAnswer: boolean;
}

export function OperationRenderer({ ex, showAnswer }: OperationRendererProps): JSX.Element {
  const op = ex.op === "+" ? "+" : "−";
  const showImages = !showAnswer && Boolean(ex.imageUrl);

  return (
    <div className="ficha-operation">
      {showImages && (
        <div className="ficha-operation__images">
          {ex.op === "+" ? (
            <>
              <ObjectImageRow count={ex.a} imageUrl={ex.imageUrl} />
              <ObjectImageRow count={ex.b} imageUrl={ex.imageUrl} />
            </>
          ) : (
            <ObjectImageRow
              count={ex.a}
              imageUrl={ex.imageUrl}
              crossedFrom={Math.max(0, ex.a - ex.b)}
            />
          )}
        </div>
      )}
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
