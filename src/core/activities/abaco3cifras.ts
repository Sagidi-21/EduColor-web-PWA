import type { ActivityDifficulty } from "../content/contracts";

/**
 * Motor "Ábaco de tres cifras" (2.º de Primaria).
 *
 * Migración 1:1 de
 * `electron-reference/Colegio/src/renderer/src/core/engines/abaco3cifras/engine.ts`.
 *
 * Tres tipos de ejercicio sobre el mismo número de tres cifras:
 *
 * - `read-abaco`: se muestra un ábaco y se lee el número que representa.
 * - `find-abaco`: se muestra el número y hay que elegir el ábaco que lo
 *   representa. Las opciones son cadenas `"C-D-U"` con las bolitas de cada
 *   columna.
 * - `valor-posicional`: se pregunta qué vale cada bolita de una columna concreta.
 *   Las opciones son múltiplos del valor de esa columna, de 0 a 9.
 *
 * No cambia ninguna regla de generación ni validación: solo el tipo de
 * dificultad (`Difficulty` de Electron → `ActivityDifficulty` de la PWA) y la
 * semilla como parámetro en lugar de `Date.now() % 999983` calculado en el
 * renderer. Los rangos y las listas de tipos, que en Electron eran `Record<
 * string, …>` sin validar, pasan a estar tipados por dificultad.
 */

export type AbacoType = "read-abaco" | "find-abaco" | "valor-posicional";

export interface AbacoExercise {
  type: AbacoType;
  number: number;
  centenas: number;
  decenas: number;
  unidades: number;
  question: string;
  correctAnswer: string;
  /**
   * Cuatro opciones. En `find-abaco` cada una codifica el número de bolitas por
   * columna como `"C-D-U"`; en los otros dos tipos son los números o valores
   * que se comparan entre sí.
   */
  options: string[];
}

/** Ejercicios por sesión, el mismo número en las cuatro dificultades. */
export const SESSION_SIZE = 10;

/** Rango de números por dificultad. Todas empiezan en 100: son tres cifras. */
export const RANGES: Record<ActivityDifficulty, readonly [number, number]> = {
  easy: [100, 299],
  medium: [100, 499],
  hard: [100, 699],
  expert: [100, 999],
};

/** Tipos de ejercicio que salen en cada dificultad. */
export const TYPE_POOLS: Record<ActivityDifficulty, readonly AbacoType[]> = {
  easy: ["read-abaco"],
  medium: ["read-abaco", "find-abaco"],
  hard: ["read-abaco", "find-abaco", "valor-posicional"],
  expert: ["read-abaco", "find-abaco", "valor-posicional"],
};

/** Columnas del ábaco, de la más a la izquierda a la más a la derecha. */
export const COLUMNS = [
  { id: "C", name: "centenas", base: 100 },
  { id: "D", name: "decenas", base: 10 },
  { id: "U", name: "unidades", base: 1 },
] as const;

export type AbacoColumnId = (typeof COLUMNS)[number]["id"];

/** Separador con el que se codifican las bolitas de una opción de `find-abaco`. */
export const OPTION_SEPARATOR = "-";

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

/** Descompone un número de tres cifras en sus tres columnas. */
export function decompose(n: number): { c: number; d: number; u: number } {
  return { c: Math.floor(n / 100), d: Math.floor((n % 100) / 10), u: n % 10 };
}

/** Codifica las bolitas de las tres columnas como opción de `find-abaco`. */
export function encodeOption(c: number, d: number, u: number): string {
  return `${c}${OPTION_SEPARATOR}${d}${OPTION_SEPARATOR}${u}`;
}

/** Lee una opción de `find-abaco` para poder dibujar ese ábaco. */
export function decodeOption(option: string): { c: number; d: number; u: number } {
  const [c, d, u] = option.split(OPTION_SEPARATOR).map(Number);
  return { c, d, u };
}

// ── Motor público ────────────────────────────────────────────────────────────

/**
 * Genera una sesión de 10 ejercicios sin repetir la combinación número:tipo.
 *
 * - easy:   100-299, solo lectura del ábaco.
 * - medium: 100-499, lectura y elección de ábaco.
 * - hard:   100-699, los tres tipos.
 * - expert: 100-999, los tres tipos.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): AbacoExercise[] {
  const rng = lcg(seed);
  const [min, max] = RANGES[difficulty];
  const types = TYPE_POOLS[difficulty];
  const out: AbacoExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < SESSION_SIZE && tries < 300) {
    tries++;
    const number = randInt(rng, min, max);
    const type = types[Math.floor(rng() * types.length)];
    const key = `${number}-${type}`;
    if (used.has(key)) continue;
    used.add(key);

    const { c, d, u } = decompose(number);
    let question: string;
    let correctAnswer: string;
    const options: string[] = [];

    if (type === "read-abaco") {
      question = "¿Qué número muestra el ábaco?";
      correctAnswer = String(number);
      const wrongs = new Set<string>([correctAnswer]);
      while (wrongs.size < 4) wrongs.add(String(randInt(rng, min, max)));
      options.push(...Array.from(wrongs).sort((a, b) => Number(a) - Number(b)));
    } else if (type === "find-abaco") {
      question = `¿Qué ábaco representa el número ${number}?`;
      correctAnswer = encodeOption(c, d, u);
      const wrongs = new Set<string>([correctAnswer]);
      while (wrongs.size < 4) {
        const wn = randInt(rng, min, max);
        const Other = decompose(wn);
        wrongs.add(encodeOption(Other.c, Other.d, Other.u));
      }
      options.push(...Array.from(wrongs).sort(() => rng() - 0.5));
    } else {
      // valor-posicional: qué vale cada bolita de la columna elegida.
      const col = rng() < 0.33 ? "C" : rng() < 0.5 ? "D" : "U";
      const columna = COLUMNS.find((x) => x.id === col)!;
      const beads = col === "C" ? c : col === "D" ? d : u;
      const val = beads * columna.base;
      question = `En el ábaco con ${beads} bolitas en la columna de ${columna.name}, ¿qué valor tienen?`;
      correctAnswer = String(val);
      const wrongs = new Set<string>([correctAnswer]);
      while (wrongs.size < 4) {
        const wb = randInt(rng, 0, 9);
        wrongs.add(String(wb * columna.base));
      }
      options.push(...Array.from(wrongs).sort((a, b) => Number(a) - Number(b)));
    }

    if (options.length >= 4) {
      out.push({
        type,
        number,
        centenas: c,
        decenas: d,
        unidades: u,
        question,
        correctAnswer,
        options,
      });
    }
  }
  return out;
}

/** La respuesta es exactamente la opción correcta; el enunciado ya la da hecha. */
export function validateAnswer(ex: AbacoExercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
