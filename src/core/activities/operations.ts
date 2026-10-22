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

/** Metadatos UI de suma (sin motor de generación — D2: Edge). */
const SUMA_SHOW_IMAGE: Record<"easy" | "medium" | "hard" | "expert", boolean> = {
  easy: true,
  medium: false,
  hard: false,
  expert: false,
};

const RESTA_CONFIGS: Record<"easy" | "medium" | "hard" | "expert", OperationsConfig> = {
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
 * Genera sesión local de **resta** (demo/compartido con UI).
 * `suma` no se genera en el cliente (D2): usar content-session Edge.
 */
export function generateSession(
  op: OperationType,
  difficulty: "easy" | "medium" | "hard" | "expert",
  seed: number,
): OperationsExercise[] {
  if (op === "suma") {
    throw new Error(
      "La generación local de suma está deshabilitada. Usa la API content-session (D2).",
    );
  }

  const cfg = RESTA_CONFIGS[difficulty];
  const rng = lcg(seed);
  const seen = new Set<string>();
  const exercises: OperationsExercise[] = [];

  const cats = IMAGE_CATEGORIES.length > 0 ? [...IMAGE_CATEGORIES].sort(() => rng() - 0.5) : [];

  let zeroesAllowed = 1;
  let attempts = 0;

  while (exercises.length < cfg.count && attempts < cfg.count * 20) {
    attempts++;
    const a = randInt(rng, cfg.minA, cfg.maxA);
    const b = randInt(rng, cfg.minB, Math.min(cfg.maxB, a));
    if (a - b < 0) continue;
    if (a - b === 0) {
      if (zeroesAllowed <= 0) continue;
      zeroesAllowed--;
    }

    const key = `${a}-${b}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const cat = cats.length > 0 ? cats[exercises.length % cats.length] : null;
    const imageUrl = cat ? pickImage(cat, rng) : "";

    exercises.push({ a, b, op: "resta", answer: a - b, imageUrl });
  }

  return exercises;
}

export function validateAnswer(ex: OperationsExercise, input: string): boolean {
  const n = parseInt(input, 10);
  return !isNaN(n) && n === ex.answer;
}

export function showImageSupport(
  op: OperationType,
  difficulty: "easy" | "medium" | "hard" | "expert",
): boolean {
  if (op === "suma") return SUMA_SHOW_IMAGE[difficulty];
  return RESTA_CONFIGS[difficulty].showImage;
}

/**
 * Adjunta imagen decorativa a ejercicios de suma ya generados en servidor.
 * No genera a/b: solo elige asset a partir del índice (sin motor premium).
 */
export function attachSumaImages(
  exercises: OperationsExercise[],
  difficulty: "easy" | "medium" | "hard" | "expert",
): OperationsExercise[] {
  if (!SUMA_SHOW_IMAGE[difficulty] || IMAGE_CATEGORIES.length === 0) {
    return exercises.map((ex) => ({ ...ex, imageUrl: "" }));
  }
  return exercises.map((ex, i) => {
    const cat = IMAGE_CATEGORIES[i % IMAGE_CATEGORIES.length]!;
    const url = cat.images[i % cat.images.length] ?? "";
    return { ...ex, imageUrl: url };
  });
}
