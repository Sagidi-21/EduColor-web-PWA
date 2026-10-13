import type { CirculoCircunferenciaSheetExercise } from "../../types";

export interface CirculoCircunferenciaRendererProps {
  ex: CirculoCircunferenciaSheetExercise;
  showAnswer: boolean;
}

/** Color de clase (`--color-primary`). */
const FILL = "var(--color-primary, #3b82f6)";
const STROKE = "var(--color-primary, #3b82f6)";

/** Círculo relleno o circunferencia (solo borde), como en pizarra. */
function CirculoSvg({
  shapeType,
  size = 84,
}: {
  shapeType: "circulo" | "circunferencia";
  size?: number;
}): JSX.Element {
  const c = size / 2;
  const r = size * 0.38;
  return (
    <svg
      className="ficha-cc__svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      {shapeType === "circulo" ? (
        <circle cx={c} cy={c} r={r} fill={FILL} opacity={0.85} />
      ) : (
        <circle cx={c} cy={c} r={r} fill="none" stroke={STROKE} strokeWidth={size * 0.1} />
      )}
    </svg>
  );
}

/**
 * Alumno: figura SVG (o objeto real) centrada + opciones • horizontales debajo.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function CirculoCircunferenciaRenderer({
  ex,
  showAnswer,
}: CirculoCircunferenciaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  const isReal = ex.type === "real-object";

  return (
    <div className="ficha-cc">
      {ex.question ? (
        <p className="ficha-cc__question">
          {ex.question}
          {choices.length > 0 && <span className="ficha-cc__hint"> (redondea la correcta)</span>}
        </p>
      ) : null}
      <div className="ficha-cc__body">
        {!isReal && ex.shapeType && (
          <div className="ficha-cc__figure">
            <CirculoSvg shapeType={ex.shapeType} />
          </div>
        )}
        {isReal && ex.objectEmoji && (
          <div className="ficha-cc__figure ficha-cc__emoji" aria-hidden>
            {ex.objectEmoji}
          </div>
        )}
        {choices.length > 0 && (
          <div className="ficha-cc__choices">
            {choices.map((label, i) => (
              <div key={`${label}-${i}`} className="ficha-cc__choice">
                <span className="ficha-cc__choice-mark" aria-hidden>
                  •
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
