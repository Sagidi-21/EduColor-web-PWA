import type { ActivityDifficulty } from "../content/contracts";
import { IMAGE_CATEGORIES, pickCategory, pickImage } from "../../platform/objectImages";

export type RelacionarPair = {
  id: number;
  number: number;
  imageUrl: string;
  objectLabel: string;
  scattered: boolean;
};

export type RelacionarSession = {
  pairs: RelacionarPair[];
  leftColumn: RelacionarPair[];
  rightColumn: RelacionarPair[];
};

type DifficultyConfig = {
  count: number;
  min: number;
  max: number;
  scattered: boolean;
  multiImage: boolean;
};

const CONFIGS: Record<ActivityDifficulty, DifficultyConfig> = {
  easy: { count: 3, min: 1, max: 5, scattered: false, multiImage: true },
  medium: { count: 4, min: 1, max: 9, scattered: false, multiImage: true },
  hard: { count: 5, min: 1, max: 9, scattered: false, multiImage: true },
  expert: { count: 5, min: 5, max: 15, scattered: true, multiImage: true },
};

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSingleRound(difficulty: ActivityDifficulty, rng: () => number): RelacionarSession {
  const cfg = CONFIGS[difficulty];

  const pool = Array.from({ length: cfg.max - cfg.min + 1 }, (_, i) => i + cfg.min);
  const numbers = shuffle(pool, rng).slice(0, cfg.count);

  let pairs: RelacionarPair[];

  if (cfg.multiImage) {
    const cats = shuffle([...IMAGE_CATEGORIES], rng);
    pairs = numbers.map((num, i) => {
      const cat = cats[i % cats.length];
      return {
        id: i,
        number: num,
        imageUrl: pickImage(cat, rng),
        objectLabel: cat.name,
        scattered: cfg.scattered,
      };
    });
  } else {
    const cat = pickCategory(rng);
    const imageUrl = pickImage(cat, rng);
    pairs = numbers.map((num, i) => ({
      id: i,
      number: num,
      imageUrl,
      objectLabel: cat.name,
      scattered: false,
    }));
  }

  const leftColumn = shuffle([...pairs], rng);
  const rightColumn = shuffle([...pairs], rng);

  return { pairs, leftColumn, rightColumn };
}

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
  totalRounds = 5,
): RelacionarSession[] {
  const rng = makeRng(seed);
  const rounds: RelacionarSession[] = [];
  for (let r = 0; r < totalRounds; r++) {
    rounds.push(generateSingleRound(difficulty, rng));
  }
  return rounds;
}
