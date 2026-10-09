import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getActivityManifest } from "../../manifests/content-registry";
import { getGenerator } from "./generators/registry";
import { generatePDF } from "./pdf";
import { FichaAlumno } from "./renderers/alumno";
import { FichaSoluciones } from "./renderers/soluciones";
import printCss from "./renderers/print.css?inline";
import type { FichaMeta, FichaMode, SheetConfig, SheetExercise } from "./types";

const LAST_FICHA_KEY = "educolor_ficha_last";

export interface GenerateFichaInput {
  activityId: string;
  config: SheetConfig;
  mode: FichaMode;
  meta?: Partial<FichaMeta>;
  logoUrl?: string;
}

export interface GeneratedFicha {
  exercises: SheetExercise[];
  config: SheetConfig;
  meta: FichaMeta;
  mode: FichaMode;
  html: string;
}

function buildMeta(activityId: string, partial?: Partial<FichaMeta>): FichaMeta {
  const manifest = getActivityManifest(activityId);
  return {
    title: partial?.title ?? manifest?.title ?? activityId,
    grade: partial?.grade ?? "Primaria",
    className: partial?.className,
    mascotUrl: partial?.mascotUrl,
    studentName: partial?.studentName ?? true,
  };
}

/** Genera ejercicios + HTML estático listo para imprimir. */
export function generateFicha(input: GenerateFichaInput): GeneratedFicha {
  const { activityId, config, mode, logoUrl } = input;
  const generator = getGenerator(activityId);
  const exercises = generator.generate({ ...config, activityId });
  const meta = buildMeta(activityId, input.meta);

  const element =
    mode === "soluciones"
      ? createElement(FichaSoluciones, { exercises, config, meta, logoUrl })
      : createElement(FichaAlumno, { exercises, config, meta, logoUrl });

  const body = renderToStaticMarkup(element);
  const html = `<div class="ficha-root">${body}</div>`;

  persistLastFicha({ activityId, config, mode });

  return { exercises, config, meta, mode, html };
}

/** Abre el diálogo de impresión / guardar PDF. */
export function downloadFicha(input: GenerateFichaInput): GeneratedFicha {
  const generated = generateFicha(input);
  const filename = `ficha-${input.activityId}-${input.mode}.pdf`;
  generatePDF(generated.html, filename, {
    title: `${generated.meta.title} (${input.mode})`,
    extraCss: printCss,
  });
  return generated;
}

export interface LastFichaPrefs {
  activityId: string;
  config: SheetConfig;
  mode: FichaMode;
}

export function persistLastFicha(prefs: LastFichaPrefs): void {
  try {
    localStorage.setItem(LAST_FICHA_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage puede fallar en modo privado
  }
}

export function loadLastFicha(): LastFichaPrefs | null {
  try {
    const raw = localStorage.getItem(LAST_FICHA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastFichaPrefs;
  } catch {
    return null;
  }
}

/** Semilla aleatoria estable en el rango del LCG del proyecto. */
export function randomFichaSeed(): number {
  return Math.floor(Math.random() * 999983) || 1;
}
