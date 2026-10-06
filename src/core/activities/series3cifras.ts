import type { ActivityDifficulty } from "../content/contracts";

export interface Series3CifrasExercise {
  sequence: number[]; // 5 numbers, -1 marks the blank
  blankIndex: number;
  step: number;
  ascending: boolean;
  correctAnswer: string;
  options: string[];
}

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

const STEPS_BY_DIFF: Record<string, number[]> = {
  easy: [1, 2, 5],
  medium: [2, 5, 10],
  hard: [5, 10, 20, 50],
  expert: [10, 20, 50, 100],
};

/** Genera una sesión de 10 ejercicios de series numéricas de 3 cifras (100-999). */
export function generateSeries3CifrasSession(
  seed: number,
  difficulty: ActivityDifficulty,
): Series3CifrasExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: Series3CifrasExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < count && tries < 500) {
    tries++;

    const steps = STEPS_BY_DIFF[difficulty] ?? STEPS_BY_DIFF.easy;
    const step = steps[Math.floor(rng() * steps.length)];
    const ascending = difficulty === "easy" || difficulty === "medium" ? true : rng() > 0.4;

    const seriesLen = 5;

    // We want all numbers to be between 100 and 999.
    // If ascending, base + 4 * step <= 999 => start <= 999 - 4 * step
    // If descending, base - 4 * step >= 100 => start >= 100 + 4 * step

    const minPossible = ascending ? 100 : 100 + step * (seriesLen - 1);
    const maxPossible = ascending ? 999 - step * (seriesLen - 1) : 999;

    if (minPossible > maxPossible) continue;

    const start = randInt(rng, minPossible, maxPossible);

    const full: number[] = Array.from({ length: seriesLen }, (_, i) =>
      ascending ? start + i * step : start - i * step,
    );
    if (full.some((n) => n < 100 || n > 999)) continue;

    // Blank position: prefer not the first (too easy to ignore context)
    const blankIndex = randInt(rng, 1, seriesLen - 1);
    const key = `${full[0]}-${step}-${ascending ? "a" : "d"}-${blankIndex}`;
    if (used.has(key)) continue;
    used.add(key);

    const correctAnswer = String(full[blankIndex]);

    const wrongs = new Set<string>();
    let w = 0;
    while (wrongs.size < 3 && w < 100) {
      w++;
      const delta = randInt(rng, 1, 3) * step * (rng() > 0.5 ? 1 : -1);
      const cand = full[blankIndex] + delta;
      if (cand >= 100 && cand <= 999 && String(cand) !== correctAnswer) wrongs.add(String(cand));
    }
    const options = [correctAnswer, ...Array.from(wrongs)].sort(() => rng() - 0.5);

    const sequence = full.map((n, i) => (i === blankIndex ? -1 : n));
    out.push({ sequence, blankIndex, step, ascending, correctAnswer, options });
  }

  return out;
}

/** Comprueba si la respuesta elegida es correcta. */
export function validateSeries3CifrasAnswer(ex: Series3CifrasExercise, answer: string): boolean {
  return answer === ex.correctAnswer;
}
