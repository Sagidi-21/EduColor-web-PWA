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
  /** Opciones MC como en pizarra (números o pares «3+7»). */
  choiceLabels?: string[];
  answer?: number | string;
}

/**
 * Campos comunes de numeración 11-19 / 40-59 / 60-99.
 * `number` alimenta los bloques decenas/unidades (obligatorios en identify).
 */
export interface NumeracionBlocksFields {
  type: string;
  number: number;
  question: string;
  /** Mostrar bloques de decenas + unidades (como TensBlock de pizarra). */
  showBlocks: boolean;
  /** Opciones MC. Si vacío, casillas de cifra o solo enunciado. */
  choiceLabels?: string[];
  /**
   * Casillas discontinuas para escribir.
   * false = sin casillas (p. ej. units/sequence/jump: imagen + enunciado debajo).
   */
  showAnswerBoxes?: boolean;
  /** Enunciado debajo de la imagen (units / sequence / jump). */
  questionBelowImage?: boolean;
  answer?: number | string;
}

export interface Numeracion1119SheetExercise extends NumeracionBlocksFields {
  kind: "numeracion1119";
  type: "identify" | "units" | "sequence";
}

export interface WeekDaySheetExercise {
  kind: "weekDay";
  question: string;
  /** Opciones MC (días) como en pizarra. */
  choiceLabels?: string[];
  /** Día mencionado en el enunciado: se resalta en la tira L-M-X-J-V-S-D. */
  highlightDay?: string;
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

export interface LeftRightCharSheet {
  imageUrl: string;
  name: string;
  /** frente: su mano derecha cae a la izquierda del papel; espaldas: coincide. */
  perspective: "frente" | "espaldas";
}

export interface LeftRightDragObjectSheet {
  label: string;
  /** Vacío si «Incluir imágenes» está desactivado (se imprime solo el nombre). */
  imageUrl: string;
}

export interface LeftRightSheetExercise {
  kind: "leftRight";
  /**
   * pair (por defecto): dos objetos + opciones.
   * char-*: escena con personaje (nivel experto en pizarra) adaptada a papel.
   */
  variant?: "pair" | "char-click" | "char-drag-one" | "char-drag-both";
  leftObj: string;
  rightObj: string;
  leftImgUrl: string;
  rightImgUrl: string;
  question: string;
  /** Opciones MC (izquierda/derecha o nombres de objeto) como en pizarra. */
  choiceLabels?: string[];
  /** Nivel fácil: rótulos «izquierda» / «derecha» junto a los objetos. */
  showSideLabels?: boolean;
  /** Personaje de la escena (variantes char-*). */
  char?: LeftRightCharSheet;
  /** Objetos que el alumno une con la mano correcta (char-drag-*). */
  dragObjects?: LeftRightDragObjectSheet[];
  /** `left`/`right` (legado), texto de la opción correcta o descripción de la escena. */
  answer?: string;
}

export interface CapacidadSheetExercise {
  kind: "capacidad";
  /** compare = A/B/Igual; read = leer nivel; fill = sumar vasos de 1 L. */
  variant?: "compare" | "read" | "fill";
  question: string;
  imageUrl?: string;
  litersA?: number;
  litersB?: number;
  /** Capacidad máxima del recipiente graduado. */
  maxLiters?: number;
  /** read: litros dibujados en el recipiente. */
  liters?: number;
  /** fill: número de vasos de 1 L. */
  cups?: number;
  choiceLabels?: string[];
  answer?: string | number;
}

export interface OrdinalesSheetExercise {
  kind: "ordinales";
  question: string;
  /** identify = redondear en la serie; position/fromRight = casilla. */
  variant?: "identify" | "position" | "fromRight";
  /** Tamaño de la fila de objetos. */
  count: number;
  /** Emoji de cada objeto (como en pizarra). */
  emoji: string;
  /** Posición 1-based del dibujo marcado (desde la izquierda). */
  target: number;
  /** Muestra flecha de dirección (izquierda → derecha). */
  fromRight: boolean;
  /** Nivel de la ficha (layout: easy/medium 2 cols; hard/expert casilla a la dcha.). */
  difficulty?: "easy" | "medium" | "hard" | "expert";
  imageUrl: string;
  answer?: number;
}

export interface Numeracion4059SheetExercise extends NumeracionBlocksFields {
  kind: "numeracion4059";
  type: "identify" | "units" | "sequence" | "jump";
}

export interface ProblemaSheetExercise {
  kind: "problemas";
  story: string[];
  question: string;
  /** Emoji del tema (pizarra); solo con imágenes activadas. */
  emoji?: string;
  /**
   * Operandos y signo para operación en columna (easy/medium).
   * Ausentes en hard/expert: solo enunciado + hueco para escribir.
   */
  a?: number;
  b?: number;
  op?: "+" | "-";
  /** Hard/expert: hueco debajo del enunciado para operación + resultado. */
  showWriteArea?: boolean;
  /** Easy/medium/hard: números del enunciado con color de clase (expert no). */
  highlightKeyNumbers?: boolean;
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
  /** Etiqueta bajo el objeto (p. ej. «5 kg»). */
  weightLabel?: string | null;
  /** Bloques de 1 kg (🧱) junto al objeto (expert/peso). */
  weightBlocks?: number;
  /** Etiqueta bajo las pesas (p. ej. «2 kg»). */
  weightBlocksLabel?: string | null;
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
  /**
   * Si false (hard), solo se muestran los dos platillos sin brazo ni inclinación:
   * los pesos del catálogo no son reales (p. ej. bicis &lt; 1 kg) y la balanza
   * inclinada afirmaría algo absurdo y adelantaría la respuesta.
   */
  showScale?: boolean;
  /** Easy/medium/hard (compare): etiquetas MC para redondear a mano. */
  choiceLabels?: string[];
  /** Expert (compare): hint «escribe el número correcto» tras el enunciado. */
  writeHint?: boolean;
  targetKg?: number;
  /** equilibra: paleta de pesas arrastrables en pizarra (p. ej. [1] o [1, 2]). */
  weightChips?: number[];
  /** equilibra: carga fija izquierda = bloques de pesa u objeto. */
  leftKind?: "weights" | "object";
  answer?: string;
}

export interface Numeracion6099SheetExercise extends NumeracionBlocksFields {
  kind: "numeracion6099";
  type: "identify" | "units" | "sequence" | "word" | "jump";
}

/** Estado de celda de la tabla 0-99 (igual que `gridState` de pizarra). */
export type TablaNumericaCellKind = "visible" | "blank" | "target" | "symbol";

export interface TablaNumericaSheetCell {
  /** Número de la casilla (0-99); coincide con el índice en la rejilla. */
  value: number;
  state: TablaNumericaCellKind;
  /** Símbolo en celdas `symbol`. */
  symbol?: string;
}

export interface TablaNumericaSheetExercise {
  kind: "tablaNumerica";
  variant: "missing" | "symbol" | "colorear";
  question: string;
  /** Rejilla en filas de `cols` (easy: hasta respuesta+10; resto: 0–99). */
  cells: TablaNumericaSheetCell[];
  cols: number;
  rows: number;
  /** Símbolo(s) preguntados (variant symbol); varios unidos con espacio. */
  targetSymbol?: string;
  /** Símbolos a localizar uno a uno (medium: 2–4). */
  targetSymbols?: string[];
  /** Regla a colorear (variant colorear), p. ej. «3 unidades». */
  ruleLabel?: string;
  /** Soluciones: número / casillas / lista de números a colorear. */
  answer?: string | number;
}

export interface ParImparSheetExercise {
  kind: "parImpar";
  question: string;
  number: number;
  /** Emoji repetido `emojiCount` veces en ejercicios visuales. */
  emoji?: string;
  emojiCount?: number;
  imageUrl: string;
  /** Opciones MC (Par/Impar, números, etc.). Si vacío y no es escritura → Par/Impar. */
  choiceLabels?: string[];
  /** true = casilla en blanco (legacy); expert escritura ya no la usa. */
  writeIn?: boolean;
  /** Solución: par/impar, o lista de números válidos en escritura (p. ej. «52, 54»). */
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
  /** Rejilla de opciones figurativas (actividad polígonos). */
  optionsList?: SheetShapeVisual[];
  /** Opciones de texto para marcar (p. ej. Formas y tamaños, como en pizarra). */
  choiceLabels?: string[];
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
  /** Puntos + cajas de grupo como en pizarra (solo easy/medium). */
  showVisual?: boolean;
  answer?: number;
}

export interface DatosInnecesariosSheetExercise {
  kind: "datosInnecesarios";
  /** Tres frases (como en pizarra); el alumno marca la que sobra. */
  story: string[];
  question: string;
  /** Texto de la frase innecesaria (soluciones). */
  answer?: string | number;
}

export interface RutaCuadriculaSheetExercise {
  kind: "rutaCuadricula";
  gridSize: { cols: number; rows: number };
  start: { x: number; y: number };
  end: { x: number; y: number };
  obstacles: { x: number; y: number }[];
  /**
   * Reservado (legado). La ficha siempre dibuja 🚶 🏫 🌳 como en la pizarra.
   * @deprecated
   */
  showEmoji?: boolean;
  /** Ruta válida de ejemplo para soluciones, p. ej. «→ → ↑ ↑». */
  answer?: string;
}

export interface RelojClockChoiceSheet {
  /** Letra de opción (A, B, C, D). */
  letter: string;
  /** Hora de la esfera, p. ej. «7:05». */
  label: string;
  hours: number;
  minutes: number;
}

export interface RelojSheetExercise {
  kind: "reloj";
  hours: number;
  minutes: number;
  /** Agujas visibles en la esfera analógica (false = esfera vacía para dibujarlas). */
  showHands: boolean;
  question: string;
  /** Tipo del motor (`analog_to_digital`, `digital_to_analog`, `match_scene`, `digital_read`, `poner_hora`). */
  type?: string;
  /** Dibujar la esfera analógica (por defecto true). */
  showAnalog?: boolean;
  /** Mostrar el reloj digital del enunciado (digital_to_analog, digital_read, poner hora). */
  showDigital?: boolean;
  /** Hora digital, p. ej. «7:05». */
  digitalLabel?: string;
  /** Opciones de texto ○ (horas digitales o lectura en palabras). */
  choiceLabels?: string[];
  /** Opciones como minirelojes con agujas (digital_to_analog nivel medio). */
  clockChoices?: RelojClockChoiceSheet[];
  /**
   * Disposición de las opciones de texto:
   * - below (defecto): debajo del reloj/caja
   * - aside: vertical a la derecha de la caja digital (digital_read hard)
   */
  choiceLayout?: "below" | "aside";
  /** Fragmento del enunciado con la hora (digital o verbal) a resaltar con color de clase. */
  highlightTime?: string;
  /** El alumno dibuja las agujas en una esfera vacía (nivel alto / pon la hora). */
  drawHands?: boolean;
  answer?: string;
}

export interface LaberintoEdgeSheet {
  from: string;
  to: string;
  op: "+" | "-";
  value: number;
  direction: "right" | "down";
}

export interface LaberintoSheetExercise {
  kind: "laberintoMatematico";
  start: number;
  edges: LaberintoEdgeSheet[];
  answers: Record<string, number>;
  mode: "mayor" | "menor";
  correctFin: string;
  question: string;
  /** Soluciones: valores de los nodos y respuesta final. */
  answer?: string;
}

export interface PosicionesAulaSheetExercise {
  kind: "posicionesAula";
  container: "caja" | "mochila" | "mesa" | "silla";
  object: "pelota" | "lápiz" | "lapiz" | "libro" | "goma";
  position: "dentro" | "fuera" | "encima" | "debajo" | "al lado";
  story: string[];
  question: string;
  /** Opciones MC como en pizarra (Dentro/Fuera, Encima/Debajo/…). */
  choiceLabels?: string[];
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
  /** Cuerpo dibujado en SVG (como en pizarra). */
  shape?: "cubo" | "esfera" | "cilindro" | "cono" | "prisma" | "piramide";
  /** Opciones ○ como en pizarra. */
  choiceLabels?: string[];
  answer?: string | number;
}

/** Fila izquierda de la unión de multiplicación: `table × factor`. */
export interface MultiplicacionSheetLeftItem {
  id: number;
  table: number;
  factor: number;
}

/** Fila derecha: el producto (barajado respecto a la izquierda). */
export interface MultiplicacionSheetRightItem {
  id: number;
  product: number;
}

/**
 * Multiplicación en modo unir (como pizarra easy/medium): operaciones a la izquierda,
 * productos a la derecha y puntos para trazar la línea. Soluciones: `2 × 3 = 6`.
 */
export interface MultiplicacionSheetExercise {
  kind: "multiplicacion";
  left: MultiplicacionSheetLeftItem[];
  right: MultiplicacionSheetRightItem[];
  /** Parejas correctas, p. ej. `["2 × 3 = 6", ...]`. */
  answer?: string[];
}

/** Suma llevando: cuadrícula D·U con casilla de llevada y 2-3 sumandos. */
export interface SumaLlevandoSheetExercise {
  kind: "sumaLlevando";
  addends: number[];
  answer?: number;
}

/** Recta numérica 0..max: el alumno marca la posición de `target`. */
export interface RectaNumericaSheetExercise {
  kind: "rectaNumerica";
  target: number;
  max: number;
  labelEvery: number;
  answer?: number;
}

export interface SimetriaSheetExercise {
  kind: "simetria";
  question: string;
  /** Figura plana en SVG; solo si la pregunta la muestra (no en «which-shape»). */
  shape?:
    | "circulo"
    | "cuadrado"
    | "rectangulo"
    | "triangulo-eq"
    | "triangulo-iso"
    | "triangulo-esc"
    | "rombo"
    | "pentagono"
    | "hexagono"
    | "estrella";
  /** Opciones ○ como en pizarra (Sí/No, número de ejes o nombres). */
  choiceLabels?: string[];
  answer?: string;
}

export interface ProbabilidadBallSheet {
  color: string;
  count: number;
}

export interface ProbabilidadSheetExercise {
  kind: "probabilidad";
  question: string;
  /** classify = suceso en texto; bag = bolsa con pelotas de colores. */
  variant?: "classify" | "bag";
  /** Suceso a clasificar (classify). */
  context?: string;
  /** Contenido de la bolsa (bag). */
  balls?: ProbabilidadBallSheet[];
  /** Opciones MC (Seguro / Posible / Imposible). */
  choiceLabels?: string[];
  answer?: string | number;
}

export interface Problemas2PasosSheetExercise {
  kind: "problemas2pasos";
  story: string[];
  question: string;
  /** Tracker de pasos (como en pizarra): a op1 b = ? → ? op2 c = ?. */
  steps?: { a: number; b: number; c: number; op1: "+" | "-"; op2: "+" | "-" };
  /** Opciones ○ como en pizarra. */
  choiceLabels?: string[];
  answer?: number;
}

export interface RedondeoSheetExercise {
  kind: "redondeo";
  variant: "round-to-ten" | "which-closer";
  question: string;
  /** Número a redondear (badge + marca en la recta). */
  number: number;
  lowerDecade: number;
  upperDecade: number;
  /** Opciones MC (○), como en pizarra. */
  choiceLabels: string[];
  /** Layout por nivel: easy/medium recta sin badge; hard sin extremos; expert solo badge. */
  difficulty?: Difficulty;
  answer?: number | string;
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
  /** classify-shape = SVG relleno/aro; real-object = objeto cotidiano. */
  type?: "classify-shape" | "real-object";
  shapeType?: "circulo" | "circunferencia";
  objectName?: string;
  /** Emoji del objeto real (solo con imágenes activadas). */
  objectEmoji?: string;
  /** Opciones ○ como en pizarra (Círculo / Circunferencia). */
  choiceLabels?: string[];
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
  /** Opciones • (p. ej. «Más de 1 hora» / «Menos de 1 hora» o nombres de actividades). */
  choiceLabels?: string[];
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
  /** Opciones MC como en pizarra. */
  choiceLabels?: string[];
  answer?: string | number;
}

export interface ElLitroSheetExercise {
  kind: "elLitro";
  question: string;
  items: PhotoItemSheet[];
  referenceUrl?: string;
  /** Solo classify (Más/Menos de 1 L). En which-more/less no: el nombre va bajo la foto. */
  choiceLabels?: string[];
  answer?: string | number;
}

export interface VecinosNumeroSheetExercise {
  kind: "vecinosNumero";
  question: string;
  /** Número central de la vía (antes / número / después). */
  number?: number;
  askType?: "anterior" | "posterior" | "ambos";
  anterior?: number;
  posterior?: number;
  /** Opciones MC (en «ambos», pares «a - p»). */
  choiceLabels?: string[];
  answer?: number | string;
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
  variant: "cifra-to-palabra" | "palabra-to-cifra";
  /** Consigna («¿Cómo se escribe este número?»). */
  question: string;
  /** Texto grande: la cifra o la palabra entre comillas. */
  display: string;
  number: number;
  word: string;
  choiceLabels: string[];
  /** Nivel de ficha (tamaños de display en hard/expert). */
  difficulty: Difficulty;
  answer?: string | number;
}

export interface Numeracion999SheetExercise {
  kind: "numeracion999";
  question: string;
  /** cifra-to-cdu | cdu-to-cifra | valor-posicional | anterior-posterior */
  type?: string;
  number?: number;
  centenas?: number;
  decenas?: number;
  unidades?: number;
  /** true = tarjeta C·D·U; false = número grande. */
  showCduCard?: boolean;
  choiceLabels?: string[];
  answer?: string | number;
}

export interface DobleYMitadSheetExercise {
  kind: "dobleYMitad";
  question: string;
  /** Número del enunciado (cajas Número / Doble|Mitad o operación vertical). */
  number?: number;
  operacion?: "x2" | "div2";
  /** "original": dato = número de partida (hueco en Doble/Mitad); "resultado": hueco en Número. */
  conocido?: "original" | "resultado";
  /**
   * Medium+: operación ×2/÷2 en vertical + hueco en blanco (sin cajas ni opciones).
   * Easy: cajas Número / Doble|Mitad + choiceLabels.
   */
  verticalOp?: boolean;
  choiceLabels?: string[];
  answer?: number;
}

export interface AbacoColumnsSheet {
  c: number;
  d: number;
  u: number;
}

export interface AbacoOptionSheet extends AbacoColumnsSheet {
  /** Letra A-D para marcar el ábaco correcto. */
  letter: string;
}

export interface Abaco3CifrasSheetExercise {
  kind: "abaco3Cifras";
  variant: "read-abaco" | "find-abaco" | "valor-posicional";
  question: string;
  number: number;
  /** Bolitas por columna del ábaco principal (read / valor). */
  columns: AbacoColumnsSheet;
  /** Opciones numéricas (read / valor) como texto. */
  choiceLabels?: string[];
  /** Opciones-ábaco (find-abaco). */
  abacoOptions?: AbacoOptionSheet[];
  /** read/valor: texto de la opción; find: letra del ábaco correcto. */
  answer?: string | number;
}

/** Algoritmo C·D·U con casillas de llevar/prestar (como `ColumnCarryOperation` en pizarra). */
export interface Algoritmo3CifrasSheetExercise {
  kind: "algoritmo3Cifras";
  op: "+" | "-";
  a: number;
  b: number;
  aC: number;
  aD: number;
  aU: number;
  bC: number;
  bD: number;
  bU: number;
  /** Rótulo de la fila de casillas: «llevar» al sumar, «prestar» al restar. */
  carryLabel: string;
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
  /** Líneas horizontales del eje Y de uno en uno (1..escalaMax). */
  marcas: number[];
  /**
   * Números visibles en el eje Y (el resto son solo líneas).
   * easy/medium/hard: valores de las columnas; expert: escala de 5 en 5.
   */
  etiquetasEje: number[];
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
  /** Platos elegidos en este ejercicio (se resaltan en la carta). */
  tray: MenuItemSheet[];
  /** Carta completa de precios (como «Carta del menú» en pizarra). */
  menu?: MenuItemSheet[];
  question: string;
  /** Opciones MC (importes o Sí/No) como en pizarra. */
  choiceLabels?: string[];
  /** easy/medium/hard: importes `N€` del enunciado con color de clase (expert no). */
  highlightQuestionPrices?: boolean;
  /**
   * Remarcado de platos del pedido en la carta.
   * easy: color de clase; medium: negro; hard/expert: sin remarcar.
   */
  selectedHighlight?: "accent" | "black";
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
  /** Opciones MC (identify / equivalence / change). Shopping no lleva. */
  choiceLabels?: string[];
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
  /** Easy: resaltar MÁS BARATO / MÁS CARO con color de clase. */
  highlightCompare?: boolean;
  /** Easy: letras A/B junto a cada producto + hint «redondea la letra correcta». */
  showItemLetters?: boolean;
  /** Medium/hard: precios de los iconos con color de clase (expert no). */
  highlightItemPrices?: boolean;
  /** Hard: precios del enunciado con color de clase (expert no). */
  highlightQuestionPrices?: boolean;
  /** Medium/hard/expert: iconos a la izquierda, hueco a la derecha para la operación. */
  leaveWorkSpace?: boolean;
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
  | SumaLlevandoSheetExercise
  | RectaNumericaSheetExercise
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
