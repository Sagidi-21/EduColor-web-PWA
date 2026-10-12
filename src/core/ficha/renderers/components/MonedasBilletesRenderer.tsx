import type { MonedasBilletesSheetExercise, MonedasMoneySheetItem } from "../../types";

export interface MonedasBilletesRendererProps {
  ex: MonedasBilletesSheetExercise;
  showAnswer: boolean;
}

function MoneyRow({
  items,
  className,
}: {
  items: MonedasMoneySheetItem[];
  className?: string;
}): JSX.Element {
  return (
    <div className={className ?? "ficha-money__row"} aria-label="Dinero">
      {items.map((m, i) =>
        m.url ? (
          <img key={i} src={m.url} alt={m.label} className="ficha-money__img" />
        ) : (
          <span key={i} className="ficha-money__label">
            {m.label}
          </span>
        ),
      )}
    </div>
  );
}

/**
 * Alumno:
 * - identify (easy/medium): imagen centrada + • opciones + hint redondea.
 * - equivalence / change (hard): dinero + producto si aplica + • opciones.
 * - shopping (expert): monedas en 2 filas más separadas (rodear para pagar).
 * Soluciones: ExerciseRenderer (solo la respuesta).
 */
export function MonedasBilletesRenderer({
  ex,
  showAnswer,
}: MonedasBilletesRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  const shopping = ex.type === "shopping";
  const identify = ex.type === "identify";
  const mid = shopping ? Math.ceil(ex.money.length / 2) : 0;
  const moneyTop = shopping ? ex.money.slice(0, mid) : ex.money;
  const moneyBottom = shopping ? ex.money.slice(mid) : [];

  return (
    <div
      className={`ficha-money ficha-money--${ex.type}${identify ? " ficha-money--centered" : ""}`}
    >
      <p className="ficha-money__question">
        {ex.question}
        {choices.length > 0 ? (
          <>
            {" "}
            <span className="ficha-money__hint">(redondea la correcta)</span>
          </>
        ) : shopping ? (
          <>
            {" "}
            <span className="ficha-money__hint">(redondea las que uses)</span>
          </>
        ) : null}
      </p>

      {(ex.productEmoji || ex.productName) && (
        <p className="ficha-money__product">
          {ex.productEmoji} {ex.productName}
          {ex.productPriceLabel ? ` — ${ex.productPriceLabel}` : ""}
        </p>
      )}

      {ex.money.length > 0 &&
        (shopping ? (
          <div className="ficha-money__grid" aria-label="Dinero disponible">
            <MoneyRow items={moneyTop} className="ficha-money__row ficha-money__row--shop" />
            {moneyBottom.length > 0 ? (
              <MoneyRow items={moneyBottom} className="ficha-money__row ficha-money__row--shop" />
            ) : null}
          </div>
        ) : (
          <MoneyRow items={ex.money} />
        ))}

      {choices.length > 0 ? (
        <div className="ficha-money__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-money__choice">
              <span className="ficha-money__choice-mark" aria-hidden>
                •
              </span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
