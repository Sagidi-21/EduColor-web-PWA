import { IMAGE_CATEGORIES, pickImage } from "../../platform/objectImages";

export type OperationType = "suma" | "resta";

export interface OperationsExercise {
  a: number;
  b: number;
  op: OperationType;
  answer: number;
  imageUrl: string;
}

export interface OperationsConfig {
  op: OperationType;
  minA: number;
  maxA: number;
  minB: number;
  maxB: number;
  maxAnswer: number;
  count: number;
  showImage: boolean;
}

export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

const CONFIGS: Record<
  OperationType,
  Record<"easy" | "medium" | "hard" | "expert", OperationsConfig>
> = {
  suma: {
    easy: {
      op: "suma",
      minA: 1,
      maxA: 4,
      minB: 1,
      maxB: 4,
      maxAnswer: 5,
      count: 10,
      showImage: true,
    },
    medium: {
      op: "suma",
      minA: 1,
      maxA: 9,
      minB: 1,
      maxB: 9,
      maxAnswer: 10,
      count: 10,
      showImage: false,
    },
    hard: {
      op: "suma",
      minA: 1,
      maxA: 10,
      minB: 1,
      maxB: 10,
      maxAnswer: 20,
      count: 10,
      showImage: false,
    },
    expert: {
      op: "suma",
      minA: 1,
      maxA: 15,
      minB: 1,
      maxB: 15,
      maxAnswer: 30,
      count: 10,
      showImage: false,
    },
  },
  resta: {
    easy: {
      op: "resta",
      minA: 2,
      maxA: 5,
      minB: 1,
      maxB: 4,
      maxAnswer: 4,
      count: 10,
      showImage: true,
    },
    medium: {
      op: "resta",
      minA: 3,
      maxA: 10,
      minB: 1,
      maxB: 9,
      maxAnswer: 9,
      count: 10,
      showImage: false,
    },
    hard: {
      op: "resta",
      minA: 5,
      maxA: 20,
      minB: 1,
      maxB: 19,
      maxAnswer: 19,
      count: 10,
      showImage: false,
    },
    expert: {
      op: "resta",
      minA: 10,
      maxA: 30,
      minB: 1,
      maxB: 29,
      maxAnswer: 29,
      count: 10,
      showImage: false,
    },
  },
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

export function generateSession(
  op: OperationType,
  difficulty: "easy" | "medium" | "hard" | "expert",
  seed: number
): OperationsExercise[] {
  const cfg = CONFIGS[op][difficulty];
  const rng = lcg(seed);
  const seen = new Set<string>();
  const exercises: OperationsExercise[] = [];

  // Una imagen diferente por ejercicio, de una categoría diferente
  const cats = IMAGE_CATEGORIES.length > 0 ? [...IMAGE_CATEGORIES].sort(() => rng() - 0.5) : [];

  let zeroesAllowed = 1;
  let attempts = 0;

  while (exercises.length < cfg.count && attempts < cfg.count * 20) {
    attempts++;
    let a: number, b: number;

    if (op === "suma") {
      a = randInt(rng, cfg.minA, cfg.maxA);
      b = randInt(rng, cfg.minB, Math.min(cfg.maxB, cfg.maxAnswer - a));
      if (a + b > cfg.maxAnswer || a + b < 1) continue;
    } else {
      a = randInt(rng, cfg.minA, cfg.maxA);
      b = randInt(rng, cfg.minB, Math.min(cfg.maxB, a));
      if (a - b < 0) continue;
      if (a - b === 0) {
        if (zeroesAllowed <= 0) continue;
        zeroesAllowed--;
      }
    }

    const key = `${a}-${b}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const cat = cats.length > 0 ? cats[exercises.length % cats.length] : null;
    const imageUrl = cat ? pickImage(cat, rng) : "";

    exercises.push({ a, b, op, answer: op === "suma" ? a + b : a - b, imageUrl });
  }

  return exercises;
}

export function validateAnswer(ex: OperationsExercise, input: string): boolean {
  const n = parseInt(input, 10);
  return !isNaN(n) && n === ex.answer;
}

export function showImageSupport(
  op: OperationType,
  difficulty: "easy" | "medium" | "hard" | "expert"
): boolean {
  return CONFIGS[op][difficulty].showImage;
}

