export interface TensBlocksSvgProps {
  /** Número a representar (11-99): decenas = bloques «10», unidades = puntos. */
  number: number;
}

const TEN_W = 30;
const TEN_H = 38;
const TEN_GAP = 6;
const DOT_R = 7;
const DOT_GAP = 5;
const ROW_GAP = 8;
const PAD = 2;

/**
 * Bloques de decenas y unidades (TensBlock de pizarra) en SVG apto para impresión.
 * Decena = rectángulo azul «10»; unidad = círculo naranja.
 */
export function TensBlocksSvg({ number }: TensBlocksSvgProps): JSX.Element {
  const n = Math.max(0, Math.floor(number));
  const tens = Math.floor(n / 10);
  const units = n % 10;

  const tensW = tens > 0 ? tens * TEN_W + (tens - 1) * TEN_GAP : 0;
  const unitsW = units > 0 ? units * DOT_R * 2 + (units - 1) * DOT_GAP : 0;
  const innerW = Math.max(tensW, unitsW, TEN_W);
  const tensRowH = tens > 0 ? TEN_H : 0;
  const unitsRowH = units > 0 ? DOT_R * 2 : 0;
  const innerH = tensRowH + (tens > 0 && units > 0 ? ROW_GAP : 0) + unitsRowH;

  const W = innerW + PAD * 2;
  const H = Math.max(innerH, TEN_H) + PAD * 2;
  const tensX0 = PAD + (innerW - tensW) / 2;
  const unitsX0 = PAD + (innerW - unitsW) / 2;
  const unitsY = PAD + tensRowH + (tens > 0 ? ROW_GAP : 0) + DOT_R;

  return (
    <svg
      className="ficha-tens-blocks"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${tens} decenas y ${units} unidades`}
    >
      {Array.from({ length: tens }, (_, i) => (
        <g key={`d-${i}`}>
          <rect
            x={tensX0 + i * (TEN_W + TEN_GAP)}
            y={PAD}
            width={TEN_W}
            height={TEN_H}
            rx={6}
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth={1.5}
          />
          <text
            x={tensX0 + i * (TEN_W + TEN_GAP) + TEN_W / 2}
            y={PAD + TEN_H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={900}
            fill="#ffffff"
          >
            10
          </text>
        </g>
      ))}
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
