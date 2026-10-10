import type { LineTypesSheetExercise } from "../../types";

export interface LineTypesRendererProps {
  ex: LineTypesSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: SVG de la línea + pregunta + • opciones (como pizarra / shapes).
 */
export function LineTypesRenderer({ ex, showAnswer }: LineTypesRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  return (
    <div className="ficha-linetypes">
      {ex.question ? (
        <p className="ficha-linetypes__question">
          {ex.question} <span className="ficha-linetypes__hint">(redondea la correcta)</span>
        </p>
      ) : null}
      <div className="ficha-linetypes__body">
        {ex.svg && (
          <svg
            className="ficha-line-svg"
            viewBox="0 0 300 200"
            width="140"
            height="90"
            aria-hidden
            dangerouslySetInnerHTML={{ __html: ex.svg }}
          />
        )}
        {ex.options.length > 0 && (
          <div className="ficha-linetypes__choices">
            {ex.options.map((label, i) => (
              <div key={`${label}-${i}`} className="ficha-linetypes__choice">
                <span className="ficha-linetypes__choice-mark" aria-hidden>
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
