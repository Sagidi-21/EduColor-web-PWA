export interface ClockSvgProps {
  hours: number;
  minutes: number;
  size?: number;
  showHands?: boolean;
}

/** Reloj analógico simple para ficha A4. */
export function ClockSvg({
  hours,
  minutes,
  size = 90,
  showHands = true,
}: ClockSvgProps): JSX.Element {
  const h = ((hours % 12) + minutes / 60) * 30;
  const m = minutes * 6;
  return (
    <svg
      className="ficha-clock-svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={`${hours}:${String(minutes).padStart(2, "0")}`}
    >
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#111" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(a) * 36;
        const y = 50 + Math.sin(a) * 36;
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fontWeight="700"
            fill="#111"
          >
            {i + 1}
          </text>
        );
      })}
      {showHands && (
        <>
          <line
            x1="50"
            y1="50"
            x2={50 + Math.sin((h * Math.PI) / 180) * 22}
            y2={50 - Math.cos((h * Math.PI) / 180) * 22}
            stroke="#111"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            className="ficha-clock-svg__minute"
            x1="50"
            y1="50"
            x2={50 + Math.sin((m * Math.PI) / 180) * 32}
            y2={50 - Math.cos((m * Math.PI) / 180) * 32}
            stroke="var(--color-primary, #0284c7)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="2.5" fill="#111" />
        </>
      )}
    </svg>
  );
}
