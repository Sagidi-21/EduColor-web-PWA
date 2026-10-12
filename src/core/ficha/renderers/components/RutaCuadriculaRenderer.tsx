import type { RutaCuadriculaSheetExercise } from "../../types";
import {
  cellsAlongRoute,
  exampleRouteLabel,
  shortestRouteArrows,
  shortestRouteDirections,
} from "../../generators/sceneHelpers";

export interface RutaCuadriculaRendererProps {
  ex: RutaCuadriculaSheetExercise;
  showAnswer: boolean;
}

const CELL = 34;
const PAD = 2;
const MIN_BOXES = 6;
const MAX_BOXES = 14;

/** Colores de casilla alineados con la pizarra (`RutaCuadriculaScreen.css`). */
const FILL_START = "#f1fcf0";
const FILL_END = "#fff5f5";
const FILL_PATH = "#dbeafe";
const FILL_EMPTY = "#fff";
const STROKE = "#64748b";

function routeLength(answer: string | undefined): number {
  return answer
    ? answer
        .replace(/^Ej\.:\s*/i, "")
        .split(/\s+/)
        .filter(Boolean).length
    : 0;
}

function RutaGrid({
  ex,
  pathKeys,
}: {
  ex: RutaCuadriculaSheetExercise;
  pathKeys?: Set<string>;
}): JSX.Element {
  const { cols, rows } = ex.gridSize;
  const width = cols * CELL + PAD * 2;
  const height = rows * CELL + PAD * 2;
  const isObstacle = (x: number, y: number) => ex.obstacles.some((o) => o.x === x && o.y === y);
  const onPath = (x: number, y: number) => pathKeys?.has(`${x},${y}`) ?? false;

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
      const fill = isStart ? FILL_START : isEnd ? FILL_END : onPath(x, y) ? FILL_PATH : FILL_EMPTY;
      cells.push(
        <g key={`${x}-${y}`}>
          <rect
            x={px}
            y={py}
            width={CELL}
            height={CELL}
            fill={fill}
            stroke={STROKE}
            strokeWidth="1.5"
          />
          {obstacle && (
            <text x={cx} y={cy + 7} fontSize="20" textAnchor="middle">
              🌳
            </text>
          )}
          {isStart && !obstacle && (
            <text x={cx} y={cy + 7} fontSize="20" textAnchor="middle">
              🚶
            </text>
          )}
          {isEnd && !obstacle && (
            <text x={cx} y={cy + 7} fontSize="20" textAnchor="middle">
              🏫
            </text>
          )}
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
 * Alumno: cuadrícula + casillas de flechas.
 * Soluciones (excepción): cuadrícula con un camino de ejemplo marcado + «Ej.: …».
 */
export function RutaCuadriculaRenderer({
  ex,
  showAnswer,
}: RutaCuadriculaRendererProps): JSX.Element {
  if (showAnswer) {
    const dirs = shortestRouteDirections(ex.gridSize, ex.start, ex.end, ex.obstacles);
    const arrows = shortestRouteArrows(ex.gridSize, ex.start, ex.end, ex.obstacles) || ex.answer;
    const pathKeys = new Set(cellsAlongRoute(ex.start, dirs).map((p) => `${p.x},${p.y}`));
    return (
      <div className="ficha-ruta ficha-ruta--sol">
        <RutaGrid ex={ex} pathKeys={pathKeys} />
        <div className="ficha-answer">{exampleRouteLabel(arrows ?? "")}</div>
      </div>
    );
  }

  const boxes = Math.min(MAX_BOXES, Math.max(MIN_BOXES, routeLength(ex.answer) + 3));

  return (
    <div className="ficha-ruta">
      <p className="ficha-ruta__question">
        Escribe con flechas (↑ ↓ ← →) el camino hasta la meta sin pisar los obstáculos.
      </p>
      <RutaGrid ex={ex} />
      <p className="ficha-ruta__legend">🚶 inicio · 🏫 meta · 🌳 obstáculo</p>
      <div className="ficha-ruta__boxes" aria-label="Casillas para las flechas">
        {Array.from({ length: boxes }, (_, i) => (
          <span key={i} className="ficha-ruta__box" />
        ))}
      </div>
    </div>
  );
}
