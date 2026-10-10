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
  /** Pregunta, p. ej. «¿Cuántas manzanas hay?» */
  question: string;
  answer?: number;
}

export interface ComparisonSheetExercise {
  kind: "comparison";
  countA: number;
  countB: number;
  imageUrl: string;
  objectLabel: string;
  questionType: "mas" | "menos";
  /** true en hard/expert: hueco entre barras para que el alumno escriba = si son iguales. */
  allowEqual: boolean;
  /** Nivel de la ficha; controla el tamaño de los dibujos en CSS. */
  difficulty: Difficulty;
  answer?: "A" | "B" | "iguales";
}

export interface TresSumandosSheetExercise {
  kind: "tresSumandos";
  a: number;
  b: number;
  c: number;
  imageUrl: string;
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
  /** Tamaño de la fila de objetos. */
  count: number;
  /** Emoji de cada objeto (como en pizarra). */
  emoji: string;
  /** Posición 1-based de la estrella (desde la izquierda). */
  target: number;
  fromRight: boolean;
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

export interface BalanzaPlateSheet {
  emoji: string;
  count: number;
  weightLabel?: string | null;
  unknown: boolean;
}

export interface BalanzaSheetExercise {
  kind: "balanza";
  /** compare = MC de la pizarra; equilibra = igualar kg a la derecha. */
  variant: "compare" | "equilibra";
  question: string;
  left: BalanzaPlateSheet;
  right: BalanzaPlateSheet;
  tilt?: "left" | "right" | "equal";
  targetKg?: number;
  answer?: string;
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
  /** Emoji repetido `emojiCount` veces en ejercicios visuales. */
  emoji?: string;
  emojiCount?: number;
  imageUrl: string;
  answer?: "par" | "impar" | string;
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
  /** Secuencia con `-1` en el hueco (igual que en pizarra). */
  sequence: number[];
  blankIndex: number;
  step: number;
  ascending: boolean;
  /** Enunciado (p. ej. con pista de salto en easy/medium). */
  question: string;
  answer?: number;
}

export interface CintaMetricaSheetExercise {
  kind: "cintaMetrica";
  emoji: string;
  itemName: string;
  question: string;
  answer?: string | number;
}

export interface CirculoCircunferenciaSheetExercise {
  kind: "circuloCircunferencia";
  question: string;
  answer?: string | number;
}

export interface IntervalosTiempoActivitySheet {
  emoji: string;
  name: string;
  label: string;
  seconds: number;
}

export interface IntervalosTiempoSheetExercise {
  kind: "intervalosTiempo";
  type: string;
  activities: IntervalosTiempoActivitySheet[];
  showBars: boolean;
  question: string;
  answer?: string | number;
}

export interface PhotoItemSheet {
  name: string;
  imageUrl: string;
}

export interface ElKiloSheetExercise {
  kind: "elKilo";
  question: string;
  items: PhotoItemSheet[];
  referenceUrl?: string;
  answer?: string | number;
}

export interface ElLitroSheetExercise {
  kind: "elLitro";
  question: string;
  items: PhotoItemSheet[];
  referenceUrl?: string;
  answer?: string | number;
}

export interface VecinosNumeroSheetExercise {
  kind: "vecinosNumero";
  question: string;
  answer?: number;
}

export interface SeriesNumericasSheetExercise {
  kind: "seriesNumericas";
  /** Secuencia con `-1` en el hueco (igual que en pizarra). */
  sequence: number[];
  blankIndex: number;
  step: number;
  ascending: boolean;
  /** Enunciado (p. ej. con pista de salto en easy/medium). */
  question: string;
  answer?: number;
}

export interface Amigos10SheetExercise {
  kind: "amigos10";
  question: string;
  /** Sumando conocido (celdas pintadas del ten-frame). */
  given: number;
  /** Ten-frame como en pizarra (toggle «Incluir imágenes»). */
  showVisual: boolean;
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

export interface GraficoBarraSheet {
  etiqueta: string;
  emoji: string;
  valor: number;
}

export interface GraficoBarrasSheetExercise {
  kind: "graficoBarras";
  titulo: string;
  bars: GraficoBarraSheet[];
  escalaMax: number;
  blankBarIndex?: number;
  question: string;
  answer?: string | number;
}

export interface MenuItemSheet {
  emoji: string;
  name: string;
  price: number;
}

export interface MenuCafeteriaSheetExercise {
  kind: "menuCafeteria";
  tray: MenuItemSheet[];
  question: string;
  answer?: string | number;
}

export interface MonedasMoneySheetItem {
  url: string;
  label: string;
}

export interface MonedasBilletesSheetExercise {
  kind: "monedasBilletes";
  type: "identify" | "equivalence" | "change" | "shopping";
  question: string;
  money: MonedasMoneySheetItem[];
  productEmoji?: string;
  productName?: string;
  productPriceLabel?: string;
  answer?: string | number;
}

export interface InventarProblemaSheetExercise {
  kind: "inventarProblema";
  items: MenuItemSheet[];
  budget?: number;
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

export interface RelacionarCantidadesSheetLeftItem {
  id: number;
  text: string;
  cantidades: { total: number; rotulo?: string }[];
}

export interface RelacionarCantidadesSheetRightItem {
  id: number;
  letter: string;
  text: string;
}

/** Relacionar cantidades (base 10): dibujo C-D-U a la izquierda, texto a la derecha. */
export interface RelacionarCantidadesSheetExercise {
  kind: "relacionarCantidades";
  left: RelacionarCantidadesSheetLeftItem[];
  right: RelacionarCantidadesSheetRightItem[];
  imageUrl: string;
  objectLabel: string;
  /** Emparejamientos, p. ej. `["Tengo 25 → A", ...]`. */
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
  | RelacionarSheetExercise
  | RelacionarCantidadesSheetExercise;

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
