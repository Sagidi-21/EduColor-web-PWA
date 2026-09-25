import type { ActivityDifficulty } from "../content/contracts";

export const DAYS = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

export type Day = (typeof DAYS)[number];

export interface WeekDaysExercise {
  question: string;
  options: Day[];
  answer: Day;
}

// ── LCG determinista ────────────────────────────────────────────────────────

function lcg(seed: number) {
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

function randInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

// ── Helpers de días ──────────────────────────────────────────────────────────

function nextDay(d: Day): Day {
  return DAYS[(DAYS.indexOf(d) + 1) % 7];
}

function prevDay(d: Day): Day {
  return DAYS[(DAYS.indexOf(d) + 6) % 7];
}

function nDaysAfter(d: Day, n: number): Day {
  return DAYS[(DAYS.indexOf(d) + n) % 7];
}

function buildOptions(correct: Day, rng: () => number): Day[] {
  const pool = DAYS.filter((d) => d !== correct);
  const distractors = shuffle([...pool], rng).slice(0, 3) as Day[];
  return shuffle([correct, ...distractors], rng);
}

// ── Motor público ────────────────────────────────────────────────────────────

/**
 * Genera 7 ejercicios (uno por día de la semana) mezclados aleatoriamente.
 *
 * - easy:   ¿Qué día va después de X?
 * - medium: ¿Qué día va antes de X?
 * - hard:   N días después de X (N ∈ {2,3})
 * - expert: mezcla de los tres tipos anteriores
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): WeekDaysExercise[] {
  const rng = lcg(seed);
  const out: WeekDaysExercise[] = [];

  for (let i = 0; i < 7; i++) {
    const day = DAYS[i];

    if (difficulty === "easy") {
      const answer = nextDay(day);
      out.push({
        question: `¿Qué día va después del ${day}?`,
        options: buildOptions(answer, rng),
        answer,
      });
    } else if (difficulty === "medium") {
      const answer = prevDay(day);
      out.push({
        question: `¿Qué día va antes del ${day}?`,
        options: buildOptions(answer, rng),
        answer,
      });
    } else if (difficulty === "hard") {
      const n = randInt(rng, 2, 3);
      const answer = nDaysAfter(day, n);
      out.push({
        question: `${n} días después del ${day} es ___`,
        options: buildOptions(answer, rng),
        answer,
      });
    } else {
      // expert: rota entre los 3 tipos
      const type = i % 3;
      if (type === 0) {
        const answer = nextDay(day);
        out.push({
          question: `¿Qué día va después del ${day}?`,
          options: buildOptions(answer, rng),
          answer,
        });
      } else if (type === 1) {
        const answer = prevDay(day);
        out.push({
          question: `¿Qué día va antes del ${day}?`,
          options: buildOptions(answer, rng),
          answer,
        });
      } else {
        const n = randInt(rng, 2, 4);
        const answer = nDaysAfter(day, n);
        out.push({
          question: `${n} días después del ${day} es ___`,
          options: buildOptions(answer, rng),
          answer,
        });
      }
    }
  }

  return shuffle(out, rng);
}

/**
 * Valida si la opción elegida por el alumno coincide con la respuesta correcta.
 */
export function validateAnswer(exercise: WeekDaysExercise, choice: string): boolean {
  return choice === exercise.answer;
}
