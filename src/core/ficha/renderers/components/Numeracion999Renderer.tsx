import type { Numeracion999SheetExercise } from "../../types";

export interface Numeracion999RendererProps {
  ex: Numeracion999SheetExercise;
  showAnswer: boolean;
}

/**
 * Alumno: número grande o tarjeta C·D·U + ○ opciones (como pizarra).
 */
export function Numeracion999Renderer({ ex, showAnswer }: Numeracion999RendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-n999">
      <p className="ficha-n999__question">{ex.question}</p>
      {ex.showCduCard ? (
        <div className="ficha-n999__cdu" aria-label="Centenas, decenas y unidades">
          <div className="ficha-n999__cdu-col">
            <span className="ficha-n999__cdu-val">{ex.centenas ?? 0}</span>
            <span className="ficha-n999__cdu-label">Centenas</span>
          </div>
          <span className="ficha-n999__cdu-sep">·</span>
          <div className="ficha-n999__cdu-col">
            <span className="ficha-n999__cdu-val">{ex.decenas ?? 0}</span>
            <span className="ficha-n999__cdu-label">Decenas</span>
          </div>
          <span className="ficha-n999__cdu-sep">·</span>
          <div className="ficha-n999__cdu-col">
            <span className="ficha-n999__cdu-val">{ex.unidades ?? 0}</span>
            <span className="ficha-n999__cdu-label">Unidades</span>
          </div>
        </div>
      ) : (
        <div className="ficha-n999__number">{ex.number ?? ""}</div>
      )}
      {choices.length > 0 && (
        <div className="ficha-n999__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-n999__choice">
              <span className="ficha-n999__choice-mark" aria-hidden>
                ○
              </span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
