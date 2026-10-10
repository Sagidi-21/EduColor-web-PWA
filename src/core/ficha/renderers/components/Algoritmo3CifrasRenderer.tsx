import type { Algoritmo3CifrasSheetExercise } from "../../types";

export interface Algoritmo3CifrasRendererProps {
  ex: Algoritmo3CifrasSheetExercise;
  showAnswer: boolean;
}

/** Columnas con casilla de llevar/prestar, desde la izquierda: C=0, D=1 (U nunca recibe). */
const CARRY_SLOTS = [0, 1] as const;
const COLUMNS = ["C", "D", "U"] as const;

/**
 * Cuadrícula C·D·U como `ColumnCarryOperation` en pizarra: fila de casillas de llevar
 * (o prestar) sobre centenas y decenas, los dos números, raya y tres casillas vacías.
 * Soluciones: solo el resultado (lo maneja `ExerciseRenderer`).
 */
export function Algoritmo3CifrasRenderer({
  ex,
  showAnswer,
}: Algoritmo3CifrasRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const op = ex.op === "-" ? "−" : "+";
  const aDigits = [ex.aC, ex.aD, ex.aU];
  const bDigits = [ex.bC, ex.bD, ex.bU];

  return (
    <div className="ficha-alg3" aria-label={`${ex.a} ${op} ${ex.b}`}>
      <span />
      {COLUMNS.map((c) => (
        <span key={c} className="ficha-alg3__label">
          {c}
        </span>
      ))}
      <span />

      <span />
      {COLUMNS.map((c, i) =>
        (CARRY_SLOTS as readonly number[]).includes(i) ? (
          <span key={c} className="ficha-alg3__carry" aria-label={`Casilla de ${ex.carryLabel}`} />
        ) : (
          <span key={c} />
        ),
      )}
      <span className="ficha-alg3__carry-label">{ex.carryLabel}</span>

      <span />
      {aDigits.map((d, i) => (
        <span key={`a${i}`} className="ficha-alg3__digit">
          {d}
        </span>
      ))}
      <span />

      <span className="ficha-alg3__op">{op}</span>
      {bDigits.map((d, i) => (
        <span key={`b${i}`} className="ficha-alg3__digit">
          {d}
        </span>
      ))}
      <span />

      <span className="ficha-alg3__sep" />

      <span />
      <span className="ficha-alg3__blank" aria-label="Centenas" />
      <span className="ficha-alg3__blank" aria-label="Decenas" />
      <span className="ficha-alg3__blank" aria-label="Unidades" />
      <span />
    </div>
  );
}
