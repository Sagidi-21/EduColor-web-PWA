import type { GraficoBarrasSheetExercise } from "../../types";

export interface GraficoBarrasRendererProps {
  ex: GraficoBarrasSheetExercise;
  showAnswer: boolean;
}

export function GraficoBarrasRenderer({ ex, showAnswer }: GraficoBarrasRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const max = Math.max(1, ex.escalaMax);
  const marcas = ex.marcas.length > 0 ? ex.marcas : Array.from({ length: max }, (_, i) => i + 1);
  const etiquetas = new Set(ex.etiquetasEje);
  const alturaMarca = (marca: number) => `${(marca / max) * 100}%`;
  const altoPx = Math.max(72, max * 7);

  return (
    <div className="ficha-bars" style={{ ["--ficha-bars-alto" as string]: `${altoPx}px` }}>
      <p className="ficha-bars__title">{ex.titulo}</p>
      <div className="ficha-bars__chart" aria-label={ex.titulo}>
        <div className="ficha-bars__axis" aria-hidden="true">
          {ex.etiquetasEje.map((marca) => (
            <span key={marca} className="ficha-bars__tick" style={{ bottom: alturaMarca(marca) }}>
              {marca}
            </span>
          ))}
        </div>

        <div className="ficha-bars__plot">
          <div className="ficha-bars__grid" aria-hidden="true">
            {marcas.map((marca) => (
              <div
                key={marca}
                className={`ficha-bars__hline${etiquetas.has(marca) ? " ficha-bars__hline--key" : ""}`}
                style={{ bottom: alturaMarca(marca) }}
              />
            ))}
          </div>

          {ex.bars.map((bar, i) => {
            const pct = (bar.valor / max) * 100;
            const blank = ex.blankBarIndex === i;
            return (
              <div key={i} className="ficha-bars__col">
                <div className="ficha-bars__zone">
                  {blank && <span className="ficha-bars__value">?</span>}
                  <div
                    className={`ficha-bars__fill${blank ? " ficha-bars__fill--blank" : ""}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <div className="ficha-bars__foot">
                  <span className="ficha-bars__emoji">{bar.emoji}</span>
                  <span className="ficha-bars__label">{bar.etiqueta}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="ficha-bars__question">{ex.question}</p>
    </div>
  );
}
