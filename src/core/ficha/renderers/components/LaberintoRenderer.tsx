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
const COLS = [90, 220, 350, 480] as const;
const ROWS = [55, 145, 235] as const;
const HALF_W = 30;
const HALF_H = 15;

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
    ? `${x2},${y2} ${x2 - 9},${y2 - 5} ${x2 - 9},${y2 + 5}`
    : `${x2},${y2} ${x2 - 5},${y2 - 9} ${x2 + 5},${y2 - 9}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const symbol = edge.op === "-" ? "−" : "+";
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a2a6c" strokeWidth="2.5" />
      <polygon points={head} fill="#1a2a6c" />
      <circle cx={mx} cy={my} r="16" fill="#fff" stroke="#1a2a6c" strokeWidth="2" />
      <text x={mx} y={my + 4.5} fontSize="13" fontWeight="800" textAnchor="middle" fill="#1a2a6c">
        {symbol}
        {edge.value}
      </text>
    </g>
  );
}

/** Tablero del laberinto en SVG (casillas en blanco, inicio con su número). */
function LaberintoBoard({ ex }: { ex: LaberintoSheetExercise }): JSX.Element {
  const start = nodePos("S");
  return (
    <svg
      className="ficha-laberinto__svg"
      viewBox="0 0 600 285"
      role="img"
      aria-label="Laberinto matemático"
    >
      {ex.edges.map((edge, i) => (
        <EdgeArrow key={`${edge.from}-${edge.to}-${i}`} edge={edge} />
      ))}

      <text
        x={start.x}
        y={start.y - 24}
        fontSize="12"
        fontWeight="700"
        textAnchor="middle"
        fill="#334155"
      >
        INICIO
      </text>
      <rect
        x={start.x - HALF_W}
        y={start.y - HALF_H}
        width={HALF_W * 2}
        height={HALF_H * 2}
        rx="6"
        fill="#e0e7ff"
        stroke="#1a2a6c"
        strokeWidth="2.5"
      />
      <text
        x={start.x}
        y={start.y + 6}
        fontSize="18"
        fontWeight="800"
        textAnchor="middle"
        fill="#0f172a"
      >
        {ex.start}
      </text>

      {FILLABLE.map((id) => {
        const p = nodePos(id);
        const fin = FIN_LABEL[id];
        return (
          <g key={id}>
            <rect
              x={p.x - HALF_W}
              y={p.y - HALF_H}
              width={HALF_W * 2}
              height={HALF_H * 2}
              rx="6"
              fill="#fff"
              stroke={fin ? "#1a2a6c" : "#64748b"}
              strokeWidth={fin ? 3 : 1.8}
              strokeDasharray={fin ? undefined : "5 3"}
            />
            {fin && (
              <text
                x={p.x}
                y={p.y + HALF_H + 14}
                fontSize="11"
                fontWeight="800"
                textAnchor="middle"
                fill="#1a2a6c"
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
 * Alumno: tablero SVG del laberinto (operaciones en las flechas, casillas en blanco)
 * + pregunta final con casilla. Soluciones: las maneja ExerciseRenderer.
 */
export function LaberintoRenderer({ ex, showAnswer }: LaberintoRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer ficha-answer--long">{ex.answer ?? "?"}</div>;
  }

  return (
    <div className="ficha-laberinto">
      <p className="ficha-laberinto__hint">
        Haz cada operación y escribe el resultado en su casilla.
      </p>
      <LaberintoBoard ex={ex} />
      <div className="ficha-laberinto__final">
        <span className="ficha-laberinto__question">{ex.question}</span>
        <span className="ficha-laberinto__blank" aria-label="Respuesta final" />
      </div>
    </div>
  );
}
