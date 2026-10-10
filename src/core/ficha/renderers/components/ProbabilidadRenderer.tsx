import type { ProbabilidadBallSheet, ProbabilidadSheetExercise } from "../../types";

export interface ProbabilidadRendererProps {
  ex: ProbabilidadSheetExercise;
  showAnswer: boolean;
}

const BALL_COLORS: Record<string, string> = {
  roja: "#ef4444",
  azul: "#3b82f6",
  verde: "#22c55e",
  amarilla: "#eab308",
  blanca: "#f1f5f9",
  negra: "#334155",
};

/** Inicial en la bola: la ficha también se imprime en blanco y negro. */
const BALL_INITIAL: Record<string, string> = {
  roja: "R",
  azul: "Az",
  verde: "V",
  amarilla: "Am",
  blanca: "B",
  negra: "N",
};

const BALL_RADIUS = 14;
const COLUMNS = 3;

function ballPositions(total: number): { x: number; y: number }[] {
  const cols = Math.min(COLUMNS, Math.max(total, 1));
  return Array.from({ length: total }, (_, i) => {
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS);
    return { x: 100 + (col - (cols - 1) / 2) * 34, y: 70 + row * 30 };
  });
}

/** Bolsa de tela con las pelotas de colores (SVG imprimible). */
function BagSvg({ balls }: { balls: ProbabilidadBallSheet[] }): JSX.Element {
  const flat = balls.flatMap(({ color, count }) => Array.from({ length: count }, () => color));
  const positions = ballPositions(flat.length);
  const rows = Math.ceil(flat.length / COLUMNS);
  // La bolsa crece si hay más de dos filas de pelotas.
  const extra = Math.max(0, rows - 2) * 30;
  const bottom = 124 + extra;

  return (
    <svg
      className="ficha-prob__bag-svg"
      viewBox={`0 0 200 ${bottom + 8}`}
      role="img"
      aria-label={`Bolsa con ${flat.length} pelotas`}
    >
      <path
        d={`M72 30 Q100 8 128 30 L150 42 Q186 72 176 ${bottom - 18} Q166 ${bottom} 100 ${bottom} Q34 ${bottom} 24 ${bottom - 18} Q14 72 50 42 Z`}
        fill="#f5e6c8"
        stroke="#92400e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="82" y="26" width="36" height="9" rx="3" fill="#92400e" />
      {flat.map((color, i) => {
        const p = positions[i]!;
        const fill = BALL_COLORS[color] ?? "#94a3b8";
        const dark = color === "negra" || color === "azul" || color === "roja" || color === "verde";
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={BALL_RADIUS} fill={fill} stroke="#111" strokeWidth="1.5" />
            <text
              x={p.x}
              y={p.y + 4}
              fontSize="11"
              fontWeight="800"
              textAnchor="middle"
              fill={dark ? "#fff" : "#111"}
            >
              {BALL_INITIAL[color] ?? color.charAt(0).toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Alumno: suceso (clasificar) o bolsa dibujada con pelotas + pregunta + • Seguro/Posible/Imposible.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function ProbabilidadRenderer({ ex, showAnswer }: ProbabilidadRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const isBag = ex.variant === "bag" && Boolean(ex.balls && ex.balls.length > 0);
  const choices =
    ex.choiceLabels && ex.choiceLabels.length > 0
      ? ex.choiceLabels
      : ["Seguro", "Posible", "Imposible"];

  return (
    <div className="ficha-prob">
      {isBag ? (
        <BagSvg balls={ex.balls!} />
      ) : ex.context ? (
        <p className="ficha-prob__context">{ex.context}</p>
      ) : null}
      <p className="ficha-prob__question">{ex.question}</p>
      <div className="ficha-prob__choices">
        {choices.map((label, i) => (
          <span key={`${label}-${i}`} className="ficha-prob__choice">
            <span className="ficha-prob__choice-mark" aria-hidden>
              •
            </span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
