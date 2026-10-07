import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `probabilidad`: clasificación de sucesos y bolsa de pelotas,
 * generación de ejercicios y validación.
 *
 * No importa React ni nada del navegador. El renderer solo dibuja lo que esto
 * devuelve, y una hoja de ejercicios podrá hacerlo mismo más adelante.
 */

export type ProbType = "classify" | "bag";
export type ProbResult = "seguro" | "posible" | "imposible";

export interface ProbExercise {
  type: ProbType;
  question: string;
  context: string;
  correctAnswer: ProbResult;
  options: string[];
}

// Bank of events: { text, result }
const EVENTS: { text: string; result: ProbResult }[] = [
  { text: "Mañana saldrá el sol por el este", result: "seguro" },
  { text: "El año tiene 12 meses", result: "seguro" },
  { text: "Un triángulo tiene 3 lados", result: "seguro" },
  { text: "El domingo sigue al sábado", result: "seguro" },
  { text: "Una persona tiene dos manos", result: "seguro" },
  { text: "Mañana lloverá", result: "posible" },
  { text: "Esta semana comeré pizza", result: "posible" },
  { text: "El equipo de fútbol ganará el partido", result: "posible" },
  { text: "Sacaré un número par en un dado", result: "posible" },
  { text: "Mañana hará calor", result: "posible" },
  { text: "Sacaré un número mayor que 4 al tirar un dado", result: "posible" },
  { text: "Me toca la lotería", result: "posible" },
  { text: "Sacaré un 7 al tirar un dado de 6 caras", result: "imposible" },
  { text: "Un perro volará sin alas", result: "imposible" },
  { text: "El mes de febrero tiene 40 días", result: "imposible" },
  { text: "Sacaré una pelota roja de una bolsa que solo tiene azules", result: "imposible" },
  { text: "2 + 2 serán 5", result: "imposible" },
  { text: "El agua congelada se convertirá en lava", result: "imposible" },
];

// Bag exercises: colored balls
interface BagScenario {
  bag: { color: string; count: number }[];
  question: string;
  result: ProbResult;
}

const BAGS: BagScenario[] = [
  {
    bag: [
      { color: "roja", count: 3 },
      { color: "azul", count: 3 },
    ],
    question: "¿Es posible sacar una pelota roja?",
    result: "posible",
  },
  {
    bag: [{ color: "azul", count: 5 }],
    question: "¿Es imposible sacar una pelota roja?",
    result: "seguro",
  },
  {
    bag: [{ color: "verde", count: 4 }],
    question: "¿Puedes sacar una pelota roja?",
    result: "imposible",
  },
  {
    bag: [{ color: "roja", count: 5 }],
    question: "¿Sacarás siempre una pelota roja?",
    result: "seguro",
  },
  {
    bag: [
      { color: "roja", count: 2 },
      { color: "azul", count: 2 },
      { color: "verde", count: 2 },
    ],
    question: "¿Es posible sacar una pelota verde?",
    result: "posible",
  },
  {
    bag: [{ color: "amarilla", count: 6 }],
    question: "¿Es seguro sacar una pelota amarilla?",
    result: "seguro",
  },
];

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

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Genera una sesión de 10 ejercicios de probabilidad. */
export function generateSession(difficulty: ActivityDifficulty, seed: number): ProbExercise[] {
  const rng = lcg(seed);
  const out: ProbExercise[] = [];
  const usedTexts = new Set<string>();
  const usedBags = new Set<number>();
  let tries = 0;

  // Difficulty determines which exercise types appear
  const useBags = difficulty === "hard" || difficulty === "expert";

  while (out.length < 10 && tries < 300) {
    tries++;

    const useBagNow = useBags && rng() > 0.5;

    if (useBagNow) {
      const idx = randInt(rng, 0, BAGS.length - 1);
      if (usedBags.has(idx)) continue;
      usedBags.add(idx);
      const scenario = BAGS[idx];
      const bagDesc = scenario.bag.map((b) => `${b.count} pelotas ${b.color}`).join(", ");
      out.push({
        type: "bag",
        context: `Bolsa: ${bagDesc}.`,
        question: scenario.question,
        correctAnswer: scenario.result,
        options: shuffle(rng, ["Seguro", "Posible", "Imposible"]),
      });
    } else {
      // Filter events by difficulty
      const pool =
        difficulty === "easy"
          ? EVENTS.filter((e) => e.result !== "posible") // only extremes
          : EVENTS; // medium, hard, expert: all
      const ev = pick(rng, pool);
      if (usedTexts.has(ev.text)) continue;
      usedTexts.add(ev.text);
      out.push({
        type: "classify",
        context: ev.text,
        question: "¿Es este suceso seguro, posible o imposible?",
        correctAnswer: ev.result,
        options: shuffle(rng, ["Seguro", "Posible", "Imposible"]),
      });
    }
  }
  return out;
}

/** Comprueba si la respuesta elegida es correcta (case-insensitive). */
export function validateAnswer(ex: ProbExercise, answer: string): boolean {
  return answer.toLowerCase() === ex.correctAnswer;
}
