import type { ComparisonSheetExercise } from "../../types";

export interface ComparisonRendererProps {
  ex: ComparisonSheetExercise;
  showAnswer: boolean;
}

function densityClass(countA: number, countB: number): string {
  const max = Math.max(countA, countB);
  if (max >= 15) return "ficha-compare--dense";
  if (max >= 8) return "ficha-compare--compact";
  return "";
}

function questionText(ex: ComparisonSheetExercise): string {
  const base = ex.questionType === "mas" ? "¿Dónde hay más?" : "¿Dónde hay menos?";
  // Misma regla que pizarra: hard/expert pueden ser iguales.
  return ex.allowEqual ? `${base} (pueden ser iguales)` : base;
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

export function ComparisonRenderer({ ex, showAnswer }: ComparisonRendererProps): JSX.Element {
  const q = questionText(ex);

  // Soluciones: solo enunciado + respuesta (sin dibujos).
  if (showAnswer) {
    return (
      <div className="ficha-compare ficha-compare--soluciones">
        <p className="ficha-compare__question">{q}</p>
        <div className="ficha-answer">{answerText(ex)}</div>
      </div>
    );
  }

  return (
    <div className={`ficha-compare ${densityClass(ex.countA, ex.countB)}`.trim()}>
      <p className="ficha-compare__question">{q}</p>
      <div className="ficha-compare__groups">
        <div className="ficha-compare__group">
          <span className="ficha-compare__letter">A</span>
          <ObjectStrip count={ex.countA} imageUrl={ex.imageUrl} label={ex.objectLabel} />
        </div>
        <div className="ficha-compare__group">
          <span className="ficha-compare__letter">B</span>
          <ObjectStrip count={ex.countB} imageUrl={ex.imageUrl} label={ex.objectLabel} />
        </div>
      </div>
    </div>
  );
}
