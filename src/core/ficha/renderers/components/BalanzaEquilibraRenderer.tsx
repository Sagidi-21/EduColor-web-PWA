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

/**
 * Balanza SVG de «Equilibra la balanza»: carga fija a la izquierda y platillo derecho
 * vacío (el alumno decide qué pesas pone). Imprimible: viga nivelada, sin arrastre.
 */
function BalanzaEquilibraSvg({ ex }: { ex: BalanzaSheetExercise }): JSX.Element {
  const emoji = ex.left.emoji;
  const hasEmoji = emoji.length > 0;
  const isWeights = ex.leftKind !== "object";
  const label = ex.left.weightLabel ?? (ex.targetKg !== undefined ? `${ex.targetKg} kg` : "");
  const blocks = isWeights ? blockPositions(Math.max(1, ex.left.count), 40) : [];

  return (
    <svg
      className="ficha-balanza-eq__svg"
      viewBox="0 0 320 130"
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
        x2="280"
        y2="36"
        stroke="#475569"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="160" cy="36" r="7" fill="#475569" />
      {/* Colgadores y platillos */}
      <g stroke="#64748b" strokeWidth="1.5" fill="none">
        <line x1="40" y1="36" x2="12" y2="96" />
        <line x1="40" y1="36" x2="68" y2="96" />
        <line x1="280" y1="36" x2="252" y2="96" />
        <line x1="280" y1="36" x2="308" y2="96" />
      </g>
      <line x1="8" y1="96" x2="72" y2="96" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      <line
        x1="248"
        y1="96"
        x2="312"
        y2="96"
        stroke="#475569"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Carga fija (izquierda) */}
      {isWeights ? (
        blocks.map((p, i) =>
          hasEmoji ? (
            <text key={i} x={p.x} y={p.y} fontSize="18" textAnchor="middle">
              {emoji}
            </text>
          ) : (
            <rect
              key={i}
              x={p.x - 9}
              y={p.y - 16}
              width="18"
              height="16"
              rx="2"
              fill="#e2e8f0"
              stroke="#475569"
              strokeWidth="1.5"
            />
          ),
        )
      ) : hasEmoji ? (
        <text x="40" y="90" fontSize="36" textAnchor="middle">
          {emoji}
        </text>
      ) : (
        <rect
          x="22"
          y="62"
          width="36"
          height="32"
          rx="4"
          fill="#e2e8f0"
          stroke="#475569"
          strokeWidth="1.5"
        />
      )}
      <text x="40" y="116" fontSize="14" fontWeight="700" textAnchor="middle" fill="#111">
        {label}
      </text>

      {/* Platillo derecho: vacío para colocar pesas */}
      <rect
        x="254"
        y="58"
        width="52"
        height="34"
        rx="5"
        fill="#fff"
        stroke="#64748b"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text x="280" y="82" fontSize="22" fontWeight="800" textAnchor="middle" fill="#94a3b8">
        ?
      </text>
      <line x1="256" y1="118" x2="290" y2="118" stroke="#111" strokeWidth="1.5" />
      <text x="304" y="116" fontSize="14" fontWeight="700" textAnchor="middle" fill="#111">
        kg
      </text>
    </svg>
  );
}

/**
 * Alumno: balanza equilibrada + paleta de pesas (chips como en pizarra) + cuántas de cada una.
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
  // Ladrillo 🧱 como en pizarra; sin imágenes, solo el peso.
  const chipEmoji = ex.right.emoji ? "🧱" : "";

  return (
    <div className="ficha-balanza-eq">
      <p className="ficha-balanza-eq__question">{ex.question}</p>
      <BalanzaEquilibraSvg ex={ex} />
      <div className="ficha-balanza-eq__palette" aria-label="Paleta de pesas">
        <span className="ficha-balanza-eq__palette-label">Pesas:</span>
        {chips.map((kg) => (
          <span key={kg} className="ficha-balanza-eq__chip">
            {chipEmoji ? <span className="ficha-balanza-eq__chip-emoji">{chipEmoji}</span> : null}
            <span className="ficha-balanza-eq__chip-kg">{kg} kg</span>
          </span>
        ))}
      </div>
      <div className="ficha-balanza-eq__fill">
        <span className="ficha-balanza-eq__fill-label">Pongo:</span>
        {chips.map((kg) => (
          <span key={kg} className="ficha-balanza-eq__fill-item">
            <span className="ficha-balanza-eq__blank" aria-label={`Cuántas pesas de ${kg} kg`} />
            <span className="ficha-balanza-eq__fill-text">× {kg} kg</span>
          </span>
        ))}
      </div>
    </div>
  );
}
