import type { Difficulty } from "../registry/types";

export type CintaType = "choose-unit" | "estimate";

export interface CintaItem {
  name: string;
  size: number;
  unit: "cm" | "m";
  emoji: string;
}

export const ITEMS_CM: CintaItem[] = [
  { name: "un lápiz", size: 15, unit: "cm", emoji: "✏️" },
  { name: "una goma de borrar", size: 5, unit: "cm", emoji: "🧹" },
  { name: "un libro", size: 28, unit: "cm", emoji: "📚" },
  { name: "un tenedor", size: 20, unit: "cm", emoji: "🍴" },
  { name: "una hoja de papel", size: 29, unit: "cm", emoji: "📄" },
  { name: "un zapato de niño", size: 22, unit: "cm", emoji: "👟" },
  { name: "un bolígrafo", size: 14, unit: "cm", emoji: "🖊️" },
  { name: "una regla", size: 30, unit: "cm", emoji: "📏" },
  { name: "un estuche", size: 22, unit: "cm", emoji: "🖊️" },
  { name: "un ratón de ordenador", size: 12, unit: "cm", emoji: "🖱️" },
  { name: "una cuchara", size: 18, unit: "cm", emoji: "🥄" },
  { name: "un cuaderno", size: 32, unit: "cm", emoji: "📓" },
];

export const ITEMS_M: CintaItem[] = [
  { name: "una puerta", size: 2, unit: "m", emoji: "🚪" },
  { name: "un árbol del patio", size: 6, unit: "m", emoji: "🌳" },
  { name: "un autobús escolar", size: 12, unit: "m", emoji: "🚌" },
  { name: "una piscina", size: 25, unit: "m", emoji: "🏊" },
  { name: "el pasillo del colegio", size: 30, unit: "m", emoji: "🏫" },
  { name: "una casa", size: 8, unit: "m", emoji: "🏠" },
  { name: "un campo de fútbol", size: 100, unit: "m", emoji: "⚽" },
  { name: "el tablón de la clase", size: 3, unit: "m", emoji: "📋" },
  { name: "una farola", size: 5, unit: "m", emoji: "💡" },
  { name: "un coche", size: 4, unit: "m", emoji: "🚗" },
  { name: "un avión", size: 70, unit: "m", emoji: "✈️" },
  { name: "la clase entera", size: 7, unit: "m", emoji: "🏫" },
];

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

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateSession(difficulty: Difficulty, seed = 42): CintaExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: CintaExercise[] = [];
  const usedNames = new Set<string>();
  let tries = 0;

  while (out.length < count && tries < 400) {
    tries++;

    const useCm = rng() > 0.5;
    const pool = useCm ? ITEMS_CM : ITEMS_M;
    const item = pool[randInt(rng, 0, pool.length - 1)];

    // Avoid repeating same item name in the same session if possible
    if (usedNames.has(item.name)) continue;

    const type: CintaType =
      difficulty === "easy" ? "choose-unit" : rng() > 0.4 ? "choose-unit" : "estimate";

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
      // estimate
      const delta = randInt(rng, 1, 3) * (rng() > 0.5 ? 1 : -1);
      const wrongSize = Math.max(1, item.size + delta);
      const correct = `${item.size} ${item.unit}`;
      const wrong1 = `${wrongSize} ${item.unit}`;
      const wrong2 = `${item.size} ${item.unit === "cm" ? "m" : "cm"}`;

      const opts = [correct, wrong1, wrong2].sort(() => rng() - 0.5);

      // Deduplicate options just in case delta logic created a duplicate
      // Wait, delta != 0 since randInt(1,3), wrongSize !== item.size unless max(1, x) kicks in.
      const uniqueOpts = Array.from(new Set(opts));
      if (uniqueOpts.length === 3) {
        out.push({
          type,
          item,
          question: `¿Cuánto mide aproximadamente ${item.name}?`,
          options: opts,
          correctAnswer: correct,
        });
        usedNames.add(item.name);
      }
    }
  }
  return out;
}

export function validateAnswer(ex: CintaExercise, input: string): boolean {
  return input.toLowerCase().trim() === ex.correctAnswer.toLowerCase();
}
