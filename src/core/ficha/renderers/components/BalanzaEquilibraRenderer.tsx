import type { BalanzaSheetExercise } from "../../types";

export interface BalanzaEquilibraRendererProps {
  ex: BalanzaSheetExercise;
  showAnswer: boolean;
}

const BLOCKS_PER_ROW = 4;

/** Posición (centro) de cada bloque de pesa apilado sobre el platillo izquierdo. */
function blockPositions(n: number, cx: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const cols = Math.min(Math.max(n, 1), BLOCKS_PER_ROW);
  for (let i = 0; i < n; i += 1) {
    const col = i % BLOCKS_PER_ROW;
    const row = Math.floor(i / BLOCKS_PER_ROW);
    out.push({ x: cx + (col - (cols - 1) / 2) * 22, y: 92 - row * 20 });
  }
  return out;
}

/** Geometría del platillo derecho según nº de huecos. */
function rightPanLayout(chipCount: number) {
  const dual = chipCount > 1;
  return {
    dual,
    armX: dual ? 310 : 280,
    panY: 96,
    panLeft: dual ? 255 : 248,
    panRight: dual ? 365 : 312,
    viewW: dual ? 390 : 340,
  };
}

/** Huecos de respuesta en el platillo derecho (uno por denominación de pesa). */
function RightAnswerBlanks({
  chips,
  armX,
  panY,
}: {
  chips: number[];
  armX: number;
  panY: number;
}): JSX.Element {
  const gapAbovePan = 2;

  // Expert (1 kg y 2 kg): dos recuadros en fila sobre el platillo; kg debajo.
  if (chips.length > 1) {
    const boxW = 44;
    const boxH = 32;
    const gap = 12;
    const totalW = chips.length * boxW + (chips.length - 1) * gap;
    const startX = armX - totalW / 2;
    const boxY = panY - gapAbovePan - boxH;
    return (
      <g aria-label="Escribe cuántas pesas de cada tipo">
        {chips.map((kg, i) => {
          const x = startX + i * (boxW + gap);
          const cx = x + boxW / 2;
          return (
            <g key={kg}>
              <rect
                x={x}
                y={boxY}
                width={boxW}
                height={boxH}
                rx="5"
                fill="#fff"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={cx}
                y={panY + 18}
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
                fill="#111"
              >
                {kg} kg
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  // Easy/medium/hard: un hueco sobre el platillo + «kg» a la derecha.
  const boxW = 48;
  const boxH = 34;
  const boxX = armX - boxW / 2;
  const boxY = panY - gapAbovePan - boxH;
  return (
    <g aria-label="Escribe el peso">
      <rect
        x={boxX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx="5"
        fill="#fff"
        stroke="#64748b"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text
        x={boxX + boxW + 4}
        y={boxY + boxH / 2 + 5}
        fontSize="14"
        fontWeight="700"
        textAnchor="start"
        fill="#111"
      >
        kg
      </text>
    </g>
  );
}

/**
 * Balanza SVG de «Equilibra la balanza»: carga fija a la izquierda y platillo derecho
 * con hueco(s) para escribir. Imprimible: viga nivelada, sin arrastre.
 */
function BalanzaEquilibraSvg({ ex }: { ex: BalanzaSheetExercise }): JSX.Element {
  const isWeights = ex.leftKind !== "object";
  // Nunca platillo vacío: si falta emoji, caemos a un icono seguro.
  const emoji = ex.left.emoji || (isWeights ? "🧱" : "📦");
  const label = ex.left.weightLabel ?? (ex.targetKg !== undefined ? `${ex.targetKg} kg` : "");
  const blocks = isWeights ? blockPositions(Math.max(1, ex.left.count), 40) : [];
  const chips = ex.weightChips && ex.weightChips.length > 0 ? ex.weightChips : [1];
  const layout = rightPanLayout(chips.length);
  const { armX, panY, panLeft, panRight, viewW, dual } = layout;

  return (
    <svg
      className={`ficha-balanza-eq__svg${dual ? " ficha-balanza-eq__svg--wide" : ""}`}
      viewBox={`0 0 ${viewW} 130`}
      role="img"
      aria-label={`Balanza equilibrada con ${label} a la izquierda`}
    >
      {/* Soporte */}
      <rect x="130" y="118" width="60" height="8" rx="3" fill="#94a3b8" />
      <path d="M150 118 L160 36 L170 118 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
      {/* Viga */}
      <line
        x1="40"
        y1="36"
        x2={armX}
        y2="36"
        stroke="#475569"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="160" cy="36" r="7" fill="#475569" />
      {/* Colgadores y platillos */}
      <g stroke="#64748b" strokeWidth="1.5" fill="none">
        <line x1="40" y1="36" x2="12" y2={panY} />
        <line x1="40" y1="36" x2="68" y2={panY} />
        <line x1={armX} y1="36" x2={panLeft + 8} y2={panY} />
        <line x1={armX} y1="36" x2={panRight - 8} y2={panY} />
      </g>
      <line
        x1="8"
        y1={panY}
        x2="72"
        y2={panY}
        stroke="#475569"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={panLeft}
        y1={panY}
        x2={panRight}
        y2={panY}
        stroke="#475569"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Carga fija (izquierda): siempre emoji (pesas 🧱 u objeto). */}
      {isWeights ? (
        blocks.map((p, i) => (
          <text key={i} x={p.x} y={p.y} fontSize="18" textAnchor="middle">
            {emoji}
          </text>
        ))
      ) : (
        <text x="40" y="90" fontSize="36" textAnchor="middle">
          {emoji}
        </text>
      )}
      <text x="40" y="116" fontSize="14" fontWeight="700" textAnchor="middle" fill="#111">
        {label}
      </text>

      <RightAnswerBlanks chips={chips} armX={armX} panY={panY} />
    </svg>
  );
}

/**
 * Alumno: balanza equilibrada + paleta de pesas (referencia).
 * La respuesta se escribe en el hueco del platillo derecho (no hay zona «Pongo»).
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function BalanzaEquilibraRenderer({
  ex,
  showAnswer,
}: BalanzaEquilibraRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const chips = ex.weightChips && ex.weightChips.length > 0 ? ex.weightChips : [1];

  return (
    <div className="ficha-balanza-eq">
      <p className="ficha-balanza-eq__question">{ex.question}</p>
      <BalanzaEquilibraSvg ex={ex} />
      <div className="ficha-balanza-eq__palette" aria-label="Paleta de pesas">
        <span className="ficha-balanza-eq__palette-label">Pesas:</span>
        {chips.map((kg) => (
          <span key={kg} className="ficha-balanza-eq__chip">
            <span className="ficha-balanza-eq__chip-emoji">🧱</span>
            <span className="ficha-balanza-eq__chip-kg">{kg} kg</span>
          </span>
        ))}
      </div>
    </div>
  );
}
