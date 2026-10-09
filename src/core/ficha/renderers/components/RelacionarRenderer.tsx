import type { RelacionarSheetExercise, RelacionarSheetRightItem } from "../../types";

export interface RelacionarRendererProps {
  ex: RelacionarSheetExercise;
  showAnswer: boolean;
}

function densityClass(ex: RelacionarSheetExercise): string {
  const maxCount = Math.max(0, ...ex.right.map((r) => r.count));
  const pairs = ex.left.length;
  if (pairs >= 5 || maxCount >= 12) return "ficha-relacionar--dense";
  if (pairs >= 4 || maxCount >= 8) return "ficha-relacionar--compact";
  return "";
}

function ObjectRow({ item }: { item: RelacionarSheetRightItem }): JSX.Element {
  if (item.imageUrl) {
    return (
      <div className="ficha-relacionar__strip" aria-label={`${item.count} ${item.objectLabel}`}>
        {Array.from({ length: item.count }, (_, i) => (
          <img key={i} src={item.imageUrl} alt="" className="ficha-relacionar__thumb" />
        ))}
      </div>
    );
  }
  return <span className="ficha-relacionar__count-badge">{item.count}</span>;
}

export function RelacionarRenderer({ ex, showAnswer }: RelacionarRendererProps): JSX.Element {
  // Soluciones: solo emparejamientos (sin enunciado ni figuras).
  if (showAnswer) {
    return (
      <div className="ficha-answer ficha-relacionar__answers">{(ex.answer ?? []).join(" · ")}</div>
    );
  }

  return (
    <div className={`ficha-relacionar ${densityClass(ex)}`.trim()}>
      <p className="ficha-relacionar__instruction">Une con una línea cada número con su grupo</p>

      <div className="ficha-relacionar__board">
        <div className="ficha-relacionar__left" aria-label="Números">
          {ex.left.map((item) => (
            <div key={item.id} className="ficha-relacionar__num">
              <span className="ficha-relacionar__num-value">{item.number}</span>
              <span className="ficha-relacionar__dot" aria-hidden="true" />
            </div>
          ))}
        </div>

        <div className="ficha-relacionar__gap" aria-hidden="true" />

        <div className="ficha-relacionar__right" aria-label="Grupos">
          {ex.right.map((item) => (
            <div key={item.id} className="ficha-relacionar__group">
              <span className="ficha-relacionar__dot" aria-hidden="true" />
              <span className="ficha-relacionar__letter">{item.letter}</span>
              <ObjectRow item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
