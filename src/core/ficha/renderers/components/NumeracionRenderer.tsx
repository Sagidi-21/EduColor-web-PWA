import type {
  Numeracion1119SheetExercise,
  Numeracion4059SheetExercise,
  Numeracion6099SheetExercise,
} from "../../types";
import { TensBlocksSvg } from "./TensBlocksSvg";

export type NumeracionSheetExercise =
  Numeracion1119SheetExercise | Numeracion4059SheetExercise | Numeracion6099SheetExercise;

export interface NumeracionRendererProps {
  ex: NumeracionSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: bloques decenas/unidades (obligatorios en identify) + pregunta +
 * ○ opciones (MC) o casillas de cifra en blanco.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function NumeracionRenderer({ ex, showAnswer }: NumeracionRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  const digits = Math.max(1, String(ex.answer ?? "00").length);

  return (
    <div className="ficha-numeracion">
      {ex.showBlocks && (
        <div className="ficha-numeracion__blocks">
          <TensBlocksSvg number={ex.number} />
        </div>
      )}
      <p className="ficha-numeracion__question">{ex.question}</p>
      {choices.length > 0 ? (
        <div className="ficha-numeracion__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-numeracion__choice">
              <span className="ficha-numeracion__choice-mark" aria-hidden>
                ○
              </span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="ficha-numeracion__boxes" aria-label="Espacio para la respuesta">
          {Array.from({ length: digits }, (_, i) => (
            <span key={i} className="ficha-numeracion__box" />
          ))}
        </div>
      )}
    </div>
  );
}
