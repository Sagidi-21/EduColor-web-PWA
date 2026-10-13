import type { ActivityDifficulty } from "../content/contracts";

/**
 * `cintaMetrica` — elegir unidad (cm/m) o estimar la medida.
 *
 * Por dificultad (manifest `boardCard.difficultyDescriptions`):
 * - easy / medium: solo `choose-unit` (elige cm o m).
 * - hard: solo `estimate` (medida aproximada con unidad).
 * - expert: ambos tipos mezclados.
 */

export type CintaType = "choose-unit" | "estimate";

export interface CintaItem {
  name: string;
  size: number;
  unit: "cm" | "m";
  emoji: string;
}

export const ITEMS_CM: CintaItem[] = [
  { name: "un lápiz", size: 15, unit: "cm", emoji: "✏️" },
  { name: "una goma de borrar", size: 5, unit: "cm", emoji: "🧽" },
  { name: "un libro", size: 25, unit: "cm", emoji: "📚" },
  { name: "un tenedor", size: 20, unit: "cm", emoji: "🍴" },
  { name: "una hoja de papel", size: 30, unit: "cm", emoji: "📄" },
  { name: "un zapato de niño", size: 18, unit: "cm", emoji: "👟" },
  { name: "un bolígrafo", size: 14, unit: "cm", emoji: "🖊️" },
  { name: "una regla", size: 30, unit: "cm", emoji: "📏" },
  { name: "un estuche", size: 20, unit: "cm", emoji: "🎒" },
  { name: "un ratón de ordenador", size: 10, unit: "cm", emoji: "🖱️" },
  { name: "una cuchara", size: 16, unit: "cm", emoji: "🥄" },
  { name: "un cuaderno", size: 30, unit: "cm", emoji: "📓" },
];

export const ITEMS_M: CintaItem[] = [
  { name: "una puerta", size: 2, unit: "m", emoji: "🚪" },
  { name: "un árbol del patio", size: 6, unit: "m", emoji: "🌳" },
  { name: "un autobús escolar", size: 12, unit: "m", emoji: "🚌" },
  { name: "una piscina", size: 25, unit: "m", emoji: "🏊" },
  { name: "el pasillo del colegio", size: 40, unit: "m", emoji: "🚶" },
  { name: "una casa", size: 8, unit: "m", emoji: "🏠" },
  { name: "un campo de fútbol", size: 100, unit: "m", emoji: "⚽" },
  { name: "la pizarra", size: 3, unit: "m", emoji: "🟩" },
  { name: "una farola", size: 5, unit: "m", emoji: "💡" },
  { name: "un coche", size: 4, unit: "m", emoji: "🚗" },
  { name: "un avión", size: 70, unit: "m", emoji: "✈️" },
  { name: "la clase entera", size: 8, unit: "m", emoji: "🏫" },
];

/** Objetos muy distintos (cm claros vs m claros) para easy. */
const EASY_CM = ITEMS_CM.filter((i) => i.size <= 20);
const EASY_M = ITEMS_M.filter((i) => i.size >= 4);

export interface CintaExercise {
  type: CintaType;
  item: CintaItem;
  question: string;
  options: string[];
  correctAnswer: string;
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

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Distractor de tamaño con la misma unidad, claramente distinto
 * (el niño no debe dudar entre 22 cm y 25 cm).
 */
function wrongSizeSameUnit(rng: () => number, size: number, unit: "cm" | "m"): number {
  const minGap = unit === "cm" ? 12 : Math.max(3, Math.round(size * 0.5));
  const candidates = [
    size * 2,
    Math.max(1, Math.round(size / 2)),
    size + minGap,
    Math.max(1, size - minGap),
  ]
    .map((n) => Math.max(1, Math.round(n)))
    .filter((n) => n !== size && Math.abs(n - size) >= minGap);
  const uniq = Array.from(new Set(candidates));
  if (uniq.length === 0) return size + minGap;
  return uniq[randInt(rng, 0, uniq.length - 1)];
}

function typeForDifficulty(difficulty: ActivityDifficulty, index: number): CintaType {
  switch (difficulty) {
    case "easy":
    case "medium":
      return "choose-unit";
    case "hard":
      return "estimate";
    case "expert":
      return index % 2 === 0 ? "choose-unit" : "estimate";
  }
}

function poolFor(difficulty: ActivityDifficulty, useCm: boolean): CintaItem[] {
  if (difficulty === "easy") {
    const pool = useCm ? EASY_CM : EASY_M;
    return pool.length > 0 ? pool : useCm ? ITEMS_CM : ITEMS_M;
  }
  // medium+: más variedad (catálogo completo)
  return useCm ? ITEMS_CM : ITEMS_M;
}

export function generateSession(difficulty: ActivityDifficulty, seed = 42): CintaExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: CintaExercise[] = [];
  const usedNames = new Set<string>();
  let tries = 0;

  while (out.length < count && tries < 400) {
    tries++;

    const type = typeForDifficulty(difficulty, out.length);
    const useCm = rng() > 0.5;
    const pool = poolFor(difficulty, useCm);
    const item = pool[randInt(rng, 0, pool.length - 1)];

    if (usedNames.has(item.name)) continue;

    if (type === "choose-unit") {
      out.push({
        type,
        item,
        question: `${cap(item.name)} mide ${item.size} ___`,
        options: ["cm", "m"],
        correctAnswer: item.unit,
      });
      usedNames.add(item.name);
    } else {
      const wrongSize = wrongSizeSameUnit(rng, item.size, item.unit);
      const correct = `${item.size} ${item.unit}`;
      const wrong1 = `${wrongSize} ${item.unit}`;
      const wrong2 = `${item.size} ${item.unit === "cm" ? "m" : "cm"}`;

      out.push({
        type,
        item,
        question: `¿Cuánto mide aproximadamente ${item.name}?`,
        options: shuffle([correct, wrong1, wrong2], rng),
        correctAnswer: correct,
      });
      usedNames.add(item.name);
    }
  }
  return out;
}

export function validateAnswer(ex: CintaExercise, input: string): boolean {
  return input.toLowerCase().trim() === ex.correctAnswer.toLowerCase();
}
