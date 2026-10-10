import type { RutaCuadriculaSheetExercise } from "../../types";

export interface RutaCuadriculaRendererProps {
  ex: RutaCuadriculaSheetExercise;
  showAnswer: boolean;
}

const CELL = 34;
const PAD = 2;
const MIN_BOXES = 6;
const MAX_BOXES = 14;

function routeLength(answer: string | undefined): number {
  return answer ? answer.split(/\s+/).filter(Boolean).length : 0;
}

/** Cuadrícula SVG: inicio abajo-izquierda, meta arriba-derecha, árboles como obstáculos. */
function RutaGrid({ ex }: { ex: RutaCuadriculaSheetExercise }): JSX.Element {
  const { cols, rows } = ex.gridSize;
  const emoji = ex.showEmoji !== false;
  const width = cols * CELL + PAD * 2;
  const height = rows * CELL + PAD * 2;
  const isObstacle = (x: number, y: number) => ex.obstacles.some((o) => o.x === x && o.y === y);

  const cells: JSX.Element[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const isStart = x === ex.start.x && y === ex.start.y;
      const isEnd = x === ex.end.x && y === ex.end.y;
      const obstacle = isObstacle(x, y);
      const px = PAD + x * CELL;
      const py = PAD + y * CELL;
      const cx = px + CELL / 2;
      const cy = py + CELL / 2;
      cells.push(
        <g key={`${x}-${y}`}>
          <rect
            x={px}
            y={py}
            width={CELL}
            height={CELL}
            fill={isStart ? "#dcfce7" : isEnd ? "#fef9c3" : obstacle && !emoji ? "#cbd5e1" : "#fff"}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          {obstacle &&
            (emoji ? (
              <text x={cx} y={cy + 7} fontSize="20" textAnchor="middle">
                🌳
              </text>
            ) : (
              <g stroke="#475569" strokeWidth="2">
                <line x1={px + 8} y1={py + 8} x2={px + CELL - 8} y2={py + CELL - 8} />
                <line x1={px + CELL - 8} y1={py + 8} x2={px + 8} y2={py + CELL - 8} />
              </g>
            ))}
          {isStart &&
            (emoji ? (
              <text x={cx} y={cy + 7} fontSize="20" textAnchor="middle">
                🚶
              </text>
            ) : (
              <text
                x={cx}
                y={cy + 6}
                fontSize="17"
                fontWeight="800"
                textAnchor="middle"
                fill="#14532d"
              >
                S
              </text>
            ))}
          {isEnd &&
            !obstacle &&
            (emoji ? (
              <text x={cx} y={cy + 7} fontSize="20" textAnchor="middle">
                🏫
              </text>
            ) : (
              <text
                x={cx}
                y={cy + 6}
                fontSize="17"
                fontWeight="800"
                textAnchor="middle"
                fill="#713f12"
              >
                F
              </text>
            ))}
        </g>,
      );
    }
  }

  return (
    <svg
      className="ficha-ruta__svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Cuadrícula de ${cols} por ${rows}`}
    >
      {cells}
    </svg>
  );
}

/**
 * Alumno: cuadrícula dibujada (inicio, meta, obstáculos) + casillas para escribir
 * las flechas del camino. Soluciones: las maneja ExerciseRenderer (solo la ruta).
 */
export function RutaCuadriculaRenderer({
  ex,
  showAnswer,
}: RutaCuadriculaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const emoji = ex.showEmoji !== false;
  const boxes = Math.min(MAX_BOXES, Math.max(MIN_BOXES, routeLength(ex.answer) + 3));
  const legend = emoji ? "🚶 inicio · 🏫 meta · 🌳 obstáculo" : "S inicio · F meta · ✕ obstáculo";

  return (
    <div className="ficha-ruta">
      <p className="ficha-ruta__question">
        Escribe con flechas (↑ ↓ ← →) el camino hasta la meta sin pisar los obstáculos.
      </p>
      <RutaGrid ex={ex} />
      <p className="ficha-ruta__legend">{legend}</p>
      <div className="ficha-ruta__boxes" aria-label="Casillas para las flechas">
        {Array.from({ length: boxes }, (_, i) => (
          <span key={i} className="ficha-ruta__box" />
        ))}
      </div>
    </div>
  );
}
