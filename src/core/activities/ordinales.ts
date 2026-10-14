import type { ActivityDifficulty } from "../content/contracts";

export type OrdinalType = "identify" | "position" | "fromRight";

export interface OrdinalExercise {
  type: OrdinalType;
  /** Número de objetos de la fila */
  rowSize: number;
  /** Posición (1-based desde la izquierda) del dibujo marcado */
  target: number;
  /** Si es true, se muestra la flecha de dirección (izquierda → derecha) */
  fromRight: boolean;
  question: string;
  /** Opciones para el tipo `identify` */
  options?: number[];
  /** Posición ordinal correcta (1-based, de izquierda a derecha) */
  answer: number;
  /** Emoji de la fila (distinto por ejercicio en la sesión). */
  emoji: string;
}

export const ORDINAL_LABELS = [
  "1º",
  "2º",
  "3º",
  "4º",
  "5º",
  "6º",
  "7º",
  "8º",
  "9º",
  "10º",
] as const;

/** Pool amplio para variar el dibujo entre ejercicios de la misma ficha/sesión. */
export const ORDINAL_EMOJIS = [
  "🏀",
  "⚽",
  "🎾",
  "🏈",
  "🎱",
  "🏓",
  "🎯",
  "🏐",
  "⚾",
  "🏒",
  "🏉",
  "🎳",
  "🏸",
  "🥊",
  "⛸️",
  "🎿",
  "🥇",
  "🏆",
  "🎽",
  "🧢",
  "👟",
  "🧘",
  "🚴",
  "🏊",
  "🤸",
] as const;

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
const MAX_TRIES = EXERCISE_COUNT * 30;

const TYPES: Record<ActivityDifficulty, OrdinalType[]> = {
  easy: ["identify"],
  medium: ["position"],
  hard: ["fromRight"],
  expert: ["identify", "position", "fromRight"],
};

/**
 * Genera ejercicios de números ordinales.
 *
 * - easy:   identify — «¿Cuál es el Nº?» (pulsar la imagen; hasta el 5º).
 * - medium: position — pregunta la posición del dibujo marcado (hasta el 7º).
 * - hard:   fromRight — misma lógica con flecha → (izquierda a derecha), hasta el 10º.
 * - expert: los tres tipos mezclados, hasta el 10º (identify también por pulsación).
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): OrdinalExercise[] {
  const rng = lcg(seed);
  const types = TYPES[difficulty];
  const used = new Set<string>();
  const out: OrdinalExercise[] = [];
  let tries = 0;
  const emojiDeck = shuffle([...ORDINAL_EMOJIS], rng);
  let emojiIdx = 0;
  const nextEmoji = () => {
    const emoji = emojiDeck[emojiIdx % emojiDeck.length]!;
    emojiIdx += 1;
    return emoji;
  };

  const maxPos = difficulty === "easy" ? 5 : difficulty === "medium" ? 7 : 10;
  const rowSize = maxPos;

  while (out.length < EXERCISE_COUNT && tries < MAX_TRIES) {
    tries++;
    const activeType = types[out.length % types.length];
    const pos = randInt(rng, 1, maxPos);

    if (activeType === "identify") {
      const distSet = new Set<number>([pos]);
      const cands = [pos - 2, pos - 1, pos + 1, pos + 2].filter((x) => x >= 1 && x <= maxPos);
      for (const c of shuffle(cands, rng)) {
        if (distSet.size >= 4) break;
        distSet.add(c);
      }
      while (distSet.size < 4) {
        distSet.add(randInt(rng, 1, maxPos));
      }

      out.push({
        type: "identify",
        rowSize,
        target: pos,
        fromRight: false,
        question: `¿Cuál es el ${ORDINAL_LABELS[pos - 1]}?`,
        options: shuffle([...distSet].slice(0, 4), rng),
        answer: pos,
        emoji: nextEmoji(),
      });
    } else if (activeType === "position") {
      const key = `pos-${pos}`;
      if (used.has(key)) continue;
      used.add(key);

      out.push({
        type: "position",
        rowSize,
        target: pos,
        fromRight: false,
        question: "¿Qué posición ocupa el dibujo marcado?",
        answer: pos,
        emoji: nextEmoji(),
      });
    } else {
      // Contar de izquierda a derecha (flecha →). Misma respuesta que la posición dibujada.
      const key = `ltr-${pos}`;
      if (used.has(key)) continue;
      used.add(key);

      out.push({
        type: "fromRight",
        rowSize,
        target: pos,
        fromRight: true,
        question: "¿Qué posición ocupa el dibujo marcado?",
        answer: pos,
        emoji: nextEmoji(),
      });
    }
  }

  return out;
}

export function validateAnswer(exercise: OrdinalExercise, input: string): boolean {
  return input.trim() === String(exercise.answer);
}
