import type { SheetExercise } from "../../types";

export interface DefaultRendererProps {
  ex: SheetExercise;
  showAnswer: boolean;
}

/**
 * Renderer genérico para familias sin mapper específico (Fase 8.3).
 * Muestra la pregunta principal y, si procede, la respuesta.
 */
export function DefaultRenderer({ ex, showAnswer }: DefaultRendererProps): JSX.Element {
  const e = ex as unknown as Record<string, unknown>;
  const question = (e.question ?? e.prompt ?? e.story) as string | undefined;
  const answer = e.answer;

  return (
    <div>
      {question && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{String(question)}</p>}
      {showAnswer && answer !== undefined && <div className="ficha-answer">{String(answer)}</div>}
    </div>
  );
}
