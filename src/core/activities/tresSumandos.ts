import type { ActivityDifficulty } from "../content/contracts";
import { IMAGE_CATEGORIES, pickImage } from "../../platform/objectImages";

export interface TresSumandosExercise {
  a: number;
  b: number;
  c: number;
  answer: number;
  imageUrl: string;
}

interface LevelConfig {
  maxEach: number;
  maxSum: number;
  count: number;
  showImage: boolean;
  minEach?: number;
  carryRule?: "none" | "units-only" | "at-least-one" | "any";
}

// Base configs per difficulty as fallback
export const CONFIGS: Record<ActivityDifficulty, LevelConfig> = {
  easy: { maxEach: 3, maxSum: 9, count: 7, showImage: true, carryRule: "none" },
  medium: { maxEach: 9, maxSum: 20, count: 10, showImage: false, carryRule: "any" },
  hard: { maxEach: 20, maxSum: 50, count: 10, showImage: false, carryRule: "any" },
  expert: { maxEach: 50, maxSum: 100, count: 10, showImage: false, carryRule: "any" },
};

// Mapping curriculum level IDs to specific configs
function configForLevel(levelId: string): LevelConfig {
  switch (levelId) {
    // 1.º Primaria levels
    case "1-L1":
      return { maxEach: 3, maxSum: 9, count: 10, showImage: true, carryRule: "none" }; // small numbers, no carry
    case "1-L2":
      return { maxEach: 9, maxSum: 20, count: 10, showImage: false, carryRule: "at-least-one" }; // up to 20, con llevadas
    case "1-L3":
      return {
        minEach: 10,
        maxEach: 30,
        maxSum: 90,
        count: 10,
        showImage: false,
        carryRule: "none",
      }; // 2‑digit column, no carry
    case "1-L4":
      return {
        minEach: 10,
        maxEach: 40,
        maxSum: 99,
        count: 10,
        showImage: false,
        carryRule: "units-only",
      }; // 2‑digit column, with exactly one carry
    // 2.º Primaria levels
    case "2-L1":
      return {
        minEach: 10,
        maxEach: 30,
        maxSum: 90,
        count: 10,
        showImage: false,
        carryRule: "none",
      }; // 3 sumandos de 2 cifras, sin llevadas
    case "2-L2":
      return {
        minEach: 10,
        maxEach: 40,
        maxSum: 99,
        count: 10,
        showImage: false,
        carryRule: "at-least-one",
      }; // 3 sumandos de 2 cifras, con llevadas
    case "2-L3":
      return {
        minEach: 100,
        maxEach: 300,
        maxSum: 900,
        count: 10,
        showImage: false,
        carryRule: "none",
      }; // 3 sumandos de 3 cifras, sin llevadas
    case "2-L4":
      return {
        minEach: 100,
        maxEach: 400,
        maxSum: 999,
        count: 10,
        showImage: false,
        carryRule: "at-least-one",
      }; // 3 sumandos de 3 cifras, con llevadas
    default:
      // Fallback to easy config if unknown level
      return CONFIGS.easy;
  }
}

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

function checkCarries(a: number, b: number, c: number) {
  const uA = a % 10,
    uB = b % 10,
    uC = c % 10;
  const tA = Math.floor(a / 10) % 10,
    tB = Math.floor(b / 10) % 10,
    tC = Math.floor(c / 10) % 10;
  const hA = Math.floor(a / 100) % 10,
    hB = Math.floor(b / 100) % 10,
    hC = Math.floor(c / 100) % 10;

  const sumU = uA + uB + uC;
  const unitsCarry = sumU >= 10;

  const sumT = tA + tB + tC + Math.floor(sumU / 10);
  const tensCarry = sumT >= 10;

  const sumH = hA + hB + hC + Math.floor(sumT / 10);
  const hundredsCarry = sumH >= 10;

  return { unitsCarry, tensCarry, hundredsCarry };
}

export function generateSession(
  difficulty: ActivityDifficulty,
  levelId?: string,
  seed = 42,
): TresSumandosExercise[] {
  // If a curriculum level is provided, use its specific config, otherwise fall back to difficulty config
  const cfg = levelId ? configForLevel(levelId) : CONFIGS[difficulty];
  const rng = lcg(seed);
  const seen = new Set<string>();
  const exercises: TresSumandosExercise[] = [];
  const cats = IMAGE_CATEGORIES.length > 0 ? [...IMAGE_CATEGORIES].sort(() => rng() - 0.5) : [];
  let attempts = 0;
  const minE = cfg.minEach || 1;

  while (exercises.length < cfg.count && attempts < cfg.count * 50) {
    attempts++;
    const a = randInt(rng, minE, cfg.maxEach);
    const b = randInt(rng, minE, cfg.maxEach);
    const c = randInt(rng, minE, cfg.maxEach);

    if (a + b + c > cfg.maxSum) continue;

    // Check carry rules
    if (cfg.carryRule && cfg.carryRule !== "any") {
      const { unitsCarry, tensCarry, hundredsCarry } = checkCarries(a, b, c);
      const anyCarry = unitsCarry || tensCarry || hundredsCarry;
      if (cfg.carryRule === "none" && anyCarry) continue;
      if (cfg.carryRule === "units-only" && (!unitsCarry || tensCarry || hundredsCarry)) continue;
      if (cfg.carryRule === "at-least-one" && !anyCarry) continue;
    }

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
