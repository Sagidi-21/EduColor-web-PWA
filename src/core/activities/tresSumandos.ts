import type { ActivityDifficulty } from "../content/contracts";
import { IMAGE_CATEGORIES, pickImage } from "../../platform/objectImages";

export interface TresSumandosExercise {
  a: number;
  b: number;
  c: number;
  answer: number;
  imageUrl: string;
}

export const CONFIGS: Record<
  ActivityDifficulty,
  { maxEach: number; maxSum: number; count: number; showImage: boolean }
> = {
  easy: { maxEach: 2, maxSum: 5, count: 7, showImage: true },
  medium: { maxEach: 4, maxSum: 10, count: 10, showImage: false },
  hard: { maxEach: 6, maxSum: 15, count: 10, showImage: false },
  expert: { maxEach: 8, maxSum: 20, count: 10, showImage: false },
};

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

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42
): TresSumandosExercise[] {
  const cfg = CONFIGS[difficulty];
  const rng = lcg(seed);
  const seen = new Set<string>();
  const exercises: TresSumandosExercise[] = [];
  const cats = IMAGE_CATEGORIES.length > 0 ? [...IMAGE_CATEGORIES].sort(() => rng() - 0.5) : [];
  let attempts = 0;

  while (exercises.length < cfg.count && attempts < cfg.count * 30) {
    attempts++;
    const a = randInt(rng, 1, cfg.maxEach);
    const b = randInt(rng, 1, cfg.maxEach);
    const c = randInt(rng, 1, cfg.maxEach);
    if (a + b + c > cfg.maxSum) continue;
    const key = `${a}-${b}-${c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cat = cfg.showImage && cats.length > 0 ? cats[exercises.length % cats.length] : null;
    exercises.push({ a, b, c, answer: a + b + c, imageUrl: cat ? pickImage(cat, rng) : "" });
  }
  return exercises;
}

export function showImageSupport(difficulty: ActivityDifficulty): boolean {
  return CONFIGS[difficulty].showImage;
}

export function validateAnswer(ex: TresSumandosExercise, input: string): boolean {
  return parseInt(input, 10) === ex.answer;
}