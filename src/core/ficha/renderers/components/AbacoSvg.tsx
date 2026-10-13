export interface AbacoSvgProps {
  /** Bolitas en la columna de centenas. */
  c: number;
  /** Bolitas en la columna de decenas. */
  d: number;
  /** Bolitas en la columna de unidades. */
  u: number;
  size?: "full" | "mini";
}

/** Bolitas que caben como máximo en una columna (igual que pizarra). */
const BOLITAS_POR_COLUMNA = 9;

const COLORES = ["#06b6d4", "#fbbf24", "#f472b6"] as const;
const ETIQUETAS = ["C", "D", "U"] as const;

/**
 * Ábaco de tres columnas (C·D·U) en SVG apto para impresión.
 * Geometría y colores como `AbacoVisual` de pizarra; `full` ligeramente más compacto
 * que en pantalla para que quepa en media hoja A4.
 */
export function AbacoSvg({ c, d, u, size = "full" }: AbacoSvgProps): JSX.Element {
  const mini = size === "mini";
  // mini más compacto: 2 ejercicios find-abaco por fila (4 ábacos cada uno).
  const beadR = mini ? 4 : 8;
  const gap = mini ? 1.2 : 2;
  const baseH = mini ? 10 : 16;
  const rodW = mini ? 3 : 6;
  const margenSuperior = mini ? 3 : 6;

  const W = mini ? 58 : 132;
  const rodH = BOLITAS_POR_COLUMNA * (beadR * 2 + gap);
  const H = margenSuperior + rodH + baseH;

  const xs = mini ? [12, 29, 46] : [26, 66, 106];
  const columnas = [c, d, u];

  return (
    <svg
      className={`ficha-abaco-svg ficha-abaco-svg--${size}`}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Ábaco con ${c} bolitas en las centenas, ${d} en las decenas y ${u} en las unidades`}
    >
      <rect x={1} y={H - baseH} width={W - 2} height={baseH} rx={mini ? 3 : 5} fill="#78350f" />
      {xs.map((x, i) => (
        <rect
          key={`barra-${i}`}
          x={x - rodW / 2}
          y={margenSuperior}
          width={rodW}
          height={rodH}
          rx={2}
          fill="#92400e"
        />
      ))}
      {columnas.map((cuenta, ci) =>
        Array.from({ length: Math.max(0, Math.min(BOLITAS_POR_COLUMNA, cuenta)) }, (_, b) => (
          <circle
            key={`bolita-${ci}-${b}`}
            cx={xs[ci]}
            cy={H - baseH - beadR - b * (beadR * 2 + gap)}
            r={beadR}
            fill={COLORES[ci]}
            stroke="rgba(0,0,0,.35)"
            strokeWidth={1}
          />
        )),
      )}
      {xs.map((x, i) => (
        <text
          key={`rotulo-${i}`}
          x={x}
          y={H - baseH / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={mini ? 8 : 10}
          fontWeight={700}
          fill="#fef3c7"
        >
          {ETIQUETAS[i]}
        </text>
      ))}
    </svg>
  );
}
