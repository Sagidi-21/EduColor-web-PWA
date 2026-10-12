import type { TresSumandosColumnaSheetExercise } from "../../types";

export interface TresSumandosColumnaRendererProps {
  ex: TresSumandosColumnaSheetExercise;
  showAnswer: boolean;
}

/**
 * Cuadrícula D·U con tres sumandos; sin casillas — espacio bajo la línea para escribir.
 */
export function TresSumandosColumnaRenderer({
  ex,
  showAnswer,
}: TresSumandosColumnaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const d = (n: number) => (Math.floor(n / 10) > 0 ? String(Math.floor(n / 10)) : "");
  const u = (n: number) => String(n % 10);

  return (
    <div
      className="ficha-algcol ficha-algcol--3 ficha-algcol--write"
      aria-label={`${ex.a} + ${ex.b} + ${ex.c}`}
    >
      <span />
      <span className="ficha-algcol__label">D</span>
      <span className="ficha-algcol__label">U</span>

      <span />
      <span className="ficha-algcol__digit">{d(ex.a)}</span>
      <span className="ficha-algcol__digit">{u(ex.a)}</span>

      <span />
      <span className="ficha-algcol__digit">{d(ex.b)}</span>
      <span className="ficha-algcol__digit">{u(ex.b)}</span>

      <span className="ficha-algcol__op">+</span>
      <span className="ficha-algcol__digit">{d(ex.c)}</span>
      <span className="ficha-algcol__digit">{u(ex.c)}</span>

      <span className="ficha-algcol__sep" />
    </div>
  );
}
