import type { RelojSheetExercise } from "../../types";
import { ClockSvg } from "./ClockSvg";

export interface RelojRendererProps {
  ex: RelojSheetExercise;
  showAnswer: boolean;
}

function ChoiceMark(): JSX.Element {
  return (
    <span className="ficha-reloj__choice-mark" aria-hidden>
      •
    </span>
  );
}

/**
 * Alumno (como en pizarra):
 * - Reloj digital cuando el ejercicio lo necesita (leer en palabras, pasar a agujas, pon la hora).
 * - Esfera analógica con agujas (leer la hora) o vacía (el alumno dibuja las agujas).
 * - Opciones • de texto o minirelojes A–D con agujas.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function RelojRenderer({ ex, showAnswer }: RelojRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const showAnalog = ex.showAnalog !== false;
  const textChoices = ex.choiceLabels ?? [];
  const clockChoices = ex.clockChoices ?? [];
  const hasChoices = textChoices.length > 0 || clockChoices.length > 0;
  const showDigital = Boolean(ex.showDigital && ex.digitalLabel);
  // Legado: esfera con agujas y sin opciones → casilla para escribir la hora.
  const showWriteBlank = showAnalog && ex.showHands && !hasChoices && !ex.drawHands;

  return (
    <div className="ficha-reloj">
      {ex.question ? <p className="ficha-reloj__question">{ex.question}</p> : null}
      <div className="ficha-reloj__body">
        {showDigital && (
          <span className="ficha-reloj__digital" aria-label={`Reloj digital: ${ex.digitalLabel}`}>
            {ex.digitalLabel}
          </span>
        )}
        {showAnalog && (
          <ClockSvg
            hours={ex.hours}
            minutes={ex.minutes}
            showHands={ex.showHands}
            size={ex.drawHands ? 104 : 84}
          />
        )}
        {showWriteBlank && (
          <span className="ficha-reloj__blank" aria-label="Espacio para escribir la hora" />
        )}
      </div>

      {textChoices.length > 0 && (
        <div className="ficha-reloj__choices">
          {textChoices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-reloj__choice">
              <ChoiceMark />
              {label}
            </span>
          ))}
        </div>
      )}

      {clockChoices.length > 0 && (
        <div className="ficha-reloj__clock-choices">
          {clockChoices.map((c) => (
            <span key={c.letter} className="ficha-reloj__clock-choice">
              <ClockSvg hours={c.hours} minutes={c.minutes} showHands size={60} />
              <span className="ficha-reloj__clock-choice-label">
                <ChoiceMark />
                {c.letter}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
