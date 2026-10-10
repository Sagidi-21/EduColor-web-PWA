import type { MultiplicacionSheetExercise } from "../../types";

export interface MultiplicacionRendererProps {
  ex: MultiplicacionSheetExercise;
  showAnswer: boolean;
}

/**
 * Multiplicación en papel = unir columnas (como `relacionar` y la pizarra easy/medium):
 * operaciones `2 × 7` a la izquierda, productos a la derecha y puntos para trazar la línea.
 * Reutiliza las clases base de `ficha-relacionar` (puntos, badges, tablero) y añade
 * `ficha-mult` solo para los ajustes de esta actividad.
 */
export function MultiplicacionRenderer({
  ex,
  showAnswer,
}: MultiplicacionRendererProps): JSX.Element {
  // Soluciones: solo las parejas correctas (sin enunciado ni columnas).
  if (showAnswer) {
    return (
      <div className="ficha-answer ficha-relacionar__answers">{(ex.answer ?? []).join(" · ")}</div>
    );
  }

  return (
    <div className="ficha-relacionar ficha-mult">
      <p className="ficha-relacionar__instruction">Une cada multiplicación con su resultado</p>

      <div className="ficha-relacionar__board">
        <div className="ficha-relacionar__left" aria-label="Multiplicaciones">
          {ex.left.map((item) => (
            <div key={item.id} className="ficha-relacionar__num">
              <span className="ficha-relacionar__num-value ficha-mult__op">
                {item.table} × {item.factor}
              </span>
              <span className="ficha-relacionar__dot" aria-hidden="true" />
            </div>
          ))}
        </div>

        <div className="ficha-relacionar__gap" aria-hidden="true" />

        <div className="ficha-relacionar__right" aria-label="Resultados">
          {ex.right.map((item) => (
            <div key={item.id} className="ficha-relacionar__group">
              <span className="ficha-relacionar__dot" aria-hidden="true" />
              <span className="ficha-relacionar__num-value ficha-mult__product">
                {item.product}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
