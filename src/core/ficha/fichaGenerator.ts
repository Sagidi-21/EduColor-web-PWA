import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getActivityManifest } from "../../manifests/content-registry";
import { difficultyStars } from "./difficultyStars";
import { getGenerator } from "./generators/registry";
import { FichaAlumno } from "./renderers/alumno";
import { FichaSoluciones } from "./renderers/soluciones";
import printCss from "./renderers/print.css?inline";
import { downloadHtmlAsWord } from "./wordHtmlExport";
import type { FichaMeta, FichaMode, SheetConfig, SheetExercise } from "./types";

/** Logo del colegio con fondo transparente (public/). */
const colegioLogoUrl = "/logo-ficha.png";
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

function buildMeta(
  activityId: string,
  config: SheetConfig,
  partial?: Partial<FichaMeta>,
): FichaMeta {
  const manifest = getActivityManifest(activityId);
  return {
    title: partial?.title ?? manifest?.title ?? activityId,
    grade: partial?.grade ?? "Primaria",
    subject: partial?.subject,
    className: partial?.className,
    mascotUrl: partial?.mascotUrl,
    studentName: partial?.studentName ?? true,
    difficultyStars: partial?.difficultyStars ?? difficultyStars(config.difficulty),
  };
}

function renderFichaHtml(
  mode: FichaMode,
  exercises: SheetExercise[],
  config: SheetConfig,
  meta: FichaMeta,
  logoUrl: string,
): string {
  const element =
    mode === "soluciones"
      ? createElement(FichaSoluciones, { exercises, config, meta, logoUrl })
      : createElement(FichaAlumno, { exercises, config, meta, logoUrl });
  return `<div class="ficha-root">${renderToStaticMarkup(element)}</div>`;
}

/** Genera ejercicios + HTML estático listo para imprimir. */
export function generateFicha(input: GenerateFichaInput): GeneratedFicha {
  const { activityId, config, mode, logoUrl = colegioLogoUrl } = input;
  const generator = getGenerator(activityId);
  const exercises = generator.generate({ ...config, activityId });
  const meta = buildMeta(activityId, config, {
    ...input.meta,
    studentName: input.meta?.studentName ?? mode === "alumno",
  });
  const html = renderFichaHtml(mode, exercises, config, meta, logoUrl);

  persistLastFicha({ activityId, config, mode });

  return { exercises, config, meta, mode, html };
}

export interface DownloadFichasInput {
  activityId: string;
  config: SheetConfig;
  /** Uno o ambos tipos; comparten la misma semilla / ejercicios. */
  modes: readonly FichaMode[];
  meta?: Partial<FichaMeta>;
  logoUrl?: string;
}

/**
 * Descarga un Word (.doc) con el mismo aspecto que la vista previa HTML.
 * Si hay dos modos, van en el mismo documento con salto de página entre ellas.
 */
export async function downloadFichas(input: DownloadFichasInput): Promise<SheetExercise[]> {
  const modes = uniqueModes(input.modes);
  if (modes.length === 0) {
    throw new Error("Selecciona al menos un tipo de ficha (alumno o soluciones).");
  }

  const { activityId, config, logoUrl = colegioLogoUrl } = input;
  const generator = getGenerator(activityId);
  const exercises = generator.generate({ ...config, activityId });

  const chunks = modes.map((mode) => {
    const meta = buildMeta(activityId, config, {
      ...input.meta,
      studentName: mode === "alumno",
    });
    return renderFichaHtml(mode, exercises, config, meta, logoUrl);
  });

  const html = chunks.join('<div class="ficha-print-break" aria-hidden="true"></div>');
  const modeLabel = modes.join("+");

  persistLastFicha({ activityId, config, mode: modes[0]! });

  await downloadHtmlAsWord({
    html,
    css: printCss,
    filename: `ficha-${activityId}-${modeLabel}.doc`,
  });

  return exercises;
}

/** Descarga la ficha en Word con el mismo HTML/CSS que la vista previa. */
export async function downloadFicha(input: GenerateFichaInput): Promise<GeneratedFicha> {
  const generated = generateFicha(input);
  await downloadHtmlAsWord({
    html: generated.html,
    css: printCss,
    filename: `ficha-${input.activityId}-${input.mode}.doc`,
  });
  return generated;
}

function uniqueModes(modes: readonly FichaMode[]): FichaMode[] {
  const out: FichaMode[] = [];
  for (const mode of modes) {
    if ((mode === "alumno" || mode === "soluciones") && !out.includes(mode)) {
      out.push(mode);
    }
  }
  return out;
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
