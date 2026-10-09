export interface QuestionRendererProps {
  question: string;
  answer?: string | number;
  showAnswer: boolean;
  detail?: string;
}

/** Renderer genérico pregunta + respuesta para la mayoría de familias. */
export function QuestionRenderer({
  question,
  answer,
  showAnswer,
  detail,
}: QuestionRendererProps): JSX.Element {
  return (
    <div>
      {question && (
        <p
          className="ficha-exercise__question ficha-mt-0"
          style={{ margin: 0, whiteSpace: "pre-wrap" }}
        >
          {question}
        </p>
      )}
      {detail && <p style={{ margin: "4px 0 0", color: "#555", fontSize: 12 }}>{detail}</p>}
      {showAnswer && answer !== undefined && answer !== "" && (
        <div className="ficha-answer">{String(answer)}</div>
      )}
    </div>
  );
}
