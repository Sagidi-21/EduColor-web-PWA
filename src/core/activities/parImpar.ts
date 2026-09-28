import type { ActivityDifficulty } from "../content/contracts";

/**
 * `parImpar` — pares e impares.
 *
 * Motor puro y determinista, extraído de
 * `electron-reference/.../engines/parImpar/engine.ts`.
 *
 * Divergencias respecto al original, todas deliberadas:
 *
 * 1. El original usa un único tipo `math_or_write` para dos interfaces
 *    opuestas: una pregunta de teoría respondida con botones y un
 *    ejercicio de escritura. Aquí se separan en `theory` y `write`, que es
 *    lo que permite al renderer montar el `Numpad` y el `DigitCell` solo
 *    cuando hacen falta y no arrastrar TF.js en el resto de la sesión.
 * 2. `easy` generaba 9 ejercicios en lugar de 10: la clave de deduplicación
 *    era `visual-${n}` con `n` entre 2 y 10, o sea 9 combinaciones para 10
 *    ejercicios pedidos, y el resto de intentos se descartaba. Se añade el
 *    emoji a la clave para llegar a 10 sin ampliar el rango 2..10, que es
 *    deliberado para contar.
 * 3. En `expert` el original elige el subtipo al azar en cada intento, con lo
 *    que una sesión puede salir sin ningún ejercicio de escritura. Aquí se
 *    alternan de forma determinista y ambos aparecen siempre.
 * 4. `validateAnswer` recorta los espacios de la respuesta en todos los
 *    tipos, no solo en los de escritura.
 */

export type ParImparType = "visual" | "select" | "rule" | "theory" | "write";

export interface ParImparOption {
  label: string;
  value: string;
}

export interface ParImparExtraData {
  /** Respuestas aceptadas en el ejercicio de escritura. */
  validAnswers?: string[];
}

export interface ParImparExercise {
  type: ParImparType;
  question: string;
  /** Cantidad de objetos en `visual`, número clasificado en `rule`. */
  number: number;
  options?: ParImparOption[];
  /** Respuesta canónica. En `write` es solo la primera de `validAnswers`. */
  answer: string;
  visualItems?: { emoji: string; count: number };
  extraData?: ParImparExtraData;
}

const FRUITS = ["🍒", "🍓", "🍎", "🍋", "🍇", "🎈", "🍪"];

/** Opciones de par/impar para 1.º, donde importa la explicación visual. */
const VISUAL_PARITY_OPTIONS: ParImparOption[] = [
  { label: "PAR (tienen pareja)", value: "par" },
  { label: "IMPAR (sobra uno)", value: "impar" },
];

const PARITY_OPTIONS: ParImparOption[] = [
  { label: "PAR", value: "par" },
  { label: "IMPAR", value: "impar" },
];

const THEORIES: { q: string; a: string }[] = [
  { q: "Si sumas dos números PARES (ej: 2 + 4), el resultado siempre es...", a: "par" },
  { q: "Si sumas dos números IMPARES (ej: 3 + 5), el resultado siempre es...", a: "par" },
  {
    q: "Si sumas un número PAR y uno IMPAR (ej: 2 + 3), el resultado siempre es...",
    a: "impar",
  },
];

// ── LCG determinista ────────────────────────────────────────────────────────

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

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const EXERCISE_COUNT = 10;
const MAX_TRIES = 300;

const TYPES: Record<ActivityDifficulty, ParImparType[]> = {
  easy: ["visual"],
  medium: ["select"],
  hard: ["rule"],
  expert: ["theory", "write"],
};

/**
 * - easy:   cuenta de 2 a 10 objetos y decide si sobran o tienen pareja.
 * - medium: elige, entre cuatro números, el par o el impar que se pide.
 * - hard:   clasifica un número del 30 al 99.
 * - expert: alterna teoría de par/impar y escritura de un número en un rango.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): ParImparExercise[] {
  const rng = lcg(seed);
  const types = TYPES[difficulty];
  const used = new Set<string>();
  const out: ParImparExercise[] = [];
  let tries = 0;

  while (out.length < EXERCISE_COUNT && tries < MAX_TRIES) {
    tries++;
    const type = types[out.length % types.length];

    if (type === "visual") {
      const n = randInt(rng, 2, 10);
      const emoji = FRUITS[randInt(rng, 0, FRUITS.length - 1)];
      const key = `visual-${n}-${emoji}`;
      if (used.has(key)) continue;
      used.add(key);

      out.push({
        type: "visual",
        question: `¿El número de objetos (${n}) es PAR o IMPAR? (Observa si todos tienen pareja)`,
        number: n,
        visualItems: { emoji, count: n },
        answer: n % 2 === 0 ? "par" : "impar",
        options: [...VISUAL_PARITY_OPTIONS],
      });
    } else if (type === "select") {
      const findEven = rng() > 0.5;
      const correct = findEven ? randInt(rng, 1, 15) * 2 : randInt(rng, 0, 14) * 2 + 1;

      // Los distractores son siempre de la paridad contraria, que es lo que
      // hace que la pregunta tenga sentido.
      const wrong: number[] = [];
      while (wrong.length < 3) {
        const candidate = findEven ? randInt(rng, 0, 14) * 2 + 1 : randInt(rng, 1, 15) * 2;
        if (candidate !== correct && !wrong.includes(candidate)) wrong.push(candidate);
      }

      const key = `select-${findEven}-${correct}`;
      if (used.has(key)) continue;
      used.add(key);

      const values = shuffle([correct, ...wrong], rng);
      out.push({
        type: "select",
        question: `¿Cuál de estos números es ${findEven ? "PAR" : "IMPAR"}?`,
        number: correct,
        options: values.map((v) => ({ label: String(v), value: String(v) })),
        answer: String(correct),
      });
    } else if (type === "rule") {
      const n = randInt(rng, 30, 99);
      const key = `rule-${n}`;
      if (used.has(key)) continue;
      used.add(key);

      out.push({
        type: "rule",
        question: `¿El número ${n} es PAR o IMPAR?`,
        number: n,
        answer: n % 2 === 0 ? "par" : "impar",
        options: [...PARITY_OPTIONS],
      });
    } else if (type === "theory") {
      // Sin deduplicación: el original usaba la clave `theory-${tries}`, que es
      // única por construcción, así que su comprobación nunca se cumplía. Hay
      // solo tres reglas posibles y repetir alguna está bien.
      const selected = THEORIES[randInt(rng, 0, THEORIES.length - 1)];
      out.push({
        type: "theory",
        question: selected.q,
        number: 0,
        answer: selected.a,
        options: [...PARITY_OPTIONS],
      });
    } else {
      const base = randInt(rng, 3, 8) * 10; // 30, 40, …, 80
      const wantsOdd = rng() > 0.5;
      const key = `write-${base}-${wantsOdd}`;
      if (used.has(key)) continue;
      used.add(key);

      const start = base;
      const end = base + 6;

      const validAnswers: string[] = [];
      for (let i = start + 1; i < end; i++) {
        if ((i % 2 !== 0) === wantsOdd) validAnswers.push(String(i));
      }

      out.push({
        type: "write",
        question: `Escribe un número ${wantsOdd ? "IMPAR" : "PAR"} que esté entre ${start} y ${end}.`,
        number: 0,
        answer: validAnswers[0],
        extraData: { validAnswers },
      });
    }
  }

  return out;
}

/** `true` solo en el ejercicio de escritura, que es el único que necesita dígitos. */
export function requiresWriting(exercise: ParImparExercise): boolean {
  return exercise.type === "write";
}

export function validateAnswer(exercise: ParImparExercise, input: string): boolean {
  if (exercise.type === "write" && exercise.extraData?.validAnswers) {
    return exercise.extraData.validAnswers.includes(input.trim());
  }
  return exercise.answer === input.trim();
}
