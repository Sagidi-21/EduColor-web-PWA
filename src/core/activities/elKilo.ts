import type { ActivityDifficulty } from "../content/contracts";

export type KiloCategory = "mas" | "menos";
export type KiloType = "classify" | "which-heavier" | "which-lighter";

export interface KiloItem {
  name: string;
  file: string;
  category: KiloCategory;
  /** Género gramatical para el artículo (El / La / Los / Las) en classify. */
  gender: "m" | "f";
  /** Plurales como «gafas» / «llaves» → Las + pesan. */
  plural?: boolean;
}

export interface KiloExercise {
  type: KiloType;
  /** 1 elemento en "classify", 2 en "which-heavier" / "which-lighter" */
  items: KiloItem[];
  question: string;
  options: string[];
  answer: string;
}

export const MAS_ITEMS: KiloItem[] = [
  { name: "sandía", file: "sandia.png", category: "mas", gender: "f" },
  { name: "melón", file: "melon.png", category: "mas", gender: "m" },
  { name: "mochila llena", file: "mochila.png", category: "mas", gender: "f" },
  { name: "pesa", file: "pesa.png", category: "mas", gender: "f" },
  { name: "montón de libros", file: "moton de libros.png", category: "mas", gender: "m" },
  { name: "calabaza", file: "calabaza.png", category: "mas", gender: "f" },
  { name: "caja de herramientas", file: "caja de herramientas.png", category: "mas", gender: "f" },
  { name: "saco de cemento", file: "saco cemento.png", category: "mas", gender: "m" },
  { name: "microondas", file: "microondas.png", category: "mas", gender: "m" },
  { name: "ordenador", file: "ordenador.png", category: "mas", gender: "m" },
  { name: "aspiradora", file: "aspiradora.png", category: "mas", gender: "f" },
  { name: "saco de cereales", file: "saco de cereales.png", category: "mas", gender: "m" },
  { name: "silla", file: "silla.png", category: "mas", gender: "f" },
  { name: "bloque", file: "bloque.png", category: "mas", gender: "m" },
  { name: "martillo", file: "martillo.png", category: "mas", gender: "m" },
  { name: "bola de bolos", file: "bola de bolos.png", category: "mas", gender: "f" },
  { name: "monitor", file: "monitor.png", category: "mas", gender: "m" },
  { name: "saco de pienso", file: "saco de pienso.png", category: "mas", gender: "m" },
  // `bateria.png` esta en `src/assets/+kilo/` pero el motor original de
  // Electron no lo declaraba. Se incorpora aqui: el asset ya estaba migrado y
  // una bateria de coche pesa bastante mas de 1 kg, que es lo que la categoria
  // "mas" afirma. Ver MIGRACION_CHANGELOG.md.
  { name: "batería", file: "bateria.png", category: "mas", gender: "f" },
];

export const MENOS_ITEMS: KiloItem[] = [
  { name: "pluma", file: "pluma.png", category: "menos", gender: "f" },
  { name: "lápiz", file: "lápiz.png", category: "menos", gender: "m" },
  { name: "gafas", file: "gafas.png", category: "menos", gender: "f", plural: true },
  { name: "móvil", file: "mólvil.png", category: "menos", gender: "m" },
  { name: "fresa", file: "fresa.png", category: "menos", gender: "f" },
  { name: "bombilla", file: "bombilla.png", category: "menos", gender: "f" },
  { name: "llaves", file: "llaves.png", category: "menos", gender: "f", plural: true },
  { name: "patito de goma", file: "patito de goma.png", category: "menos", gender: "m" },
  { name: "carta", file: "carta.png", category: "menos", gender: "f" },
  { name: "concha", file: "concha.png", category: "menos", gender: "f" },
  { name: "USB", file: "usb.png", category: "menos", gender: "m" },
  { name: "caracola", file: "caracola.png", category: "menos", gender: "f" },
  { name: "clip", file: "clip.png", category: "menos", gender: "m" },
  { name: "pelota de ping-pong", file: "pelota de pingpong.png", category: "menos", gender: "f" },
  { name: "uva", file: "uva.png", category: "menos", gender: "f" },
  { name: "bolsita de té", file: "te.png", category: "menos", gender: "f" },
  { name: "dedal", file: "dedal.png", category: "menos", gender: "m" },
  { name: "hoja de papel", file: "hoja.png", category: "menos", gender: "f" },
  { name: "canica", file: "canica.png", category: "menos", gender: "f" },
  { name: "botón", file: "botón.png", category: "menos", gender: "m" },
  { name: "almendra", file: "almendra.png", category: "menos", gender: "f" },
  { name: "soldadito", file: "soldadito.png", category: "menos", gender: "m" },
];

const CATEGORY_FOLDER: Record<KiloCategory, string> = {
  mas: "+kilo",
  menos: "-kilo",
};

export function itemFolder(item: KiloItem): string {
  return CATEGORY_FOLDER[item.category];
}

export const MAS_LABEL = "Más de 1 kg";
export const MENOS_LABEL = "Menos de 1 kg";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function article(item: KiloItem): string {
  if (item.plural) return item.gender === "f" ? "Las" : "Los";
  return item.gender === "f" ? "La" : "El";
}

function weightVerb(item: KiloItem): string {
  return item.plural ? "pesan" : "pesa";
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

function pickType(rng: () => number, difficulty: ActivityDifficulty): KiloType {
  if (difficulty === "easy") return "classify";
  if (difficulty === "medium") return rng() > 0.4 ? "classify" : "which-heavier";
  if (difficulty === "expert") {
    const roll = rng();
    if (roll < 0.33) return "classify";
    return roll < 0.5 ? "which-heavier" : "which-lighter";
  }
  // hard
  const roll = rng();
  if (roll < 0.4) return "classify";
  return roll < 0.7 ? "which-heavier" : "which-lighter";
}

function classifyExercise(item: KiloItem): KiloExercise {
  return {
    type: "classify",
    items: [item],
    question: `¿${article(item)} ${item.name} ${weightVerb(item)} más o menos de 1 kg?`,
    options: [MAS_LABEL, MENOS_LABEL],
    answer: item.category === "mas" ? MAS_LABEL : MENOS_LABEL,
  };
}

function compareExercise(
  rng: () => number,
  type: "which-heavier" | "which-lighter",
  masItem: KiloItem,
  menItem: KiloItem,
): KiloExercise {
  const pair = rng() > 0.5 ? [masItem, menItem] : [menItem, masItem];
  const winner = type === "which-heavier" ? masItem : menItem;
  return {
    type,
    items: pair,
    question: type === "which-heavier" ? "¿Cuál pesa más de 1 kg?" : "¿Cuál pesa menos de 1 kg?",
    options: shuffled(rng, [cap(masItem.name), cap(menItem.name)]),
    answer: cap(winner.name),
  };
}

const EXERCISE_COUNT = 10;

/**
 * Genera EXERCISE_COUNT ejercicios, preferring objetos que aún no han salido.
 * El invariante de 10 no depende de una red de seguridad en tiempo de ejecución,
 * sino de que ninguna iteración puede fallar en añadir un ejercicio.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): KiloExercise[] {
  const rng = lcg(seed);
  const out: KiloExercise[] = [];
  const usedMas = new Set<string>();
  const usedMenos = new Set<string>();
  const markUsed = (item: KiloItem) => {
    (item.category === "mas" ? usedMas : usedMenos).add(item.name);
  };
  const isUsed = (item: KiloItem) => (item.category === "mas" ? usedMas : usedMenos).has(item.name);

  // Cada vuelta empuja exactamente un ejercicio, así que el bucle termina en
  // EXERCISE_COUNT iteraciones. No hay continuaciones ni tope de intentos: un
  // `continue` exigiría dos objetos con el mismo nombre de pools disjuntos, y
  // los dos pools siempre tienen objetos disponibles. Una red de seguridad
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
    const unusedMen = MENOS_ITEMS.filter((item) => !usedMenos.has(item.name));
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

export function validateAnswer(ex: KiloExercise, input: string): boolean {
  return input.trim().toLowerCase() === ex.answer.trim().toLowerCase();
}
