import type { AlgoritmoVerticalSheetExercise } from "../../types";

export interface AlgoritmoVerticalRendererProps {
  ex: AlgoritmoVerticalSheetExercise;
  showAnswer: boolean;
}

/**
 * Cuadrícula D·U centrada; sin casillas — espacio bajo la línea para escribir.
 */
export function AlgoritmoVerticalRenderer({
  ex,
  showAnswer,
}: AlgoritmoVerticalRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const op = ex.op === "-" ? "−" : "+";
  const aD = ex.aD > 0 ? String(ex.aD) : "";
  const aU = String(ex.aU);
  const bD = ex.bD > 0 ? String(ex.bD) : "";
  const bU = ex.op === "-" ? (ex.bU > 0 || ex.bD > 0 ? String(ex.bU) : "") : String(ex.bU);

  return (
    <div className="ficha-algcol ficha-algcol--write" aria-label={`${ex.a} ${op} ${ex.b}`}>
      <span />
      <span className="ficha-algcol__label">D</span>
      <span className="ficha-algcol__label">U</span>

      <span />
      <span className="ficha-algcol__digit">{aD}</span>
      <span className="ficha-algcol__digit">{aU}</span>

      <span className="ficha-algcol__op">{op}</span>
      <span className="ficha-algcol__digit">{bD}</span>
      <span className="ficha-algcol__digit">{bU}</span>

      <span className="ficha-algcol__sep" />
    </div>
  );
}
