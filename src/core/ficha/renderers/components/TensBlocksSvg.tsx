export type TensBlocksLayout = "stack" | "row";

export interface TensBlocksSvgProps {
  /** Número a representar (11-99): decenas = bloques «10», unidades = puntos. */
  number: number;
  /**
   * `stack` — decenas en columna (identify/MC, mismo ancho que 11–19).
   * `row` — decenas en fila (medium/hard/jump: menos altura).
   */
  layout?: TensBlocksLayout;
}

const TEN_W = 30;
const TEN_H = 38;
const TEN_GAP = 6;
const DOT_R = 7;
const DOT_GAP = 5;
const ROW_GAP = 8;
const PAD = 2;

/** Columnas de bloques «10» según layout y cantidad. */
function tensPerRow(tens: number, layout: TensBlocksLayout): number {
  if (tens <= 0) return 0;
  if (layout === "row") return tens; // una sola fila horizontal
  // stack: 1 columna (≤5); desde 6, 2 columnas
  return tens <= 5 ? 1 : 2;
}

/**
 * Bloques de decenas y unidades (TensBlock de pizarra) en SVG apto para impresión.
 * Decena = rectángulo «10» con color de clase (`--color-primary`); unidad = círculo naranja.
 */
export function TensBlocksSvg({ number, layout = "stack" }: TensBlocksSvgProps): JSX.Element {
  const n = Math.max(0, Math.floor(number));
  const tens = Math.floor(n / 10);
  const units = n % 10;
  const cols = tensPerRow(tens, layout);
  const tensRows = tens > 0 && cols > 0 ? Math.ceil(tens / cols) : 0;
  const tensCols = tens > 0 ? Math.min(cols, tens) : 0;

  const tensW = tensCols > 0 ? tensCols * TEN_W + (tensCols - 1) * TEN_GAP : 0;
  const unitsW = units > 0 ? units * DOT_R * 2 + (units - 1) * DOT_GAP : 0;
  const innerW = Math.max(tensW, unitsW, TEN_W);
  const tensBlockH = tensRows > 0 ? tensRows * TEN_H + (tensRows - 1) * TEN_GAP : 0;
  const unitsRowH = units > 0 ? DOT_R * 2 : 0;
  const innerH = tensBlockH + (tens > 0 && units > 0 ? ROW_GAP : 0) + unitsRowH;

  const W = innerW + PAD * 2;
  const H = Math.max(innerH, TEN_H) + PAD * 2;
  const unitsX0 = PAD + (innerW - unitsW) / 2;
  const unitsY = PAD + tensBlockH + (tens > 0 ? ROW_GAP : 0) + DOT_R;

  return (
    <svg
      className={`ficha-tens-blocks ficha-tens-blocks--${layout}`}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${tens} decenas y ${units} unidades`}
    >
      {Array.from({ length: tens }, (_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const rowCount = Math.min(cols, tens - row * cols);
        const rowW = rowCount * TEN_W + (rowCount - 1) * TEN_GAP;
        const rowX0 = PAD + (innerW - rowW) / 2;
        const x = rowX0 + col * (TEN_W + TEN_GAP);
        const y = PAD + row * (TEN_H + TEN_GAP);
        return (
          <g key={`d-${i}`}>
            <rect
              x={x}
              y={y}
              width={TEN_W}
              height={TEN_H}
              rx={6}
              className="ficha-tens-blocks__ten"
              fill="var(--color-primary, #3b82f6)"
              stroke="var(--color-primary-dark, #1d4ed8)"
              strokeWidth={1.5}
            />
            <text
              x={x + TEN_W / 2}
              y={y + TEN_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontWeight={900}
              fill="#ffffff"
            >
              10
            </text>
          </g>
        );
      })}
      {Array.from({ length: units }, (_, i) => (
        <circle
          key={`u-${i}`}
          cx={unitsX0 + DOT_R + i * (DOT_R * 2 + DOT_GAP)}
          cy={unitsY}
          r={DOT_R}
          fill="#f59e0b"
          stroke="#b45309"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
