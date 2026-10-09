import { useMemo } from "react";
import type { ActivityDifficulty } from "../../core/content/contracts";
import {
  FichaAlumno,
  FichaSoluciones,
  difficultyStars,
  getGenerator,
  printElement,
  type FichaMeta,
  type FichaMode,
  type SheetConfig,
  type SheetExercise,
} from "../../core/ficha";
import { getActivityManifest } from "../../manifests/content-registry";

/** Logo del colegio con fondo transparente (public/). */
const colegioLogoUrl = "/logo-ficha.png";
import "../../core/ficha/renderers/print.css";
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

export function FichaPreviewScreen(): JSX.Element {
  const opts = useMemo(() => readParams(), []);
  const manifest = getActivityManifest(opts.activityId);

  const config: SheetConfig = {
    activityId: opts.activityId,
    difficulty: opts.difficulty,
    count: opts.count,
    withImages: opts.withImages,
    seed: opts.seed,
  };

  const baseMeta: Omit<FichaMeta, "studentName"> = {
    title: manifest?.title ?? opts.activityId,
    grade: opts.grade,
    subject: opts.subject,
    className: opts.className || undefined,
    difficultyStars: difficultyStars(opts.difficulty),
  };

  let exercises: SheetExercise[];
  let error: string | null = null;
  try {
    exercises = getGenerator(opts.activityId).generate(config);
  } catch (err) {
    exercises = [];
    error = err instanceof Error ? err.message : "Error al generar la ficha";
  }

  const handlePrint = () => {
    const sheets = document.querySelector(".ficha-preview__sheets") as HTMLElement | null;
    if (sheets) {
      printElement(sheets, baseMeta.title);
    } else {
      window.print();
    }
  };

  const modeLabel = opts.modes.join(" + ");

  return (
    <div className="ficha-preview">
      <div className="ficha-preview__toolbar no-print">
        <button type="button" onClick={() => window.close()}>
          Cerrar
        </button>
        <span>
          {baseMeta.title} · {modeLabel}
        </span>
        <button type="button" className="ficha-preview__print" onClick={handlePrint}>
          Imprimir / PDF
        </button>
      </div>

      {error ? (
        <p className="ficha-preview__error">{error}</p>
      ) : (
        <div className="ficha-preview__sheets">
          {opts.modes.map((mode, index) => (
            <div key={mode}>
              {index > 0 ? <div className="ficha-print-break" aria-hidden="true" /> : null}
              {mode === "soluciones" ? (
                <FichaSoluciones
                  exercises={exercises}
                  config={config}
                  meta={{ ...baseMeta, studentName: false }}
                  logoUrl={colegioLogoUrl}
                />
              ) : (
                <FichaAlumno
                  exercises={exercises}
                  config={config}
                  meta={{ ...baseMeta, studentName: true }}
                  logoUrl={colegioLogoUrl}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
