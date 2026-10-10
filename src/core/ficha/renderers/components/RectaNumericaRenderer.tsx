import type { RectaNumericaSheetExercise } from "../../types";

export interface RectaNumericaRendererProps {
  ex: RectaNumericaSheetExercise;
  showAnswer: boolean;
}

/** hard (max 50) / expert (max 100): una por fila, recta más ancha. */
function isWideRectaNumerica(ex: RectaNumericaSheetExercise): boolean {
  return ex.max >= 50;
}

type LineLayout = {
  viewW: number;
  viewH: number;
  x0: number;
  x1: number;
  lineY: number;
  labelSize: number;
};

function layoutFor(wide: boolean): LineLayout {
  if (wide) {
    return { viewW: 560, viewH: 78, x0: 16, x1: 536, lineY: 30, labelSize: 14 };
  }
  return { viewW: 320, viewH: 62, x0: 12, x1: 306, lineY: 24, labelSize: 12 };
}

/**
 * Recta numérica 0..max en SVG.
 * Alumno: enunciado + recta sin marcar el target.
 * Soluciones: misma recta con línea vertical en la respuesta (sin enunciado).
 */
export function RectaNumericaRenderer({ ex, showAnswer }: RectaNumericaRendererProps): JSX.Element {
  const wide = isWideRectaNumerica(ex);
  const L = layoutFor(wide);
  const max = Math.max(1, ex.max);
  const every = Math.max(1, ex.labelEvery);
  const target = ex.answer ?? ex.target;
  const xOf = (v: number) => L.x0 + (v / max) * (L.x1 - L.x0);

  const ticks: JSX.Element[] = [];
  for (let v = 0; v <= max; v++) {
    const major = v % every === 0 || v === max;
    const x = xOf(v);
    ticks.push(
      <line
        key={`t${v}`}
        x1={x}
        y1={L.lineY}
        x2={x}
        y2={L.lineY + (major ? 12 : 6)}
        stroke={major ? "#475569" : "#94a3b8"}
        strokeWidth={major ? 1.8 : 1}
      />,
    );
    if (major) {
      ticks.push(
        <text
          key={`l${v}`}
          x={x}
          y={L.lineY + 28}
          fontSize={L.labelSize}
          fontWeight="bold"
          fill="#334155"
          textAnchor="middle"
        >
          {v}
        </text>,
      );
    }
  }

  const markX = xOf(Math.max(0, Math.min(max, target)));

  return (
    <div className={`ficha-recta${wide ? " ficha-recta--wide" : ""}`}>
      {!showAnswer && (
        <p className="ficha-recta__question">
          Marca el <span className="ficha-recta__target">{ex.target}</span> en la recta
        </p>
      )}
      <svg
        className="ficha-recta__svg"
        viewBox={`0 0 ${L.viewW} ${L.viewH}`}
        role="img"
        aria-label={
          showAnswer ? `Recta numérica: respuesta ${target}` : `Recta numérica del 0 al ${max}`
        }
      >
        <line
          x1={L.x0}
          y1={L.lineY}
          x2={L.x1}
          y2={L.lineY}
          stroke="#334155"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {ticks}
        {showAnswer && (
          <line
            className="ficha-recta__answer-mark"
            x1={markX}
            y1={L.lineY - 14}
            x2={markX}
            y2={L.lineY + 14}
            stroke="#dc2626"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}
