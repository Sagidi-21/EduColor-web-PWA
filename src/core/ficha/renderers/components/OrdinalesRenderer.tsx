import type { OrdinalesSheetExercise } from "../../types";

export interface OrdinalesRendererProps {
  ex: OrdinalesSheetExercise;
  showAnswer: boolean;
}

const ORDINAL_LABELS = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"];

/**
 * Alumno:
 * - identify (easy / expert): enunciado arriba («Redondea la posición Xº») + serie (sin casilla ni marca).
 * - medium (position): serie + pregunta + casilla.
 * - hard / expert position|fromRight: casilla a la derecha; flecha → si aplica; dibujo marcado.
 */
export function OrdinalesRenderer({ ex, showAnswer }: OrdinalesRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const circleMode = ex.variant === "identify" || (!ex.variant && ex.difficulty === "easy");
  const wide = !circleMode && (ex.difficulty === "hard" || ex.difficulty === "expert");
  const showLabels = ex.count <= 7;

  const row =
    ex.emoji && ex.count > 0 ? (
      <div className="ficha-ordinales__row" aria-label="Fila de objetos">
        {Array.from({ length: ex.count }, (_, i) => {
          const pos = i + 1;
          const marked = !circleMode && pos === ex.target;
          return (
            <div
              key={i}
              className={`ficha-ordinales__item${marked ? " ficha-ordinales__item--marked" : ""}`}
            >
              <span className="ficha-ordinales__cell">{ex.emoji}</span>
              {showLabels && (
                <span className="ficha-ordinales__pos">{ORDINAL_LABELS[pos - 1] ?? `${pos}º`}</span>
              )}
            </div>
          );
        })}
      </div>
    ) : null;

  const question = <p className="ficha-ordinales__question">{ex.question}</p>;
  const showDirection = ex.fromRight || (circleMode && ex.difficulty === "expert");
  const direction = showDirection ? (
    <p className="ficha-ordinales__direction" aria-label="De izquierda a derecha">
      <span className="ficha-ordinales__arrow" aria-hidden>
        →
      </span>
      <span className="ficha-ordinales__hint">(de izquierda a derecha)</span>
    </p>
  ) : null;

  return (
    <div
      className={`ficha-ordinales${wide ? " ficha-ordinales--wide" : ""}${circleMode ? " ficha-ordinales--easy" : ""}`}
    >
      <div className="ficha-ordinales__main">
        {circleMode ? (
          <>
            {direction}
            {question}
            {row}
          </>
        ) : (
          <>
            {direction}
            {row}
            {question}
            {!wide && (
              <span className="ficha-ordinales__blank" aria-label="Espacio para la respuesta" />
            )}
          </>
        )}
      </div>
      {wide && <span className="ficha-ordinales__blank" aria-label="Espacio para la respuesta" />}
    </div>
  );
}
