import type { ReactNode } from "react";
import type { Abaco3CifrasSheetExercise } from "../../types";
import { AbacoSvg } from "./AbacoSvg";

export interface Abaco3CifrasRendererProps {
  ex: Abaco3CifrasSheetExercise;
  showAnswer: boolean;
}

/** Resalta cifras del enunciado con el color de clase. */
function questionWithNumbers(question: string): ReactNode {
  const parts = question.split(/(\d+)/);
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="ficha-abaco__q-num">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Alumno:
 * - read-abaco / valor-posicional: ábaco SVG + pregunta + • opciones.
 * - find-abaco: número en el enunciado (color de clase) + 4 ábacos (A-D) + hint redondea.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta; letra en find-abaco).
 */
export function Abaco3CifrasRenderer({ ex, showAnswer }: Abaco3CifrasRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  if (ex.variant === "find-abaco") {
    return (
      <div className="ficha-abaco">
        <p className="ficha-abaco__question">
          {questionWithNumbers(ex.question)}{" "}
          <span className="ficha-abaco__hint">(redondea la correcta)</span>
        </p>
        <table className="ficha-abaco__options" cellPadding={0} cellSpacing={0} role="presentation">
          <tbody>
            <tr>
              {(ex.abacoOptions ?? []).map((opt) => (
                <td key={opt.letter} className="ficha-abaco__option" valign="bottom">
                  <AbacoSvg c={opt.c} d={opt.d} u={opt.u} size="mini" />
                  <div className="ficha-abaco__option-label">
                    <span className="ficha-abaco__choice-mark" aria-hidden>
                      •
                    </span>
                    <span>{opt.letter}</span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  const choices = ex.choiceLabels ?? [];
  return (
    <div className="ficha-abaco">
      <p className="ficha-abaco__question">{ex.question}</p>
      <table className="ficha-abaco__row" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td className="ficha-abaco__visual" valign="top">
              <AbacoSvg c={ex.columns.c} d={ex.columns.d} u={ex.columns.u} size="full" />
            </td>
            <td className="ficha-abaco__choices-cell" valign="middle">
              <div className="ficha-abaco__choices">
                {choices.map((label, i) => (
                  <div key={`${label}-${i}`} className="ficha-abaco__choice">
                    <span className="ficha-abaco__choice-mark" aria-hidden>
                      •
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
