import type { ReactNode } from "react";
import type { ProblemaSheetExercise } from "../../types";

export interface ProblemaRendererProps {
  ex: ProblemaSheetExercise;
  showAnswer: boolean;
}

/** Resalta cifras del enunciado (easy/medium/hard) con el color de clase. */
function textWithKeyNumbers(text: string, highlight: boolean): ReactNode {
  if (!highlight) return text;
  const parts = text.split(/(\d+)/);
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="ficha-problema__key-num">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function digitPair(n: number): { d: string; u: string } {
  const d = Math.floor(n / 10);
  return { d: d > 0 ? String(d) : "", u: String(n % 10) };
}

/**
 * Alumno:
 * - easy/medium: enunciado izq. + operación en columna dcha.
 * - hard/expert: enunciado centrado + hueco debajo (números clave resaltados excepto expert).
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function ProblemaRenderer({ ex, showAnswer }: ProblemaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const hasEquation = ex.a !== undefined && ex.b !== undefined && ex.op !== undefined;
  const writeOnly = Boolean(ex.showWriteArea);
  const highlight = Boolean(ex.highlightKeyNumbers);
  const storyText = (ex.story ?? []).filter(Boolean).join(" ");
  const questionText = ex.question ?? "";
  const op = ex.op === "-" ? "−" : "+";
  const a = hasEquation ? digitPair(ex.a!) : null;
  const b = hasEquation ? digitPair(ex.b!) : null;

  return (
    <div
      className={`ficha-problema${writeOnly ? " ficha-problema--write" : " ficha-problema--with-op"}`}
    >
      <div className="ficha-problema__body">
        <div className="ficha-problema__enunciado">
          {ex.emoji ? (
            <span className="ficha-problema__emoji" aria-hidden>
              {ex.emoji}
            </span>
          ) : null}
          <div className="ficha-problema__texts">
            {storyText ? (
              <p className="ficha-problema__text">{textWithKeyNumbers(storyText, highlight)}</p>
            ) : null}
            {questionText ? (
              <p className="ficha-problema__text ficha-problema__text--q">
                {textWithKeyNumbers(questionText, highlight)}
              </p>
            ) : null}
          </div>
        </div>

        {hasEquation && a && b ? (
          <div className="ficha-problema__col" aria-label={`${ex.a} ${op} ${ex.b}`}>
            <span />
            <span className="ficha-problema__col-label">D</span>
            <span className="ficha-problema__col-label">U</span>
            <span />
            <span className="ficha-problema__col-digit">{a.d}</span>
            <span className="ficha-problema__col-digit">{a.u}</span>
            <span className="ficha-problema__col-op">{op}</span>
            <span className="ficha-problema__col-digit">{b.d}</span>
            <span className="ficha-problema__col-digit">{b.u}</span>
            <span className="ficha-problema__col-sep" />
          </div>
        ) : null}
      </div>

      {writeOnly ? (
        <div
          className="ficha-problema__work"
          aria-label="Espacio para la operación y el resultado"
        />
      ) : null}
    </div>
  );
}
