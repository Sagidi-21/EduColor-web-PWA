import type { MenuCafeteriaSheetExercise } from "../../types";

export interface MenuCafeteriaRendererProps {
  ex: MenuCafeteriaSheetExercise;
  showAnswer: boolean;
}

export function MenuCafeteriaRenderer({ ex, showAnswer }: MenuCafeteriaRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-menu">
        <p className="ficha-menu__question">{ex.question}</p>
        <div className="ficha-answer">{ex.answer ?? "?"}</div>
      </div>
    );
  }

  return (
    <div className="ficha-menu">
      <p className="ficha-menu__question">{ex.question}</p>
      <div className="ficha-menu__tray" aria-label="Bandeja">
        {ex.tray.map((item, i) => (
          <div key={i} className="ficha-menu__item">
            <span className="ficha-menu__emoji">{item.emoji}</span>
            <span className="ficha-menu__name">{item.name}</span>
            <span className="ficha-menu__price">{item.price}€</span>
          </div>
        ))}
      </div>
    </div>
  );
}
