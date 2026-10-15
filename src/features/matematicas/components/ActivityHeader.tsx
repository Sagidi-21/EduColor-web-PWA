import { useContext, type ReactNode } from "react";
import { ExerciseSessionContext } from "../ExerciseSessionContext";
import { starsForIndex, type LevelIndex } from "../levelSelect";
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
  /** Slot central: entre el título y las estrellas. */
  children?: ReactNode;
}

const LEVEL_INDICES: LevelIndex[] = [0, 1, 2, 3];

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
  // Lectura opcional: los tests de pantalla montan el header sin provider.
  const sessionCtx = useContext(ExerciseSessionContext);
  const showLevelChips = !!sessionCtx?.session && sessionCtx.currentLevelIndex !== null;

  return (
    <header className="activity-header">
      <button type="button" className="activity-header__exit" onClick={onExit}>
        {exitLabel}
      </button>

      <div className="activity-header__info">
        {(gradeTitle || className) && (
          <span className="activity-header__meta">
            {gradeTitle}
            {className ? ` — ${className}` : ""}
          </span>
        )}
        {headerTitle && <span className="activity-header__title">{headerTitle}</span>}
      </div>

      {/* Hueco flexible entre título y estrellas; centra lo que haya (p. ej. Verificar/Siguiente). */}
      <div className="activity-header__center">{children}</div>

      <div className="activity-header__right">
        {showLevelChips ? (
          <div className="activity-header__levels" role="group" aria-label="Nivel de dificultad">
            {LEVEL_INDICES.map((index) => {
              const active = index === sessionCtx!.currentLevelIndex;
              return (
                <button
                  key={index}
                  type="button"
                  className={`activity-header__level-chip${active ? " activity-header__level-chip--active" : ""}`}
                  disabled={active}
                  aria-label={`Nivel ${index + 1}`}
                  aria-current={active ? "true" : undefined}
                  onClick={() => sessionCtx!.setLevelIndex(index)}
                >
                  {starsForIndex(index)}
                </button>
              );
            })}
          </div>
        ) : (
          difficultyStars && (
            <span className="activity-header__meta-stars" aria-hidden="true">
              {difficultyStars}
            </span>
          )
        )}
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
