import type { LineTypesSheetExercise } from "../../types";
import { QuestionRenderer } from "./QuestionRenderer";

export interface LineTypesRendererProps {
  ex: LineTypesSheetExercise;
  showAnswer: boolean;
}

export function LineTypesRenderer({ ex, showAnswer }: LineTypesRendererProps): JSX.Element {
  return (
    <div>
      <QuestionRenderer
        question={ex.question}
        answer={ex.answer}
        showAnswer={showAnswer}
        detail={ex.options.length ? `Opciones: ${ex.options.join(", ")}` : undefined}
      />
      {ex.svg && (
        <svg
          className="ficha-line-svg"
          viewBox="0 0 300 200"
          width="140"
          height="90"
          aria-hidden
          dangerouslySetInnerHTML={{ __html: ex.svg }}
        />
      )}
    </div>
  );
}
