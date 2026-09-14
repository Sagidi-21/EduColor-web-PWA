import type { ActivityDifficulty } from "../content/contracts";
import { IMAGE_CATEGORIES, pickImage } from "../../platform/objectImages";
import type { ImageCategory } from "../../platform/objectImages";

export interface CountingConfig {
  minCount: number;
  maxCount: number;
  randomLayout: boolean;
  quantity: number;
  difficulty: ActivityDifficulty;
}

export interface ObjectPosition {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface CountingExercise {
  id: number;
  count: number;
  imageUrl: string;
  objectLabel: string;
  positions: ObjectPosition[];
  options: number[];
  correctAnswer: number;
}

export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

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

function generateDistractors(correct: number, max: number, rng: () => number): number[] {
  const candidates: number[] = [];
  for (let i = 1; i <= max; i++) {
    if (i !== correct) candidates.push(i);
  }
  candidates.sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct));
  return shuffle(candidates.slice(0, 4), rng).slice(0, 3);
}

function generatePositions(
  count: number,
  randomLayout: boolean,
  rng: () => number
): ObjectPosition[] {
  const cols = count <= 4 ? count : Math.ceil(Math.sqrt(count * 1.4));
  const rows = Math.ceil(count / cols);
  const paddingX = 12,
    paddingY = 10;
  const cellW = (100 - paddingX * 2) / cols;
  const cellH = (100 - paddingY * 2) / rows;

  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push({ x: paddingX + (c + 0.5) * cellW, y: paddingY + (r + 0.5) * cellH });

  const chosen = shuffle(cells, rng).slice(0, count);
  const jitter = randomLayout ? 0.35 : 0;

  return chosen.map((cell) => ({
    x: Math.max(8, Math.min(92, cell.x + (rng() - 0.5) * cellW * jitter * 2)),
    y: Math.max(8, Math.min(92, cell.y + (rng() - 0.5) * cellH * jitter * 2)),
    rotation: randomLayout ? (rng() - 0.5) * 24 : 0,
    scale: 0.85 + rng() * 0.3,
  }));
}

export function generateSession(config: CountingConfig, seed = 42): CountingExercise[] {
  const rng = makeRng(seed);
  const exercises: CountingExercise[] = [];

  // Baraja las categorías disponibles — rota una por ejercicio
  const categories: ImageCategory[] =
    IMAGE_CATEGORIES.length > 0 ? shuffle([...IMAGE_CATEGORIES], rng) : [];

  const range: number[] = [];
  for (let n = config.minCount; n <= config.maxCount; n++) range.push(n);
  const shuffledRange = shuffle(range, rng);

  for (let i = 0; i < config.quantity; i++) {
    const count = shuffledRange[i % shuffledRange.length];
    const cat =
      categories.length > 0 ? categories[i % categories.length] : { name: "objetos", images: [] };

    // Una sola imagen por ejercicio — la misma para todos los objetos
    const imageUrl = cat.images.length > 0 ? pickImage(cat, rng) : "";

    exercises.push({
      id: i,
      count,
      imageUrl,
      objectLabel: cat.name,
      positions: generatePositions(count, config.randomLayout, rng),
      options: shuffle([count, ...generateDistractors(count, config.maxCount, rng)], rng),
      correctAnswer: count,
    });
  }

  return exercises;
}

export function validateAnswer(exercise: CountingExercise, answer: number): boolean {
  return answer === exercise.correctAnswer;
}

export const PRESET_CONFIGS: Record<ActivityDifficulty, CountingConfig> = {
  easy: { minCount: 1, maxCount: 5, randomLayout: false, quantity: 10, difficulty: "easy" },
  medium: { minCount: 1, maxCount: 10, randomLayout: true, quantity: 10, difficulty: "medium" },
  hard: { minCount: 5, maxCount: 10, randomLayout: true, quantity: 10, difficulty: "hard" },
  expert: { minCount: 10, maxCount: 20, randomLayout: true, quantity: 10, difficulty: "expert" },
};