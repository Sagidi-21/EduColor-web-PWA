import type { LaberintoSheetExercise } from "../../types";

export interface LaberintoRendererProps {
  ex: LaberintoSheetExercise;
  showAnswer: boolean;
}

// Topología fija del motor (8 nodos): misma que `LaberintoMatematicoScreen`.
//   S → A → B → C (FIN A)
//       ↓   ↓
//       D   E
//       ↓   ↓
//       F   G → H (FIN C)
//    (FIN B)
const COLS = [100, 250, 400, 550] as const;
const ROWS = [70, 190, 310] as const;
/** Casillas más grandes para escribir a mano. */
const HALF_W = 44;
const HALF_H = 26;

const NODE_GRID: Record<string, [number, number]> = {
  S: [0, 0],
  A: [1, 0],
  B: [2, 0],
  C: [3, 0],
  D: [1, 1],
  E: [2, 1],
  F: [1, 2],
  G: [2, 2],
  H: [3, 2],
};

const FILLABLE = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const FIN_LABEL: Record<string, string> = { C: "FIN A", F: "FIN B", H: "FIN C" };

function nodePos(id: string): { x: number; y: number } {
  const cell = NODE_GRID[id] ?? [0, 0];
  return { x: COLS[cell[0]]!, y: ROWS[cell[1]]! };
}

function EdgeArrow({ edge }: { edge: LaberintoSheetExercise["edges"][number] }): JSX.Element {
  const a = nodePos(edge.from);
  const b = nodePos(edge.to);
  const horizontal = a.y === b.y;
  const x1 = horizontal ? a.x + HALF_W : a.x;
  const y1 = horizontal ? a.y : a.y + HALF_H;
  const x2 = horizontal ? b.x - HALF_W : b.x;
  const y2 = horizontal ? b.y : b.y - HALF_H;
  const head = horizontal
    ? `${x2},${y2} ${x2 - 10},${y2 - 6} ${x2 - 10},${y2 + 6}`
    : `${x2},${y2} ${x2 - 6},${y2 - 10} ${x2 + 6},${y2 - 10}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const symbol = edge.op === "-" ? "−" : "+";
  return (
    <g className="ficha-laberinto__edge">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2.5" />
      <polygon points={head} />
      <circle cx={mx} cy={my} r="18" strokeWidth="2" />
      <text x={mx} y={my + 5} fontSize="14" fontWeight="800" textAnchor="middle">
        {symbol}
        {edge.value}
      </text>
    </g>
  );
}

/** Tablero del laberinto en SVG. En soluciones rellena cada casilla con su número. */
function LaberintoBoard({
  ex,
  showAnswer,
}: {
  ex: LaberintoSheetExercise;
  showAnswer: boolean;
}): JSX.Element {
  const start = nodePos("S");
  return (
    <svg
      className="ficha-laberinto__svg"
      viewBox="0 0 660 380"
      role="img"
      aria-label={showAnswer ? "Laberinto matemático con soluciones" : "Laberinto matemático"}
    >
      {ex.edges.map((edge, i) => (
        <EdgeArrow key={`${edge.from}-${edge.to}-${i}`} edge={edge} />
      ))}

      <text
        className="ficha-laberinto__label"
        x={start.x}
        y={start.y - 34}
        fontSize="13"
        fontWeight="700"
        textAnchor="middle"
      >
        INICIO
      </text>
      <rect
        className="ficha-laberinto__node ficha-laberinto__node--start"
        x={start.x - HALF_W}
        y={start.y - HALF_H}
        width={HALF_W * 2}
        height={HALF_H * 2}
        rx="8"
        strokeWidth="2.5"
      />
      <text
        className="ficha-laberinto__digit"
        x={start.x}
        y={start.y + 7}
        fontSize="22"
        fontWeight="800"
        textAnchor="middle"
      >
        {ex.start}
      </text>

      {FILLABLE.map((id) => {
        const p = nodePos(id);
        const fin = FIN_LABEL[id];
        const value = showAnswer ? ex.answers[id] : undefined;
        const isCorrectFin = showAnswer && id === ex.correctFin;
        const nodeClass = [
          "ficha-laberinto__node",
          fin ? "ficha-laberinto__node--fin" : "ficha-laberinto__node--blank",
          isCorrectFin ? "ficha-laberinto__node--answer" : "",
          showAnswer ? "ficha-laberinto__node--filled" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <g key={id}>
            <rect
              className={nodeClass}
              x={p.x - HALF_W}
              y={p.y - HALF_H}
              width={HALF_W * 2}
              height={HALF_H * 2}
              rx="8"
              strokeWidth={fin || isCorrectFin ? 3 : 2}
              strokeDasharray={fin || showAnswer ? undefined : "5 3"}
            />
            {value !== undefined && (
              <text
                className="ficha-laberinto__digit"
                x={p.x}
                y={p.y + 7}
                fontSize="22"
                fontWeight="800"
                textAnchor="middle"
              >
                {value}
              </text>
            )}
            {fin && (
              <text
                className="ficha-laberinto__fin-label"
                x={p.x}
                y={p.y + HALF_H + 16}
                fontSize="12"
                fontWeight="800"
                textAnchor="middle"
              >
                {fin}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Alumno: tablero SVG (casillas en blanco) + pregunta final.
 * Soluciones: mismo tablero relleno con los números (sin enunciado).
 * Colores: familia de `--color-primary` (color de clase).
 */
export function LaberintoRenderer({ ex, showAnswer }: LaberintoRendererProps): JSX.Element {
  const finalValue =
    typeof ex.answers[ex.correctFin] === "number" ? ex.answers[ex.correctFin] : undefined;

  return (
    <div className={`ficha-laberinto${showAnswer ? " ficha-laberinto--sol" : ""}`}>
      {!showAnswer && (
        <p className="ficha-laberinto__hint">
          Haz cada operación y escribe el resultado en su casilla.
        </p>
      )}
      <LaberintoBoard ex={ex} showAnswer={showAnswer} />
      {!showAnswer ? (
        <div className="ficha-laberinto__final">
          <span className="ficha-laberinto__question">{ex.question}</span>
          <span className="ficha-laberinto__blank" aria-label="Respuesta final" />
        </div>
      ) : (
        <div className="ficha-laberinto__final">
          <span className="ficha-laberinto__question">Respuesta</span>
          <span className="ficha-laberinto__sol-answer">{finalValue ?? "?"}</span>
        </div>
      )}
    </div>
  );
}
