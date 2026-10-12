import type { ReactNode } from "react";
import type { ParImparSheetExercise } from "../../types";

export interface ParImparRendererProps {
  ex: ParImparSheetExercise;
  showAnswer: boolean;
}

/** Resalta PAR / IMPAR (y plurales) con el color de clase; solo en enunciados. */
function questionWithParityWords(question: string): ReactNode {
  const parts = question.split(/(\b(?:IMPARES|PARES|IMPAR|PAR)\b)/gi);
  return parts.map((part, i) =>
    /^(?:IMPARES|PARES|IMPAR|PAR)$/i.test(part) ? (
      <span key={i} className="ficha-parimpar__parity">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Alumno: enunciado → imágenes debajo → • opciones en horizontal centradas
 * (o casilla de escritura).
 */
export function ParImparRenderer({ ex, showAnswer }: ParImparRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{String(ex.answer ?? "?")}</div>;
  }

  const count = ex.emojiCount ?? ex.number;
  const showEmoji = Boolean(ex.emoji) && count > 0;
  const showImage = Boolean(ex.imageUrl);
  // `[]` = escritura (sin opciones). `undefined` = clasificar → Par/Impar por defecto.
  const choices =
    ex.choiceLabels !== undefined ? ex.choiceLabels : ex.writeIn ? [] : ["Par", "Impar"];
  const question = ex.question || `¿${ex.number} es par o impar?`;

  return (
    <div className="ficha-parimpar">
      <p className="ficha-parimpar__question">{questionWithParityWords(question)}</p>

      {showEmoji ? (
        <div className="ficha-parimpar__row" aria-label={`${count} objetos`}>
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className="ficha-parimpar__emoji">
              {ex.emoji}
            </span>
          ))}
        </div>
      ) : null}

      {showImage && !showEmoji ? (
        <div className="ficha-parimpar__media">
          <img src={ex.imageUrl} alt="" className="ficha-parimpar__img" />
        </div>
      ) : null}

      {ex.writeIn ? (
        <span className="ficha-parimpar__blank" aria-label="Espacio para la respuesta" />
      ) : choices.length > 0 ? (
        <div className="ficha-parimpar__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-parimpar__choice">
              <span className="ficha-parimpar__choice-mark" aria-hidden>
                •
              </span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="ficha-parimpar__write" aria-label="Espacio para escribir las respuestas">
          <span className="ficha-parimpar__write-line" />
        </div>
      )}
    </div>
  );
}
