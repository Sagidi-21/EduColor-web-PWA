import type { SimetriaSheetExercise, SimetriaSheetShape } from "../../types";

export interface SimetriaRendererProps {
  ex: SimetriaSheetExercise;
  showAnswer: boolean;
}

type SimShape = SimetriaSheetShape;

/** Color de clase (`--color-primary`); relleno suave con color-mix. */
const FILL = "color-mix(in srgb, var(--color-primary, #0284c7) 18%, #fff)";
const STROKE = "var(--color-primary, #0284c7)";

function pts(arr: [number, number][]): string {
  return arr.map(([x, y]) => `${x},${y}`).join(" ");
}

function polygon(
  n: number,
  cx: number,
  cy: number,
  r: number,
  offset = -Math.PI / 2,
): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = offset + (2 * Math.PI * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

function starPts(n: number, cx: number, cy: number, r1: number, r2: number): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / n;
    const r = i % 2 === 0 ? r1 : r2;
    result.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return result;
}

const CX = 80;
const CY = 80;

function shapeBody(shape: SimShape): JSX.Element {
  const common = { fill: FILL, stroke: STROKE, strokeWidth: 2.5 as const };
  switch (shape) {
    case "circulo":
      return <circle cx={CX} cy={CY} r={65} {...common} />;
    case "cuadrado":
      return <rect x={15} y={15} width={130} height={130} {...common} />;
    case "rectangulo":
      return <rect x={10} y={35} width={140} height={90} {...common} />;
    case "triangulo-eq":
      return <polygon points={pts(polygon(3, CX, CY + 5, 68))} {...common} />;
    case "triangulo-iso":
      return (
        <polygon
          points={pts([
            [80, 12],
            [20, 148],
            [140, 148],
          ])}
          {...common}
        />
      );
    case "triangulo-esc":
      return (
        <polygon
          points={pts([
            [35, 148],
            [145, 148],
            [100, 20],
          ])}
          {...common}
        />
      );
    case "rombo":
      return (
        <polygon
          points={pts([
            [80, 10],
            [150, 80],
            [80, 150],
            [10, 80],
          ])}
          {...common}
        />
      );
    case "pentagono":
      return <polygon points={pts(polygon(5, CX, CY + 5, 68))} {...common} />;
    case "hexagono":
      return <polygon points={pts(polygon(6, CX, CY, 68))} {...common} />;
    case "estrella":
      return <polygon points={pts(starPts(5, CX, CY, 68, 28))} {...common} />;
  }
}

/** Figura plana de simetría (mismo trazado que la pizarra, sin eje). */
function SimetriaShapeSvg({ shape, size = 84 }: { shape: SimShape; size?: number }): JSX.Element {
  return (
    <svg
      className="ficha-simetria__svg"
      width={size}
      height={size}
      viewBox="0 0 160 160"
      aria-hidden
    >
      {shapeBody(shape)}
    </svg>
  );
}

/**
 * Alumno: pregunta + figura (o figuras-opción) + • / letras.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function SimetriaRenderer({ ex, showAnswer }: SimetriaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  const optionShapes = ex.optionShapes ?? [];
  const hasRoundHint = choices.length > 0 || optionShapes.length > 0;

  return (
    <div className={`ficha-simetria${optionShapes.length > 0 ? " ficha-simetria--which" : ""}`}>
      {ex.question ? (
        <p className="ficha-simetria__question">
          {ex.question}
          {hasRoundHint && <span className="ficha-simetria__hint"> (redondea la correcta)</span>}
        </p>
      ) : null}

      {ex.shape || choices.length > 0 ? (
        <div className="ficha-simetria__body">
          {ex.shape && (
            <div className="ficha-simetria__figure">
              <SimetriaShapeSvg shape={ex.shape} />
            </div>
          )}
          {choices.length > 0 && (
            <div className="ficha-simetria__choices">
              {choices.map((label, i) => (
                <div key={`${label}-${i}`} className="ficha-simetria__choice">
                  <span className="ficha-simetria__choice-mark" aria-hidden>
                    •
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {optionShapes.length > 0 && (
        <div className="ficha-simetria__options">
          {optionShapes.map((shape, i) => (
            <div key={`${shape}-${i}`} className="ficha-simetria__option">
              <span className="ficha-simetria__opt-label">{String.fromCharCode(65 + i)}</span>
              <SimetriaShapeSvg shape={shape} size={64} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
