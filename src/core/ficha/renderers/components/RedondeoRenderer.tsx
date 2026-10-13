import type { RedondeoSheetExercise } from "../../types";

export interface RedondeoRendererProps {
  ex: RedondeoSheetExercise;
  showAnswer: boolean;
}

const LINE_W = 260;
const LINE_H = 54;
const X0 = 22;
const X1 = LINE_W - 22;
const Y = 30;

/** Recta entre dos decenas con la marca del número (como pizarra). */
function DecadeNumberLine({
  number,
  lower,
  upper,
  showEndLabels,
}: {
  number: number;
  lower: number;
  upper: number;
  showEndLabels: boolean;
}): JSX.Element {
  const span = Math.max(1, upper - lower);
  const pct = Math.min(1, Math.max(0, (number - lower) / span));
  const xN = X0 + pct * (X1 - X0);
  return (
    <svg
      className="ficha-redondeo__line"
      width={LINE_W}
      height={LINE_H}
      viewBox={`0 0 ${LINE_W} ${LINE_H}`}
      role="img"
      aria-label={`Recta entre ${lower} y ${upper} con el ${number}`}
    >
      <line x1={X0} y1={Y} x2={X1} y2={Y} stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
      {[X0, X1].map((x) => (
        <line key={x} x1={x} y1={Y - 9} x2={x} y2={Y + 9} stroke="#0f172a" strokeWidth={3} />
      ))}
      {showEndLabels ? (
        <>
          <text
            x={X0}
            y={LINE_H - 3}
            textAnchor="middle"
            fontSize={14}
            fontWeight={800}
            fill="#0f172a"
          >
            {lower}
          </text>
          <text
            x={X1}
            y={LINE_H - 3}
            textAnchor="middle"
            fontSize={14}
            fontWeight={800}
            fill="#0f172a"
          >
            {upper}
          </text>
        </>
      ) : null}
      <circle
        cx={xN}
        cy={Y}
        r={6}
        fill="var(--color-primary, #0284c7)"
        stroke="var(--color-primary-dark, #0369a1)"
        strokeWidth={1.5}
      />
      <text
        x={xN}
        y={Y - 11}
        textAnchor="middle"
        fontSize={14}
        fontWeight={900}
        fill="var(--color-primary, #0284c7)"
      >
        {number}
      </text>
    </svg>
  );
}

/**
 * Alumno: layout por nivel (recta ± badge + pregunta + • opciones).
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function RedondeoRenderer({ ex, showAnswer }: RedondeoRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const difficulty = ex.difficulty ?? "easy";
  const showBadge = difficulty === "hard" || difficulty === "expert";
  const showLine = difficulty !== "expert";
  const showEndLabels = difficulty === "easy" || difficulty === "medium";
  const choicesClass =
    difficulty === "easy"
      ? "ficha-redondeo__choices ficha-redondeo__choices--spread"
      : "ficha-redondeo__choices ficha-redondeo__choices--center";

  return (
    <div className={`ficha-redondeo ficha-redondeo--${difficulty}`}>
      {showBadge || showLine ? (
        <div className="ficha-redondeo__top">
          {showBadge ? <span className="ficha-redondeo__badge">{ex.number}</span> : null}
          {showLine ? (
            <DecadeNumberLine
              number={ex.number}
              lower={ex.lowerDecade}
              upper={ex.upperDecade}
              showEndLabels={showEndLabels}
            />
          ) : null}
        </div>
      ) : null}
      <p className="ficha-redondeo__question">{ex.question}</p>
      <div className={choicesClass}>
        {ex.choiceLabels.map((label, i) => (
          <span key={`${label}-${i}`} className="ficha-redondeo__choice">
            <span className="ficha-redondeo__choice-mark" aria-hidden>
              •
            </span>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
