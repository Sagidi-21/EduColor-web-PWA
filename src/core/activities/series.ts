import type { ActivityDifficulty } from "../../content/contracts";

export interface SeriesExercise {
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
  easy: [1],
  medium: [1, 2, 5],
  hard: [1, 2, 5, 10],
  expert: [2, 5, 10],
};

/** Genera una sesión de 10 ejercicios de series numéricas. */
export function generateSeriesSession(seed: number, difficulty: ActivityDifficulty): SeriesExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: SeriesExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < count && tries < 300) {
    tries++;

    const steps = STEPS_BY_DIFF[difficulty] ?? STEPS_BY_DIFF.easy;
    const step = steps[Math.floor(rng() * steps.length)];
    const ascending =
      difficulty === "easy" || difficulty === "medium" ? true : rng() > 0.35;

    const seriesLen = 5;
    const maxStart =
      difficulty === "easy"
        ? 8
        : difficulty === "medium"
          ? 14
          : difficulty === "hard"
            ? 49
            : 79;
    const start = randInt(rng, 0, Math.max(0, maxStart - step * (seriesLen - 1)));
    const base = ascending ? start : start + step * (seriesLen - 1);

    const full: number[] = Array.from({ length: seriesLen }, (_, i) =>
      ascending ? base + i * step : base - i * step,
    );
    if (full.some((n) => n < 0 || n > 99)) continue;

    // Blank position: prefer not the first (too easy to ignore context)
    const blankIndex = randInt(rng, 1, seriesLen - 1);
    const key = `${full[0]}-${step}-${ascending ? "a" : "d"}-${blankIndex}`;
    if (used.has(key)) continue;
    used.add(key);

    const correctAnswer = String(full[blankIndex]);

    const wrongs = new Set<string>();
    let w = 0;
    while (wrongs.size < 3 && w < 60) {
      w++;
      const delta = randInt(rng, 1, 3) * step * (rng() > 0.5 ? 1 : -1);
      const cand = full[blankIndex] + delta;
      if (cand >= 0 && cand <= 99 && String(cand) !== correctAnswer)
        wrongs.add(String(cand));
    }
    const options = [correctAnswer, ...Array.from(wrongs)].sort(() => rng() - 0.5);

    const sequence = full.map((n, i) => (i === blankIndex ? -1 : n));
    out.push({ sequence, blankIndex, step, ascending, correctAnswer, options });
  }

  return out;
}

/** Comprueba si la respuesta elegida es correcta. */
export function validateSeriesAnswer(ex: SeriesExercise, answer: string): boolean {
  return answer === ex.correctAnswer;
}
