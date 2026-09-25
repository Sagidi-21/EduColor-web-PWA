import type { ReactNode } from "react";
import "./ActivityHeader.css";

export interface ActivityHeaderProps {
  onExit: () => void;
  exitLabel?: string;
  gradeTitle?: string;
  className?: string;
  unitTitle?: string;
  title?: string;
  difficultyStars?: string;
  mascotUrl?: string;
  progress?: string;
  children?: ReactNode;
}

export function ActivityHeader({
  onExit,
  exitLabel = "← Salir",
  gradeTitle,
  className,
  unitTitle,
  title,
  difficultyStars,
  mascotUrl,
  progress,
  children,
}: ActivityHeaderProps): JSX.Element {
  const headerTitle = unitTitle ?? title;

  return (
    <header className="activity-header">
      <button type="button" className="activity-header__exit" onClick={onExit}>
        {exitLabel}
      </button>

      <div className="activity-header__info">
        {(gradeTitle || difficultyStars || className) && (
          <span className="activity-header__meta">
            {gradeTitle}
            {difficultyStars && ` · ${difficultyStars}`}
            {className ? ` — ${className}` : ""}
          </span>
        )}
        {headerTitle && <span className="activity-header__title">{headerTitle}</span>}
      </div>

      <div className="activity-header__right">
        {children}
        {progress && (
          <span className="activity-header__counter" aria-label={`Ejercicio ${progress}`}>
            {progress}
          </span>
        )}
        {mascotUrl && <img src={mascotUrl} alt="" className="activity-header__mascot" />}
      </div>
    </header>
  );
}
