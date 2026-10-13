import type { ReactNode } from "react";
import type { MenuCafeteriaSheetExercise, MenuItemSheet } from "../../types";

export interface MenuCafeteriaRendererProps {
  ex: MenuCafeteriaSheetExercise;
  showAnswer: boolean;
}

function formatPrice(price: number): string {
  return `${price}€`;
}

/** Resalta importes `N€` del enunciado con el color de clase. */
function questionWithPrices(question: string, highlight: boolean): ReactNode {
  if (!highlight) return question;
  const parts = question.split(/(\d+€)/);
  return parts.map((part, i) =>
    /^\d+€$/.test(part) ? (
      <span key={i} className="ficha-menu__price-hl">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function selectedClass(highlight: MenuCafeteriaSheetExercise["selectedHighlight"]): string {
  if (highlight === "accent") return "ficha-menu__item ficha-menu__item--selected-accent";
  if (highlight === "black") return "ficha-menu__item ficha-menu__item--selected";
  return "ficha-menu__item";
}

/**
 * Alumno: carta de precios + enunciado + opciones •.
 * - easy: precios del enunciado y remarcado de pedido en color de clase.
 * - medium: precios del enunciado en color; remarcado negro; precios de carta negros.
 * - hard: precios del enunciado en color; carta sin remarcar; precios negros.
 * - expert: sin color especial ni remarcado.
 * Soluciones: ExerciseRenderer (solo la respuesta).
 */
export function MenuCafeteriaRenderer({ ex, showAnswer }: MenuCafeteriaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const hasMenu = Boolean(ex.menu && ex.menu.length > 0);
  const items: MenuItemSheet[] = hasMenu ? ex.menu! : ex.tray;
  const trayNames = new Set(ex.tray.map((t) => t.name));
  const choices = ex.choiceLabels ?? [];
  const canSelect = Boolean(ex.selectedHighlight);

  return (
    <div className="ficha-menu">
      <p className="ficha-menu__question">
        {questionWithPrices(ex.question, Boolean(ex.highlightQuestionPrices))}
        {choices.length > 0 && <span className="ficha-menu__hint"> (redondea la correcta)</span>}
      </p>
      <div className="ficha-menu__card" aria-label={hasMenu ? "Carta del menú" : "Bandeja"}>
        {hasMenu && <p className="ficha-menu__card-title">🍽️ Carta del menú</p>}
        <div className={hasMenu ? "ficha-menu__tray ficha-menu__tray--card" : "ficha-menu__tray"}>
          {items.map((item, i) => {
            const selected = canSelect && hasMenu && trayNames.has(item.name);
            return (
              <div
                key={`${item.name}-${i}`}
                className={selected ? selectedClass(ex.selectedHighlight) : "ficha-menu__item"}
              >
                <span className="ficha-menu__emoji">{item.emoji}</span>
                <span className="ficha-menu__name">{item.name}</span>
                <span className="ficha-menu__price">{formatPrice(item.price)}</span>
              </div>
            );
          })}
        </div>
      </div>
      {choices.length > 0 && (
        <div className="ficha-menu__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-menu__choice">
              <span className="ficha-menu__choice-mark" aria-hidden>
                •
              </span>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
