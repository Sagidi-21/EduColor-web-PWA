import type { OperationSheetExercise } from "../../types";
import { ObjectImageRow } from "./ObjectImageRow";

export interface OperationRendererProps {
  ex: OperationSheetExercise;
  showAnswer: boolean;
}

function padDigits(n: number, cols: number): (string | null)[] {
  const s = String(Math.max(0, n));
  const out: (string | null)[] = Array(cols).fill(null);
  const start = cols - s.length;
  for (let i = 0; i < s.length; i++) out[start + i] = s[i]!;
  return out;
}

/**
 * Alumno: filas de objetos (si hay imagen) + algoritmo vertical con casillas de respuesta.
 * Soluciones: ExerciseRenderer.
 */
export function OperationRenderer({ ex, showAnswer }: OperationRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const op = ex.op === "+" ? "+" : "−";
  const showImages = Boolean(ex.imageUrl);
  const ansLen = String(ex.answer ?? ex.a + (ex.op === "+" ? ex.b : -ex.b)).length;
  const cols = Math.max(String(ex.a).length, String(ex.b).length, ansLen);
  const aDigits = padDigits(ex.a, cols);
  const bDigits = padDigits(ex.b, cols);

  return (
    <div className="ficha-operation">
      {showImages && (
        <div className="ficha-operation__images">
          {ex.op === "+" ? (
            <>
              <ObjectImageRow count={ex.a} imageUrl={ex.imageUrl} />
              <ObjectImageRow count={ex.b} imageUrl={ex.imageUrl} />
            </>
          ) : (
            <ObjectImageRow
              count={ex.a}
              imageUrl={ex.imageUrl}
              crossedFrom={Math.max(0, ex.a - ex.b)}
            />
          )}
        </div>
      )}
      <div
        className="ficha-vop"
        style={{ ["--ficha-vop-cols" as string]: cols }}
        aria-label={`${ex.a} ${op} ${ex.b}`}
      >
        <span className="ficha-vop__sym" />
        {aDigits.map((d, i) => (
          <span key={`a${i}`} className="ficha-vop__digit">
            {d ?? ""}
          </span>
        ))}
        <span className="ficha-vop__sym">{op}</span>
        {bDigits.map((d, i) => (
          <span key={`b${i}`} className="ficha-vop__digit">
            {d ?? ""}
          </span>
        ))}
        <span className="ficha-vop__sep" />
      </div>
    </div>
  );
}
