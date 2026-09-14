import type { ActivityDifficulty } from "../content/contracts";
import { IMAGE_CATEGORIES, pickImage } from "../../platform/objectImages";

export type IgualdadType = "resultado" | "sumando" | "descomposicion";

export interface IgualdadExercise {
  type: IgualdadType;
  a: number;
  b: number;
  c: number;
  options: (number | string)[];
  answer: number | string;
  imageUrl: string;
}

export function generateSession(
  difficulty: ActivityDifficulty,
  seed: number
): IgualdadExercise[] {
  const rng = lcg(seed);
  const seen = new Set<string>();
  const exercises: IgualdadExercise[] = [];
  let attempts = 0;

  const CONFIGS: Record<ActivityDifficulty, { type: IgualdadType | "mixed"; max: number; count: number }> = {
    easy: { type: "resultado", max: 5, count: 10 },
    medium: { type: "sumando", max: 10, count: 10 },
    hard: { type: "descomposicion", max: 10, count: 10 },
    expert: { type: "mixed", max: 15, count: 10 },
  };

  const MIXED_TYPES: IgualdadType[] = ["resultado", "sumando", "descomposicion"];

  const cfg = CONFIGS[difficulty];

  while (exercises.length < cfg.count && attempts < cfg.count * 20) {
    attempts++;
    const activeType: IgualdadType =
      cfg.type === "mixed" ? MIXED_TYPES[exercises.length % 3] : cfg.type;

    if (activeType === "resultado") {
      const a = randInt(rng, 1, cfg.max - 1);
      const b = randInt(rng, 1, cfg.max - a);
      const c = a + b;
      const key = `${a}+${b}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // distractores: ±1, ±2 del resultado correcto, únicos y en rango
      const distSet = new Set<number>([c]);
      const candidates = [c - 2, c - 1, c + 1, c + 2].filter((n) => n >= 1 && n <= cfg.max + 4);
      for (const n of shuffle(candidates, rng)) {
        if (distSet.size >= 4) break;
        distSet.add(n);
      }
      const options = shuffle([...distSet].slice(0, 4) as number[], rng);
      const cat =
        difficulty !== "expert" && IMAGE_CATEGORIES.length > 0
          ? IMAGE_CATEGORIES[Math.floor(rng() * IMAGE_CATEGORIES.length)]
          : null;
      const imageUrl = cat ? pickImage(cat, rng) : "";
      exercises.push({ type: "resultado", a, b, c, options, answer: c, imageUrl });
    } else if (activeType === "sumando") {
      const c = randInt(rng, 2, cfg.max);
      const b = randInt(rng, 1, c - 1);
      const a = c - b;
      const key = `${a}+${b}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const distSet = new Set<number>([a]);
      const candidates = [a - 2, a - 1, a + 1, a + 2].filter((n) => n >= 1 && n < c);
      for (const n of shuffle(candidates, rng)) {
        if (distSet.size >= 4) break;
        distSet.add(n);
      }
      // si no hay suficientes, relleno determinista
      let fill = 1;
      while (distSet.size < 4 && fill < c) {
        if (fill !== a) distSet.add(fill);
        fill++;
      }
      const options = shuffle([...distSet].slice(0, 4) as number[], rng);
      exercises.push({ type: "sumando", a, b, c, options, answer: a, imageUrl: "" });
    } else {
      // decompose: c = ___ + ___  → elegir la pareja correcta
      const c = randInt(rng, 2, cfg.max);
      const a = randInt(rng, 1, c - 1);
      const b = c - a;
      const key = `${c}=${Math.min(a, b)}+${Math.max(a, b)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const correctStr = `${Math.min(a, b)}+${Math.max(a, b)}`;
      // distractores: otras descomposiciones del mismo o distinto número
      const distSet = new Set<string>([correctStr]);
      for (let tries = 0; tries < 20 && distSet.size < 4; tries++) {
        const da = randInt(rng, 1, cfg.max - 1);
        const db = randInt(rng, 1, cfg.max - 1);
        const ds = `${Math.min(da, db)}+${Math.max(da, db)}`;
        if (da + db !== c) distSet.add(ds); // suma diferente = distractor
      }
      const options = shuffle([...distSet].slice(0, 4) as string[], rng);
      exercises.push({ type: "descomposicion", a, b, c, options, answer: correctStr, imageUrl: "" });
    }
  }

  return exercises;
}

export function validateAnswer(ex: IgualdadExercise, chosen: number | string): boolean {
  return String(chosen) === String(ex.answer);
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

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}