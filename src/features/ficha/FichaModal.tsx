import { useState } from "react";
import type { ActivityDifficulty, ActivityManifest } from "../../core/content/contracts";
import { downloadFicha, randomFichaSeed, type FichaMode } from "../../core/ficha";
import "./FichaModal.css";

export interface FichaModalProps {
  activity: ActivityManifest;
  difficulty: ActivityDifficulty;
  onDifficultyChange?: (difficulty: ActivityDifficulty) => void;
  gradeTitle?: string;
  className?: string;
  onClose: () => void;
}

const DIFFICULTIES: { id: ActivityDifficulty; label: string }[] = [
  { id: "easy", label: "⭐ Fácil" },
  { id: "medium", label: "⭐⭐ Medio" },
  { id: "hard", label: "⭐⭐⭐ Difícil" },
  { id: "expert", label: "⭐⭐⭐⭐ Experto" },
];

export function FichaModal({
  activity,
  difficulty,
  onDifficultyChange,
  gradeTitle = "Primaria",
  className,
  onClose,
}: FichaModalProps): JSX.Element {
  const [count, setCount] = useState(10);
  const [withImages, setWithImages] = useState(true);
  const [seed, setSeed] = useState(() => randomFichaSeed());
  const [mode, setMode] = useState<FichaMode>("alumno");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setBusy(true);
    setError(null);
    try {
      downloadFicha({
        activityId: activity.id,
        mode,
        config: {
          activityId: activity.id,
          difficulty,
          count,
          withImages,
          seed,
        },
        meta: {
          title: activity.title,
          grade: gradeTitle,
          className,
          studentName: mode === "alumno",
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la ficha.");
    } finally {
      setBusy(false);
    }
  };

  const openPreview = () => {
    const params = new URLSearchParams({
      activity: activity.id,
      mode,
      difficulty,
      count: String(count),
      seed: String(seed),
      withImages: withImages ? "1" : "0",
    });
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
        <button type="button" className="ficha-modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <h2 id="ficha-modal-title" className="ficha-modal__title">
          {activity.boardCard?.icon ?? "📄"} Generar ficha — {activity.title}
        </h2>

        {onDifficultyChange && (
          <fieldset className="ficha-modal__mode">
            <legend>Dificultad</legend>
            {DIFFICULTIES.map((diff) => (
              <label key={diff.id}>
                <input
                  type="radio"
                  name="ficha-difficulty"
                  checked={difficulty === diff.id}
                  onChange={() => onDifficultyChange(diff.id)}
                />
                {diff.label}
              </label>
            ))}
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

        <label className="ficha-modal__field">
          <span>Semilla (reproducible)</span>
          <div className="ficha-modal__seed-row">
            <input
              type="number"
              min={1}
              value={seed}
              onChange={(e) => setSeed(Math.max(1, Number(e.target.value) || 1))}
            />
            <button type="button" onClick={() => setSeed(randomFichaSeed())}>
              Nueva
            </button>
          </div>
        </label>

        <label className="ficha-modal__check">
          <input
            type="checkbox"
            checked={withImages}
            onChange={(e) => setWithImages(e.target.checked)}
          />
          Incluir imágenes cuando la actividad las soporte
        </label>

        <fieldset className="ficha-modal__mode">
          <legend>Tipo de ficha</legend>
          <label>
            <input
              type="radio"
              name="ficha-mode"
              checked={mode === "alumno"}
              onChange={() => setMode("alumno")}
            />
            Alumno (sin soluciones)
          </label>
          <label>
            <input
              type="radio"
              name="ficha-mode"
              checked={mode === "soluciones"}
              onChange={() => setMode("soluciones")}
            />
            Soluciones
          </label>
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
            {busy ? "Generando…" : "Imprimir / PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
