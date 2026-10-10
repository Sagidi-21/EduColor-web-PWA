import type { IgualdadSheetExercise } from "../../types";
import { ObjectImageRow } from "./ObjectImageRow";

export interface IgualdadRendererProps {
  ex: IgualdadSheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: imágenes (resultado) + fórmula con huecos como en pizarra + ○ opciones.
 * Soluciones: las maneja ExerciseRenderer.
 */
export function IgualdadRenderer({ ex, showAnswer }: IgualdadRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const showImages = ex.type === "result" && Boolean(ex.imageUrl);
  const blank = <span className="ficha-igualdad__blank" aria-label="Espacio para la respuesta" />;

  let formula: JSX.Element;
  if (ex.type === "addend") {
    formula = (
      <>
        {blank}
        <span className="ficha-igualdad__op">+</span>
        <span className="ficha-igualdad__num">{ex.b}</span>
        <span className="ficha-igualdad__op">=</span>
        <span className="ficha-igualdad__num">{ex.c}</span>
      </>
    );
  } else if (ex.type === "decompose") {
    formula = (
      <>
        <span className="ficha-igualdad__num">{ex.c}</span>
        <span className="ficha-igualdad__op">=</span>
        {blank}
        <span className="ficha-igualdad__op">+</span>
        {blank}
      </>
    );
  } else {
    formula = (
      <>
        <span className="ficha-igualdad__num">{ex.a}</span>
        <span className="ficha-igualdad__op">+</span>
        <span className="ficha-igualdad__num">{ex.b}</span>
        <span className="ficha-igualdad__op">=</span>
        {blank}
      </>
    );
  }

  const choices = ex.choiceLabels ?? [];

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
      <div className="ficha-igualdad__formula" aria-label="Operación">
        {formula}
      </div>
      {choices.length > 0 && (
        <div className="ficha-igualdad__choices">
          {choices.map((label, i) => (
            <div key={`${label}-${i}`} className="ficha-igualdad__choice">
              <span className="ficha-igualdad__choice-mark" aria-hidden>
                ○
              </span>
              <span className="ficha-igualdad__choice-text">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
