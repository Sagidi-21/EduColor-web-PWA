import { useState } from "react";
import type { ActivityDifficulty, ActivityManifest } from "../../core/content/contracts";
import {
  downloadFichas,
  difficultyStars,
  getGenerator,
  randomFichaSeed,
  type FichaMode,
} from "../../core/ficha";
import { ModalCloseButton } from "../shared/components/ModalCloseButton";
import "./FichaModal.css";

function activitySupportsImages(activityId: string): boolean {
  try {
    return getGenerator(activityId).supportsImages;
  } catch {
    return false;
  }
}

export interface FichaModalProps {
  activity: ActivityManifest;
  difficulty: ActivityDifficulty;
  onDifficultyChange?: (difficulty: ActivityDifficulty) => void;
  /** Curso, p. ej. "1º Primaria". */
  gradeTitle?: string;
  /** Materia, p. ej. "Matemáticas". */
  subjectTitle?: string;
  /** Nombre de la clase (configuración). */
  className?: string;
  /** Mascota de la clase (configuración), para la cabecera del Word. */
  mascotUrl?: string;
  onClose: () => void;
}

const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];

export function FichaModal({
  activity,
  difficulty,
  onDifficultyChange,
  gradeTitle = "Primaria",
  subjectTitle = "Matemáticas",
  className,
  mascotUrl,
  onClose,
}: FichaModalProps): JSX.Element {
  const [count, setCount] = useState(10);
  const [withImages, setWithImages] = useState(true);
  const [includeAlumno, setIncludeAlumno] = useState(true);
  const [includeSoluciones, setIncludeSoluciones] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Una sola semilla por apertura del modal → preview y Word comparten ejercicios. */
  const [seed] = useState(() => randomFichaSeed());

  const supportsImages = activitySupportsImages(activity.id);
  const effectiveWithImages = supportsImages && withImages;

  const selectedModes = (): FichaMode[] => {
    const modes: FichaMode[] = [];
    if (includeAlumno) modes.push("alumno");
    if (includeSoluciones) modes.push("soluciones");
    return modes;
  };

  const handleGenerate = async () => {
    const modes = selectedModes();
    if (modes.length === 0) {
      setError("Selecciona al menos un tipo: alumno o soluciones.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await downloadFichas({
        activityId: activity.id,
        modes,
        config: {
          activityId: activity.id,
          difficulty,
          count,
          withImages: effectiveWithImages,
          seed,
        },
        meta: {
          title: activity.title,
          grade: gradeTitle,
          subject: subjectTitle,
          className,
          mascotUrl,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la ficha.");
    } finally {
      setBusy(false);
    }
  };

  const openPreview = () => {
    const modes = selectedModes();
    if (modes.length === 0) {
      setError("Selecciona al menos un tipo: alumno o soluciones.");
      return;
    }
    setError(null);
    const params = new URLSearchParams({
      activity: activity.id,
      mode: modes.join(","),
      difficulty,
      count: String(count),
      seed: String(seed),
      withImages: effectiveWithImages ? "1" : "0",
      grade: gradeTitle,
      subject: subjectTitle,
    });
    if (className) params.set("className", className);
    window.open(`/ficha-preview?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="ficha-modal__backdrop" onClick={onClose} role="presentation">
      <div
        className="ficha-modal"
        role="dialog"
        aria-labelledby="ficha-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalCloseButton onClick={onClose} className="ficha-modal__close" />

        <h2 id="ficha-modal-title" className="ficha-modal__title">
          {activity.boardCard?.icon ?? "📄"} Generar ficha — {activity.title}
        </h2>

        {onDifficultyChange && (
          <fieldset className="ficha-modal__mode">
            <legend>Dificultad</legend>
            {DIFFICULTIES.map((diff) => {
              const desc = activity.boardCard?.difficultyDescriptions?.[diff];
              return (
                <label key={diff} className="ficha-modal__difficulty">
                  <input
                    type="radio"
                    name="ficha-difficulty"
                    checked={difficulty === diff}
                    onChange={() => onDifficultyChange(diff)}
                  />
                  <span className="ficha-modal__stars" aria-hidden="true">
                    {difficultyStars(diff)}
                  </span>
                  {desc && <span className="ficha-modal__diff-desc">{desc}</span>}
                </label>
              );
            })}
          </fieldset>
        )}

        <label className="ficha-modal__field">
          <span>Número de ejercicios</span>
          <input
            type="number"
            min={1}
            max={30}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
          />
        </label>

        {supportsImages ? (
          <label className="ficha-modal__check">
            <input
              type="checkbox"
              checked={withImages}
              onChange={(e) => setWithImages(e.target.checked)}
            />
            Incluir imágenes (como en la pizarra)
          </label>
        ) : (
          <p className="ficha-modal__hint">
            Esta actividad no usa imágenes de objetos en la ficha.
          </p>
        )}

        <fieldset className="ficha-modal__mode">
          <legend>Tipo de ficha</legend>
          <label>
            <input
              type="checkbox"
              checked={includeAlumno}
              onChange={(e) => setIncludeAlumno(e.target.checked)}
            />
            Alumno (sin soluciones)
          </label>
          <label>
            <input
              type="checkbox"
              checked={includeSoluciones}
              onChange={(e) => setIncludeSoluciones(e.target.checked)}
            />
            Soluciones
          </label>
          <p className="ficha-modal__hint">
            Si marcas ambas, se generan con los mismos ejercicios.
          </p>
        </fieldset>

        {error && <p className="ficha-modal__error">{error}</p>}

        <div className="ficha-modal__actions">
          <button type="button" className="ficha-modal__secondary" onClick={openPreview}>
            Vista previa
          </button>
          <button
            type="button"
            className="ficha-modal__primary"
            onClick={handleGenerate}
            disabled={busy}
          >
            {busy ? "Generando…" : "Guardar Word"}
          </button>
        </div>
      </div>
    </div>
  );
}
