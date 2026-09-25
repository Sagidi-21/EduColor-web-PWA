import type { ActivityDifficulty } from "../content/contracts";

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

export interface RestaColumnaExercise {
  /** Minuendo */
  a: number;
  /** Sustraendo */
  b: number;
  /** Diferencia */
  answer: number;
  aD: number;
  aU: number;
  bD: number;
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

function make(a: number, b: number): RestaColumnaExercise {
  return {
    a,
    b,
    answer: a - b,
    aD: Math.floor(a / 10),
    aU: a % 10,
    bD: Math.floor(b / 10),
    bU: b % 10,
  };
}

// ────────────────────────────────────────────────────────────────
// Generador
// Dificultades (siempre sin llevar):
//   easy   — minuendo 12–19, sustraendo 1 cifra, resultado siempre 2 cifras
//   medium — minuendo 20–39, ambos de 2 cifras, sin llevar
//   hard   — minuendo 30–59, sin llevar, resultado ≥ 10
//   expert — minuendo 40–59, sin llevar, resultado ≥ 10
// ────────────────────────────────────────────────────────────────

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): RestaColumnaExercise[] {
  const rng = lcg(seed);
  const used = new Set<string>();
  const out: RestaColumnaExercise[] = [];
  const count = 10;
  let tries = 0;

  while (out.length < count && tries < 300) {
    tries++;
    let a: number, b: number;

    if (difficulty === "easy") {
      const aD = 1;
      const aU = randInt(rng, 2, 9);
      const bU = randInt(rng, 1, aU - 1);
      a = aD * 10 + aU;
      b = bU;
    } else if (difficulty === "medium") {
      const aD = randInt(rng, 2, 3);
      const bD = randInt(rng, 1, aD - 1);
      const aU = randInt(rng, 1, 9);
      const bU = randInt(rng, 0, aU - 1);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      if (b === 0) continue;
    } else if (difficulty === "hard") {
      const aD = randInt(rng, 3, 5);
      const bD = randInt(rng, 1, aD - 1);
      const aU = randInt(rng, 1, 9);
      const bU = randInt(rng, 0, aU - 1);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      if (b === 0 || a - b < 10) continue;
    } else {
      // expert
      const aD = randInt(rng, 4, 5);
      const bD = randInt(rng, 1, aD - 1);
      const aU = randInt(rng, 1, 9);
      const bU = randInt(rng, 0, aU - 1);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      if (b === 0 || a - b < 10) continue;
    }

    const key = `${a}-${b}`;
    if (used.has(key)) continue;
    used.add(key);
    out.push(make(a, b));
  }

  return out;
}

export function validateAnswer(ex: RestaColumnaExercise, input: string): boolean {
  return input.trim() === String(ex.answer);
}
