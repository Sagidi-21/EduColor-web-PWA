import "./WrongFeedback.css";

export interface WrongFeedbackProps {
  correctAnswer?: string;
  onNext: () => void;
  onRetry: () => void;
}

export function WrongFeedback({ correctAnswer, onNext, onRetry }: WrongFeedbackProps): JSX.Element {
  return (
    <div className="wrong-feedback">
      {correctAnswer && (
        <div className="wrong-feedback__answer">Respuesta: {correctAnswer}</div>
      )}
      <div className="wrong-feedback__actions">
        <button
          type="button"
          className="wrong-feedback__btn wrong-feedback__btn--retry"
          onClick={onRetry}
        >
          🔄 Reintentar
        </button>
        <button
          type="button"
          className="wrong-feedback__btn wrong-feedback__btn--next"
          onClick={onNext}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}