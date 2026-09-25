import type { ActivityDifficulty } from "../content/contracts";

export interface ShapeDef {
  id: string;
  label: string;
  type: "circle" | "square" | "triangle" | "rectangle" | "rhombus" | "oval";
}

export const SHAPES: ShapeDef[] = [
  { id: "circulo", label: "círculo", type: "circle" },
  { id: "cuadrado", label: "cuadrado", type: "square" },
  { id: "triangulo", label: "triángulo", type: "triangle" },
  { id: "rectangulo", label: "rectángulo", type: "rectangle" },
  { id: "rombo", label: "rombo", type: "rhombus" },
  { id: "ovalo", label: "óvalo", type: "oval" },
];

const COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#0ea5e9",
  "#16a34a",
];

const CONFIGS: Record<
  ActivityDifficulty,
  {
    shapes: ShapeDef[];
    optionCount: number;
    rotationMax: number;
    quantity: number;
  }
> = {
  easy: { shapes: SHAPES.slice(0, 3), optionCount: 3, rotationMax: 0, quantity: 10 },
  medium: { shapes: SHAPES.slice(0, 4), optionCount: 4, rotationMax: 30, quantity: 10 },
  hard: { shapes: SHAPES.slice(0, 5), optionCount: 5, rotationMax: 60, quantity: 10 },
  expert: { shapes: SHAPES, optionCount: 5, rotationMax: 0, quantity: 12 },
};

export interface ShapesExercise {
  id: number;
  shape: ShapeDef;
  color: string;
  rotation: number;
  scale: number;
  options: ShapeDef[];
  correctAnswer: string; // shape.id
  imageUrl?: string; // solo en expert: foto real del objeto
}

// ── LCG determinista ────────────────────────────────────────────────────────

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

function randomFloat(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

// Opcional: inyección de imágenes para "expert" (si se usa en test o sin PWA)
export type ImageProvider = Record<string, string[]>;

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
  imageProvider?: ImageProvider,
): ShapesExercise[] {
  const rng = makeRng(seed);
  const cfg = CONFIGS[difficulty];
  const exercises: ShapesExercise[] = [];
  const isExpert = difficulty === "expert";

  const shapeCycle = shuffle([...cfg.shapes, ...cfg.shapes], rng);
  const colorCycle = shuffle([...COLORS], rng);

  // Precalcular índices de imagen por carpeta para que el RNG sea determinista
  const imageIndexes: Record<string, number> = {};

  for (let i = 0; i < cfg.quantity; i++) {
    const shape = shapeCycle[i % shapeCycle.length];
    const color = colorCycle[i % colorCycle.length];
    const rotation =
      cfg.rotationMax > 0 ? Math.round(randomFloat(rng, -cfg.rotationMax, cfg.rotationMax)) : 0;
    const scale = randomFloat(rng, 0.72, 1.08);

    const distractors = shuffle(
      cfg.shapes.filter((s) => s.id !== shape.id),
      rng,
    ).slice(0, cfg.optionCount - 1);

    const options = shuffle([shape, ...distractors], rng);

    // En expert: elegir imagen real de la carpeta correspondiente
    let imageUrl: string | undefined;
    if (isExpert && imageProvider) {
      const imgs = imageProvider[shape.id] ?? [];
      if (imgs.length > 0) {
        if (imageIndexes[shape.id] === undefined) imageIndexes[shape.id] = 0;
        imageUrl = imgs[imageIndexes[shape.id] % imgs.length];
        imageIndexes[shape.id]++;
      }
    }

    exercises.push({
      id: i,
      shape,
      color,
      rotation,
      scale,
      options,
      correctAnswer: shape.id,
      imageUrl,
    });
  }

  return exercises;
}

export function validateAnswer(ex: ShapesExercise, answerId: string): boolean {
  return answerId === ex.correctAnswer;
}
