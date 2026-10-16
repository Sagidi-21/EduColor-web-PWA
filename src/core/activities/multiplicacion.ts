import type { ActivityDifficulty } from "../content/contracts";

/**
 * `multiplicacion` — las tablas de multiplicar.
 *
 * Motor puro y determinista. Nace de
 * `electron-reference/Colegio/src/renderer/src/core/engines/multiplicacion/engine.ts`
 * y lo sustituye: aquel hacía siempre diez ejercicios de opción múltiple, y aquí
 * los niveles bajos se han rediseñado.
 *
 * ## Dos modos, según la dificultad
 *
 * - **`easy` y `medium` son un solo ejercicio de unir.** Una columna con las
 *   operaciones (`2 × 1`, `2 × 2`…) y otra con los resultados barajados; el niño
 *   toca una de cada lado y la app las une con una línea si la pareja es correcta.
 *   Es la forma en que la tabla se aprende en la pizarra: se ve la tabla entera
 *   de una vez, en vez de diez ejercicios sueltos que la esconden. En `easy` es
 *   la tabla del 2 completa; en `medium`, cinco filas de la del 2 y cinco de la
 *   del 5.
 * - **`hard` y `expert` son seis pantallas**, cada una con tres operaciones a
 *   rellenar (numpad/canvas en pizarra). Cada pantalla completa cuenta como un
 *   ejercicio. Misma ficha de tipos/tablas; `hard` lleva apoyo visual de grupos
 *   y `expert` no. Las `options` se siguen generando por si la ficha impresa las
 *   usa.
 *
 * ## Divergencias respecto a Electron
 *
 * 1. Los niveles bajos cambian de formato (ver arriba). Es un rediseño, no una
 *    traducción, y está anotado como decisión del programador.
 * 2. En los niveles altos `b` ya no puede valer 1. El original sortea `1..10` y con
 *    `b = 1` salen ejercicios degenerados (`2 × 1 = 2`, `___ × 1 = 2`) que no
 *    piden calcular nada y ocupan plaza en la sesión. Ahora es `2..10`. Ojo: en
 *    modo unir sí aparece `2 × 1 = 2`, porque ahí no es un ejercicio suelto sino
 *    una fila de la tabla completa, y `×1` es una fila legítima.
 * 3. Las opciones se barajan. El original las ordenaba de menor a mayor, lo que
 *    dejaba la correcta correlacionada con su magnitud: en `7 × 3 = 21` las
 *    opciones `{7, 14, 21, 28}` se leen como una progresión y se puede acertar sin
 *    multiplicar.
 * 4. El tipo y la tabla se alternan de forma determinista en vez de sortearse en
 *    cada intento, para que toda sesión contenga todos los tipos de su
 *    dificultad. Con el sorteo, una sesión de `expert` podía salir sin un solo
 *    `count-groups`, que es justamente el tipo nuevo de ese nivel.
 * 5. `validateAnswer` acepta el número, no la cadena. La comparación estricta de
 *    texto del original funciona solo porque las opciones son cadenas idénticas a
 *    `correctAnswer`; comparar números no depende de cómo se haya formateado.
 *
 * En modo unir la comprobación no va por `validateAnswer`: una pareja es correcta
 * cuando los dos lados dicen lo mismo, y eso lo decide el emparejador, no este
 * módulo.
 */

/** Una fila de la tabla, tal y como aparece a la izquierda. */
export interface MatchPair {
  /** Identificador de la pareja, el mismo en las dos columnas. */
  id: number;
  /** La tabla: 2 en `2 × 7`. */
  table: number;
  /** El multiplicando: 7 en `2 × 7`. */
  factor: number;
  /** El producto, que es lo que aparece a la derecha. */
  product: number;
}

export interface MatchSession {
  mode: "match";
  pairs: MatchPair[];
  leftColumn: MatchPair[];
  rightColumn: MatchPair[];
}

// ── Opción múltiple (hard, expert) ────────────────────────────────────────────

export type MultiplicacionType =
  "product" | "missing-factor-a" | "missing-factor-b" | "count-groups";

export interface MultiplicacionExercise {
  type: MultiplicacionType;
  /** El factor de la tabla, el que se memoriza. */
  a: number;
  /** El multiplicando variable. */
  b: number;
  result: number;
  table: number;
  question: string;
  correctAnswer: number;
  options: number[];
}

export interface ChoiceSession {
  mode: "choice";
  /** Seis pantallas; cada una es un ejercicio con tres operaciones. */
  screens: MultiplicacionExercise[][];
}

/** Lo que devuelve `generateSession`: una unión o una tanda de ejercicios. */
export type MultiplicacionSession = MatchSession | ChoiceSession;

/** Pantallas (ejercicios) por sesión en hard/expert. */
export const CHOICE_SESSION_SCREENS = 6;
/** Operaciones por pantalla en pizarra. */
export const CHOICE_OPS_PER_SCREEN = 3;
/** Alias: tamaño de sesión = número de pantallas. */
export const SESSION_SIZE = CHOICE_SESSION_SCREENS;

/** Intentos antes de darse por vencido: la deduplicación puede rechazar muchos. */
const MAX_TRIES = 800;

/** Cuántas opciones se ofrecen siempre. */
const OPCIONES = 4;

/** Máximo de las opciones, para que ninguna se salga de un producto posible. */
const MAX_OPCION = 100;

/**
 * El segundo factor no baja de 2 en los niveles de opción múltiple.
 *
 * En el original `b` se sorteaba entre 1 y 10, y `b = 1` daba ejercicios donde no
 * hay nada que calcular. Solo aplica a `hard` y `expert`: en modo unir el factor 1
 * sí aparece, porque `2 × 1 = 2` es una fila más de la tabla.
 */
export const MIN_FACTOR = 2;

/** Factores disponibles de una tabla. En modo unir empieza en 1, como la tabla. */
export const FACTORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

// ── Configuración ─────────────────────────────────────────────────────────────

/** Las tablas de las cuatro dificultades, igual que en el original. */
const TABLAS: Record<ActivityDifficulty, number[]> = {
  easy: [2],
  medium: [2, 5],
  hard: [2, 5, 10],
  expert: [2, 3, 4, 5, 10],
};

/**
 * Tipos por dificultad, en el orden en que se alternan.
 *
 * Se recorren de forma determinista y no al azar, igual que hace `parImpar`: un
 * sorteo puede dejar un nivel sin el tipo que lo define.
 */
const TIPOS: Record<ActivityDifficulty, MultiplicacionType[]> = {
  easy: ["product"],
  medium: ["product", "missing-factor-b"],
  hard: ["product", "missing-factor-a", "missing-factor-b"],
  expert: ["product", "missing-factor-a", "missing-factor-b", "count-groups"],
};

/** Qué tabla y cuántas filas por tabla usa el ejercicio de unir. */
const UNIR: Record<ActivityDifficulty, { tablas: number[]; porTabla: number }> = {
  easy: { tablas: [2], porTabla: 10 },
  medium: { tablas: [2, 5], porTabla: 5 },
  hard: { tablas: [2, 5, 10], porTabla: 5 },
  expert: { tablas: [2, 3, 4, 5, 10], porTabla: 5 },
};

/** Los niveles bajos se unis; los altos, ejercicios de opción múltiple. */
export const MODOS: Record<ActivityDifficulty, MultiplicacionSession["mode"]> = {
  easy: "match",
  medium: "match",
  hard: "choice",
  expert: "choice",
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

// ── Modo unir ─────────────────────────────────────────────────────────────────

/**
 * Elige las filas de las tablas indicadas, sin repetir producto.
 *
 * El filtro de productos es lo que hace posible mezclar tablas: `2 × 5` y `5 × 2`
 * dan los dos 10, y si entraran las dos habría dos tarjetas de la izquierda
 * apuntando a una sola de la derecha, que no tiene unión posible. Se queda la
 * primera y la otra se descarta, así que el orden de las tablas decide cuál
 * sobrevive.
 */
function generarPares(rng: () => number, tablas: number[], porTabla: number): MatchPair[] {
  const usados = new Set<number>();
  const pares: MatchPair[] = [];

  for (const tabla of tablas) {
    let cogidos = 0;
    for (const factor of shuffle(FACTORES, rng)) {
      if (cogidos >= porTabla) break;
      const product = tabla * factor;
      if (usados.has(product)) continue;
      usados.add(product);
      pares.push({ id: pares.length, table: tabla, factor, product });
      cogidos++;
    }
  }

  return pares;
}

/** Genera el ejercicio de unir: dos columnas barajadas de forma independiente. */
export function generateMatchSession(difficulty: ActivityDifficulty, seed = 42): MatchSession {
  const rng = lcg(seed);
  const { tablas, porTabla } = UNIR[difficulty];
  const pairs = generarPares(rng, tablas, porTabla);

  // Barajadas por separado: si compartieran orden, unir sería mirar a la misma
  // altura y la operación no se leería.
  const leftColumn = shuffle(pairs, rng);
  const rightColumn = shuffle(pairs, rng);

  return { mode: "match", pairs, leftColumn, rightColumn };
}

/** Filas por bloque de unir en la ficha impresa (como las rondas de `relacionar`). */
export const FICHA_BLOCK_SIZE = 5;

/**
 * Bloques de unir para la ficha impresa, en cualquier dificultad.
 *
 * La pizarra usa opción múltiple en `hard`/`expert`, pero el papel siempre se
 * imprime como columnas a unir (decisión del profesorado): se reutiliza la
 * configuración `UNIR` de cada nivel y se parte en bloques de `blockSize` filas
 * (por tabla en `medium`/`hard`/`expert`) para que quepan varios por hoja. Cada
 * bloque baraja sus dos columnas por separado; el producto es único en toda la
 * sesión, así que dentro de un bloque no hay dos filas que apunten al mismo valor.
 */
export function generateMatchBlocks(
  difficulty: ActivityDifficulty,
  seed = 42,
  blockSize = FICHA_BLOCK_SIZE,
): MatchSession[] {
  const rng = lcg(seed);
  const { tablas, porTabla } = UNIR[difficulty];
  const pairs = generarPares(rng, tablas, porTabla);
  const size = Math.max(1, blockSize);
  const blocks: MatchSession[] = [];

  for (let i = 0; i < pairs.length; i += size) {
    const chunk = pairs.slice(i, i + size);
    const leftColumn = shuffle(chunk, rng);
    let rightColumn = shuffle(chunk, rng);
    // Con el mismo orden las líneas serían todas horizontales: se rebaraja.
    for (let t = 0; t < 5 && chunk.length > 1; t++) {
      if (rightColumn.some((p, idx) => p.id !== leftColumn[idx].id)) break;
      rightColumn = shuffle(chunk, rng);
    }
    blocks.push({ mode: "match", pairs: chunk, leftColumn, rightColumn });
  }

  return blocks;
}

/** Si las dos tarjetas que se han tocado forman una unión correcta. */
export function isCorrectPair(left: MatchPair, right: MatchPair): boolean {
  return left.product === right.product;
}

// ── Modo opción múltiple ──────────────────────────────────────────────────────

/**
 * Cuatro opciones alrededor de la correcta.
 *
 * `paso` es el de la tabla cuando lo que se busca es un producto, y 1 cuando lo
 * que se busca es un factor: los productos salen a saltos de la tabla porque así
 * se lee mejor la rejilla, pero un factor tiene que aparecer uno a uno.
 */
function opcionesCerca(rng: () => number, correcta: number, paso: number): number[] {
  const vistos = new Set<number>([correcta]);
  let intentos = 0;
  while (vistos.size < OPCIONES && intentos < 100) {
    intentos++;
    const delta = randInt(rng, 1, 3) * paso * (rng() > 0.5 ? 1 : -1);
    const w = correcta + delta;
    if (w > 0 && w <= MAX_OPCION) vistos.add(w);
  }
  return shuffle(Array.from(vistos), rng);
}

/**
 * Genera las pantallas de hard/expert: 6×3 operaciones sin repetir tipo, tabla
 * y factor en toda la sesión.
 *
 * La clave de deduplicación incluye los tres, igual que en el original, porque
 * son los tres que determinan el enunciado.
 */
export function generateChoiceSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): MultiplicacionExercise[][] {
  const rng = lcg(seed);
  const tablas = TABLAS[difficulty];
  const tipos = TIPOS[difficulty];
  const usadas = new Set<string>();
  const totalOps = CHOICE_SESSION_SCREENS * CHOICE_OPS_PER_SCREEN;
  const flat: MultiplicacionExercise[] = [];
  let intentos = 0;

  while (flat.length < totalOps && intentos < MAX_TRIES) {
    intentos++;

    // Tipo y tabla al azar entre los del nivel, para repartir variedad en 18 ops.
    const tabla = tablas[randInt(rng, 0, tablas.length - 1)]!;
    const type = tipos[randInt(rng, 0, tipos.length - 1)]!;
    const b = randInt(rng, MIN_FACTOR, 10);
    const a = tabla;
    const result = a * b;

    const clave = `${type}-${a}-${b}`;
    if (usadas.has(clave)) continue;
    usadas.add(clave);

    let question: string;
    let correcta: number;
    let opciones: number[];

    if (type === "product") {
      question = `${a} × ${b} = ___`;
      correcta = result;
      opciones = opcionesCerca(rng, correcta, a);
    } else if (type === "missing-factor-b") {
      question = `${a} × ___ = ${result}`;
      correcta = b;
      opciones = opcionesCerca(rng, correcta, 1);
    } else if (type === "missing-factor-a") {
      question = `___ × ${b} = ${result}`;
      correcta = a;
      opciones = opcionesCerca(rng, correcta, 1);
    } else {
      question = `¿En cuántos grupos de ${a} se pueden repartir ${result} objetos?`;
      correcta = b;
      opciones = opcionesCerca(rng, correcta, 1);
    }

    flat.push({
      type,
      a,
      b,
      result,
      table: a,
      question,
      correctAnswer: correcta,
      options: opciones,
    });
  }

  const screens: MultiplicacionExercise[][] = [];
  for (let i = 0; i < CHOICE_SESSION_SCREENS; i++) {
    screens.push(flat.slice(i * CHOICE_OPS_PER_SCREEN, (i + 1) * CHOICE_OPS_PER_SCREEN));
  }
  return screens;
}

/**
 * La sesión que pide el nivel.
 *
 * Es una unión discriminada por `mode`, para que quien la reciba tenga que
 * decidir qué formato toca en lugar de comprobarlo con `instanceof` o mirando si
 * viene `pairs` o `exercises`.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): MultiplicacionSession {
  return MODOS[difficulty] === "match"
    ? generateMatchSession(difficulty, seed)
    : { mode: "choice", screens: generateChoiceSession(difficulty, seed) };
}

/**
 * Si el ejercicio lleva ese tipo de hueco.
 *
 * Solo tiene sentido en modo opción múltiple: en el de unir la pareja se
 * comprueba con `isCorrectPair`.
 */
export function validateAnswer(exercise: MultiplicacionExercise, answer: number): boolean {
  return answer === exercise.correctAnswer;
}
