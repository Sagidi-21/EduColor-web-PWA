import type { TresSumandosSheetExercise } from "../../types";
import { ObjectImageRow } from "./ObjectImageRow";

export interface TresSumandosRendererProps {
  ex: TresSumandosSheetExercise;
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
 * Tres filas de objetos + algoritmo vertical con casillas (como pizarra).
 */
export function TresSumandosRenderer({ ex, showAnswer }: TresSumandosRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const showImages = Boolean(ex.imageUrl);
  const ans = ex.answer ?? ex.a + ex.b + ex.c;
  const cols = Math.max(
    String(ex.a).length,
    String(ex.b).length,
    String(ex.c).length,
    String(ans).length,
  );
  const aDigits = padDigits(ex.a, cols);
  const bDigits = padDigits(ex.b, cols);
  const cDigits = padDigits(ex.c, cols);

  return (
    <div className={`ficha-tres-sumandos${showImages ? "" : " ficha-tres-sumandos--solo"}`}>
      {showImages && (
        <div className="ficha-tres-sumandos__images">
          <ObjectImageRow count={ex.a} imageUrl={ex.imageUrl} />
          <ObjectImageRow count={ex.b} imageUrl={ex.imageUrl} />
          <ObjectImageRow count={ex.c} imageUrl={ex.imageUrl} />
        </div>
      )}
      <div
        className="ficha-vop"
        style={{ ["--ficha-vop-cols" as string]: cols }}
        aria-label={`${ex.a} + ${ex.b} + ${ex.c}`}
      >
        <span className="ficha-vop__sym" />
        {aDigits.map((d, i) => (
          <span key={`a${i}`} className="ficha-vop__digit">
            {d ?? ""}
          </span>
        ))}
        <span className="ficha-vop__sym">+</span>
        {bDigits.map((d, i) => (
          <span key={`b${i}`} className="ficha-vop__digit">
            {d ?? ""}
          </span>
        ))}
        <span className="ficha-vop__sym">+</span>
        {cDigits.map((d, i) => (
          <span key={`c${i}`} className="ficha-vop__digit">
            {d ?? ""}
          </span>
        ))}
        <span className="ficha-vop__sep" />
        <span className="ficha-vop__sym" />
        {Array.from({ length: cols }, (_, i) => (
          <span key={`ans${i}`} className="ficha-vop__blank" aria-label="Cifra" />
        ))}
      </div>
    </div>
  );
}
