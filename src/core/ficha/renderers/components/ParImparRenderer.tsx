import type { ParImparSheetExercise } from "../../types";

export interface ParImparRendererProps {
  ex: ParImparSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: fila de emojis (si hay) + pregunta + • opciones o casilla de escritura.
 */
export function ParImparRenderer({ ex, showAnswer }: ParImparRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{String(ex.answer ?? "?")}</div>;
  }

  const count = ex.emojiCount ?? ex.number;
  const showEmoji = Boolean(ex.emoji) && count > 0;
  const choices =
    ex.choiceLabels && ex.choiceLabels.length > 0
      ? ex.choiceLabels
      : ex.writeIn
        ? []
        : ["Par", "Impar"];

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
      {ex.writeIn ? (
        <span className="ficha-parimpar__blank" aria-label="Espacio para la respuesta" />
      ) : (
        <div className="ficha-parimpar__choices">
          {choices.map((label, i) => (
            <div key={`${label}-${i}`} className="ficha-parimpar__choice">
              <span className="ficha-parimpar__choice-mark" aria-hidden>
                •
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
