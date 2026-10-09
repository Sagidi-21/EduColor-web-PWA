import type { Difficulty } from "../content/engine-registry";

export type ExerciseLayout = "horizontal" | "vertical";

export interface SheetConfig {
  activityId: string;
  difficulty: Difficulty;
  count: number;
  withImages: boolean;
  seed: number;
  layout?: ExerciseLayout;
}

export interface OperationSheetExercise {
  kind: "operation";
  a: number;
  b: number;
  op: "+" | "-";
  imageUrl: string;
  layout?: ExerciseLayout;
  answer?: number;
}

export interface CountingSheetExercise {
  kind: "counting";
  count: number;
  imageUrl: string;
  objectLabel: string;
  answer?: number;
}

export interface ComparisonSheetExercise {
  kind: "comparison";
  countA: number;
  countB: number;
  imageUrl: string;
  objectLabel: string;
  questionType: "mas" | "menos";
  answer?: "A" | "B";
}

export interface TresSumandosSheetExercise {
  kind: "tresSumandos";
  a: number;
  b: number;
  c: number;
  answer?: number;
}

export interface IgualdadSheetExercise {
  kind: "igualdad";
  type: "result" | "addend" | "decompose";
  a: number;
  b: number;
  c: number;
  imageUrl: string;
  answer?: number;
}

export interface Numeracion1119SheetExercise {
  kind: "numeracion1119";
  type: "identify" | "units" | "sequence";
  number: number;
  question: string;
  answer?: number | string;
}

export interface WeekDaySheetExercise {
  kind: "weekDay";
  question: string;
  answer?: string;
}

export interface AlgoritmoVerticalSheetExercise {
  kind: "algoritmoVertical";
  op?: "+" | "-";
  a: number;
  b: number;
  aD: number;
  aU: number;
  bD: number;
  bU: number;
  answer?: number;
}

export interface LeftRightSheetExercise {
  kind: "leftRight";
  leftObj: string;
  rightObj: string;
  leftImgUrl: string;
  rightImgUrl: string;
  question: string;
  answer?: "left" | "right";
}

export interface CapacidadSheetExercise {
  kind: "capacidad";
  question: string;
  imageUrl: string;
  answer?: string | number;
}

export interface OrdinalesSheetExercise {
  kind: "ordinales";
  question: string;
  count: number;
  imageUrl: string;
  answer?: number;
}

export interface Numeracion4059SheetExercise {
  kind: "numeracion4059";
  question: string;
  answer?: string | number;
}

export interface ProblemaSheetExercise {
  kind: "problemas";
  story: string[];
  question: string;
  answer?: string | number;
}

export interface TresSumandosColumnaSheetExercise {
  kind: "tresSumandosColumna";
  a: number;
  b: number;
  c: number;
  aD: number;
  aU: number;
  bD: number;
  bU: number;
  cD: number;
  cU: number;
  answer?: number;
}

export interface BalanzaSheetExercise {
  kind: "balanza";
  question: string;
  leftText: string;
  rightText: string;
  imageUrl: string;
  answer?: "left" | "right" | "equal";
}

export interface Numeracion6099SheetExercise {
  kind: "numeracion6099";
  question: string;
  answer?: string | number;
}

export interface TablaNumericaSheetExercise {
  kind: "tablaNumerica";
  cells: (number | null)[];
  cols: number;
  rows: number;
  answer?: (number | null)[];
}

export interface ParImparSheetExercise {
  kind: "parImpar";
  question: string;
  number: number;
  imageUrl: string;
  answer?: "par" | "impar";
}

/** Figura SVG serializable para fichas (polígonos / shapes). */
export interface SheetShapeVisual {
  path: string;
  drawType: "path" | "circle" | "open_line" | "curved_side" | "primitive";
  color: string;
  vertexPoints?: { x: number; y: number }[];
  showVertices?: boolean;
  /** Para shapes: círculo, cuadrado, triángulo, etc. */
  primitive?: "circle" | "square" | "triangle" | "rectangle" | "rhombus" | "oval";
  rotation?: number;
  label?: string;
}

export interface PoligonosSheetExercise {
  kind: "poligonos";
  question: string;
  answer?: string | number;
  shape?: SheetShapeVisual;
  /** Foto real (p. ej. shapes expert) en lugar del SVG. */
  imageUrl?: string;
  /** Rejilla de opciones (nivel experto). */
  optionsList?: SheetShapeVisual[];
}

export interface RelacionSumaRestaSheetExercise {
  kind: "relacionSumaResta";
  total: number;
  partA: number;
  partB: number;
  answer?: { suma: number; resta1: number; resta2: number };
}

export interface RepartoIgualSheetExercise {
  kind: "repartoIgual";
  total: number;
  groups: number;
  answer?: number;
}

export interface DatosInnecesariosSheetExercise {
  kind: "datosInnecesarios";
  story: string[];
  question: string;
  answer?: string | number;
}

export interface RutaCuadriculaSheetExercise {
  kind: "rutaCuadricula";
  gridSize: { cols: number; rows: number };
  start: { x: number; y: number };
  end: { x: number; y: number };
  obstacles: { x: number; y: number }[];
  answer?: string;
}

export interface RelojSheetExercise {
  kind: "reloj";
  hours: number;
  minutes: number;
  showHands: boolean;
  question: string;
  answer?: string;
}

export interface LaberintoSheetExercise {
  kind: "laberintoMatematico";
  start: number;
  edges: { from: string; to: string; op: "+" | "-"; value: number; direction: "right" | "down" }[];
  answers: Record<string, number>;
  mode: "mayor" | "menor";
  correctFin: string;
  question: string;
  answer?: Record<string, number>;
}

export interface PosicionesAulaSheetExercise {
  kind: "posicionesAula";
  container: "caja" | "mochila" | "mesa" | "silla";
  object: "pelota" | "lapiz" | "libro" | "goma";
  position: "dentro" | "fuera" | "encima" | "debajo" | "al lado";
  story: string[];
  question: string;
  answer?: string;
}

export interface LineTypesSheetExercise {
  kind: "lineTypes";
  svg: string;
  options: string[];
  question: string;
  answer?: string;
}

export interface Cuerpos3DSheetExercise {
  kind: "cuerpos3d";
  question: string;
  answer?: string | number;
}

export interface MultiplicacionSheetExercise {
  kind: "multiplicacion";
  question: string;
  answer?: number;
}

export interface SimetriaSheetExercise {
  kind: "simetria";
  question: string;
  answer?: string;
}

export interface ProbabilidadSheetExercise {
  kind: "probabilidad";
  question: string;
  answer?: string | number;
}

export interface Problemas2PasosSheetExercise {
  kind: "problemas2pasos";
  story: string[];
  question: string;
  answer?: number;
}

export interface RedondeoSheetExercise {
  kind: "redondeo";
  question: string;
  answer?: number;
}

export interface Series3CifrasSheetExercise {
  kind: "series3Cifras";
  question: string;
  answer?: number;
}

export interface CintaMetricaSheetExercise {
  kind: "cintaMetrica";
  question: string;
  answer?: number;
}

export interface CirculoCircunferenciaSheetExercise {
  kind: "circuloCircunferencia";
  question: string;
  answer?: string | number;
}

export interface IntervalosTiempoSheetExercise {
  kind: "intervalosTiempo";
  question: string;
  answer?: string | number;
}

export interface ElKiloSheetExercise {
  kind: "elKilo";
  question: string;
  answer?: string | number;
}

export interface ElLitroSheetExercise {
  kind: "elLitro";
  question: string;
  answer?: string | number;
}

export interface VecinosNumeroSheetExercise {
  kind: "vecinosNumero";
  question: string;
  answer?: number;
}

export interface SeriesNumericasSheetExercise {
  kind: "seriesNumericas";
  question: string;
  answer?: number;
}

export interface Amigos10SheetExercise {
  kind: "amigos10";
  question: string;
  answer?: number;
}

export interface LecturaNumerosSheetExercise {
  kind: "lecturaNumeros";
  question: string;
  answer?: string | number;
}

export interface Numeracion999SheetExercise {
  kind: "numeracion999";
  question: string;
  answer?: string | number;
}

export interface DobleYMitadSheetExercise {
  kind: "dobleYMitad";
  question: string;
  answer?: number;
}

export interface Abaco3CifrasSheetExercise {
  kind: "abaco3Cifras";
  question: string;
  answer?: number;
}

export interface Algoritmo3CifrasSheetExercise {
  kind: "algoritmo3Cifras";
  question: string;
  answer?: number;
}

export interface GraficoBarrasSheetExercise {
  kind: "graficoBarras";
  question: string;
  answer?: string | number;
}

export interface MenuCafeteriaSheetExercise {
  kind: "menuCafeteria";
  question: string;
  answer?: number;
}

export interface MonedasBilletesSheetExercise {
  kind: "monedasBilletes";
  question: string;
  answer?: number;
}

export interface InventarProblemaSheetExercise {
  kind: "inventarProblema";
  question: string;
  answer?: string;
}

export interface OrderingSheetExercise {
  kind: "ordenar";
  numbers: number[];
  direction: "ascending" | "descending";
  /** Orden correcto (solo visible en hoja de soluciones). */
  answer?: number[];
}

/** Un ítem de la columna izquierda (números barajados). */
export interface RelacionarSheetLeftItem {
  id: number;
  number: number;
}

/** Un grupo de la columna derecha, etiquetado A, B, C… */
export interface RelacionarSheetRightItem {
  id: number;
  letter: string;
  count: number;
  imageUrl: string;
  objectLabel: string;
}

/**
 * Relacionar número y cantidad: una ronda = un bloque con varias parejas a unir.
 * El alumno traza líneas; las soluciones van como «número → letra».
 */
export interface RelacionarSheetExercise {
  kind: "relacionar";
  left: RelacionarSheetLeftItem[];
  right: RelacionarSheetRightItem[];
  /** Emparejamientos correctos, p. ej. `["3 → A", "1 → B"]`. */
  answer?: string[];
}

export type SheetExercise =
  | OperationSheetExercise
  | CountingSheetExercise
  | ComparisonSheetExercise
  | TresSumandosSheetExercise
  | IgualdadSheetExercise
  | Numeracion1119SheetExercise
  | WeekDaySheetExercise
  | AlgoritmoVerticalSheetExercise
  | LeftRightSheetExercise
  | CapacidadSheetExercise
  | OrdinalesSheetExercise
  | Numeracion4059SheetExercise
  | ProblemaSheetExercise
  | TresSumandosColumnaSheetExercise
  | BalanzaSheetExercise
  | Numeracion6099SheetExercise
  | TablaNumericaSheetExercise
  | ParImparSheetExercise
  | PoligonosSheetExercise
  | RelacionSumaRestaSheetExercise
  | RepartoIgualSheetExercise
  | DatosInnecesariosSheetExercise
  | RutaCuadriculaSheetExercise
  | RelojSheetExercise
  | LaberintoSheetExercise
  | PosicionesAulaSheetExercise
  | LineTypesSheetExercise
  | Cuerpos3DSheetExercise
  | MultiplicacionSheetExercise
  | SimetriaSheetExercise
  | ProbabilidadSheetExercise
  | Problemas2PasosSheetExercise
  | RedondeoSheetExercise
  | Series3CifrasSheetExercise
  | CintaMetricaSheetExercise
  | CirculoCircunferenciaSheetExercise
  | IntervalosTiempoSheetExercise
  | ElKiloSheetExercise
  | ElLitroSheetExercise
  | VecinosNumeroSheetExercise
  | SeriesNumericasSheetExercise
  | Amigos10SheetExercise
  | LecturaNumerosSheetExercise
  | Numeracion999SheetExercise
  | DobleYMitadSheetExercise
  | Abaco3CifrasSheetExercise
  | Algoritmo3CifrasSheetExercise
  | GraficoBarrasSheetExercise
  | MenuCafeteriaSheetExercise
  | MonedasBilletesSheetExercise
  | InventarProblemaSheetExercise
  | OrderingSheetExercise
  | RelacionarSheetExercise;

export interface GeneratorDef {
  activityId: string;
  label: string;
  icon: string;
  supportsImages: boolean;
  grades?: number[];
  supportedLayouts?: ExerciseLayout[];
  generate: (config: SheetConfig) => SheetExercise[];
}

export interface FichaMeta {
  title: string;
  /** Curso, p. ej. "1º Primaria" / "2º Primaria" (extensible a más cursos). */
  grade: string;
  /** Materia, p. ej. "Matemáticas". */
  subject?: string;
  /** Nombre de la clase (configuración). */
  className?: string;
  mascotUrl?: string;
  studentName: boolean;
  /** Solo estrellas (⭐…), sin texto de dificultad. */
  difficultyStars?: string;
}

export type FichaMode = "alumno" | "soluciones";
