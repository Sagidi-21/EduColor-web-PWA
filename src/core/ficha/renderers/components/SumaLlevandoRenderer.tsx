import { Fragment } from "react";
import type { SumaLlevandoSheetExercise } from "../../types";

export interface SumaLlevandoRendererProps {
  ex: SumaLlevandoSheetExercise;
  showAnswer: boolean;
}

const tens = (n: number): string => (Math.floor(n / 10) > 0 ? String(Math.floor(n / 10)) : "");
const units = (n: number): string => String(n % 10);

/**
 * Cuadrícula D·U de «Sumamos llevando» como en pizarra: casilla de llevada encima de las
 * decenas, 2-3 sumandos y dos casillas vacías para el resultado.
 * Soluciones: solo el número (lo maneja `ExerciseRenderer`).
 */
export function SumaLlevandoRenderer({ ex, showAnswer }: SumaLlevandoRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const last = ex.addends.length - 1;

  return (
    <div className="ficha-sumall" aria-label={ex.addends.join(" + ")}>
      <span />
      <span className="ficha-sumall__label">D</span>
      <span className="ficha-sumall__label">U</span>
      <span />

      <span />
      <span className="ficha-sumall__carry" aria-label="Casilla de llevada" />
      <span className="ficha-sumall__carry-label">llevada</span>
      <span />

      {ex.addends.map((n, i) => (
        <Fragment key={i}>
          <span className="ficha-sumall__op">{i === last && last > 0 ? "+" : ""}</span>
          <span className="ficha-sumall__digit">{tens(n)}</span>
          <span className="ficha-sumall__digit">{units(n)}</span>
          <span />
        </Fragment>
      ))}

      <span className="ficha-sumall__sep" />

      <span />
      <span className="ficha-sumall__blank" aria-label="Decenas" />
      <span className="ficha-sumall__blank" aria-label="Unidades" />
      <span />
    </div>
  );
}
