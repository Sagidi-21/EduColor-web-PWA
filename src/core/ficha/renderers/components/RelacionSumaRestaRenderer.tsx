import type { RelacionSumaRestaSheetExercise } from "../../types";

export interface RelacionSumaRestaRendererProps {
  ex: RelacionSumaRestaSheetExercise;
  showAnswer: boolean;
}

function digitDU(n: number): { d: string; u: string } {
  const d = Math.floor(n / 10);
  return { d: d > 0 ? String(d) : "", u: String(n % 10) };
}

/** Una operación de la familia en vertical (D·U), con espacio bajo la línea. */
function VerticalOp({ a, b, op }: { a: number; b: number; op: "+" | "−" }): JSX.Element {
  const top = digitDU(a);
  const bottom = digitDU(b);
  return (
    <div className="ficha-fam__col ficha-fam__col--write" aria-label={`${a} ${op} ${b}`}>
      <span />
      <span className="ficha-fam__label">D</span>
      <span className="ficha-fam__label">U</span>

      <span />
      <span className="ficha-fam__digit">{top.d}</span>
      <span className="ficha-fam__digit">{top.u}</span>

      <span className="ficha-fam__op">{op}</span>
      <span className="ficha-fam__digit">{bottom.d}</span>
      <span className="ficha-fam__digit">{bottom.u}</span>

      <span className="ficha-fam__sep" />
    </div>
  );
}

/**
 * Familia de operaciones: tres operaciones en vertical
 * (total−partA, total−partB, partA+partB), como en pizarra.
 */
export function RelacionSumaRestaRenderer({
  ex,
  showAnswer,
}: RelacionSumaRestaRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-answer">
        {ex.total}−{ex.partA}={ex.partB}; {ex.total}−{ex.partB}={ex.partA}; {ex.partA}+{ex.partB}=
        {ex.total}
      </div>
    );
  }

  return (
    <div className="ficha-fam">
      <p className="ficha-fam__intro">
        Total {ex.total}: partes {ex.partA} y {ex.partB}{" "}
        <span className="ficha-fam__hint">(realiza todas las operaciones)</span>
      </p>
      <div className="ficha-fam__ops">
        <VerticalOp a={ex.total} b={ex.partA} op="−" />
        <VerticalOp a={ex.total} b={ex.partB} op="−" />
        <VerticalOp a={ex.partA} b={ex.partB} op="+" />
      </div>
    </div>
  );
}
