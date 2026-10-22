import { useEffect, useState } from "react";
import type { ActivityDifficulty } from "../../core/content/contracts";
import { useClassProfile } from "../../core/context/ClassProfileContext";
import { useSchoolAuth } from "../../core/context/SchoolAuthContext";
import {
  buildFichaDocument,
  buildFichaDocumentFromExercises,
  buildPrintDocumentHtml,
  defaultFichaCount,
  isEdgeContentActivity,
  type FichaMode,
  type SheetConfig,
} from "../../core/ficha";
import { getActivityManifest } from "../../manifests/content-registry";
import {
  ContentClientError,
  fetchSumaFichaExercises,
} from "../../platform/content-api/contentClient";
import defaultFichaLogoUrl from "../../assets/welcome-logo-bg.png";
import "./FichaPreviewScreen.css";

function parseModes(raw: string | null): FichaMode[] {
  const parts = (raw ?? "alumno")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const modes: FichaMode[] = [];
  for (const part of parts) {
    if (part === "soluciones" && !modes.includes("soluciones")) modes.push("soluciones");
    if (part === "alumno" && !modes.includes("alumno")) modes.push("alumno");
  }
  return modes.length > 0 ? modes : ["alumno"];
}

function readParams(): {
  activityId: string;
  modes: FichaMode[];
  difficulty: ActivityDifficulty;
  count: number;
  seed: number;
  withImages: boolean;
  grade: string;
  subject: string;
  className: string;
} {
  const params = new URLSearchParams(window.location.search);
  const difficulty = (params.get("difficulty") ?? "easy") as ActivityDifficulty;
  return {
    activityId: params.get("activity") ?? "suma",
    modes: parseModes(params.get("mode")),
    difficulty: ["easy", "medium", "hard", "expert"].includes(difficulty) ? difficulty : "easy",
    count: Math.max(
      1,
      Math.min(
        30,
        Number(params.get("count") ?? defaultFichaCount(params.get("activity") ?? "suma")) || 10,
      ),
    ),
    seed: Math.max(1, Number(params.get("seed") ?? 42) || 42),
    withImages: params.get("withImages") !== "0",
    grade: params.get("grade") ?? "Primaria",
    subject: params.get("subject") ?? "Matemáticas",
    className: params.get("className") ?? "",
  };
}

function contentErrorMessage(err: unknown): string {
  if (err instanceof ContentClientError) {
    if (err.code === "unauthorized" || err.code === "forbidden") {
      return "Necesitas una sesión autorizada para previsualizar esta ficha.";
    }
    return err.message || "Error al generar la ficha";
  }
  return err instanceof Error ? err.message : "Error al generar la ficha";
}

/**
 * Ruta de depuración `/ficha-preview`.
 * Usa el mismo shell HTML/CSS que el PDF y el modal (WYSIWYG).
 * `suma` (D2) solo vía Edge content-ficha.
 */
export function FichaPreviewScreen(): JSX.Element {
  const opts = readParams();
  const { profile } = useClassProfile();
  const { primarySchool } = useSchoolAuth();
  const logoUrl = primarySchool?.logo_ficha_url || defaultFichaLogoUrl;
  const manifest = getActivityManifest(opts.activityId);
  const title = manifest?.title ?? opts.activityId;
  const modeLabel = opts.modes.join(" + ");

  const config: SheetConfig = {
    activityId: opts.activityId,
    difficulty: opts.difficulty,
    count: opts.count,
    withImages: opts.withImages,
    seed: opts.seed,
  };

  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdgeContentActivity(opts.activityId));

  useEffect(() => {
    let cancelled = false;

    if (!isEdgeContentActivity(opts.activityId)) {
      try {
        const doc = buildFichaDocument({
          activityId: opts.activityId,
          config,
          modes: opts.modes,
          meta: {
            title,
            grade: opts.grade,
            subject: opts.subject,
            className: opts.className || profile.className || undefined,
          },
          logoUrl,
          accentColor: profile.accentColor,
        });
        if (!cancelled) {
          setSrcDoc(
            buildPrintDocumentHtml({
              html: doc.html,
              css: doc.css,
              variant: "preview",
            }),
          );
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al generar la ficha");
          setSrcDoc(null);
          setLoading(false);
        }
      }
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    (async () => {
      try {
        const exercises = await fetchSumaFichaExercises({
          difficulty: opts.difficulty,
          seed: opts.seed,
          count: opts.count,
          modes: opts.modes,
          withImages: opts.withImages,
        });
        if (cancelled) return;
        const doc = buildFichaDocumentFromExercises({
          activityId: opts.activityId,
          config,
          modes: opts.modes,
          exercises,
          meta: {
            title,
            grade: opts.grade,
            subject: opts.subject,
            className: opts.className || profile.className || undefined,
          },
          logoUrl,
          accentColor: profile.accentColor,
        });
        setSrcDoc(
          buildPrintDocumentHtml({
            html: doc.html,
            css: doc.css,
            variant: "preview",
          }),
        );
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(contentErrorMessage(err));
          setSrcDoc(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Params de URL + perfil: re-render al abrir; no hace falta reactividad fina.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.activityId, opts.seed, opts.count, opts.difficulty, opts.withImages, modeLabel]);

  return (
    <div className="ficha-preview">
      <div className="ficha-preview__toolbar no-print">
        <button type="button" onClick={() => window.close()}>
          Cerrar
        </button>
        <span>
          {title} · {modeLabel}
        </span>
      </div>

      {loading ? (
        <p className="ficha-preview__error">Cargando vista previa…</p>
      ) : error || !srcDoc ? (
        <p className="ficha-preview__error">{error ?? "Error al generar la ficha"}</p>
      ) : (
        <iframe className="ficha-preview__frame" title="Vista previa de la ficha" srcDoc={srcDoc} />
      )}
    </div>
  );
}
