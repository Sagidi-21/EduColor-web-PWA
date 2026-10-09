import type { PoligonosSheetExercise } from "../../types";
import { ShapeSvg } from "./ShapeSvg";
import { QuestionRenderer } from "./QuestionRenderer";

export interface PoligonosRendererProps {
  ex: PoligonosSheetExercise;
  showAnswer: boolean;
}

export function PoligonosRenderer({ ex, showAnswer }: PoligonosRendererProps): JSX.Element {
  return (
    <div className="ficha-poligonos">
      <QuestionRenderer question={ex.question} answer={ex.answer} showAnswer={showAnswer} />
      {ex.imageUrl ? (
        <div className="ficha-poligonos__figure">
          <img src={ex.imageUrl} alt="" className="ficha-exercise__image" />
        </div>
      ) : (
        ex.shape && (
          <div className="ficha-poligonos__figure">
            <ShapeSvg shape={ex.shape} size={88} />
          </div>
        )
      )}
      {ex.optionsList && ex.optionsList.length > 0 && (
        <div className="ficha-poligonos__options">
          {ex.optionsList.map((opt, i) => (
            <div key={i} className="ficha-poligonos__option">
              <span className="ficha-poligonos__opt-label">{String.fromCharCode(65 + i)}</span>
              <ShapeSvg shape={opt} size={48} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
