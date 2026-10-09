import type { IgualdadSheetExercise } from "../../types";
import { ObjectImageRow } from "./ObjectImageRow";

export interface IgualdadRendererProps {
  ex: IgualdadSheetExercise;
  showAnswer: boolean;
}

function formula(ex: IgualdadSheetExercise): string {
  if (ex.type === "addend") return `${ex.a} + ? = ${ex.c}`;
  if (ex.type === "decompose") return `Descompón ${ex.a}`;
  return `${ex.a} + ${ex.b} = ?`;
}

/**
 * Igualdad: en tipo resultado (easy) muestra las mismas filas de objetos que la pizarra.
 */
export function IgualdadRenderer({ ex, showAnswer }: IgualdadRendererProps): JSX.Element {
  const showImages = !showAnswer && ex.type === "result" && Boolean(ex.imageUrl);

  return (
    <div className="ficha-igualdad">
      {showImages && (
        <div className="ficha-igualdad__images">
          <ObjectImageRow count={ex.a} imageUrl={ex.imageUrl} />
          <span className="ficha-igualdad__plus" aria-hidden="true">
            +
          </span>
          <ObjectImageRow count={ex.b} imageUrl={ex.imageUrl} />
        </div>
      )}
      <p className="ficha-igualdad__formula">{formula(ex)}</p>
      {showAnswer && ex.answer !== undefined && <div className="ficha-answer">{ex.answer}</div>}
    </div>
  );
}
