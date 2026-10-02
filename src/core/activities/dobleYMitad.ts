import type { ActivityDifficulty } from "../content/contracts";

/**
 * `dobleYMitad` — el doble y la mitad de un número.
 *
 * Motor puro y determinista, extraído de
 * `electron-reference/Colegio/src/renderer/src/core/engines/dobleYMitad/engine.ts`.
 * Las cuatro dificultades usan los mismos tipos y rangos que el original.
 *
 * Divergencias respecto a Electron, todas deliberadas:
 *
 * 1. El tipo se alterna de forma determinista en vez de sortearse en cada
 *    intento. Con el sorteo, una sesión de `expert` podía salir sin un solo
 *    `find-original-mitad`, que es justamente el tipo nuevo de ese nivel. Es el
 *    mismo criterio que se aplicó en `multiplicacion` y `parImpar`.
 * 2. Las opciones se barajan. El original las ordenaba siempre de menor a mayor,
 *    y como además las sortea dentro de una ventana alrededor de la correcta,
 *    quedaban como una progresión: en "¿Cuánto es el doble de 3?" las opciones
 *    salían `{3, 6, 9, 12}` y se podía acertar sin multiplicar.
 * 3. Los números y las respuestas son `number`, no cadenas. La comparación
 *    estricta de texto del original solo funciona porque las opciones son
 *    cadenas idénticas a `correctAnswer`.
 * 4. La mitad se sortea entre los números pares directamente, en vez de tirar un
 *    número cualquiera y redondearlo hacia arriba. El efecto era el mismo —los
 *    impares nunca salían— pero cada par salía el doble de veces que su vecino.
 * 5. Los distractores no pueden ser cero ni negativos. El original los sorteaba
 *    desde `Math.max(0, …)`, así que un «0» podía aparecer como opción al pedir
 *    el doble de 1.
 * 6. La generación de distractores tiene tope de intentos. El original usaba un
 *    `while` sin límite: si la ventana no daba tres números distintos, el
 *    generador se quedaba colgado en lugar de seguir.
 *
 * La mitad de un impar no sale nunca, y eso es intencionado: 7 no tiene una
 * mitad limpia. Lo que se pregunta es el doble de un número o su mitad, y en el
 * nivel experto también el número del que se conoce el doble o la mitad.
 */

export type DobleType = "doble" | "mitad" | "find-original-doble" | "find-original-mitad";

/** Qué se le hace al número: duplicarlo o repartirlo en dos partes iguales. */
export type DobleOperacion = "x2" | "div2";

export interface DobleYMitadExercise {
  type: DobleType;
  /**
   * El número que aparece en el enunciado.
   *
   * En `doble` y `mitad` es el número del que se parte; en los otros dos es el
   * dato que se da, y la respuesta es el número del que se partió.
   */
  number: number;
  /** La respuesta. */
  result: number;
  /** Qué operación corresponde al enunciado. */
  operacion: DobleOperacion;
  /**
   * De qué lado va el dato conocido.
   *
   * La pantalla lo usa para saber en qué caja va el hueco: si el enunciado da el
   * número original, el hueco está en el doble o en la mitad; si da el resultado,
   * el hueco está en el número.
   */
  conocido: "original" | "resultado";
  question: string;
  correctAnswer: number;
  options: number[];
}

/** Ejercicios por sesión, el mismo número en las cuatro dificultades. */
export const SESSION_SIZE = 10;

/** Intentos antes de darse por vencido: la deduplicación puede rechazar muchos. */
const MAX_TRIES = 300;

/** Cuántas opciones se ofrecen siempre. */
const OPCIONES = 4;

/**
 * Distancia a la correcta de cada distractor.
 *
 * En `find-original-mitad` los saltos son pares porque la respuesta es par: si
 * entre los distractores apareciera un impar, el niño lo descartaría de un
 * vistazo por no poder ser el doble de una mitad, y la opción se filtraría sola.
 */
const SALTOS = 3;
const SALTOS_PARES = 6;
const PASO_PAR = 2;

// ── Configuración ─────────────────────────────────────────────────────────────

interface DobleConfig {
  /** Tipos que aparecen en la dificultad, en el orden en que se alternan. */
  types: DobleType[];
  /** Rango del número del que se parte. */
  rango: [number, number];
}

const CONFIG: Record<ActivityDifficulty, DobleConfig> = {
  easy: { types: ["doble"], rango: [1, 10] },
  medium: { types: ["doble", "mitad"], rango: [1, 20] },
  hard: { types: ["doble", "mitad", "find-original-doble"], rango: [1, 50] },
  expert: {
    types: ["doble", "mitad", "find-original-doble", "find-original-mitad"],
    rango: [1, 100],
  },
};

// ── LCG determinista ──────────────────────────────────────────────────────────

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

/** Fisher-Yates. El original usaba `sort(() => rng() - 0.5)`, que no baraja bien. */
function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tres distractores alrededor de la correcta, más la correcta.
 *
 * `soloPares` deja fuera los impares, para los ejercicios en los que la respuesta
 * tiene que ser par. Los saltos se recorren en orden barajado, que es lo que hace
 * que la posición de la correcta dentro de las opciones no dependa de su valor.
 */
function opcionesCerca(rng: () => number, correcta: number, soloPares: boolean): number[] {
  const vistas = new Set<number>([correcta]);
  const saltoMax = soloPares ? SALTOS_PARES : SALTOS;
  const paso = soloPares ? PASO_PAR : 1;
  const candidatos: number[] = [];
  for (let salto = paso; salto <= saltoMax; salto += paso) candidatos.push(salto);

  for (const salto of shuffle(candidatos, rng)) {
    if (vistas.size >= OPCIONES) break;
    // Se prueban los dos lados; con valores grandes basta con el de arriba.
    for (const delta of shuffle([salto, -salto], rng)) {
      const w = correcta + delta;
      if (w > 0 && !vistas.has(w)) vistas.add(w);
      if (vistas.size >= OPCIONES) break;
    }
  }

  return shuffle(Array.from(vistas), rng);
}

/**
 * Genera una sesión de 10 ejercicios sin repetir tipo y número.
 *
 * La clave de deduplicación son los dos, porque son los que determinan el
 * enunciado: con el mismo tipo y el mismo número el ejercicio sería idéntico.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): DobleYMitadExercise[] {
  const rng = lcg(seed);
  const { types, rango } = CONFIG[difficulty];
  const usadas = new Set<string>();
  const out: DobleYMitadExercise[] = [];
  let intentos = 0;

  while (out.length < SESSION_SIZE && intentos < MAX_TRIES) {
    intentos++;

    // El tipo gira con el índice del ejercicio, como `multiplicacion`: así toda
    // sesión trae todos los tipos de su dificultad y ninguno se pasa de la cuenta.
    const type = types[out.length % types.length];

    let number: number;
    let result: number;
    let question: string;
    let operacion: DobleOperacion;
    let conocido: "original" | "resultado";
    let soloPares: boolean;

    switch (type) {
      case "doble": {
        number = randInt(rng, rango[0], rango[1]);
        result = number * 2;
        question = `¿Cuánto es el doble de ${number}?`;
        operacion = "x2";
        conocido = "original";
        soloPares = false;
        break;
      }
      case "mitad": {
        // Solo los pares tienen mitad limpia, así que se sortean entre ellos.
        number = randInt(rng, 1, Math.floor(rango[1] / 2)) * 2;
        result = number / 2;
        question = `¿Cuánto es la mitad de ${number}?`;
        operacion = "div2";
        conocido = "original";
        soloPares = false;
        break;
      }
      case "find-original-doble": {
        const original = randInt(rng, rango[0], Math.floor(rango[1] / 2));
        number = original * 2;
        result = original;
        question = `Si el doble de un número es ${number}, ¿cuál es ese número?`;
        operacion = "x2";
        conocido = "resultado";
        soloPares = false;
        break;
      }
      default: {
        const mitad = randInt(rng, rango[0], Math.floor(rango[1] / 2));
        number = mitad;
        result = mitad * 2;
        question = `Si la mitad de un número es ${number}, ¿cuál es ese número?`;
        operacion = "div2";
        conocido = "resultado";
        soloPares = true;
        break;
      }
    }

    const clave = `${type}-${number}`;
    if (usadas.has(clave)) continue;
    usadas.add(clave);

    const opciones = opcionesCerca(rng, result, soloPares);
    if (opciones.length < OPCIONES) continue;

    out.push({
      type,
      number,
      result,
      operacion,
      conocido,
      question,
      correctAnswer: result,
      options: opciones,
    });
  }

  return out;
}

export function validateAnswer(exercise: DobleYMitadExercise, answer: number): boolean {
  return answer === exercise.correctAnswer;
}

/** Si el enunciado da el número del que se parte, el hueco está en el resultado. */
export function huecoEnElResultado(exercise: DobleYMitadExercise): boolean {
  return exercise.conocido === "original";
}
