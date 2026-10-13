import type { ReactNode } from "react";
import type { InventarProblemaSheetExercise } from "../../types";

export interface InventarProblemaRendererProps {
  ex: InventarProblemaSheetExercise;
  showAnswer: boolean;
}

/** Resalta MÁS BARATO / MÁS CARO con color de clase. */
function questionWithCompare(question: string, highlight: boolean): ReactNode {
  if (!highlight) return question;
  const parts = question.split(/(MÁS BARATO|MÁS CARO)/);
  return parts.map((part, i) =>
    part === "MÁS BARATO" || part === "MÁS CARO" ? (
      <span key={i} className="ficha-inventar__compare">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Resalta importes `N€` del enunciado (hard) con color de clase. */
function questionWithPrices(question: string, highlight: boolean): ReactNode {
  if (!highlight) return question;
  const parts = question.split(/(\d+€)/);
  return parts.map((part, i) =>
    /^\d+€$/.test(part) ? (
      <span key={i} className="ficha-inventar__price-hl">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function renderQuestion(ex: InventarProblemaSheetExercise): ReactNode {
  if (ex.highlightCompare) return questionWithCompare(ex.question, true);
  if (ex.highlightQuestionPrices) return questionWithPrices(ex.question, true);
  return ex.question;
}

/**
 * Alumno:
 * - easy: MÁS BARATO/CARO en color de clase; letras A/B + hint «redondea la letra correcta».
 * - medium/hard: precios de iconos en color de clase; hard también en enunciado.
 * - medium/hard/expert: iconos a la izquierda + hueco para la operación.
 * - expert: sin resaltados de ayuda.
 * Soluciones: ExerciseRenderer (solo la respuesta).
 */
export function InventarProblemaRenderer({
  ex,
  showAnswer,
}: InventarProblemaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const priceClass = ex.highlightItemPrices
    ? "ficha-inventar__price ficha-inventar__price--accent"
    : "ficha-inventar__price";
  const workSpace = Boolean(ex.leaveWorkSpace);
  const showLetters = Boolean(ex.showItemLetters);

  return (
    <div className={`ficha-inventar${workSpace ? " ficha-inventar--workspace" : ""}`}>
      <p className="ficha-inventar__question">
        {renderQuestion(ex)}
        {showLetters ? (
          <span className="ficha-inventar__hint"> (redondea la letra correcta)</span>
        ) : null}
      </p>
      {ex.budget !== undefined ? (
        <p className="ficha-inventar__budget">
          💰 Presupuesto:{" "}
          {ex.highlightQuestionPrices ? (
            <span className="ficha-inventar__price-hl">{ex.budget}€</span>
          ) : (
            `${ex.budget}€`
          )}
        </p>
      ) : null}
      <div className="ficha-inventar__items">
        {ex.items.map((item, i) => (
          <div key={i} className="ficha-inventar__card">
            {showLetters ? (
              <span className="ficha-inventar__letter" aria-hidden="true">
                {String.fromCharCode(65 + i)}
              </span>
            ) : null}
            <span className="ficha-inventar__emoji">{item.emoji}</span>
            <span className="ficha-inventar__name">{item.name}</span>
            <span className={priceClass}>{item.price}€</span>
          </div>
        ))}
      </div>
    </div>
  );
}
