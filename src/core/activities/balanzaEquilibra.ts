import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `balanzaEquilibra`: genera ejercicios de arrastrar pesas para
 * equilibrar una balanza y valida la respuesta.
 *
 * Motor "Equilibra la balanza" — el niño ARRASTRA pesas al platillo derecho
 * hasta igualar la carga fija de la izquierda; la balanza se inclina en tiempo
 * real y, al quedar equilibrada, valida. Trabaja el kilogramo con kg ENTEROS
 * (sin decimales), alineado con la Unidad 7 (peso y masa, el kilogramo).
 *
 * Es un motor de manipulación distinto del motor `balanza` (opción múltiple):
 * aquí el renderer dibuja una balanza SVG con física de inclinación en tiempo
 * real y el alumno coloca pesas arrastrándolas, no elige una opción.
 *
 * No importa React ni nada del navegador. El renderer dibuja la balanza con lo
 * que esto devuelve, y los tests pueden hacerlo mismo.
 */

/** Un ejercicio de equilibrar la balanza. */
export interface BalanzaEqExercise {
  /** kg a igualar en la derecha (= carga fija de la izquierda). */
  target: number;
  /** Qué lleva el plato izquierdo: bloques de pesa o un objeto. */
  leftKind: "weights" | "object";
  /** Emoji del plato izquierdo: 🧱 (pesas) u objeto. */
  leftEmoji: string;
  /** `3 kg` — se muestra como etiqueta al lado del plato. */
  leftLabel: string;
  /** Denominaciones de pesa arrastrables: [1] o [1, 2]. */
  allowed: number[];
}

/** Objetos que pueden aparecer en el plato izquierdo en `medium`, `hard` y `expert`. */
export const OBJECTS = ["📦", "🎁", "🧺", "🎒", "🪣", "🛍️"] as const;

/**
 * Tamaño nominal de sesión: 10 ejercicios es el techo, pero el motor
 * deduplica targets y cada dificultad solo tiene `targetRange[1] - targetRange[0] + 1`
 * valores posibles, así que la sesión real puede ser más corta:
 *
 * - `easy`: 3 targets distintos (2-4 kg).
 * - `medium`: 5 targets (2-6 kg).
 * - `hard`: 6 targets (5-10 kg).
 * - `expert`: 9 targets (8-16 kg).
 *
 * El renderer usa `session.exercises.length` como total real; esto es solo
 * documentación declarativa y tests verifican contra `generateSession(...).length`.
 */
export const SESSION_TARGET = 10 as const;

/** Número de targets distintos que puede generar cada dificultad. */
function targetCount(difficulty: ActivityDifficulty): number {
  const cfg = config(difficulty);
  return cfg.targetRange[1] - cfg.targetRange[0] + 1;
}

/** Session size real esperado para cada dificultad (igual al número de targets). */
export const SESSION_SIZE: Record<ActivityDifficulty, number> = {
  easy: targetCount("easy"),
  medium: targetCount("medium"),
  hard: targetCount("hard"),
  expert: targetCount("expert"),
};

// ── LCG determinista ────────────────────────────────────────────────────────
// Mismas constantes que el original de Electron: una semilla da la misma
// secuencia allí y aquí, que es lo que hace comparables los tests de grano.

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Entero aleatorio entre `min` y `max`, inclusive, con el LCG. */
function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Configuración de cada dificultad: rango de target y denominaciones arrastrables.
 *
 * - `easy`: 2-4 kg con pesas de 1 kg (el plato izquierdo también es una pila de
 *   bloques de 1 kg).
 * - `medium`: 2-6 kg con un objeto.
 * - `hard`: 5-10 kg con un objeto.
 * - `expert`: 8-16 kg con un objeto y pesas de 1 kg y 2 kg.
 */
function config(difficulty: ActivityDifficulty): {
  targetRange: [number, number];
  leftKind: "weights" | "object";
  allowed: number[];
} {
  if (difficulty === "easy") return { targetRange: [2, 4], leftKind: "weights", allowed: [1] };
  if (difficulty === "medium") return { targetRange: [2, 6], leftKind: "object", allowed: [1] };
  if (difficulty === "hard") return { targetRange: [5, 10], leftKind: "object", allowed: [1] };
  return { targetRange: [8, 16], leftKind: "object", allowed: [1, 2] };
}

export function generateSession(difficulty: ActivityDifficulty, seed = 42): BalanzaEqExercise[] {
  const rng = lcg(seed);
  const cfg = config(difficulty);
  const out: BalanzaEqExercise[] = [];
  const used = new Set<number>();
  let tries = 0;

  while (out.length < 10 && tries < 300) {
    tries++;

    const target = randInt(rng, cfg.targetRange[0], cfg.targetRange[1]);
    if (used.has(target)) continue;
    used.add(target);

    const leftEmoji =
      cfg.leftKind === "weights" ? "🧱" : OBJECTS[Math.floor(rng() * OBJECTS.length)];
    out.push({
      target,
      leftKind: cfg.leftKind,
      leftEmoji,
      leftLabel: `${target} kg`,
      allowed: cfg.allowed,
    });
  }

  return out;
}

/**
 * Valida que un conjunto de pesas colocadas equilibre la balanza.
 *
 * La suma de las pesas debe ser exactamente `target`: cualquier exceso o falta
 * deja la balanza inclinada, que no es equilibrada.
 */
export function validateAnswer(weights: number[], exercise: BalanzaEqExercise): boolean {
  const sum = weights.reduce((a, b) => a + b, 0);
  return sum === exercise.target;
}
