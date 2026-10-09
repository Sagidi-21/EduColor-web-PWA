import type { ComparisonSheetExercise } from "../../types";

export interface ComparisonRendererProps {
  ex: ComparisonSheetExercise;
  showAnswer: boolean;
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
  const n = Math.max(0, Math.min(count, 12));
  if (imageUrl) {
    return (
      <div className="ficha-compare__strip" aria-label={`${count} ${label}`}>
        {Array.from({ length: n }, (_, i) => (
          <img key={i} src={imageUrl} alt="" className="ficha-compare__thumb" />
        ))}
        {count > 12 && <span className="ficha-compare__more">+{count - 12}</span>}
      </div>
    );
  }
  return <span className="ficha-compare__count">{count}</span>;
}

export function ComparisonRenderer({ ex, showAnswer }: ComparisonRendererProps): JSX.Element {
  const q = ex.questionType === "mas" ? "¿Dónde hay más?" : "¿Dónde hay menos?";
  return (
    <div className="ficha-compare">
      <p style={{ margin: 0, fontWeight: 600 }}>{q}</p>
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
      {showAnswer && ex.answer && <div className="ficha-answer">Grupo {ex.answer}</div>}
    </div>
  );
}
