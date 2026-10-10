import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getActivityManifest } from "../../manifests/content-registry";
import { buildAccentCssVars } from "./accentCss";
import { difficultyStars } from "./difficultyStars";
import { getGenerator } from "./generators/registry";
import { FichaAlumno } from "./renderers/alumno";
import { FichaSoluciones } from "./renderers/soluciones";
import printCss from "./renderers/print/print-bundle";
import { downloadHtmlAsPdf } from "./pdfExport";
import { downloadHtmlAsWord } from "./wordHtmlExport";
import type { FichaMeta, FichaMode, SheetConfig, SheetExercise } from "./types";
/** Logo empaquetado por Vite (URL estable + inlinable a data URL en export). */
import colegioLogoUrl from "../../assets/logo-ficha.png";

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

export interface BuildFichaDocumentInput {
  activityId: string;
  config: SheetConfig;
  /** Uno o ambos tipos; comparten la misma semilla / ejercicios. */
  modes: readonly FichaMode[];
  meta?: Partial<FichaMeta>;
  logoUrl?: string;
  /** Color de acento de la clase (`#rrggbb`) para números / UI de ficha. */
  accentColor?: string;
}

export interface FichaDocumentChunk {
  mode: FichaMode;
  meta: FichaMeta;
  html: string;
}

/** Documento canónico compartido por vista previa y exportación Word. */
export interface FichaDocument {
  exercises: SheetExercise[];
  config: SheetConfig;
  modes: FichaMode[];
  css: string;
  /** HTML de todos los modos unidos con salto de página. */
  html: string;
  chunks: FichaDocumentChunk[];
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

/**
 * Construye el documento de ficha una sola vez (ejercicios + HTML + CSS).
 * Preview y Word deben consumir este builder con la misma seed.
 */
export function buildFichaDocument(input: BuildFichaDocumentInput): FichaDocument {
  const modes = uniqueModes(input.modes);
  if (modes.length === 0) {
    throw new Error("Selecciona al menos un tipo de ficha (alumno o soluciones).");
  }

  const { activityId, config, logoUrl = colegioLogoUrl } = input;
  const generator = getGenerator(activityId);
  const exercises = generator.generate({ ...config, activityId });

  const chunks = modes.map((mode) => {
    const baseMeta = buildMeta(activityId, config, {
      ...input.meta,
      studentName: input.meta?.studentName ?? mode === "alumno",
    });
    const meta =
      mode === "soluciones" && !/soluciones/i.test(baseMeta.title)
        ? { ...baseMeta, title: `${baseMeta.title} — Soluciones` }
        : baseMeta;
    return {
      mode,
      meta,
      html: renderFichaHtml(mode, exercises, config, meta, logoUrl),
    };
  });

  const html = chunks
    .map((c) => c.html)
    .join('<div class="ficha-print-break" aria-hidden="true"></div>');

  const css = `${buildAccentCssVars(input.accentColor)}${printCss}`;

  return { exercises, config, modes, css, html, chunks };
}

/** Genera ejercicios + HTML estático listo para imprimir. */
export function generateFicha(input: GenerateFichaInput): GeneratedFicha {
  const doc = buildFichaDocument({
    activityId: input.activityId,
    config: input.config,
    modes: [input.mode],
    meta: input.meta,
    logoUrl: input.logoUrl,
  });
  const chunk = doc.chunks[0]!;

  persistLastFicha({ activityId: input.activityId, config: input.config, mode: input.mode });

  return {
    exercises: doc.exercises,
    config: doc.config,
    meta: chunk.meta,
    mode: chunk.mode,
    html: chunk.html,
  };
}

export interface DownloadFichasInput {
  activityId: string;
  config: SheetConfig;
  /** Uno o ambos tipos; comparten la misma semilla / ejercicios. */
  modes: readonly FichaMode[];
  meta?: Partial<FichaMeta>;
  logoUrl?: string;
  accentColor?: string;
}

/**
 * Descarga un PDF con el mismo HTML/CSS que la vista previa.
 * Descarga directa del archivo — sin diálogo de impresión ni impresora.
 */
export async function downloadFichas(input: DownloadFichasInput): Promise<SheetExercise[]> {
  const doc = buildFichaDocument(input);
  const modeLabel = doc.modes.join("+");

  persistLastFicha({
    activityId: input.activityId,
    config: input.config,
    mode: doc.modes[0]!,
  });

  await downloadHtmlAsPdf({
    html: doc.html,
    css: doc.css,
    filename: `ficha-${input.activityId}-${modeLabel}.pdf`,
  });

  return doc.exercises;
}

/** Descarga la ficha en PDF (sin impresión). */
export async function downloadFicha(input: GenerateFichaInput): Promise<GeneratedFicha> {
  const generated = generateFicha(input);
  await downloadHtmlAsPdf({
    html: generated.html,
    css: printCss,
    filename: `ficha-${input.activityId}-${input.mode}.pdf`,
  });
  return generated;
}

/** Compatibilidad: exporta Word (.doc HTML). Preferir PDF. */
export async function downloadFichasAsWord(input: DownloadFichasInput): Promise<SheetExercise[]> {
  const doc = buildFichaDocument(input);
  const modeLabel = doc.modes.join("+");
  persistLastFicha({
    activityId: input.activityId,
    config: input.config,
    mode: doc.modes[0]!,
  });
  await downloadHtmlAsWord({
    html: doc.html,
    css: doc.css,
    filename: `ficha-${input.activityId}-${modeLabel}.doc`,
  });
  return doc.exercises;
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
