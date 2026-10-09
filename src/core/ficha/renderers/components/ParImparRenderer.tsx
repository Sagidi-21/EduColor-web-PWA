import type { ParImparSheetExercise } from "../../types";

export interface ParImparRendererProps {
  ex: ParImparSheetExercise;
  showAnswer: boolean;
}

export function ParImparRenderer({ ex, showAnswer }: ParImparRendererProps): JSX.Element {
  const count = ex.emojiCount ?? ex.number;
  const showEmoji = !showAnswer && Boolean(ex.emoji) && count > 0;

  return (
    <div className="ficha-parimpar">
      {showEmoji && (
        <div className="ficha-parimpar__row" aria-label={`${count} objetos`}>
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className="ficha-parimpar__emoji">
              {ex.emoji}
            </span>
          ))}
        </div>
      )}
      <p className="ficha-parimpar__question">{ex.question || `¿${ex.number} es par o impar?`}</p>
      {showAnswer && ex.answer !== undefined && (
        <div className="ficha-answer">{String(ex.answer)}</div>
      )}
    </div>
  );
}
