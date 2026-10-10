import type { RectaNumericaSheetExercise } from "../../types";

export interface RectaNumericaRendererProps {
  ex: RectaNumericaSheetExercise;
  showAnswer: boolean;
}

// Mismas proporciones que la pizarra (0..max sobre una recta con flecha), a escala de ficha.
const VIEW_W = 320;
const VIEW_H = 62;
const X0 = 12;
const X1 = 306;
const LINE_Y = 24;

/**
 * Recta numérica 0..max en SVG con marcas menores y mayores etiquetadas (`labelEvery`).
 * El alumno marca con un punto dónde va `target`; el número no se señala en la recta.
 * Soluciones: solo el número (lo maneja `ExerciseRenderer`).
 */
export function RectaNumericaRenderer({ ex, showAnswer }: RectaNumericaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? ex.target}</div>;
  }

  const max = Math.max(1, ex.max);
  const every = Math.max(1, ex.labelEvery);
  const xOf = (v: number) => X0 + (v / max) * (X1 - X0);

  const ticks: JSX.Element[] = [];
  for (let v = 0; v <= max; v++) {
    const major = v % every === 0 || v === max;
    const x = xOf(v);
    ticks.push(
      <line
        key={`t${v}`}
        x1={x}
        y1={LINE_Y}
        x2={x}
        y2={LINE_Y + (major ? 11 : 6)}
        stroke={major ? "#475569" : "#94a3b8"}
        strokeWidth={major ? 1.8 : 1}
      />,
    );
    if (major) {
      ticks.push(
        <text
          key={`l${v}`}
          x={x}
          y={LINE_Y + 26}
          fontSize={12}
          fontWeight="bold"
          fill="#334155"
          textAnchor="middle"
        >
          {v}
        </text>,
      );
    }
  }

  return (
    <div className="ficha-recta">
      <p className="ficha-recta__question">
        Marca el <span className="ficha-recta__target">{ex.target}</span> en la recta
      </p>
      <svg
        className="ficha-recta__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`Recta numérica del 0 al ${max}`}
      >
        <line
          x1={X0}
          y1={LINE_Y}
          x2={X1}
          y2={LINE_Y}
          stroke="#334155"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <polygon
          points={`${X1 + 6},${LINE_Y} ${X1 - 2},${LINE_Y - 4} ${X1 - 2},${LINE_Y + 4}`}
          fill="#334155"
        />
        {ticks}
      </svg>
    </div>
  );
}
