import type { ActivityDifficulty } from "../content/contracts";

export type LineKind =
  "recta" | "curva" | "horizontal" | "vertical" | "oblicua" | "abierta" | "cerrada";

export interface LineDef {
  kind: LineKind;
  label: string;
  /** Trazo SVG dentro de un viewBox 0 0 300 200 */
  svg: string;
}

export const LINES: LineDef[] = [
  {
    kind: "horizontal",
    label: "Horizontal",
    svg: '<line x1="30" y1="100" x2="270" y2="100" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
  },
  {
    kind: "vertical",
    label: "Vertical",
    svg: '<line x1="150" y1="20" x2="150" y2="180" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
  },
  {
    kind: "oblicua",
    label: "Oblicua",
    svg: '<line x1="40" y1="170" x2="260" y2="30" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
  },
  {
    kind: "curva",
    label: "Curva",
    svg: '<path d="M30,150 Q150,20 270,150" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
  },
  {
    kind: "abierta",
    label: "Abierta",
    svg: '<path d="M30,170 Q100,30 170,100 Q220,150 270,60" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
  },
  {
    kind: "cerrada",
    label: "Cerrada",
    svg: '<ellipse cx="150" cy="100" rx="110" ry="70" fill="none" stroke="currentColor" stroke-width="5"/>',
  },
  {
    kind: "recta",
    label: "Recta",
    svg: '<line x1="40" y1="140" x2="260" y2="60" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
  },
];

const BY_KIND = Object.fromEntries(LINES.map((l) => [l.kind, l])) as Record<LineKind, LineDef>;

export interface LineTypesExercise {
  line: LineDef;
  /** Etiquetas de las opciones, incluida la correcta */
  options: string[];
  answer: string;
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

const POOLS: Record<ActivityDifficulty, LineKind[]> = {
  easy: ["horizontal", "vertical", "curva", "oblicua"],
  medium: ["horizontal", "vertical", "oblicua", "curva"],
  hard: ["abierta", "cerrada", "curva", "recta"],
  expert: ["horizontal", "vertical", "oblicua", "curva", "abierta", "cerrada", "recta"],
};

const EXERCISE_COUNT = 10;

/**
 * Genera 10 ejercicios de identificación de tipos de línea.
 *
 * El pool de tipos crece con la dificultad: `easy` y `medium` trabajan los
 * cuatro tipos básicos, `hard` incorpora abierta, cerrada y recta, y `expert`
 * mezcla los siete.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): LineTypesExercise[] {
  const rng = lcg(seed);
  const pool = POOLS[difficulty];
  const labels = pool.map((k) => BY_KIND[k].label);
  const out: LineTypesExercise[] = [];

  for (let i = 0; i < EXERCISE_COUNT; i++) {
    const line = BY_KIND[pool[i % pool.length]];
    const distractors = shuffle(
      labels.filter((l) => l !== line.label),
      rng,
    ).slice(0, 3);
    const options = shuffle([line.label, ...distractors], rng);
    out.push({ line, options, answer: line.label });
  }

  return shuffle(out, rng);
}

export function validateAnswer(exercise: LineTypesExercise, choice: string): boolean {
  return choice === exercise.answer;
}
