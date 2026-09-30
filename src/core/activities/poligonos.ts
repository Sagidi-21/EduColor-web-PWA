import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `poligonos`: figuras, generación de ejercicios y validación.
 *
 * No importa React ni nada del navegador. El renderer solo dibuja lo que esto
 * devuelve, y una hoja de ejercicios podrá hacerlo mismo más adelante.
 */

export type PoligonoQuestType = "is_polygon" | "count_elements" | "name" | "expert_select";

export type ShapeDrawType = "path" | "circle" | "open_line" | "curved_side";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface ShapeDef {
  id: string;
  /** Nombre pedagógico. Es lo que se responde en la pregunta de tipo `name`. */
  name: string;
  sides: number;
  /** Número de vértices. Los vértices con coordenadas van en `vertexPoints`. */
  vertices: number;
  /** Coordenadas de los vértices en el `viewBox` 0..200, para poder marcarlos. */
  vertexPoints: readonly Point[];
  isPolygon: boolean;
  /** Trazo SVG. Con `drawType: "circle"` no se usa: dibuja un `circle`. */
  path: string;
  drawType: ShapeDrawType;
  color: string;
}

export interface PoligonoOption {
  label: string;
  value: string;
}

interface PoligonoExerciseBase {
  question: string;
  /** Figura que se dibuja en el escenario. */
  shape: ShapeDef;
  answer: string;
  /** Marca los vértices de la figura. */
  showVertices: boolean;
  hint?: string;
}

/** Preguntas con una fila de botones de respuesta. */
export interface PoligonoChoiceExercise extends PoligonoExerciseBase {
  type: "is_polygon" | "count_elements" | "name";
  options: PoligonoOption[];
}

/** Pregunta de `expert`: una rejilla de figuras de la que hay que elegir una. */
export interface PoligonoSelectExercise extends PoligonoExerciseBase {
  type: "expert_select";
  optionsList: ShapeDef[];
}

export type PoligonoExercise = PoligonoChoiceExercise | PoligonoSelectExercise;

export const SHAPES: readonly ShapeDef[] = [
  // Polígonos
  {
    id: "tri1",
    name: "Triángulo",
    sides: 3,
    vertices: 3,
    vertexPoints: [
      { x: 100, y: 30 },
      { x: 170, y: 150 },
      { x: 30, y: 150 },
    ],
    isPolygon: true,
    path: "M 100 30 L 170 150 L 30 150 Z",
    drawType: "path",
    color: "#3b82f6",
  },
  {
    id: "quad1",
    name: "Cuadrilátero",
    sides: 4,
    vertices: 4,
    vertexPoints: [
      { x: 40, y: 40 },
      { x: 160, y: 40 },
      { x: 160, y: 160 },
      { x: 40, y: 160 },
    ],
    isPolygon: true,
    path: "M 40 40 L 160 40 L 160 160 L 40 160 Z",
    drawType: "path",
    color: "#10b981",
  },
  {
    id: "quad2",
    name: "Cuadrilátero",
    sides: 4,
    vertices: 4,
    vertexPoints: [
      { x: 40, y: 50 },
      { x: 160, y: 30 },
      { x: 140, y: 150 },
      { x: 60, y: 160 },
    ],
    isPolygon: true,
    path: "M 40 50 L 160 30 L 140 150 L 60 160 Z",
    drawType: "path",
    color: "#06b6d4",
  },
  {
    id: "pent1",
    name: "Pentágono",
    sides: 5,
    vertices: 5,
    vertexPoints: [
      { x: 100, y: 25 },
      { x: 170, y: 75 },
      { x: 145, y: 155 },
      { x: 55, y: 155 },
      { x: 30, y: 75 },
    ],
    isPolygon: true,
    path: "M 100 25 L 170 75 L 145 155 L 55 155 L 30 75 Z",
    drawType: "path",
    color: "#f59e0b",
  },
  {
    id: "hex1",
    name: "Hexágono",
    sides: 6,
    vertices: 6,
    vertexPoints: [
      { x: 100, y: 25 },
      { x: 160, y: 60 },
      { x: 160, y: 130 },
      { x: 100, y: 165 },
      { x: 40, y: 130 },
      { x: 40, y: 60 },
    ],
    isPolygon: true,
    path: "M 100 25 L 160 60 L 160 130 L 100 165 L 40 130 L 40 60 Z",
    drawType: "path",
    color: "#a855f7",
  },

  // No polígonos
  {
    id: "circ1",
    name: "Círculo",
    sides: 0,
    vertices: 0,
    vertexPoints: [],
    isPolygon: false,
    path: "",
    drawType: "circle",
    color: "#ec4899",
  },
  {
    id: "open1",
    name: "Línea abierta",
    sides: 3,
    // El original declaraba 4 vértices con solo 3 puntos dibujados. Además esta
    // figura nunca es la protagonista de `count_elements` ni de `expert`, que
    // solo eligen polígonos, así que el dato solo podía despistar al tests.
    vertices: 3,
    vertexPoints: [
      { x: 40, y: 40 },
      { x: 160, y: 40 },
      { x: 160, y: 160 },
    ],
    isPolygon: false,
    path: "M 40 40 L 160 40 L 160 160",
    drawType: "open_line",
    color: "#f43f5e",
  },
  {
    id: "curve_side1",
    name: "Figura con curva",
    sides: 3,
    vertices: 3,
    vertexPoints: [
      { x: 100, y: 30 },
      { x: 170, y: 150 },
      { x: 30, y: 150 },
    ],
    isPolygon: false,
    path: "M 100 30 Q 150 100 170 150 L 30 150 Z",
    drawType: "curved_side",
    color: "#e2e8f0",
  },
];

export const POLYGONS: readonly ShapeDef[] = SHAPES.filter((s) => s.isPolygon);

/** Los polígonos que se pueden nombrar en 1.º: los de 5 lados o menos. */
const NAMED_POLYGONS: readonly ShapeDef[] = POLYGONS.filter((s) => s.sides <= 5);

/** Tope de ejercicios por sesión, el mismo que en el motor de Electron. */
export const SESSION_TARGET = 10;

/**
 * Tamaño de sesión por dificultad, que no es el mismo en las cuatro.
 *
 * El original de Electron generaba por muestreo con rechazo sobre un conjunto de
 * claves únicas, así que se quedaba corto cuando no había figuras distintas que
 * ofrecer. Se conserva ese conteo por decisión propia, pero enumerando los
 * candidatos en lugar de rejection sampling: da los mismos números sin la tirada
 * de 300 intentos que podía devolver una sesión corta por azar.
 *
 * - `easy`: las 8 figuras del catálogo, una pregunta cada una.
 * - `medium`: los 5 polígonos × 2 (lados o vértices).
 * - `hard`: los 4 polígonos nombrables (triángulo, dos cuadriláteros, pentágono).
 * - `expert`: los 5 polígonos, uno por pregunta.
 */
export const SESSION_SIZE: Record<ActivityDifficulty, number> = {
  easy: SHAPES.length,
  medium: POLYGONS.length * 2,
  hard: NAMED_POLYGONS.length,
  expert: POLYGONS.length,
};

/** Valores ofrecidos como respuesta en `count_elements`. */
const COUNT_OPTIONS: readonly number[] = [3, 4, 5, 6];

const NAME_OPTIONS: readonly PoligonoOption[] = [
  { label: "Triángulo (3 lados)", value: "Triángulo" },
  { label: "Cuadrilátero (4 lados)", value: "Cuadrilátero" },
  { label: "Pentágono (5 lados)", value: "Pentágono" },
];

const YES_NO_OPTIONS: readonly PoligonoOption[] = [
  { label: "SÍ, es un polígono", value: "yes" },
  { label: "NO es un polígono", value: "no" },
];

// ── LCG determinista ────────────────────────────────────────────────────────
// Mismas constantes que el original de Electron: una semilla da la misma
// secuencia allí y aquí, que es lo que hace comparables los tests de grano.

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Por qué una figura no es un polígono, según cómo está dibujada. */
function hintFor(shape: ShapeDef): string {
  if (shape.isPolygon) return "Es una línea cerrada formada solo por líneas rectas.";
  if (shape.drawType === "circle" || shape.drawType === "curved_side")
    return "Tiene líneas curvas, por lo que NO es un polígono.";
  return "Es una línea abierta, por lo que NO es un polígono.";
}

function isPolygonExercise(shape: ShapeDef): PoligonoChoiceExercise {
  return {
    type: "is_polygon",
    question: "¿Esta figura es un polígono?",
    shape,
    options: [...YES_NO_OPTIONS],
    answer: shape.isPolygon ? "yes" : "no",
    showVertices: false,
    hint: hintFor(shape),
  };
}

function countElementsExercise(
  shape: ShapeDef,
  askSides: boolean,
  rng: () => number,
): PoligonoChoiceExercise {
  const target = askSides ? shape.sides : shape.vertices;
  return {
    type: "count_elements",
    question: askSides
      ? "¿Cuántos LADOS tiene este polígono?"
      : "¿Cuántos VÉRTICES tiene este polígono?",
    shape,
    options: shuffle(COUNT_OPTIONS, rng).map((n) => ({ label: String(n), value: String(n) })),
    answer: String(target),
    // Los vértices se marcan solo cuando se cuentan. Dibujarlos al pedir los
    // lados sería una pista visual que falsea la pregunta.
    showVertices: !askSides,
  };
}

function nameExercise(shape: ShapeDef): PoligonoChoiceExercise {
  return {
    type: "name",
    question: "¿Cómo se llama este polígono por su número de lados?",
    shape,
    options: [...NAME_OPTIONS],
    answer: shape.name,
    showVertices: false,
  };
}

/**
 * `expert`: elegir de una rejilla el polígono con exactamente los lados y
 * vértices que pide la pregunta.
 *
 * Se descartan los distractores con la misma firma `(sides, vertices)` que el
 * objetivo. `quad1` y `quad2` son los dos cuadriláteros: con el muestreo del
 * original, si uno salía como respuesta el otro podía salir también entre las
 * opciones y había dos pulsaciones correctas.
 */
function expertExercise(target: ShapeDef, rng: () => number): PoligonoSelectExercise {
  const distractores = shuffle(
    SHAPES.filter(
      (s) =>
        s.id !== target.id &&
        !(s.isPolygon && s.sides === target.sides && s.vertices === target.vertices),
    ),
    rng,
  ).slice(0, 3);

  return {
    type: "expert_select",
    question: `Selecciona el polígono que tiene exactamente ${target.sides} lados y ${target.vertices} vértices.`,
    shape: target,
    optionsList: shuffle([target, ...distractores], rng),
    answer: target.id,
    showVertices: false,
  };
}

/** Un ejercicio candidato: recibe el LCG solo si tiene algo que barajar. */
type Candidato = (rng: () => number) => PoligonoExercise;

/** Candidatos de cada dificultad: uno por ejercicio distinto que se puede pedir. */
function candidatos(difficulty: ActivityDifficulty): Candidato[] {
  switch (difficulty) {
    case "easy":
      return SHAPES.map((shape) => () => isPolygonExercise(shape));
    case "medium":
      return POLYGONS.flatMap((shape) => [
        (rng: () => number) => countElementsExercise(shape, true, rng),
        (rng: () => number) => countElementsExercise(shape, false, rng),
      ]);
    case "hard":
      return NAMED_POLYGONS.map((shape) => () => nameExercise(shape));
    case "expert":
      return POLYGONS.map((target) => (rng: () => number) => expertExercise(target, rng));
  }
}

export function generateSession(difficulty: ActivityDifficulty, seed = 42): PoligonoExercise[] {
  const rng = makeRng(seed);

  // El orden de los ejercicios y el orden de sus opciones se barajan con el
  // mismo flujo, así que la semilla decide la sesión entera.
  const orden = shuffle(candidatos(difficulty), rng);
  const total = Math.min(SESSION_TARGET, orden.length);

  return orden.slice(0, total).map((construye) => construye(rng));
}

export function validateAnswer(exercise: PoligonoExercise, answer: string): boolean {
  return exercise.answer === answer;
}

/**
 * Opciones de un ejercicio de botón.
 *
 * Existe porque `PoligonoExercise` es un union discriminado y `expert_select`
 * no tiene botones: quien necesite las opciones debe decirlo, y si le pasa la
 * variante equivocada el error salta en el núcleo y no en un `undefined` que
 * acabaría rompiendo el renderer en silencio.
 */
export function choiceOptions(exercise: PoligonoExercise): PoligonoOption[] {
  if (exercise.type === "expert_select")
    throw new Error("Un ejercicio `expert_select` no tiene opciones: se responde con una figura");
  return exercise.options;
}
