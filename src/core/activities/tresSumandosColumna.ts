import type { ActivityDifficulty } from "../content/contracts";

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

export interface TresSumandosColumnaExercise {
  a: number;
  b: number;
  c: number;
  answer: number;
  aD: number;
  aU: number;
  bD: number;
  bU: number;
  cD: number;
  cU: number;
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

// ────────────────────────────────────────────────────────────────
// Generador
// Dificultades (siempre sin llevada):
//   easy   — a=1D+1cifra, b y c=1 cifra, resultado ≤ 19
//   medium — a=2D (D=1-2), b=2D (D=1), c=1 cifra, resultado ≤ 49
//   hard   — a=2D (D=1-2), b=2D (D=1-2), c=2D (D=1), resultado ≤ 69
//   expert — a,b,c todos de 2D, resultado ≤ 89
// ────────────────────────────────────────────────────────────────

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): TresSumandosColumnaExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const used = new Set<string>();
  const out: TresSumandosColumnaExercise[] = [];
  let tries = 0;

  while (out.length < count && tries < count * 50) {
    tries++;
    let a: number, b: number, c: number;

    if (difficulty === "easy") {
      const aD = 1;
      const aU = randInt(rng, 0, 4);
      const bU = randInt(rng, 1, 4);
      const cU = randInt(rng, 1, 3);
      if (aU + bU + cU > 9) continue;
      a = aD * 10 + aU;
      b = bU;
      c = cU;
    } else if (difficulty === "medium") {
      const aD = randInt(rng, 1, 2);
      const aU = randInt(rng, 0, 3);
      const bD = 1;
      const bU = randInt(rng, 0, 3);
      const cU = randInt(rng, 1, 3);
      if (aU + bU + cU > 9) continue;
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      c = cU;
    } else if (difficulty === "hard") {
      const aD = randInt(rng, 1, 2);
      const aU = randInt(rng, 0, 3);
      const bD = randInt(rng, 1, 2);
      const bU = randInt(rng, 0, 3);
      const cD = 1;
      const cU = randInt(rng, 0, 3);
      if (aU + bU + cU > 9) continue;
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      c = cD * 10 + cU;
    } else {
      // expert
      const aD = randInt(rng, 1, 3);
      const aU = randInt(rng, 0, 2);
      const bD = randInt(rng, 1, 3);
      const bU = randInt(rng, 0, 2);
      const cD = randInt(rng, 1, 2);
      const cU = randInt(rng, 0, 2);
      if (aU + bU + cU > 9) continue;
      if (aD + bD + cD > 8) continue;
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      c = cD * 10 + cU;
    }

    const key = `${a}-${b}-${c}`;
    if (used.has(key)) continue;
    used.add(key);

    out.push({
      a,
      b,
      c,
      answer: a + b + c,
      aD: Math.floor(a / 10),
      aU: a % 10,
      bD: Math.floor(b / 10),
      bU: b % 10,
      cD: Math.floor(c / 10),
      cU: c % 10,
    });
  }

  return out;
}

export function validateAnswer(ex: TresSumandosColumnaExercise, input: string): boolean {
  return input.trim() === String(ex.answer);
}
