import type { ActivityDifficulty } from "../../core/content/contracts";
import { buildFichaDocument, type FichaMode, type SheetConfig } from "../../core/ficha";
import { getActivityManifest } from "../../manifests/content-registry";
import printCss from "../../core/ficha/renderers/print.css?inline";
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
    count: Math.max(1, Math.min(30, Number(params.get("count") ?? 10) || 10)),
    seed: Math.max(1, Number(params.get("seed") ?? 42) || 42),
    withImages: params.get("withImages") !== "0",
    grade: params.get("grade") ?? "Primaria",
    subject: params.get("subject") ?? "Matemáticas",
    className: params.get("className") ?? "",
  };
}

/**
 * Vista previa = mismo HTML/CSS que se exporta a PDF (`buildFichaDocument`).
 */
export function FichaPreviewScreen(): JSX.Element {
  const opts = readParams();
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

  let doc: ReturnType<typeof buildFichaDocument> | null = null;
  let error: string | null = null;
  try {
    doc = buildFichaDocument({
      activityId: opts.activityId,
      config,
      modes: opts.modes,
      meta: {
        title,
        grade: opts.grade,
        subject: opts.subject,
        className: opts.className || undefined,
      },
      logoUrl: colegioLogoUrl,
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al generar la ficha";
  }

  const css = doc?.css || printCss;

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

      {error || !doc ? (
        <p className="ficha-preview__error">{error ?? "Error al generar la ficha"}</p>
      ) : (
        <>
          <style dangerouslySetInnerHTML={{ __html: css }} />
          <div className="ficha-preview__sheets" dangerouslySetInnerHTML={{ __html: doc.html }} />
        </>
      )}
    </div>
  );
}
