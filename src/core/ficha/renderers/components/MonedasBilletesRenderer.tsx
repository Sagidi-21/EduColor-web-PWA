import type { MonedasBilletesSheetExercise } from "../../types";

export interface MonedasBilletesRendererProps {
  ex: MonedasBilletesSheetExercise;
  showAnswer: boolean;
}

export function MonedasBilletesRenderer({
  ex,
  showAnswer,
}: MonedasBilletesRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-money">
        <p className="ficha-money__question">{ex.question}</p>
        <div className="ficha-answer">{ex.answer ?? "?"}</div>
      </div>
    );
  }

  return (
    <div className="ficha-money">
      <p className="ficha-money__question">{ex.question}</p>
      {(ex.productEmoji || ex.productName) && (
        <p className="ficha-money__product">
          {ex.productEmoji} {ex.productName}
          {ex.productPriceLabel ? ` — ${ex.productPriceLabel}` : ""}
        </p>
      )}
      {ex.money.length > 0 && (
        <div className="ficha-money__row" aria-label="Dinero">
          {ex.money.map((m, i) =>
            m.url ? (
              <img key={i} src={m.url} alt={m.label} className="ficha-money__img" />
            ) : (
              <span key={i} className="ficha-money__label">
                {m.label}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
