import type { CintaMetricaSheetExercise } from "../../types";

export interface CintaMetricaRendererProps {
  ex: CintaMetricaSheetExercise;
  showAnswer: boolean;
}

export function CintaMetricaRenderer({ ex, showAnswer }: CintaMetricaRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-cinta">
        <p className="ficha-cinta__question">{ex.question}</p>
        <div className="ficha-answer">{ex.answer ?? "?"}</div>
      </div>
    );
  }

  return (
    <div className="ficha-cinta">
      <div className="ficha-cinta__object">
        <span className="ficha-cinta__emoji">{ex.emoji}</span>
        <span className="ficha-cinta__name">{ex.itemName}</span>
      </div>
      <div className="ficha-cinta__tape" aria-hidden="true" />
      <p className="ficha-cinta__question">{ex.question}</p>
    </div>
  );
}
