import type { WeekDaySheetExercise } from "../../types";

export interface WeekDaysRendererProps {
  ex: WeekDaySheetExercise;
  showAnswer: boolean;
}

const WEEK_STRIP: { day: string; abbr: string }[] = [
  { day: "lunes", abbr: "L" },
  { day: "martes", abbr: "M" },
  { day: "miércoles", abbr: "X" },
  { day: "jueves", abbr: "J" },
  { day: "viernes", abbr: "V" },
  { day: "sábado", abbr: "S" },
  { day: "domingo", abbr: "D" },
];

function questionWithHighlight(question: string, highlightDay?: string): JSX.Element {
  if (!highlightDay) return <>{question}</>;
  const idx = question.toLowerCase().indexOf(highlightDay.toLowerCase());
  if (idx < 0) return <>{question}</>;
  const before = question.slice(0, idx);
  const match = question.slice(idx, idx + highlightDay.length);
  const after = question.slice(idx + highlightDay.length);
  return (
    <>
      {before}
      <span className="ficha-weekdays__day-name">{match}</span>
      {after}
    </>
  );
}

/**
 * Alumno: pregunta + tira L-M-X-J-V-S-D (día del enunciado resaltado) + • opciones.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function WeekDaysRenderer({ ex, showAnswer }: WeekDaysRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-weekdays">
      <p className="ficha-weekdays__question">
        {questionWithHighlight(ex.question, ex.highlightDay)}
        {choices.length > 0 && (
          <span className="ficha-weekdays__hint"> (redondea la correcta)</span>
        )}
      </p>
      <div className="ficha-weekdays__strip" aria-label="Días de la semana">
        {WEEK_STRIP.map(({ day, abbr }) => (
          <span
            key={day}
            className={`ficha-weekdays__day${ex.highlightDay === day ? " ficha-weekdays__day--active" : ""}`}
          >
            {abbr}
          </span>
        ))}
      </div>
      {choices.length > 0 && (
        <div className="ficha-weekdays__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-weekdays__choice">
              <span className="ficha-weekdays__choice-mark" aria-hidden>
                •
              </span>
              <span className="ficha-weekdays__choice-text">{label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
