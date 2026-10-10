import type { Abaco3CifrasSheetExercise } from "../../types";
import { AbacoSvg } from "./AbacoSvg";

export interface Abaco3CifrasRendererProps {
  ex: Abaco3CifrasSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno:
 * - read-abaco / valor-posicional: ábaco SVG + pregunta + • opciones.
 * - find-abaco: número en badge + 4 ábacos (A-D) con • para marcar.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta; letra en find-abaco).
 */
export function Abaco3CifrasRenderer({ ex, showAnswer }: Abaco3CifrasRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  if (ex.variant === "find-abaco") {
    return (
      <div className="ficha-abaco">
        <p className="ficha-abaco__question">{ex.question}</p>
        <div className="ficha-abaco__badge">{ex.number}</div>
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
