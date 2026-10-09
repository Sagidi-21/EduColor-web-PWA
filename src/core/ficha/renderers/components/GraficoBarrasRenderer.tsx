import type { GraficoBarrasSheetExercise } from "../../types";

export interface GraficoBarrasRendererProps {
  ex: GraficoBarrasSheetExercise;
  showAnswer: boolean;
}

export function GraficoBarrasRenderer({ ex, showAnswer }: GraficoBarrasRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-bars">
        <p className="ficha-bars__question">{ex.question}</p>
        <div className="ficha-answer">{ex.answer ?? "?"}</div>
      </div>
    );
  }

  const max = Math.max(1, ex.escalaMax);

  return (
    <div className="ficha-bars">
      <p className="ficha-bars__title">{ex.titulo}</p>
      <div className="ficha-bars__chart" aria-label={ex.titulo}>
        {ex.bars.map((bar, i) => {
          const pct = Math.max(4, Math.round((bar.valor / max) * 100));
          const blank = ex.blankBarIndex === i;
          return (
            <div key={i} className="ficha-bars__col">
              <span className="ficha-bars__value">{blank ? "?" : bar.valor}</span>
              <div className="ficha-bars__track">
                <div className="ficha-bars__fill" style={{ height: `${pct}%` }} />
              </div>
              <span className="ficha-bars__emoji">{bar.emoji}</span>
              <span className="ficha-bars__label">{bar.etiqueta}</span>
            </div>
          );
        })}
      </div>
      <p className="ficha-bars__question">{ex.question}</p>
    </div>
  );
}
