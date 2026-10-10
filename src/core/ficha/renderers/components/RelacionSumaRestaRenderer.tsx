import type { RelacionSumaRestaSheetExercise } from "../../types";

export interface RelacionSumaRestaRendererProps {
  ex: RelacionSumaRestaSheetExercise;
  showAnswer: boolean;
}

/**
 * Familia de operaciones: tres ecuaciones con hueco (como pizarra).
 */
export function RelacionSumaRestaRenderer({
  ex,
  showAnswer,
}: RelacionSumaRestaRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-answer">
        {ex.partA}+{ex.partB}={ex.total}; {ex.total}−{ex.partA}={ex.partB}; {ex.total}−{ex.partB}=
        {ex.partA}
      </div>
    );
  }

  const blank = <span className="ficha-fam__blank" aria-label="Respuesta" />;

  return (
    <div className="ficha-fam">
      <p className="ficha-fam__intro">
        Total {ex.total}: partes {ex.partA} y {ex.partB}
      </p>
      <div className="ficha-fam__eqs">
        <div className="ficha-fam__eq">
          <span>
            {ex.partA} + {ex.partB} =
          </span>
          {blank}
        </div>
        <div className="ficha-fam__eq">
          <span>
            {ex.total} − {ex.partA} =
          </span>
          {blank}
        </div>
        <div className="ficha-fam__eq">
          <span>
            {ex.total} − {ex.partB} =
          </span>
          {blank}
        </div>
      </div>
    </div>
  );
}
