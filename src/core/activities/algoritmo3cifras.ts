import type { ActivityDifficulty } from "../content/contracts";

/**
 * Motor "Algoritmo de tres cifras" (2.º de Primaria).
 *
 * Migración 1:1 de
 * `electron-reference/Colegio/src/renderer/src/core/engines/algoritmo3cifras/engine.ts`.
 *
 * El niño ve una operación planteada encolumnada, con la fila de llevadas ya
 * resuelta, y elige el resultado entre cuatro opciones. La mecánica es de
 * opción múltiple: no se teclea el resultado, se elige.
 *
 * Lo que cambia con la dificultad es **qué clase de llevadas** aparece, no la
 * cantidad de cifras:
 *
 * - easy:   suma sin ninguna llamada, con el resultado por debajo de 1000.
 * - medium: suma con llamada de unidades a decenas, y solo esa.
 * - hard:   suma con llamada de decenas a centenas, y solo esa.
 * - expert: suma con las dos llamadas, o resta con los dos prestamos.
 *
 * No cambia ninguna regla de generación ni validación: solo el tipo de
 * dificultad (`Difficulty` de Electron → `ActivityDifficulty` de la PWA) y la
 * semilla como parámetro en lugar de `Date.now() % 999983` calculado en el
 * renderer.
 */

export type AlgoritmoOperacion = "+" | "-";

export interface Algoritmo3Exercise {
  op: AlgoritmoOperacion;
  a: number;
  b: number;
  result: number;
  aC: number;
  aD: number;
  aU: number;
  bC: number;
  bD: number;
  bU: number;
  /** Hay que pasar una decena a las centenas: Units→Decenas. En restas, préstamo. */
  carryUD: boolean;
  /** Hay que pasar una centena hacia la izquierda: Decenas→Centenas. */
  carryDC: boolean;
  question: string;
  correctAnswer: string;
  options: string[];
}

/** Ejercicios por sesión, el mismo número en las cuatro dificultades. */
export const SESSION_SIZE = 10;

/** Cuánto puede alejarse una opción incorrecta del resultado correcto. */
const DESVIO_MAXIMO = 15;

/** Intentos por ejercicio antes de descartarlo y probar con otro. */
const INTENTOS_POR_EJERCICIO = 50;

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

function dec(n: number): { c: number; d: number; u: number } {
  return { c: Math.floor(n / 100), d: Math.floor((n % 100) / 10), u: n % 10 };
}

/**
 * Las dos llamadas de una operación, sin tener en cuenta el orden de las cifras.
 * `carryUD` es "unidades producen decena" y `carryDC` es "decenas producen
 * centena"; en una resta son los dos prestamos.
 *
 * Se exporta porque el renderer las dibuja en la fila de llevadas y los tests
 * necesitan comprobarlas contra las cifras del enunciado.
 */
export function llamadas(op: AlgoritmoOperacion, a: number, b: number) {
  const { d: ad, u: au } = dec(a);
  const { d: bd, u: bu } = dec(b);
  const carryUD = op === "+" ? au + bu >= 10 : au < bu;
  const carryDC = op === "+" ? ad + bd + (carryUD ? 1 : 0) >= 10 : ad - (carryUD ? 1 : 0) < bd;
  return { carryUD, carryDC };
}

/**
 * Genera una sesión de 10 operaciones distintas, sin repetir la terna
 * operación:primer número:segundo número.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): Algoritmo3Exercise[] {
  const rng = lcg(seed);
  const out: Algoritmo3Exercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < SESSION_SIZE && tries < 400) {
    tries++;

    let a = 0;
    let b = 0;
    let op: AlgoritmoOperacion = "+";

    if (difficulty === "easy") {
      // Suma sin llamada: cada cifra del segundo sumando cabe en la del primero.
      a = randInt(rng, 100, 500);
      const { c, d, u } = dec(a);
      const bc = randInt(rng, 0, Math.min(9 - c, 4));
      const bd = randInt(rng, 0, 9 - d);
      const bu = randInt(rng, 0, 9 - u);
      b = bc * 100 + bd * 10 + bu;
      // Un sumando por debajo de cien no es un número de tres cifras, pero
      // sumarle cien solo toca la columna de las centenas y `a` nunca pasa de
      // 500, así que sigue sin generar ninguna llamada.
      if (b < 100) b += 100;
      if (b > a) [a, b] = [b, a];
    } else if (difficulty === "medium") {
      // Suma con llamada de unidades a decenas, y solo esa.
      op = "+";
      let valid = false;
      for (let t = 0; t < 30 && !valid; t++) {
        a = randInt(rng, 100, 699);
        b = randInt(rng, 100, 299);
        const { c: ac } = dec(a);
        const { c: bc } = dec(b);
        const { carryUD, carryDC } = llamadas(op, a, b);
        if (carryUD && !carryDC && ac + bc <= 9) valid = true;
        else {
          a = 0;
          b = 0;
        }
      }
      if (a === 0 || b === 0) continue;
    } else if (difficulty === "hard") {
      // Suma con llamada de decenas a centenas, y solo esa.
      op = "+";
      let valid = false;
      for (let t = 0; t < 30 && !valid; t++) {
        a = randInt(rng, 100, 699);
        b = randInt(rng, 100, 299);
        const { c: ac } = dec(a);
        const { c: bc } = dec(b);
        const { carryUD, carryDC } = llamadas(op, a, b);
        if (!carryUD && carryDC && ac + bc + 1 <= 9) valid = true;
        else {
          a = 0;
          b = 0;
        }
      }
      if (a === 0 || b === 0) continue;
    } else {
      // Expert: suma con las dos llamadas, o resta con los dos prestamos.
      op = rng() > 0.5 ? "+" : "-";
      let valid = false;
      for (let t = 0; t < INTENTOS_POR_EJERCICIO && !valid; t++) {
        if (op === "+") {
          a = randInt(rng, 100, 499);
          b = randInt(rng, 100, 499);
          const { c: ac } = dec(a);
          const { c: bc } = dec(b);
          const { carryUD, carryDC } = llamadas(op, a, b);
          if (carryUD && carryDC && ac + bc + 1 <= 9 && a + b <= 999) valid = true;
          else {
            a = 0;
            b = 0;
          }
        } else {
          // El segundo sumando se queda por debajo de la mitad del primero, así
          // que la resta nunca sale negativa.
          a = randInt(rng, 300, 999);
          b = randInt(rng, 100, Math.floor(a / 2));
          const { carryUD, carryDC } = llamadas(op, a, b);
          if (carryUD && carryDC) valid = true;
          else {
            a = 0;
            b = 0;
          }
        }
      }
      if (a === 0 || b === 0) continue;
    }

    const result = op === "+" ? a + b : a - b;
    if (result < 0 || result > 999) continue;

    const key = `${op}-${a}-${b}`;
    if (used.has(key)) continue;
    used.add(key);

    const da = dec(a);
    const db = dec(b);
    const { carryUD, carryDC } = llamadas(op, a, b);

    const correctAnswer = String(result);
    const wrongs = new Set<string>([correctAnswer]);
    while (wrongs.size < 4) {
      const w = result + randInt(rng, 1, DESVIO_MAXIMO) * (rng() > 0.5 ? 1 : -1);
      if (w > 0 && w <= 999) wrongs.add(String(w));
    }
    const options = Array.from(wrongs).sort((a, b) => Number(a) - Number(b));

    out.push({
      op,
      a,
      b,
      result,
      aC: da.c,
      aD: da.d,
      aU: da.u,
      bC: db.c,
      bD: db.d,
      bU: db.u,
      carryUD,
      carryDC,
      question: op === "+" ? `Suma: ${a} + ${b} = ___` : `Resta: ${a} − ${b} = ___`,
      correctAnswer,
      options,
    });
  }
  return out;
}

/** La respuesta es exactamente la opción correcta; el enunciado ya la da hecha. */
export function validateAnswer(ex: Algoritmo3Exercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
