import { useMemo } from "react";
import type { ActivityDifficulty } from "../../core/content/contracts";
import {
  FichaAlumno,
  FichaSoluciones,
  getGenerator,
  printElement,
  type FichaMeta,
  type FichaMode,
  type SheetConfig,
  type SheetExercise,
} from "../../core/ficha";
import { getActivityManifest } from "../../manifests/content-registry";
import "../../core/ficha/renderers/print.css";
import "./FichaPreviewScreen.css";

function readParams(): {
  activityId: string;
  mode: FichaMode;
  difficulty: ActivityDifficulty;
  count: number;
  seed: number;
  withImages: boolean;
} {
  const params = new URLSearchParams(window.location.search);
  const difficulty = (params.get("difficulty") ?? "easy") as ActivityDifficulty;
  return {
    activityId: params.get("activity") ?? "suma",
    mode: params.get("mode") === "soluciones" ? "soluciones" : "alumno",
    difficulty: ["easy", "medium", "hard", "expert"].includes(difficulty) ? difficulty : "easy",
    count: Math.max(1, Math.min(30, Number(params.get("count") ?? 10) || 10)),
    seed: Math.max(1, Number(params.get("seed") ?? 42) || 42),
    withImages: params.get("withImages") !== "0",
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

  const meta: FichaMeta = {
    title: manifest?.title ?? opts.activityId,
    grade: "Primaria",
    studentName: opts.mode === "alumno",
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
    const page = document.querySelector(".ficha-page") as HTMLElement | null;
    if (page) {
      printElement(page, meta.title);
    } else {
      window.print();
    }
  };

  return (
    <div className="ficha-preview">
      <div className="ficha-preview__toolbar no-print">
        <button type="button" onClick={() => window.close()}>
          Cerrar
        </button>
        <span>
          {meta.title} · {opts.mode} · seed {opts.seed}
        </span>
        <button type="button" className="ficha-preview__print" onClick={handlePrint}>
          Imprimir / PDF
        </button>
      </div>

      {error ? (
        <p className="ficha-preview__error">{error}</p>
      ) : opts.mode === "soluciones" ? (
        <FichaSoluciones exercises={exercises} config={config} meta={meta} />
      ) : (
        <FichaAlumno exercises={exercises} config={config} meta={meta} />
      )}
    </div>
  );
}
