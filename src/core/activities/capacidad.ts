import type { ActivityDifficulty } from "../content/contracts";

export type CapacidadType = "compare" | "read" | "fill";

export interface CapacidadExercise {
  type: CapacidadType;
  question: string;
  /** compare: litros del recipiente A */
  litersA?: number;
  /** compare: litros del recipiente B */
  litersB?: number;
  /** Capacidad máxima del recipiente visual */
  maxLiters?: number;
  /** compare: ["A", "B", "Igual"] */
  options?: string[];
  /** read: litros que hay en el recipiente */
  liters?: number;
  /** fill: número de vasos de 1 L */
  cups?: number;
  answer: string;
}

// ── LCG determinista ────────────────────────────────────────────────────────

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

const EXERCISE_COUNT = 10;
const MAX_TRIES = EXERCISE_COUNT * 30;

const TYPES: Record<ActivityDifficulty, CapacidadType[]> = {
  easy: ["compare"],
  medium: ["read"],
  hard: ["fill"],
  expert: ["compare", "read", "fill"],
};

/**
 * Genera ejercicios de capacidad con litros.
 *
 * - easy:   comparar dos recipientes (A, B o Igual).
 * - medium: leer el nivel de un recipiente.
 * - hard:   sumar vasos de 1 litro.
 * - expert: los tres tipos mezclados, hasta 8 litros.
 *
 * Se conservan los límites del motor original: la deduplicación por clave y el
 * tope `MAX_TRIES` hacen que `medium` y `hard` devuelvan 5 ejercicios en lugar
 * de 10, porque con 5 litros como máximo solo existen 5 combinaciones únicas.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): CapacidadExercise[] {
  const rng = lcg(seed);
  const types = TYPES[difficulty];
  const used = new Set<string>();
  const out: CapacidadExercise[] = [];
  let tries = 0;

  while (out.length < EXERCISE_COUNT && tries < MAX_TRIES) {
    tries++;
    const activeType = types[out.length % types.length];

    if (activeType === "compare") {
      const maxL = difficulty === "expert" ? 8 : 5;
      const a = randInt(rng, 1, maxL);
      const makeEqual = rng() < 0.2;
      const b = makeEqual
        ? a
        : (() => {
            let v = randInt(rng, 1, maxL);
            while (v === a) v = randInt(rng, 1, maxL);
            return v;
          })();
      const key = `cmp-${Math.min(a, b)}-${Math.max(a, b)}-${a === b}`;
      if (used.has(key)) continue;
      used.add(key);

      out.push({
        type: "compare",
        question: "¿Cuál tiene más agua?",
        litersA: a,
        litersB: b,
        maxLiters: maxL,
        options: ["A", "B", "Igual"],
        answer: a > b ? "A" : b > a ? "B" : "Igual",
      });
    } else if (activeType === "read") {
      const maxL = difficulty === "expert" ? 8 : 5;
      const liters = randInt(rng, 1, maxL);
      const key = `read-${liters}-${maxL}`;
      if (used.has(key)) continue;
      used.add(key);

      out.push({
        type: "read",
        question: "¿Cuántos litros hay?",
        liters,
        maxLiters: maxL,
        answer: String(liters),
      });
    } else {
      const maxCups = difficulty === "expert" ? 8 : 5;
      const cups = randInt(rng, 1, maxCups);
      const key = `fill-${cups}`;
      if (used.has(key)) continue;
      used.add(key);

      out.push({
        type: "fill",
        question: `Tienes ${cups} vasos de 1 litro.\n¿Cuántos litros hay en total?`,
        cups,
        answer: String(cups),
      });
    }
  }

  return out;
}

export function validateAnswer(exercise: CapacidadExercise, input: string): boolean {
  return input.trim() === exercise.answer;
}
