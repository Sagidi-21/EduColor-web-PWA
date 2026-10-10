import type { ComparisonSheetExercise } from "../../types";

export interface ComparisonRendererProps {
  ex: ComparisonSheetExercise;
  showAnswer: boolean;
}

function sizeClass(difficulty: ComparisonSheetExercise["difficulty"]): string {
  return `ficha-compare--${difficulty}`;
}

function questionText(ex: ComparisonSheetExercise): string {
  const base =
    ex.questionType === "mas"
      ? "Redondea la letra donde hay más"
      : "Redondea la letra donde hay menos";
  return ex.allowEqual ? `${base}. Si son iguales pon un signo igual entre las barras` : base;
}

function answerText(ex: ComparisonSheetExercise): string {
  if (ex.answer === "iguales") return "Iguales";
  if (ex.answer === "A" || ex.answer === "B") return `Grupo ${ex.answer}`;
  return "?";
}

function ObjectStrip({
  count,
  imageUrl,
  label,
}: {
  count: number;
  imageUrl: string;
  label: string;
}): JSX.Element {
  const n = Math.max(0, count);
  if (imageUrl) {
    return (
      <div className="ficha-compare__strip" aria-label={`${count} ${label}`}>
        {Array.from({ length: n }, (_, i) => (
          <img key={i} src={imageUrl} alt="" className="ficha-compare__thumb" />
        ))}
      </div>
    );
  }
  return <span className="ficha-compare__count">{count}</span>;
}

/**
 * Alumno: pregunta + grupos A | | B (hueco para = si allowEqual).
 * Soluciones: las maneja ExerciseRenderer (solo texto de respuesta).
 */
export function ComparisonRenderer({ ex, showAnswer }: ComparisonRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{answerText(ex)}</div>;
  }

  return (
    <div className={`ficha-compare ${sizeClass(ex.difficulty)}`}>
      <p className="ficha-compare__question">{questionText(ex)}</p>
      <div className="ficha-compare__groups">
        <div className="ficha-compare__group">
          <span className="ficha-compare__letter">A</span>
          <ObjectStrip count={ex.countA} imageUrl={ex.imageUrl} label={ex.objectLabel} />
        </div>
        {ex.allowEqual ? (
          <>
            <span className="ficha-compare__sep" aria-hidden="true" />
            <span className="ficha-compare__equal-slot" aria-label="Espacio para el signo igual" />
            <span className="ficha-compare__sep" aria-hidden="true" />
          </>
        ) : null}
        <div className="ficha-compare__group">
          <span className="ficha-compare__letter">B</span>
          <ObjectStrip count={ex.countB} imageUrl={ex.imageUrl} label={ex.objectLabel} />
        </div>
      </div>
    </div>
  );
}
