import type { ActivityDifficulty } from "../content/contracts";

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

export interface AlgoritmoVerticalExercise {
  /** Primer sumando */
  a: number;
  /** Segundo sumando */
  b: number;
  /** Resultado */
  answer: number;
  /** Decenas de a */
  aD: number;
  /** Unidades de a */
  aU: number;
  /** Decenas de b */
  bD: number;
  /** Unidades de b */
  bU: number;
}

export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

// ────────────────────────────────────────────────────────────────
// PRNG determinista (LCG)
// ────────────────────────────────────────────────────────────────

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

function make(a: number, b: number): AlgoritmoVerticalExercise {
  return {
    a,
    b,
    answer: a + b,
    aD: Math.floor(a / 10),
    aU: a % 10,
    bD: Math.floor(b / 10),
    bU: b % 10,
  };
}

// ────────────────────────────────────────────────────────────────
// Generador
// Dificultades:
//   easy   — sin llevar, a con decenas (1–4D), b de 1 cifra, resultado ≤ 50
//   medium — sin llevar, ambos de 2 cifras, resultado ≤ 99
//   hard   — con llevar en unidades, resultado ≤ 50
//   expert — con llevar en unidades, resultado ≤ 99
// ────────────────────────────────────────────────────────────────

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): AlgoritmoVerticalExercise[] {
  const rng = lcg(seed);
  const used = new Set<string>();
  const out: AlgoritmoVerticalExercise[] = [];
  const count = 10;
  let tries = 0;

  while (out.length < count && tries < 300) {
    tries++;
    let a: number, b: number;

    if (difficulty === "easy") {
      // sin llevar, a con decenas (1-4D), b de 1 cifra, resultado ≤ 50
      const aD = randInt(rng, 1, 4);
      const aU = randInt(rng, 0, 9);
      const bU = randInt(rng, 1, 9 - aU);
      a = aD * 10 + aU;
      b = bU;
      if (a + b > 50) continue;
    } else if (difficulty === "medium") {
      // sin llevar, ambos con decenas, resultado ≤ 99
      const aD = randInt(rng, 1, 7);
      const bD = randInt(rng, 1, 9 - aD);
      const aU = randInt(rng, 0, 9);
      const bU = randInt(rng, 0, 9 - aU);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      if (a === b) continue;
    } else if (difficulty === "hard") {
      // con llevar en unidades, resultado ≤ 50
      const aU = randInt(rng, 5, 9);
      const bU = randInt(rng, 10 - aU, 9);
      const aD = randInt(rng, 1, 3);
      const bD = randInt(rng, 0, 2);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      if (a + b > 50) continue;
    } else {
      // expert: con llevar en unidades, resultado ≤ 99
      const aU = randInt(rng, 2, 9);
      const bU = randInt(rng, 10 - aU, 9);
      const aD = randInt(rng, 1, 8);
      const bD = randInt(rng, 0, 8 - aD);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      if (a + b > 99) continue;
      if (a === b) continue;
    }

    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (used.has(key)) continue;
    used.add(key);
    out.push(make(a, b));
  }

  return out;
}

export function validateAnswer(ex: AlgoritmoVerticalExercise, input: string): boolean {
  return input.trim() === String(ex.answer);
}
