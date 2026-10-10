import type { MenuCafeteriaSheetExercise, MenuItemSheet } from "../../types";

export interface MenuCafeteriaRendererProps {
  ex: MenuCafeteriaSheetExercise;
  showAnswer: boolean;
}

function formatPrice(price: number): string {
  return `${price}€`;
}

/**
 * Alumno: carta completa de precios (como «Carta del menú» en pizarra, con los platos
 * del pedido resaltados) + enunciado + opciones •.
 * Si el motor no trae la carta (datos antiguos), se dibuja la bandeja.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function MenuCafeteriaRenderer({ ex, showAnswer }: MenuCafeteriaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const hasMenu = Boolean(ex.menu && ex.menu.length > 0);
  const items: MenuItemSheet[] = hasMenu ? ex.menu! : ex.tray;
  const trayNames = new Set(ex.tray.map((t) => t.name));
  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-menu">
      <p className="ficha-menu__question">{ex.question}</p>
      <div className="ficha-menu__card" aria-label={hasMenu ? "Carta del menú" : "Bandeja"}>
        {hasMenu && <p className="ficha-menu__card-title">🍽️ Carta del menú</p>}
        <div className={hasMenu ? "ficha-menu__tray ficha-menu__tray--card" : "ficha-menu__tray"}>
          {items.map((item, i) => {
            const selected = hasMenu && trayNames.has(item.name);
            return (
              <div
                key={`${item.name}-${i}`}
                className={
                  selected ? "ficha-menu__item ficha-menu__item--selected" : "ficha-menu__item"
                }
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
