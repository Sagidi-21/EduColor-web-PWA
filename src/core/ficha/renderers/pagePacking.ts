/**
 * Empaqueta el máximo de ejercicios por hoja A4.
 * Mide con un layout real (cabecera + rejilla + pie) y solo pasa de página
 * cuando el siguiente ejercicio no cabe sin cortarse.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SheetExercise } from "../types";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { columnsPerRow } from "./exerciseLayout";
import { chunkByPageSize, isFullWidthExercise, pageSizeForExercises } from "./pageLayout";
import printCss from "./print/print-bundle";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/**
 * El pie debe quedar por encima del borde A4 (PDF usa overflow:hidden).
 * Margen negativo = más estricto que el borde exacto.
 */
const FIT_MARGIN_PX = 20;

export interface PackOptions {
  showAnswer?: boolean;
  /** Primera página incluye cabecera + línea de nombre. */
  withStudentName?: boolean;
}

function nextRowTake(exercises: SheetExercise[], start: number, showAnswer: boolean): number {
  const ex = exercises[start];
  if (!ex) return 0;
  if (isFullWidthExercise(ex, { showAnswer })) return 1;
  const cols = columnsPerRow(ex);
  let take = 1;
  while (take < cols) {
    const next = exercises[start + take];
    if (!next || isFullWidthExercise(next, { showAnswer })) break;
    if (columnsPerRow(next) !== cols) break;
    take += 1;
  }
  return take;
}

function pageMarkup(
  pageExercises: SheetExercise[],
  pageIndex: number,
  options: PackOptions,
): string {
  const showAnswer = Boolean(options.showAnswer);
  const withStudentName = options.withStudentName !== false && !showAnswer;

  const header =
    pageIndex === 0
      ? `<header class="ficha-header">
          <table class="ficha-header__table" cellpadding="0" cellspacing="0" role="presentation">
            <tbody><tr>
              <td class="ficha-header__meta-cell" valign="bottom">
                <p class="ficha-header__meta">Curso — Matemáticas</p>
              </td>
              <td class="ficha-header__logo-cell" valign="middle" width="96">
                <div class="ficha-header__logo" style="width:90px;height:90px;"></div>
              </td>
            </tr></tbody>
          </table>
          <h1 class="ficha-header__title">Actividad</h1>
        </header>
        ${withStudentName ? `<div class="ficha-name-line"><span class="ficha-name-line__label">Nombre:</span><span class="ficha-name-line__field"></span></div>` : ""}`
      : `<p class="ficha-page__continued">continuación</p>`;

  const grid = renderToStaticMarkup(
    createElement(ExerciseGrid, {
      exercises: pageExercises,
      pageOffset: 0,
      showAnswer,
    }),
  );

  return `<div class="ficha-page${pageIndex > 0 ? " ficha-page--continued" : ""}">
    ${header}
    ${grid}
    <footer class="ficha-footer"><span>EduColor</span><span></span></footer>
  </div>`;
}

/**
 * ¿Cabe esta página completa dentro de A4 sin que el pie quede fuera?
 */
export function pageContentFits(
  pageExercises: SheetExercise[],
  pageIndex: number,
  options: PackOptions,
  host: HTMLElement,
): boolean {
  if (pageExercises.length === 0) return true;
  host.innerHTML = pageMarkup(pageExercises, pageIndex, options);
  const page = host.querySelector(".ficha-page") as HTMLElement | null;
  const footer = host.querySelector(".ficha-footer") as HTMLElement | null;
  if (!page || !footer) return false;

  page.style.width = `${A4_WIDTH_MM}mm`;
  page.style.height = `${A4_HEIGHT_MM}mm`;
  page.style.maxHeight = `${A4_HEIGHT_MM}mm`;
  page.style.minHeight = `${A4_HEIGHT_MM}mm`;
  page.style.overflow = "hidden";
  page.style.margin = "0";
  page.style.boxSizing = "border-box";

  const pageRect = page.getBoundingClientRect();
  const footerRect = footer.getBoundingClientRect();
  if (pageRect.height < 8) {
    // Sin layout real (jsdom): no asumir que cabe; el caller fuerza 1 fila si la página está vacía.
    return false;
  }
  return footerRect.bottom <= pageRect.bottom - FIT_MARGIN_PX;
}

/**
 * Empaqueta midiendo páginas reales: máximo por hoja sin cortar.
 */
export function packExercisesByFit(
  exercises: SheetExercise[],
  options: PackOptions = {},
): SheetExercise[][] {
  if (exercises.length === 0) return [];
  if (typeof document === "undefined") {
    return chunkByPageSize(exercises, pageSizeForExercises(exercises, options));
  }

  const showAnswer = Boolean(options.showAnswer);
  const style = document.createElement("style");
  style.setAttribute("data-ficha-pack-css", "1");
  style.textContent = printCss;

  const host = document.createElement("div");
  host.setAttribute("data-ficha-pack-host", "1");
  host.style.cssText =
    "position:fixed;left:-12000px;top:0;opacity:0;pointer-events:none;background:#fff;z-index:-1;";

  document.head.appendChild(style);
  document.body.appendChild(host);

  try {
    // Sin motor de layout (jsdom), caer al heurístico de pageSize.
    host.innerHTML = pageMarkup(exercises.slice(0, 1), 0, options);
    const probe = host.querySelector(".ficha-page") as HTMLElement | null;
    if ((probe?.getBoundingClientRect().height ?? 0) < 8) {
      return chunkByPageSize(exercises, pageSizeForExercises(exercises, options));
    }

    const pages: SheetExercise[][] = [];
    let i = 0;
    let pageIndex = 0;

    while (i < exercises.length) {
      const page: SheetExercise[] = [];

      while (i < exercises.length) {
        const take = nextRowTake(exercises, i, showAnswer);
        const candidate = page.concat(exercises.slice(i, i + take));
        const fits = pageContentFits(candidate, pageIndex, options, host);
        if (!fits) {
          // Si la página está vacía, forzar la fila (evita bucle; un bloque enorme va solo).
          if (page.length === 0) {
            page.push(...exercises.slice(i, i + take));
            i += take;
          }
          break;
        }
        page.push(...exercises.slice(i, i + take));
        i += take;
      }

      if (page.length === 0) {
        page.push(exercises[i]!);
        i += 1;
      }

      pages.push(page);
      pageIndex += 1;
    }

    return pages;
  } finally {
    host.remove();
    style.remove();
  }
}

/** @deprecated Prefer packExercisesByFit; se mantiene para tests unitarios de alturas. */
export function packExercisesByHeights(
  exercises: SheetExercise[],
  heights: number[],
  options: PackOptions = {},
): SheetExercise[][] {
  // Compat: empaquetado greedy por alturas (sin DOM de página).
  const CELL_PAD_Y_PX = 12;
  const SAFETY_PX = 8;
  const PAGE_PAD_Y_MM = 12;
  const FOOTER_MM = 12;
  const HEADER_FIRST_MM = 40;
  const NAME_LINE_MM = 12;
  const HEADER_CONT_MM = 14;
  const FALLBACK = 140;
  const mmToPx = (mm: number) => (mm * 96) / 25.4;

  const showAnswer = Boolean(options.showAnswer);
  const withStudentName = options.withStudentName !== false && !showAnswer;
  const pages: SheetExercise[][] = [];
  let i = 0;
  let pageIndex = 0;

  while (i < exercises.length) {
    const chromeMm =
      pageIndex === 0 ? HEADER_FIRST_MM + (withStudentName ? NAME_LINE_MM : 0) : HEADER_CONT_MM;
    const available = Math.max(
      80,
      mmToPx(A4_HEIGHT_MM - PAGE_PAD_Y_MM - FOOTER_MM - chromeMm) - SAFETY_PX,
    );
    const page: SheetExercise[] = [];
    let used = 0;

    while (i < exercises.length) {
      const take = nextRowTake(exercises, i, showAnswer);
      const rowHeight = Math.max(
        ...Array.from({ length: take }, (_, k) => heights[i + k] ?? FALLBACK),
      );
      const need = rowHeight + CELL_PAD_Y_PX;
      if (page.length > 0 && used + need > available) break;
      for (let k = 0; k < take && i < exercises.length; k += 1) {
        page.push(exercises[i]!);
        i += 1;
      }
      used += need;
    }

    if (page.length === 0) {
      page.push(exercises[i]!);
      i += 1;
    }
    pages.push(page);
    pageIndex += 1;
  }

  return pages;
}

export function measureExerciseHeights(
  exercises: SheetExercise[],
  options: PackOptions = {},
): number[] {
  // API legacy para tests; la paginación real usa packExercisesByFit.
  if (typeof document === "undefined" || exercises.length === 0) {
    return exercises.map(() => 140);
  }
  const showAnswer = Boolean(options.showAnswer);
  const contentWidthPx = ((A4_WIDTH_MM - 16) * 96) / 25.4;
  const style = document.createElement("style");
  style.textContent = printCss;
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-12000px;top:0;visibility:hidden;pointer-events:none;";
  document.head.appendChild(style);
  document.body.appendChild(host);
  try {
    return exercises.map((ex) => {
      const markup = pageMarkup([ex], 0, { ...options, showAnswer });
      host.style.width = `${contentWidthPx}px`;
      host.innerHTML = markup;
      const card = host.querySelector(".ficha-exercise") as HTMLElement | null;
      const h = card?.getBoundingClientRect().height ?? 0;
      return h >= 8 ? Math.ceil(h) : 140;
    });
  } finally {
    host.remove();
    style.remove();
  }
}

/**
 * Máximo de ejercicios por hoja A4 sin cortar ninguno.
 */
export function packExercisesForPrint(
  exercises: SheetExercise[],
  options: PackOptions = {},
): SheetExercise[][] {
  if (exercises.length === 0) return [];

  if (typeof document === "undefined") {
    return chunkByPageSize(exercises, pageSizeForExercises(exercises, options));
  }

  try {
    return packExercisesByFit(exercises, options);
  } catch {
    return chunkByPageSize(exercises, pageSizeForExercises(exercises, options));
  }
}
