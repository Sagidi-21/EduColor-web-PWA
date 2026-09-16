import "./SummaryScreen.css";

export interface SessionResult {
  correct: number;
  total: number;
  duration: number;
}

export interface SummaryProps {
  result: SessionResult;
  onRestart: () => void;
  onExit: () => void;
  gradeLabel: string;
}

export function SummaryScreen({
  result,
  onRestart,
  onExit,
  gradeLabel,
}: SummaryProps): JSX.Element {
  const pct = Math.round((result.correct / result.total) * 100);
  const mins = Math.floor(result.duration / 60000);
  const secs = Math.floor((result.duration % 60000) / 1000);
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;

  return (
    <div className="summary">
      <div className="summary__card">
        <div className="summary__stars">{"⭐".repeat(stars)}</div>
        <h2 className="summary__title">
          {pct >= 90 ? "¡Excelente!" : pct >= 70 ? "¡Bien hecho!" : "¡Sigue practicando!"}
        </h2>
        <p className="summary__grade">{gradeLabel}</p>
        <div className="summary__stats">
          <div className="summary__stat">
            <span className="summary__stat-value">
              {result.correct}/{result.total}
            </span>
            <span className="summary__stat-label">correctas</span>
          </div>
          <div className="summary__stat">
            <span className="summary__stat-value">{pct}%</span>
            <span className="summary__stat-label">aciertos</span>
          </div>
          <div className="summary__stat">
            <span className="summary__stat-value">
              {mins > 0 ? `${mins}m ` : ""}
              {secs}s
            </span>
            <span className="summary__stat-label">tiempo</span>
          </div>
        </div>
        <div className="summary__actions">
          <button className="summary__btn summary__btn--primary" onClick={onRestart}>
            🔄 Repetir
          </button>
          <button className="summary__btn summary__btn--secondary" onClick={onExit}>
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}
