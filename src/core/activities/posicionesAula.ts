import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `posicionesAula`: posiciones espaciales, generación de ejercicios y validación.
 *
 * No importa React ni nada del navegador. El renderer solo dibuja lo que esto
 * devuelve, y una hoja de ejercicios podrá hacerlo mismo más adelante.
 */

export type Position = "dentro" | "fuera" | "encima" | "debajo" | "al lado";
export type PosObject = "pelota" | "lápiz" | "libro" | "goma";
export type Container = "caja" | "mochila" | "mesa" | "silla";

export interface PosExercise {
  container: Container;
  object: PosObject;
  position: Position;
  question: string;
  options: string[];
  correctAnswer: string;
}

// Containment positions (dentro/fuera) only valid for closed containers
const CONTAINMENT: Position[] = ["dentro", "fuera"];
// Directional positions (no overlap with containment semantics)
const DIRECTIONAL_EASY: Position[] = ["encima", "debajo"];
const DIRECTIONAL_HARD: Position[] = ["encima", "debajo", "al lado"];

const CLOSED_CONTAINERS: Container[] = ["caja", "mochila"];
const ALL_CONTAINERS: Container[] = ["caja", "mochila", "mesa", "silla"];
const OBJECTS: PosObject[] = ["pelota", "lápiz", "libro", "goma"];

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

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function artOf(obj: PosObject): string {
  return obj === "lápiz" ? "el" : obj === "goma" ? "la" : obj === "pelota" ? "la" : "el";
}

/** Genera una sesión de 10 ejercicios de posiciones espaciales. */
export function generateSession(difficulty: ActivityDifficulty, seed: number): PosExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: PosExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  const directional =
    difficulty === "easy" || difficulty === "medium" ? DIRECTIONAL_EASY : DIRECTIONAL_HARD;

  while (out.length < count && tries < 400) {
    tries++;

    const object = OBJECTS[randInt(rng, 0, OBJECTS.length - 1)];

    // Alternate between containment and directional exercises
    const useContainment =
      difficulty === "easy"
        ? rng() > 0.5 // 50/50
        : difficulty === "medium"
          ? rng() > 0.5
          : rng() > 0.6; // 40% containment in hard/expert

    if (useContainment) {
      // CONTAINMENT exercise: dentro / fuera — options are ALWAYS only ['Dentro', 'Fuera']
      const container = CLOSED_CONTAINERS[randInt(rng, 0, CLOSED_CONTAINERS.length - 1)];
      const position = CONTAINMENT[randInt(rng, 0, 1)] as Position;
      const key = `${container}-${object}-${position}`;
      if (used.has(key)) continue;
      used.add(key);

      const options = shuffle(rng, ["Dentro", "Fuera"]);
      out.push({
        container,
        object,
        position,
        question: `¿Dónde está ${artOf(object)} ${object}?`,
        options,
        correctAnswer: cap(position),
      });
    } else {
      // DIRECTIONAL exercise: encima / debajo / al lado — options never include dentro/fuera
      const container = ALL_CONTAINERS[randInt(rng, 0, ALL_CONTAINERS.length - 1)];
      const position = directional[randInt(rng, 0, directional.length - 1)] as Position;
      const key = `${container}-${object}-${position}`;
      if (used.has(key)) continue;
      used.add(key);

      const others = directional.filter((p) => p !== position);
      const decoys = shuffle(rng, [...others]).slice(0, 3) as Position[];
      const options = shuffle(rng, [position, ...decoys]).map(cap);

      out.push({
        container,
        object,
        position,
        question: `¿Dónde está ${artOf(object)} ${object}?`,
        options,
        correctAnswer: cap(position),
      });
    }
  }
  return out;
}

/** Comprueba si la respuesta elegida es correcta (case-insensitive). */
export function validateAnswer(ex: PosExercise, input: string): boolean {
  return input.toLowerCase() === ex.correctAnswer.toLowerCase();
}
