import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `problemas2pasos`: problemas aritméticos de dos pasos,
 * generación de ejercicios y validación.
 *
 * No importa React ni nada del navegador. El renderer solo dibuja lo que esto
 * devuelve, y una hoja de ejercicios podrá hacerlo mismo más adelante.
 */

export type P2Op = "+" | "-";
export type P2Type = "add-add" | "add-sub" | "sub-add" | "sub-sub";

export interface Problemas2Exercise {
  type: P2Type;
  op1: P2Op;
  op2: P2Op;
  a: number;
  b: number;
  c: number;
  mid: number;
  result: number;
  story: string[];
  question: string;
  correctAnswer: string;
  options: string[];
}

// Story templates: {a}, {b}, {c} are replaced
const TEMPLATES: Record<
  P2Type,
  { story: (a: number, b: number, c: number, mid: number) => string[]; question: string }[]
> = {
  "add-add": [
    {
      story: (a, b, c) => [
        `María tiene ${a} cromos.`,
        `Le dan ${b} cromos más por su cumpleaños`,
        `y después compra ${c} cromos más en la tienda.`,
      ],
      question: "¿Cuántos cromos tiene ahora?",
    },
    {
      story: (a, b, c) => [
        `En el patio hay ${a} niños jugando.`,
        `Llegan ${b} niños del parque`,
        `y después llegan ${c} niños más del comedor.`,
      ],
      question: "¿Cuántos niños hay en total?",
    },
  ],
  "add-sub": [
    {
      story: (a, b, c) => [
        `Juan tiene ${a} caramelos.`,
        `Su madre le da ${b} caramelos más.`,
        `Luego reparte ${c} caramelos entre sus amigos.`,
      ],
      question: "¿Cuántos caramelos le quedan?",
    },
    {
      story: (a, b, c) => [
        `En la caja hay ${a} lápices.`,
        `Añadimos ${b} lápices más.`,
        `Luego cogemos ${c} lápices para pintar.`,
      ],
      question: "¿Cuántos lápices quedan en la caja?",
    },
  ],
  "sub-add": [
    {
      story: (a, b, c) => [
        `En la biblioteca hay ${a} libros.`,
        `Se llevan prestados ${b} libros.`,
        `Al día siguiente devuelven ${c} libros.`,
      ],
      question: "¿Cuántos libros hay ahora?",
    },
    {
      story: (a, b, c) => [
        `El florista tiene ${a} flores.`,
        `Vende ${b} flores por la mañana.`,
        `Por la tarde recibe ${c} flores nuevas.`,
      ],
      question: "¿Cuántas flores tiene ahora?",
    },
  ],
  "sub-sub": [
    {
      story: (a, b, c) => [
        `En la clase hay ${a} galletas.`,
        `En el desayuno se comen ${b}.`,
        `En la merienda se comen ${c} más.`,
      ],
      question: "¿Cuántas galletas quedan?",
    },
    {
      story: (a, b, c) => [
        `En la tienda hay ${a} manzanas.`,
        `Venden ${b} manzanas.`,
        `Luego venden ${c} manzanas más.`,
      ],
      question: "¿Cuántas manzanas quedan?",
    },
  ],
};

const RANGES: Record<ActivityDifficulty, { max: number }> = {
  easy: { max: 20 },
  medium: { max: 50 },
  hard: { max: 100 },
  expert: { max: 200 },
};

const TYPES_BY_DIFF: Record<ActivityDifficulty, P2Type[]> = {
  easy: ["add-add", "add-sub"],
  medium: ["add-add", "add-sub", "sub-add"],
  hard: ["add-add", "add-sub", "sub-add", "sub-sub"],
  expert: ["add-add", "add-sub", "sub-add", "sub-sub"],
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

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Genera una sesión de 10 ejercicios de problemas de 2 pasos. */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed: number,
): Problemas2Exercise[] {
  const rng = lcg(seed);
  const { max } = RANGES[difficulty];
  const types = TYPES_BY_DIFF[difficulty];
  const out: Problemas2Exercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < 10 && tries < 400) {
    tries++;
    const type = pick(rng, types);
    let a: number, b: number, c: number, mid: number, result: number;
    let op1: P2Op, op2: P2Op;

    if (type === "add-add") {
      op1 = "+";
      op2 = "+";
      a = randInt(rng, 5, Math.floor(max * 0.4));
      b = randInt(rng, 2, Math.floor(max * 0.3));
      c = randInt(rng, 2, Math.floor(max * 0.3));
      mid = a + b;
      result = mid + c;
    } else if (type === "add-sub") {
      op1 = "+";
      op2 = "-";
      a = randInt(rng, 5, Math.floor(max * 0.4));
      b = randInt(rng, 2, Math.floor(max * 0.4));
      c = randInt(rng, 1, a + b - 1);
      mid = a + b;
      result = mid - c;
    } else if (type === "sub-add") {
      op1 = "-";
      op2 = "+";
      a = randInt(rng, Math.floor(max * 0.3), max);
      b = randInt(rng, 2, Math.floor(a * 0.6));
      c = randInt(rng, 1, Math.floor(max * 0.3));
      mid = a - b;
      result = mid + c;
    } else {
      op1 = "-";
      op2 = "-";
      a = randInt(rng, Math.floor(max * 0.4), max);
      b = randInt(rng, 2, Math.floor(a * 0.4));
      mid = a - b;
      c = randInt(rng, 1, mid - 1);
      result = mid - c;
    }

    if (result < 0 || result > max + 50) continue;
    const key = `${type}-${a}-${b}-${c}`;
    if (used.has(key)) continue;
    used.add(key);

    const correctAnswer = String(result);
    const wrongs = new Set<string>([correctAnswer]);
    while (wrongs.size < 4) {
      const delta = randInt(rng, 1, Math.max(5, Math.floor(result * 0.25)));
      const w = result + (rng() > 0.5 ? delta : -delta);
      if (w > 0) wrongs.add(String(w));
    }
    const options = Array.from(wrongs).sort((x, y) => Number(x) - Number(y));

    const tmpl = pick(rng, TEMPLATES[type]);
    const story = tmpl.story(a, b, c, mid);

    out.push({
      type,
      op1,
      op2,
      a,
      b,
      c,
      mid,
      result,
      story,
      question: tmpl.question,
      correctAnswer,
      options,
    });
  }
  return out;
}

/** Comprueba si la respuesta elegida es correcta (comparación exacta). */
export function validateAnswer(ex: Problemas2Exercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
