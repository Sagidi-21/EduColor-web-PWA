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

/**
 * Alumno: tira L-M-X-J-V-S-D (día del enunciado resaltado) + pregunta + • opciones.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function WeekDaysRenderer({ ex, showAnswer }: WeekDaysRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-weekdays">
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
      <p className="ficha-weekdays__question">{ex.question}</p>
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
