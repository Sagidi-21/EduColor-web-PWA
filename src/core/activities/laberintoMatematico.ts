import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `laberintoMatematico` (y de `laberintoMatematico2`, que comparte
 * motor): genera el laberinto de operaciones y valida el valor de un nodo.
 *
 * El tablero tiene ocho nodos: `S` es el de inicio y no lo escribe el niño, los
 * otros siete se rellenan. Cada flecha lleva una operación (`+` o `-`) y un
 * valor, así que hay ocho operaciones en total. El niño recorre el laberinto
 * escribiendo el resultado de cada operación en su casilla y, al final,
 * contesta qué número es el mayor (o el menor) de todos los que ha encontrado.
 *
 * Migración literal de `electron-reference/Colegio/src/renderer/src/core/
 * engines/laberintoMatematico/engine.ts`: misma topología, mismo orden de
 * cómputo, mismo LCG (una semilla da la misma sesión allí y aquí) y los mismos
 * límites por curso y dificultad. Lo único que cambia es que la semilla llega
 * por parámetro en vez de generarse dentro.
 *
 * No importa React ni nada del navegador: el renderer dibuja el laberinto con
 * lo que esto devuelve, y los tests pueden comprobarlo sin montar nada.
 */

/** Los ocho nodos del tablero: `S` es el de inicio y no se rellena. */
export type NodeId = "S" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

/** Operaciones de las flechas. */
export type OpType = "+" | "-";

/** Qué pregunta el enunciado del ejercicio. */
export type Mode = "mayor" | "menor";

/** Curso: 1.º y 2.º tienen tablas de límites distintas (ver `CONFIGS`). */
export type LaberintoGrade = "1" | "2";

/** Una flecha del laberinto: une dos nodos y lleva la operación que hay que hacer. */
export interface LaberintoEdge {
  from: NodeId;
  to: NodeId;
  op: OpType;
  value: number;
  direction: "right" | "down";
}

/** Un ejercicio: el tablero completo, sus soluciones y la pregunta final. */
export interface LaberintoExercise {
  /** Número del nodo de inicio. */
  start: number;
  /** Las ocho flechas, en el mismo orden que la topología fija. */
  edges: LaberintoEdge[];
  /** Valor de cada nodo, `S` incluido. */
  answers: Record<NodeId, number>;
  /** Las tres salidas del laberinto. */
  fins: { node: NodeId; label: string }[];
  mode: Mode;
  /** Nodo que hay que señalar como respuesta a la pregunta final. */
  correctFin: NodeId;
  question: string;
}

// ── Topología fija de 8 nodos ───────────────────────────────────────────────
// S → A → B → C (FIN A)
//     ↓   ↓
//     D   E
//     ↓   ↓
//     F   G → H (FIN C)
//  (FIN B)
const TOPOLOGY: { from: NodeId; to: NodeId; direction: "right" | "down" }[] = [
  { from: "S", to: "A", direction: "right" }, // 0
  { from: "A", to: "B", direction: "right" }, // 1
  { from: "B", to: "C", direction: "right" }, // 2
  { from: "A", to: "D", direction: "down" }, // 3
  { from: "B", to: "E", direction: "down" }, // 4
  { from: "D", to: "F", direction: "down" }, // 5
  { from: "E", to: "G", direction: "down" }, // 6
  { from: "G", to: "H", direction: "right" }, // 7
];

/**
 * Orden en que se calculan los valores. No es el mismo que el de las flechas:
 * los nodos se resuelven en anchura, así que `D` y `E` se calculan antes que
 * `F`, `G` y `H`. `edgeIdx` es la flecha que llega a cada nodo.
 */
const COMPUTE_ORDER = [
  { node: "A" as NodeId, from: "S" as NodeId, edgeIdx: 0 },
  { node: "B" as NodeId, from: "A" as NodeId, edgeIdx: 1 },
  { node: "C" as NodeId, from: "B" as NodeId, edgeIdx: 2 },
  { node: "D" as NodeId, from: "A" as NodeId, edgeIdx: 3 },
  { node: "E" as NodeId, from: "B" as NodeId, edgeIdx: 4 },
  { node: "F" as NodeId, from: "D" as NodeId, edgeIdx: 5 },
  { node: "G" as NodeId, from: "E" as NodeId, edgeIdx: 6 },
  { node: "H" as NodeId, from: "G" as NodeId, edgeIdx: 7 },
];

/** Las tres salidas del laberinto. Sus etiquetas (`A`, `B`, `C`) las usa el renderer. */
export const FIN_NODES: { node: NodeId; label: string }[] = [
  { node: "C", label: "A" },
  { node: "F", label: "B" },
  { node: "H", label: "C" },
];

/** Los siete nodos que el niño rellena, en el orden en que los pinta el renderer. */
export const FILLABLE_NODES: Exclude<NodeId, "S">[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

// ── Configuración de dificultad ─────────────────────────────────────────────
interface DiffConfig {
  startRange: [number, number];
  opValues: number[];
  ops: OpType[];
  max: number;
  min: number;
}

/**
 * Límites por curso y dificultad, iguales a los del original.
 *
 * 1.º: `easy` solo suma hasta 10; a partir de `medium` entran las restas y el
 * techo sube a 20, 59 y 99, que es lo que dicen las tarjetas del catálogo.
 * 2.º: los mismos cuatro niveles con cifras de dos y tres, hasta 199 y 999.
 */
const CONFIGS: Record<LaberintoGrade, Record<ActivityDifficulty, DiffConfig>> = {
  "1": {
    easy: { startRange: [1, 4], opValues: [1, 2, 3], ops: ["+"], max: 10, min: 0 },
    medium: { startRange: [2, 8], opValues: [1, 2, 3, 4], ops: ["+", "-"], max: 20, min: 0 },
    hard: { startRange: [5, 20], opValues: [2, 3, 5, 10], ops: ["+", "-"], max: 59, min: 0 },
    expert: { startRange: [10, 40], opValues: [5, 10, 15, 20], ops: ["+", "-"], max: 99, min: 0 },
  },
  "2": {
    easy: { startRange: [5, 20], opValues: [5, 10, 15], ops: ["+", "-"], max: 99, min: 0 },
    medium: { startRange: [20, 80], opValues: [10, 20, 30], ops: ["+", "-"], max: 199, min: 0 },
    hard: { startRange: [50, 200], opValues: [20, 50, 100], ops: ["+", "-"], max: 999, min: 0 },
    expert: {
      startRange: [50, 300],
      opValues: [25, 50, 75, 100],
      ops: ["+", "-"],
      max: 999,
      min: 0,
    },
  },
};

// ── LCG determinista ────────────────────────────────────────────────────────
// Mismas constantes que el original de Electron, para que una semilla dé la
// misma sesión en los dos proyectos.

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Entero entre `min` y `max`, inclusive, con el LCG. */
function ri(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ── API pública ────────────────────────────────────────────────────────────

/**
 * Genera una sesión de cinco ejercicios como mucho.
 *
 * Rechaza un candidato y vuelve a tirar cuando alguna operación se sale del
 * rango de la dificultad (no puede bajar de `min` ni pasar de `max`) o cuando
 * las tres salidas coinciden en valor, que haría la pregunta final ambigua.
 * El tope de 1000 intentos es una red de seguridad: los límites son generosos
 * y siempre hay candidatos válidos, así que no es un comportamiento que se
 * llegue a ver.
 */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
  grade: LaberintoGrade = "1",
): LaberintoExercise[] {
  const cfg = CONFIGS[grade][difficulty];
  const rng = lcg(seed);
  const out: LaberintoExercise[] = [];
  let tries = 0;

  while (out.length < 5 && tries < 1000) {
    tries++;

    const start = ri(rng, cfg.startRange[0], cfg.startRange[1]);
    const edgeOps = TOPOLOGY.map(() => ({
      op: cfg.ops[Math.floor(rng() * cfg.ops.length)] as OpType,
      value: cfg.opValues[Math.floor(rng() * cfg.opValues.length)],
    }));

    const vals: Partial<Record<NodeId, number>> = { S: start };
    let valid = true;

    for (const step of COMPUTE_ORDER) {
      const base = vals[step.from]!;
      const { op, value } = edgeOps[step.edgeIdx];
      const result = op === "+" ? base + value : base - value;
      if (result < cfg.min || result > cfg.max) {
        valid = false;
        break;
      }
      vals[step.node] = result;
    }
    if (!valid) continue;

    // Las tres salidas tienen que tener valores distintos.
    const finVals = FIN_NODES.map((f) => vals[f.node]!);
    if (new Set(finVals).size < 3) continue;

    const mode: Mode = rng() > 0.5 ? "mayor" : "menor";

    // El objetivo es el número menor/mayor de TODOS los nodos a los que se ha
    // llegado (la ruta entera, no solo las salidas).
    const allVals = Object.values(vals) as number[];
    const correctAns = mode === "mayor" ? Math.max(...allVals) : Math.min(...allVals);

    // Cualquier nodo puede tener ese valor: la respuesta puede ser una salida
    // o un nodo intermedio, y el enunciado no dice que sean las salidas.
    const correctFin = (Object.keys(vals) as NodeId[]).find((n) => vals[n] === correctAns) || "S";

    out.push({
      start,
      edges: TOPOLOGY.map((t, i) => ({ ...t, op: edgeOps[i].op, value: edgeOps[i].value })),
      answers: vals as Record<NodeId, number>,
      fins: FIN_NODES,
      mode,
      correctFin,
      question:
        mode === "mayor"
          ? "¿Cuál es el número mayor al que has llegado?"
          : "¿Cuál es el número menor al que has llegado?",
    });
  }

  return out;
}

/**
 * Valida el número escrito en un nodo: tiene que ser exactamente el que
 * resulta de aplicar su flecha. El nodo de inicio no se valida, porque no lo
 * escribe el niño.
 */
export function validateNode(
  ex: LaberintoExercise,
  nodeId: Exclude<NodeId, "S">,
  answer: number,
): boolean {
  return answer === ex.answers[nodeId];
}
