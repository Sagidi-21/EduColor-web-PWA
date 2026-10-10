import type { CirculoCircunferenciaSheetExercise } from "../../types";

export interface CirculoCircunferenciaRendererProps {
  ex: CirculoCircunferenciaSheetExercise;
  showAnswer: boolean;
}

const COLOR = "#3b82f6";

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
        <circle cx={c} cy={c} r={r} fill={COLOR} opacity={0.85} />
      ) : (
        <circle cx={c} cy={c} r={r} fill="none" stroke={COLOR} strokeWidth={size * 0.1} />
      )}
    </svg>
  );
}

/**
 * Alumno: figura SVG (o objeto real) + pregunta + opciones • (como en pizarra).
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
      {ex.question ? <p className="ficha-cc__question">{ex.question}</p> : null}
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
