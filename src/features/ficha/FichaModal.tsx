import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ActivityDifficulty, ActivityManifest } from "../../core/content/contracts";
import {
  A4_WIDTH_MM,
  buildFichaDocument,
  buildFichaDocumentFromExercises,
  buildPrintDocumentHtml,
  defaultFichaCount,
  difficultyStars,
  downloadHtmlAsPdf,
  edgeActivitySupportsImages,
  getGenerator,
  isEdgeContentActivity,
  persistLastFicha,
  randomFichaSeed,
  type FichaDocument,
  type FichaMode,
} from "../../core/ficha";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import { isDemoActivityAllowed } from "../../core/demo/demoMode";
import {
  ContentClientError,
  fetchSumaFichaExercises,
} from "../../platform/content-api/contentClient";
import { ModalCloseButton } from "../shared/components/ModalCloseButton";
import defaultFichaLogoUrl from "../../assets/welcome-logo-bg.png";
import "./FichaModal.css";

function activitySupportsImages(activityId: string): boolean {
  if (isEdgeContentActivity(activityId)) return edgeActivitySupportsImages(activityId);
  try {
    return getGenerator(activityId).supportsImages;
  } catch {
    return false;
  }
}

function contentErrorMessage(err: unknown): string {
  if (err instanceof ContentClientError) {
    if (err.code === "unauthorized" || err.code === "forbidden") {
      return "Necesitas una sesión autorizada para generar esta ficha.";
    }
    if (err.code === "not_configured") {
      return "El servicio de contenido no está configurado.";
    }
    return err.message || "No se pudo generar la ficha.";
  }
  return err instanceof Error ? err.message : "No se pudo generar la ficha.";
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
  /** Color de acento de la clase (configuración). */
  accentColor?: string;
  onClose: () => void;
  /** En DEMO se puede previsualizar pero no guardar PDF. */
  demoMode?: boolean;
}

const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];

type FichaDocResult = { doc: FichaDocument } | { error: string } | null;

export function FichaModal({
  activity,
  difficulty,
  onDifficultyChange,
  demoMode = false,
  gradeTitle = "Primaria",
  subjectTitle = "Matemáticas",
  className,
  mascotUrl,
  accentColor,
  onClose,
}: FichaModalProps): JSX.Element {
  const { primarySchool } = useSchoolAuth();
  const schoolLogoUrl = primarySchool?.logo_ficha_url || defaultFichaLogoUrl;
  const [countDraft, setCountDraft] = useState(() => ({
    activityId: activity.id,
    count: defaultFichaCount(activity.id),
  }));
  const count =
    countDraft.activityId === activity.id ? countDraft.count : defaultFichaCount(activity.id);
  const setCount = (next: number) => {
    setCountDraft({ activityId: activity.id, count: next });
  };
  const [withImages, setWithImages] = useState(true);
  const [includeAlumno, setIncludeAlumno] = useState(true);
  const [includeSoluciones, setIncludeSoluciones] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Una sola semilla por apertura del modal → preview y PDF comparten ejercicios. */
  const [seed] = useState(() => randomFichaSeed());
  const [edgeDoc, setEdgeDoc] = useState<FichaDocResult>(null);
  const [edgeLoading, setEdgeLoading] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [iframeHeightPx, setIframeHeightPx] = useState(1123);

  const supportsImages = activitySupportsImages(activity.id);
  const effectiveWithImages = supportsImages && withImages;
  const edgeActivity = isEdgeContentActivity(activity.id);

  const selectedModes = useCallback((): FichaMode[] => {
    const modes: FichaMode[] = [];
    if (includeAlumno) modes.push("alumno");
    if (includeSoluciones) modes.push("soluciones");
    return modes;
  }, [includeAlumno, includeSoluciones]);

  const localFichaDoc = useMemo((): FichaDocResult => {
    if (edgeActivity) return null;
    const modes = selectedModes();
    if (modes.length === 0) return null;
    if (demoMode && !isDemoActivityAllowed(activity.id)) {
      return { error: "Esta actividad no está disponible en modo DEMO." };
    }
    try {
      const doc = buildFichaDocument({
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
        logoUrl: schoolLogoUrl,
        accentColor,
      });
      return { doc };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "No se pudo generar la vista previa.",
      };
    }
  }, [
    accentColor,
    activity.id,
    activity.title,
    className,
    count,
    demoMode,
    difficulty,
    edgeActivity,
    effectiveWithImages,
    gradeTitle,
    mascotUrl,
    schoolLogoUrl,
    seed,
    selectedModes,
    subjectTitle,
  ]);

  useEffect(() => {
    if (!edgeActivity) {
      setEdgeDoc(null);
      setEdgeLoading(false);
      return;
    }

    const modes = selectedModes();
    if (modes.length === 0) {
      setEdgeDoc(null);
      setEdgeLoading(false);
      return;
    }

    if (demoMode && !isDemoActivityAllowed(activity.id)) {
      setEdgeDoc({ error: "Esta actividad no está disponible en modo DEMO." });
      setEdgeLoading(false);
      return;
    }

    let cancelled = false;
    setEdgeLoading(true);
    setEdgeDoc(null);

    (async () => {
      try {
        const exercises = await fetchSumaFichaExercises({
          difficulty,
          seed,
          count,
          modes,
          withImages: effectiveWithImages,
        });
        if (cancelled) return;
        const doc = buildFichaDocumentFromExercises({
          activityId: activity.id,
          modes,
          exercises,
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
          logoUrl: schoolLogoUrl,
          accentColor,
        });
        setEdgeDoc({ doc });
      } catch (err) {
        if (!cancelled) setEdgeDoc({ error: contentErrorMessage(err) });
      } finally {
        if (!cancelled) setEdgeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accentColor,
    activity.id,
    activity.title,
    className,
    count,
    demoMode,
    difficulty,
    edgeActivity,
    effectiveWithImages,
    gradeTitle,
    mascotUrl,
    schoolLogoUrl,
    seed,
    selectedModes,
    subjectTitle,
  ]);

  const fichaDoc: FichaDocResult = edgeActivity ? edgeDoc : localFichaDoc;

  const previewSrcDoc = useMemo(() => {
    if (!fichaDoc || !("doc" in fichaDoc)) return null;
    return buildPrintDocumentHtml({
      html: fichaDoc.doc.html,
      css: fichaDoc.doc.css,
      variant: "preview",
    });
  }, [fichaDoc]);

  const updateScale = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const pagePx = (A4_WIDTH_MM / 25.4) * 96;
    const available = Math.max(120, viewport.clientWidth - 24);
    setPreviewScale(Math.min(1, available / pagePx));
  }, []);

  useEffect(() => {
    updateScale();
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateScale());
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [updateScale]);

  const onIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc?.body) return;
    const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
    if (height > 0) setIframeHeightPx(height);
    updateScale();
  }, [updateScale]);

  useEffect(() => {
    const id = window.setTimeout(() => onIframeLoad(), 50);
    return () => window.clearTimeout(id);
  }, [previewSrcDoc, onIframeLoad]);

  const handleGenerate = async () => {
    if (!fichaDoc || !("doc" in fichaDoc)) {
      setError("Selecciona al menos un tipo: alumno o soluciones.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { doc } = fichaDoc;
      const modeLabel = doc.modes.join("+");
      persistLastFicha({
        activityId: activity.id,
        config: doc.config,
        mode: doc.modes[0]!,
      });
      await downloadHtmlAsPdf({
        html: doc.html,
        css: doc.css,
        filename: `ficha-${activity.id}-${modeLabel}.pdf`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la ficha.");
    } finally {
      setBusy(false);
    }
  };

  const previewError = edgeLoading
    ? null
    : fichaDoc === null
      ? "Selecciona al menos un tipo: alumno o soluciones."
      : "error" in fichaDoc
        ? fichaDoc.error
        : null;

  return (
    <div className="ficha-modal__backdrop" onClick={onClose} role="presentation">
      <div
        className="ficha-modal"
        role="dialog"
        aria-labelledby="ficha-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalCloseButton onClick={onClose} className="ficha-modal__close" />

        <aside className="ficha-modal__controls">
          <h2 id="ficha-modal-title" className="ficha-modal__title">
            {activity.boardCard?.icon ?? "📄"} {activity.title}
          </h2>

          {onDifficultyChange && (
            <fieldset className="ficha-modal__mode" aria-labelledby="ficha-diff-title">
              <p id="ficha-diff-title" className="ficha-modal__mode-title">
                Dificultad
              </p>
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

          <fieldset className="ficha-modal__mode" aria-labelledby="ficha-tipo-title">
            <p id="ficha-tipo-title" className="ficha-modal__mode-title">
              Tipo de ficha
            </p>
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

          {(error || previewError) && <p className="ficha-modal__error">{error ?? previewError}</p>}

          <div className="ficha-modal__actions">
            <button
              type="button"
              className="ficha-modal__primary"
              onClick={handleGenerate}
              disabled={demoMode || busy || edgeLoading || !fichaDoc || !("doc" in fichaDoc)}
              title={demoMode ? "Guardar PDF no disponible en modo DEMO" : undefined}
            >
              {busy ? "Generando…" : "Guardar PDF"}
            </button>
            {demoMode ? (
              <p className="ficha-modal__hint">En DEMO puedes ver la ficha, pero no guardarla.</p>
            ) : null}
          </div>
        </aside>

        <div className="ficha-modal__preview" ref={viewportRef}>
          {edgeLoading ? (
            <p className="ficha-modal__preview-empty">Cargando vista previa…</p>
          ) : previewSrcDoc ? (
            <div
              className="ficha-modal__preview-scale"
              style={
                {
                  "--ficha-preview-scale": String(previewScale),
                  width: `${A4_WIDTH_MM}mm`,
                  height: iframeHeightPx * previewScale,
                } as CSSProperties
              }
            >
              <iframe
                ref={iframeRef}
                className="ficha-modal__preview-frame"
                title="Vista previa de la ficha (igual que el PDF)"
                srcDoc={previewSrcDoc}
                onLoad={onIframeLoad}
                style={{ height: iframeHeightPx }}
              />
            </div>
          ) : (
            <p className="ficha-modal__preview-empty">
              {previewError ?? "La vista previa aparecerá aquí."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
