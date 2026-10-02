import type { ActivityDifficulty } from "../content/contracts";

/**
 * Motor "Algoritmo de tres cifras" (2.º de Primaria).
 *
 * Migración de
 * `electron-reference/Colegio/src/renderer/src/core/engines/algoritmo3cifras/engine.ts`,
 * **con la mecánica del renderer cambiada por indicación del profesorado**
 * (2026-10-02). La parte aritmética es 1:1; lo que cambia es cómo se contesta.
 *
 * ## Lo que hace el generador
 *
 * Una operación planteada encolumnada, con la fila de llevadas ya resuelta en el
 * enunciado, para 2.º de Primaria. Lo que cambia con la dificultad no es la
 * cantidad de cifras sino **qué clase de llevadas** aparece:
 *
 * - easy:   suma sin ninguna llamada, con el resultado por debajo de 1000.
 * - medium: suma con llamada de unidades a decenas, y solo esa.
 * - hard:   suma con llamada de decenas a centenas, y solo esa.
 * - expert: suma con las dos llamadas, o resta con los dos prestamos.
 *
 * ## Lo que cambia respecto a Electron
 *
 * En Electron la respuesta era de opción múltiple: el niño elegía entre cuatro
 * resultados y, además, se le revelaba la fila de llevadas ya resuelta. Aquí la
 * respuesta **se escribe**, casilla a casilla, y se comprueba **una sola vez**
 * contra el resultado entero. Es una decisión del profesorado, no una limpieza:
 * la idea es que el niño no salga sabiendo en qué cifra se ha equivocado, porque
 * si lo sabe el error ya no le sirve de nada y el profesor pierde su intervención.
 * Por eso el núcleo ya no genera opciones: la única pregunta que tiene respuesta
 * correcta es "¿cuál es el resultado?".
 *
 * ElRenderer es lo único que cambia; las reglas de generación, los rangos, las
 * listas de tipos de llamada y la aritmética son las de Electron. También lo es
 * el paso a `ActivityDifficulty` y la semilla como parámetro en lugar de
 * `Date.now() % 999983` calculado en el renderer.
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
}

/** Ejercicios por sesión, el mismo número en las cuatro dificultades. */
export const SESSION_SIZE = 10;

/**
 * Las columnas que tienen casilla de "llevar", por su posición desde la
 * izquierda: la de las centenas es la 0 y la de las decenas la 1.
 *
 * La columna de las unidades nunca recibe nada de la derecha, así que no tiene
 * casilla. Se expone porque el renderer dibuja las casillas y las decide quien
 * lleva la pantalla, no el núcleo.
 */
export const CARRY_SLOTS = [0, 1] as const;

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
    });
  }
  return out;
}

/** Las tres cifras del resultado, como las ve el niño en las casillas. */
export function resultDigits(ex: Algoritmo3Exercise): string[] {
  return [
    String(Math.floor(ex.result / 100)),
    String(Math.floor((ex.result % 100) / 10)),
    String(ex.result % 10),
  ];
}

/**
 * La única validación del ejercicio.
 *
 * Se compara **el resultado entero**, no cifra a cifra, y por eso devuelve un
 * solo booleano: el ejercicio se acierta o se falla entero. No hay ninguna vía
 * para que quien llama sepa en qué posición estaba el error, que es justo lo que
 * se busca: si se le dijera, sabría qué corregir solo y no necesitaría al
 * profesor.
 *
 * Con cualquiera de las tres casillas vacía devuelve `false`: el niño todavía no
 * ha terminado y no se comprueba nada.
 */
export function validateDigits(ex: Algoritmo3Exercise, digits: readonly string[]): boolean {
  if (digits.length !== 3 || digits.some((d) => d === "")) return false;
  const escrito = Number(digits.join(""));
  if (!Number.isInteger(escrito)) return false;
  return escrito === ex.result;
}
