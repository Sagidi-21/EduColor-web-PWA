import "./ActivityActionButtons.css";

export interface ActionButtonsProps {
  onRetry: () => void;
  onNext: () => void;
  retryLabel?: string;
  nextLabel?: string;
  className?: string;
}

export function ActionButtons({
  onRetry,
  onNext,
  retryLabel = "🔄 Reintentar",
  nextLabel = "Siguiente →",
  className = "",
}: ActionButtonsProps): JSX.Element {
  return (
    <div className={`activity-actions ${className}`.trim()}>
      <button type="button" className="activity-action activity-action--retry" onClick={onRetry}>
        {retryLabel}
      </button>
      <button type="button" className="activity-action activity-action--next" onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  );
}
