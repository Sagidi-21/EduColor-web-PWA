import type { ActivityDifficulty } from "../content/contracts";

export type LitroCategory = "mas" | "litro" | "menos";
export type LitroType = "classify" | "which-more" | "which-less";

export interface LitroItem {
  name: string;
  file: string;
  category: LitroCategory;
}

export interface LitroExercise {
  type: LitroType;
  /** 1 elemento en "classify", 2 en "which-more" / "which-less" */
  items: LitroItem[];
  question: string;
  options: string[];
  answer: string;
}

export const MAS_ITEMS: LitroItem[] = [
  { name: "acuario", file: "acuario.png", category: "mas" },
  { name: "botella grande", file: "botella grande.png", category: "mas" },
  { name: "cubo", file: "cubo.png", category: "mas" },
  { name: "fuente", file: "fuente.png", category: "mas" },
  { name: "garrafa", file: "garrafa.png", category: "mas" },
  { name: "lechera", file: "lechera.png", category: "mas" },
  { name: "nevera", file: "nevera.png", category: "mas" },
  { name: "olla", file: "olla.png", category: "mas" },
];

/** Recipientes de exactamente 1 litro: se usan como referencia visual. */
export const LITRO_ITEMS: LitroItem[] = [
  { name: "botella de litro", file: "botella de litro.png", category: "litro" },
  { name: "jarra de litro", file: "jarra de litro.png", category: "litro" },
  { name: "leche de litro", file: "leche de litro.png", category: "litro" },
  { name: "probeta de litro", file: "probeta de litro.png", category: "litro" },
  { name: "termo de litro", file: "termo de litro.png", category: "litro" },
];

export const MENOS_ITEMS: LitroItem[] = [
  { name: "bote", file: "bote.png", category: "menos" },
  { name: "cáscara de nuez", file: "cascara de nuez.png", category: "menos" },
  { name: "chupito", file: "chupito.png", category: "menos" },
  { name: "cuchara", file: "cuchara.png", category: "menos" },
  { name: "cuenco de desayuno", file: "cuenco desayuno.png", category: "menos" },
  { name: "dedal", file: "dedal.png", category: "menos" },
  { name: "jabonera", file: "jabonera.png", category: "menos" },
  { name: "tacita", file: "tacita.png", category: "menos" },
  { name: "tapón", file: "tapon.png", category: "menos" },
  { name: "taza", file: "taza.png", category: "menos" },
  { name: "vaso", file: "vaso.png", category: "menos" },
  { name: "yogur", file: "yogur.png", category: "menos" },
];

const CATEGORY_FOLDER: Record<LitroCategory, string> = {
  mas: "+litro",
  litro: "litro",
  menos: "-litro",
};

export function itemFolder(item: LitroItem): string {
  return CATEGORY_FOLDER[item.category];
}

export const MAS_LABEL = "Más de 1 L";
export const MENOS_LABEL = "Menos de 1 L";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── LCG determinista ────────────────────────────────────────────────────────

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffled<T>(rng: () => number, values: T[]): T[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickType(rng: () => number, difficulty: ActivityDifficulty): LitroType {
  if (difficulty === "easy") return "classify";
  if (difficulty === "medium") return rng() > 0.4 ? "classify" : "which-more";
  if (difficulty === "expert") {
    const roll = rng();
    if (roll < 0.33) return "classify";
    return roll < 0.5 ? "which-more" : "which-less";
  }
  // hard
  const roll = rng();
  if (roll < 0.4) return "classify";
  return roll < 0.7 ? "which-more" : "which-less";
}

function classifyExercise(item: LitroItem): LitroExercise {
  return {
    type: "classify",
    items: [item],
    question: `¿${cap(item.name)} tiene más o menos de 1 litro?`,
    options: [MAS_LABEL, MENOS_LABEL],
    answer: item.category === "mas" ? MAS_LABEL : MENOS_LABEL,
  };
}

function compareExercise(
  rng: () => number,
  type: "which-more" | "which-less",
  masItem: LitroItem,
  menItem: LitroItem,
): LitroExercise {
  const pair = rng() > 0.5 ? [masItem, menItem] : [menItem, masItem];
  const winner = type === "which-more" ? masItem : menItem;
  return {
    type,
    items: pair,
    question:
      type === "which-more" ? "¿Cuál tiene más de 1 litro?" : "¿Cuál tiene menos de 1 litro?",
    options: shuffled(rng, [cap(masItem.name), cap(menItem.name)]),
    answer: cap(winner.name),
  };
}

const EXERCISE_COUNT = 10;

/**
 * Genera EXERCISE_COUNT ejercicios, prefiriendo recipientes que aún no han
 * salido. El invariante de 10 no depende de una red de seguridad en tiempo de
 * ejecución, sino de que ninguna iteración puede fallar en añadir un ejercicio.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): LitroExercise[] {
  const rng = lcg(seed);
  const out: LitroExercise[] = [];
  const usedMas = new Set<string>();
  const usedMen = new Set<string>();
  const markUsed = (item: LitroItem) => {
    (item.category === "mas" ? usedMas : usedMen).add(item.name);
  };
  const isUsed = (item: LitroItem) => (item.category === "mas" ? usedMas : usedMen).has(item.name);

  // Cada vuelta empuja exactamente un ejercicio, así que el bucle termina en
  // EXERCISE_COUNT iteraciones. No hay continuaciones ni tope de intentos: un
  // `continue` exigiría dos recipientes con el mismo nombre de pools disjuntos,
  // y los dos pools siempre tienen recipientes disponibles. Una red de seguridad
  // "por si acaso" sería inalcanzable y, por tanto, imposible de cubrir con un
  // test, y el umbral de cobertura de funciones es del 100 %.
  while (out.length < EXERCISE_COUNT) {
    const type = pickType(rng, difficulty);

    if (type === "classify") {
      const pool = rng() > 0.5 ? MAS_ITEMS : MENOS_ITEMS;
      const unused = pool.filter((item) => !isUsed(item));
      const from = unused.length > 0 ? unused : pool;
      const item = from[randInt(rng, 0, from.length - 1)];
      markUsed(item);
      out.push(classifyExercise(item));
      continue;
    }

    const unusedMas = MAS_ITEMS.filter((item) => !usedMas.has(item.name));
    const unusedMen = MENOS_ITEMS.filter((item) => !usedMen.has(item.name));
    const masPool = unusedMas.length > 0 ? unusedMas : MAS_ITEMS;
    const menPool = unusedMen.length > 0 ? unusedMen : MENOS_ITEMS;
    const masItem = masPool[randInt(rng, 0, masPool.length - 1)];
    const menItem = menPool[randInt(rng, 0, menPool.length - 1)];
    markUsed(masItem);
    markUsed(menItem);
    out.push(compareExercise(rng, type, masItem, menItem));
  }

  return out;
}

export function validateAnswer(ex: LitroExercise, input: string): boolean {
  return input.trim().toLowerCase() === ex.answer.trim().toLowerCase();
}
