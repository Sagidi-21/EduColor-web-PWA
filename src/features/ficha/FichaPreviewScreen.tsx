import type { ActivityDifficulty } from "../../core/content/contracts";
import { useClassProfile } from "../../core/context/ClassProfileContext";
import {
  buildFichaDocument,
  buildPrintDocumentHtml,
  defaultFichaCount,
  type FichaMode,
  type SheetConfig,
} from "../../core/ficha";
import { getActivityManifest } from "../../manifests/content-registry";
import colegioLogoUrl from "../../assets/logo-ficha.png";
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

/**
 * Ruta de depuración `/ficha-preview`.
 * Usa el mismo shell HTML/CSS que el PDF y el modal (WYSIWYG).
 */
export function FichaPreviewScreen(): JSX.Element {
  const opts = readParams();
  const { profile } = useClassProfile();
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

  let srcDoc: string | null = null;
  let error: string | null = null;
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
      logoUrl: colegioLogoUrl,
      accentColor: profile.accentColor,
    });
    srcDoc = buildPrintDocumentHtml({
      html: doc.html,
      css: doc.css,
      variant: "preview",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al generar la ficha";
  }

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

      {error || !srcDoc ? (
        <p className="ficha-preview__error">{error ?? "Error al generar la ficha"}</p>
      ) : (
        <iframe className="ficha-preview__frame" title="Vista previa de la ficha" srcDoc={srcDoc} />
      )}
    </div>
  );
}
