import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `simetría`: figuras planas, ejes de simetría,
 * generación de ejercicios y validación.
 *
 * No importa React ni nada del navegador. El renderer solo dibuja lo que esto
 * devuelve, y una hoja de ejercicios podrá hacerlo mismo más adelante.
 */

export type SimShape =
  | "circulo"
  | "cuadrado"
  | "rectangulo"
  | "triangulo-eq"
  | "triangulo-iso"
  | "triangulo-esc"
  | "rombo"
  | "pentagono"
  | "hexagono"
  | "estrella";

export type SimType = "is-symmetric" | "count-axes" | "which-shape";

export interface SimExercise {
  type: SimType;
  shape: SimShape;
  axes: number;
  question: string;
  correctAnswer: string;
  options: string[];
}

interface ShapeData {
  name: string;
  axes: number;
}

const SHAPES: Record<SimShape, ShapeData> = {
  circulo: { name: "Círculo", axes: 99 },
  cuadrado: { name: "Cuadrado", axes: 4 },
  rectangulo: { name: "Rectángulo", axes: 2 },
  "triangulo-eq": { name: "Triángulo equilátero", axes: 3 },
  "triangulo-iso": { name: "Triángulo isósceles", axes: 1 },
  "triangulo-esc": { name: "Triángulo escaleno", axes: 0 },
  rombo: { name: "Rombo", axes: 2 },
  pentagono: { name: "Pentágono regular", axes: 5 },
  hexagono: { name: "Hexágono regular", axes: 6 },
  estrella: { name: "Estrella de 5 puntas", axes: 5 },
};

const SHAPES_BY_DIFF: Record<ActivityDifficulty, SimShape[]> = {
  easy: ["cuadrado", "rectangulo", "triangulo-eq", "triangulo-esc"],
  medium: ["cuadrado", "rectangulo", "triangulo-eq", "triangulo-iso", "triangulo-esc", "rombo"],
  hard: [
    "cuadrado",
    "rectangulo",
    "triangulo-eq",
    "triangulo-iso",
    "triangulo-esc",
    "rombo",
    "pentagono",
  ],
  expert: [
    "cuadrado",
    "rectangulo",
    "triangulo-eq",
    "triangulo-iso",
    "triangulo-esc",
    "rombo",
    "pentagono",
    "hexagono",
    "estrella",
  ],
};

const TYPES_BY_DIFF: Record<ActivityDifficulty, SimType[]> = {
  easy: ["is-symmetric"],
  medium: ["is-symmetric", "which-shape"],
  hard: ["is-symmetric", "which-shape", "count-axes"],
  expert: ["is-symmetric", "which-shape", "count-axes"],
};

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Genera una sesión de 10 ejercicios de simetría. */
export function generateSession(difficulty: ActivityDifficulty, seed: number): SimExercise[] {
  const rng = lcg(seed);
  const shapes = SHAPES_BY_DIFF[difficulty];
  const types = TYPES_BY_DIFF[difficulty];
  const out: SimExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < 10 && tries < 300) {
    tries++;
    const shape = pick(rng, shapes);
    const type = pick(rng, types);
    const key = `${shape}-${type}`;
    if (used.has(key)) continue;
    used.add(key);

    const data = SHAPES[shape];
    const isSymmetric = data.axes > 0;

    let question: string;
    let correctAnswer: string;
    let options: string[];

    if (type === "is-symmetric") {
      question = `¿Tiene el ${data.name.toLowerCase()} algún eje de simetría?`;
      correctAnswer = isSymmetric ? "Sí" : "No";
      options = shuffle(rng, ["Sí", "No"]);
    } else if (type === "count-axes") {
      const displayAxes = data.axes === 99 ? "∞" : String(data.axes);
      question = `¿Cuántos ejes de simetría tiene el ${data.name.toLowerCase()}?`;
      correctAnswer = displayAxes;
      const allCounts = ["0", "1", "2", "3", "4", "5", "6", "∞"];
      const wrongs = new Set<string>([displayAxes]);
      const others = allCounts.filter((x) => x !== displayAxes);
      while (wrongs.size < 4 && others.length > 0) {
        const w = others.splice(Math.floor(rng() * others.length), 1)[0];
        wrongs.add(w);
      }
      options = shuffle(rng, Array.from(wrongs));
    } else {
      const symmetric = shapes.filter((s) => SHAPES[s].axes > 0);
      const asymmetric = shapes.filter((s) => SHAPES[s].axes === 0);
      if (rng() > 0.5 && symmetric.length >= 4) {
        if (asymmetric.length === 0) continue;
        const target = pick(rng, asymmetric);
        const decoys = shuffle(rng, symmetric).slice(0, 3);
        const pool = shuffle(rng, [target, ...decoys]);
        question = "¿Cuál de estas figuras NO tiene eje de simetría?";
        correctAnswer = SHAPES[target].name;
        options = pool.map((s) => SHAPES[s].name);
      } else {
        if (symmetric.length === 0) continue;
        const target = pick(rng, symmetric);
        const decoys = shuffle(
          rng,
          shapes.filter((s) => s !== target),
        ).slice(0, 3);
        const pool = shuffle(rng, [target, ...decoys]);
        question = "¿Cuál de estas figuras tiene al menos un eje de simetría?";
        correctAnswer = SHAPES[target].name;
        options = pool.map((s) => SHAPES[s].name);
      }
    }

    if (options.length >= 2) {
      out.push({ type, shape, axes: data.axes, question, correctAnswer, options });
    }
  }
  return out;
}

/** Comprueba si la respuesta elegida es correcta (comparación exacta). */
export function validateAnswer(ex: SimExercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
