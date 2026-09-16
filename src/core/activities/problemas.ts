import type { ActivityDifficulty } from "../content/contracts";

export type ProblemOp = "suma" | "resta";
export type Theme = "deportes" | "animales" | "clase" | "naturaleza";

export interface ProblemaExercise {
  story: string;
  question: string;
  solutionTemplate: string;
  emoji: string;
  a: number;
  b: number;
  op: ProblemOp;
  answer: number;
}

export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

type NounType = "person" | "object" | "animal";
interface Noun {
  plural: string;
  emoji: string;
  gender: "m" | "f";
  type: NounType;
}

const THEMED_NOUNS: Record<Theme, Noun[]> = {
  deportes: [
    { plural: "niños", emoji: "🧒", gender: "m", type: "person" },
    { plural: "jugadores", emoji: "👕", gender: "m", type: "person" },
    { plural: "corredores", emoji: "🏃", gender: "m", type: "person" },
    { plural: "ciclistas", emoji: "🚴", gender: "m", type: "person" },
    { plural: "nadadores", emoji: "🏊", gender: "m", type: "person" },
    { plural: "pelotas", emoji: "⚽", gender: "f", type: "object" },
    { plural: "balones", emoji: "🏀", gender: "m", type: "object" },
    { plural: "medallas", emoji: "🥇", gender: "f", type: "object" },
    { plural: "pelotas de tenis", emoji: "🎾", gender: "f", type: "object" },
    { plural: "puntos", emoji: "🏅", gender: "m", type: "object" },
  ],
  animales: [
    { plural: "perros", emoji: "🐕", gender: "m", type: "animal" },
    { plural: "gatos", emoji: "🐈", gender: "m", type: "animal" },
    { plural: "pájaros", emoji: "🐦", gender: "m", type: "animal" },
    { plural: "mariposas", emoji: "🦋", gender: "f", type: "animal" },
    { plural: "conejos", emoji: "🐇", gender: "m", type: "animal" },
    { plural: "peces", emoji: "🐟", gender: "m", type: "animal" },
    { plural: "gallinas", emoji: "🐔", gender: "f", type: "animal" },
    { plural: "tortugas", emoji: "🐢", gender: "f", type: "animal" },
    { plural: "ranas", emoji: "🐸", gender: "f", type: "animal" },
    { plural: "abejas", emoji: "🐝", gender: "f", type: "animal" },
  ],
  clase: [
    { plural: "lápices", emoji: "✏️", gender: "m", type: "object" },
    { plural: "cuadernos", emoji: "📓", gender: "m", type: "object" },
    { plural: "libros", emoji: "📚", gender: "m", type: "object" },
    { plural: "ceras", emoji: "🖍️", gender: "f", type: "object" },
    { plural: "fichas", emoji: "📄", gender: "f", type: "object" },
    { plural: "pegatinas", emoji: "⭐", gender: "f", type: "object" },
    { plural: "reglas", emoji: "📏", gender: "f", type: "object" },
    { plural: "mochilas", emoji: "🎒", gender: "f", type: "object" },
    { plural: "rotuladores", emoji: "🖊️", gender: "m", type: "object" },
    { plural: "folios", emoji: "📋", gender: "m", type: "object" },
  ],
  naturaleza: [
    { plural: "manzanas", emoji: "🍎", gender: "f", type: "object" },
    { plural: "naranjas", emoji: "🍊", gender: "f", type: "object" },
    { plural: "flores", emoji: "🌸", gender: "f", type: "object" },
    { plural: "fresas", emoji: "🍓", gender: "f", type: "object" },
    { plural: "hojas", emoji: "🍃", gender: "f", type: "object" },
    { plural: "peras", emoji: "🍐", gender: "f", type: "object" },
    { plural: "cerezas", emoji: "🍒", gender: "f", type: "object" },
    { plural: "setas", emoji: "🍄", gender: "f", type: "object" },
    { plural: "nueces", emoji: "🌰", gender: "f", type: "object" },
    { plural: "piñas", emoji: "🍍", gender: "f", type: "object" },
  ],
};

const THEMED_PLACES: Record<Theme, string[]> = {
  deportes: [
    "el parque",
    "el campo de fútbol",
    "la piscina",
    "la cancha",
    "la carrera",
    "el polideportivo",
    "el estadio",
    "el gimnasio",
  ],
  animales: [
    "el jardín",
    "el parque",
    "el bosque",
    "la granja",
    "el estanque",
    "el campo",
    "el zoo",
    "la pradera",
  ],
  clase: [
    "la clase",
    "el aula",
    "la mochila",
    "el estuche",
    "la mesa",
    "el cajón",
    "la estantería",
    "el recreo",
  ],
  naturaleza: [
    "el jardín",
    "el parque",
    "el bosque",
    "la cesta",
    "el campo",
    "el huerto",
    "el prado",
    "el árbol",
  ],
};

interface Slot {
  text: string;
  types: NounType[];
}

const INTROS: Slot[] = [
  { text: "Hay {a} {noun} en {place}.", types: ["person", "object", "animal"] },
  { text: "En {place} hay {a} {noun}.", types: ["person", "object", "animal"] },
  { text: "{a} {noun} están en {place}.", types: ["person", "object", "animal"] },
  { text: "El equipo tiene {a} {noun}.", types: ["person", "object"] },
  { text: "En el equipo hay {a} {noun}.", types: ["person"] },
  { text: "Tengo {a} {noun}.", types: ["object", "animal"] },
];

const EVENTOS_SUMA: Slot[] = [
  { text: "Llegan {b} más.", types: ["person", "object", "animal"] },
  { text: "Aparecen {b} más.", types: ["person", "object", "animal"] },
  { text: "Se añaden {b} más.", types: ["person", "object"] },
  { text: "Se unen {b} más.", types: ["person"] },
  { text: "Se incorporan {b} más.", types: ["person"] },
  { text: "Nos dan {b} más.", types: ["object"] },
  { text: "Encontramos {b} más.", types: ["object", "animal"] },
  { text: "Traemos {b} más.", types: ["object"] },
  { text: "Ganamos {b} más.", types: ["object"] },
  { text: "Nacen {b} más.", types: ["animal"] },
  { text: "Vemos {b} más.", types: ["animal"] },
];

const EVENTOS_RESTA: Slot[] = [
  { text: "Se van {b}.", types: ["person", "object", "animal"] },
  { text: "Perdemos {b}.", types: ["person", "object", "animal"] },
  { text: "Nos faltan {b}.", types: ["person", "object", "animal"] },
  { text: "Se marchan {b}.", types: ["person", "animal"] },
  { text: "Se retiran {b}.", types: ["person"] },
  { text: "Se lesionan {b}.", types: ["person"] },
  { text: "Se pierden {b}.", types: ["object", "animal"] },
  { text: "Se rompen {b}.", types: ["object"] },
  { text: "Usamos {b}.", types: ["object"] },
  { text: "Se escapan {b}.", types: ["animal"] },
  { text: "Se alejan {b}.", types: ["animal"] },
];

const PREGUNTAS_SUMA: Array<{ q: string; sol: string }> = [
  { q: "¿{C} {noun} hay ahora?", sol: "Hay ___ {noun}." },
  { q: "¿{C} {noun} hay en total?", sol: "Hay ___ {noun} en total." },
  { q: "¿{C} {noun} son en total?", sol: "Son ___ {noun} en total." },
];

const PREGUNTAS_RESTA: Array<{ q: string; sol: string }> = [
  { q: "¿{C} {noun} quedan?", sol: "Quedan ___ {noun}." },
  { q: "¿{C} {noun} nos quedan?", sol: "Nos quedan ___ {noun}." },
  { q: "¿{C} {noun} hay ahora?", sol: "Hay ___ {noun}." },
];

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

function pickSlot(pool: Slot[], type: NounType, rng: () => number): string {
  const valid = pool.filter((s) => s.types.includes(type));
  return valid[Math.floor(rng() * valid.length)].text;
}

function fill(tpl: string, noun: Noun, place: string, a: number, b: number): string {
  const c = noun.gender === "f" ? "Cuántas" : "Cuántos";
  return tpl
    .replace("{a}", String(a))
    .replace("{b}", String(b))
    .replace("{noun}", noun.plural)
    .replace("{place}", place)
    .replace("{C}", c);
}

const COUNT = 10;

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
  theme: Theme = "deportes",
): ProblemaExercise[] {
  const rng = lcg(seed);
  const nouns = shuffle(THEMED_NOUNS[theme], rng);
  const places = shuffle(THEMED_PLACES[theme], rng);

  const usedAB = new Set<string>();
  const out: ProblemaExercise[] = [];
  let tries = 0;

  while (out.length < COUNT && tries < COUNT * 40) {
    tries++;
    const idx = out.length;
    const noun = nouns[idx % nouns.length];
    const place = places[idx % places.length];
    const op: ProblemOp = difficulty === "easy" ? "suma" : idx % 2 === 0 ? "suma" : "resta";

    let a: number, b: number;

    if (difficulty === "easy") {
      a = randInt(rng, 2, 7);
      b = randInt(rng, 1, 5);
      if (a + b > 10) continue;
    } else if (difficulty === "medium") {
      a = randInt(rng, 3, 9);
      b = randInt(rng, 1, 6);
      if (op === "suma" && a + b > 10) continue;
      if (op === "resta" && a <= b) continue;
    } else if (difficulty === "hard") {
      a = randInt(rng, 5, 15);
      b = randInt(rng, 1, 9);
      if (op === "suma" && a + b > 19) continue;
      if (op === "resta" && a <= b) continue;
    } else {
      a = randInt(rng, 10, 29);
      b = randInt(rng, 5, 15);
      if (op === "suma" && a + b > 39) continue;
      if (op === "resta" && a <= b) continue;
    }

    const abKey = `${op}-${a}-${b}`;
    if (usedAB.has(abKey)) continue;
    usedAB.add(abKey);

    const pregs = op === "suma" ? PREGUNTAS_SUMA : PREGUNTAS_RESTA;
    const pItem = pregs[Math.floor(rng() * pregs.length)];
    const intro = fill(pickSlot(INTROS, noun.type, rng), noun, place, a, b);
    const evento = fill(
      pickSlot(op === "suma" ? EVENTOS_SUMA : EVENTOS_RESTA, noun.type, rng),
      noun,
      place,
      a,
      b,
    );

    out.push({
      story: `${intro} ${evento}`,
      question: fill(pItem.q, noun, place, a, b),
      solutionTemplate: fill(pItem.sol, noun, place, a, b),
      emoji: noun.emoji,
      a,
      b,
      op,
      answer: op === "suma" ? a + b : a - b,
    });
  }

  return out;
}

export function validateAnswer(ex: ProblemaExercise, input: string): boolean {
  return input.trim() === String(ex.answer);
}
