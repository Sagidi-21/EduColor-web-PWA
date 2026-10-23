export * from "./types";
export * from "./renderers";
export * from "./generators";
export { buildAccentCssVars } from "./accentCss";
export { defaultFichaCount } from "./defaultFichaCount";
export { difficultyStars } from "./difficultyStars";
export { generatePDF, printElement } from "./pdf";
export { downloadHtmlAsPdf } from "./pdfExport";
export {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  buildPrintDocumentHtml,
  buildPrintDocumentShellCss,
} from "./printDocument";
export type { BuildPrintDocumentHtmlInput, PrintDocumentVariant } from "./printDocument";
export { downloadHtmlAsWord } from "./wordHtmlExport";
export {
  buildFichaDocument,
  buildFichaDocumentFromExercises,
  generateFicha,
  downloadFicha,
  downloadFichas,
  downloadFichasAsWord,
  loadLastFicha,
  persistLastFicha,
  randomFichaSeed,
} from "./fichaGenerator";
export {
  EDGE_CONTENT_ACTIVITY_IDS,
  edgeActivitySupportsImages,
  isEdgeContentActivity,
} from "./edgeContentActivities";
export type {
  BuildFichaDocumentInput,
  FichaDocument,
  FichaDocumentChunk,
  GenerateFichaInput,
  GeneratedFicha,
  DownloadFichasInput,
  LastFichaPrefs,
} from "./fichaGenerator";
