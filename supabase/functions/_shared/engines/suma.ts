/**
 * Motor puro de `suma` para Edge (D1).
 * Sin imágenes / sin consumo de RNG de catálogos: determinismo estable por seed.
 * El cliente (`operations.ts`) aún puede diferir en a/b si consume RNG de imágenes —
 * la paridad D1 se valida contra ESTE motor, no contra el bundle con assets.
 */

export type SumaDifficulty = "easy" | "medium" | "hard" | "expert";

export interface SumaExercise {
  a: number;
  b: number;
  op: "suma";
  answer: number;
  imageUrl: string;
}

interface SumaConfig {
  minA: number;
  maxA: number;
  minB: number;
  maxB: number;
  maxAnswer: number;
  count: number;
}

const CONFIGS: Record<SumaDifficulty, SumaConfig> = {
  easy: { minA: 1, maxA: 4, minB: 1, maxB: 4, maxAnswer: 5, count: 10 },
  medium: { minA: 1, maxA: 9, minB: 1, maxB: 9, maxAnswer: 10, count: 10 },
  hard: { minA: 1, maxA: 10, minB: 1, maxB: 10, maxAnswer: 20, count: 10 },
  expert: { minA: 1, maxA: 15, minB: 1, maxB: 15, maxAnswer: 30, count: 10 },
};

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Llevada de algoritmo en columna (p. ej. 12+8): algún sumando ≥ 10
 * y unidades ≥ 10. Las sumas de una cifra que pasan de 10 (7+8) no cuentan.
 * Esas llevadas pertenecen a «Sumamos llevando», no a «La suma».
 */
export function hasColumnCarry(a: number, b: number): boolean {
  if (a < 10 && b < 10) return false;
  return (a % 10) + (b % 10) >= 10;
}

export function generateSumaSession(difficulty: SumaDifficulty, seed: number): SumaExercise[] {
  const cfg = CONFIGS[difficulty];
  const rng = lcg(seed);
  const seen = new Set<string>();
  const exercises: SumaExercise[] = [];
  let attempts = 0;

  while (exercises.length < cfg.count && attempts < cfg.count * 40) {
    attempts++;
    const a = randInt(rng, cfg.minA, cfg.maxA);
    const b = randInt(rng, cfg.minB, Math.min(cfg.maxB, cfg.maxAnswer - a));
    if (a + b > cfg.maxAnswer || a + b < 1) continue;
    if (hasColumnCarry(a, b)) continue;

    const key = `${a}-${b}`;
    if (seen.has(key)) continue;
    seen.add(key);

    exercises.push({ a, b, op: "suma", answer: a + b, imageUrl: "" });
  }

  return exercises;
}

export function isSumaDifficulty(value: string): value is SumaDifficulty {
  return value === "easy" || value === "medium" || value === "hard" || value === "expert";
}
