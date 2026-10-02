import type { ActivityDifficulty } from "../content/contracts";
import { pickCategory, pickImage } from "../../platform/objectImages";

/**
 * `relacionarCantidades` — unir una situación con su cantidad o su cambio.
 *
 * Motor puro y determinista, extraído de
 * `electron-reference/Colegio/src/renderer/src/core/engines/relacionarCantidades/`.
 * Las cuatro dificultades son las del original, dentro de la unidad 1
 * («2.º · Los números hasta el 99»).
 *
 * Divergencias respecto a Electron, todas deliberadas:
 *
 * 1. **Cada tarjeta dibuja la cantidad que anuncia su texto.** El original
 *    guardaba en `rightCount` la cantidad *añadida o quitada* mientras el texto
 *    decía «Ahora tengo 25»: la tarjeta de la derecha pintaba cinco objetos
 *    junto a un texto que hablaba de veinticinco. Aquí `derecha.total` es siempre
 *    el número que dice el texto, que es lo que se comprueba al mirar.
 * 2. **La tarjeta izquierda ya no se recorta a diez objetos.** El original
 *    pintaba `Math.min(10, cantidad)`, así que «Tengo 25» salía con diez objetos
 *    dibujados. Ahora se dibuja entero, con un bloque por decena.
 * 3. **En el nivel de grupos se dibujan los dos.** La tarjeta izquierda era
 *    `leftCountA` y `leftCountB`, pero el renderer solo pintaba el primero, así
 *    que «Grupo A: 30 · Grupo B: 8» mostraba el grupo B únicamente en el texto.
 *    Aquí la izquierda es una lista y el nivel de grupos trae las dos.
 * 4. **La tarjeta de la derecha ya no dibuja, solo lleva el texto.** Decisión
 *    del profesor de Matemáticas tras el pase en pizarra: con el enunciado
 *    entero más el dibujo, la columna derecha no cabía y competía por el
 *    espacio con la izquierda. `derecha.total` se sigue calculando y se sigue
 *    comprobando aquí, porque es el número que anuncia el texto, pero ya no se
 *    pinta; el dibujo queda solo en la columna que sitúa la cantidad.
 *
 * ## Cómo se dibuja una cantidad
 *
 * Una caja por cada cien, una caja por cada diez y las unidades sueltas: 347 son
 * tres cajas de cien, cuatro de diez y siete figuras. Es la representación de la
 * base decimal que se usa en la pizarra, y evita el problema contrario —dibujar
 * catorce veces una y otra— sin dejar de dibujar la cantidad entera.
 *
 * Las cajas llevan su rótulo porque una caja de cien no es cien veces una figura
 * suelta: es otro orden de unidad, y de eso va la actividad.
 */

/** Parejas por pantalla. El original lo fijaba en 4, por claridad en pizarra. */
export const PAREJAS_POR_PANTALLA = 4;

/**
 * Parejas por pantalla en `expert`.
 *
 * Bajado de 4 a 3 a petición del profesor de Matemáticas tras verlo en pizarra:
 * los enunciados de la descomposición C-D-U («Descomponer 457» / «4 C + 5 D + 7
 * U») no caben en la tarjeta cuando hay cuatro por pantalla. Los otros tres
 * niveles conservan 4, donde sí caben.
 */
export const PAREJAS_POR_PANTALLA_EXPERT = 3;

/** Cuántas parejas pinta una pantalla según la dificultad. */
export function parejasPorPantalla(difficulty: ActivityDifficulty): number {
  return difficulty === "expert" ? PAREJAS_POR_PANTALLA_EXPERT : PAREJAS_POR_PANTALLA;
}

/** Qué se dibuja y qué se declara, para una cantidad dada. */
export interface Representacion {
  /** Cajas de cien que se dibujan. De 0 a 9. */
  centenas: number;
  /** Cajas de diez que se dibujan. De 0 a 9. */
  decenas: number;
  /** Figuras sueltas, de 0 a 9. */
  unidades: number;
}

/**
 * Cómo se descompone una cantidad para dibujarla.
 *
 * Toda cantidad se dibuja entera, en los tres tramos de la base decimal, sin
 * declarar nada «en alto»: una caja por cien, una caja por diez y las unidades
 * sueltas. Antes las decenas que no cabían se agrupaban en una etiqueta del
 * tipo «+34 × 10», que es una cuenta, no una cantidad, y no se entendía.
 */
export function representacion(total: number): Representacion {
  return {
    centenas: Math.floor(total / 100),
    decenas: Math.floor(total / 10) % 10,
    unidades: total % 10,
  };
}

/** Una cantidad que aparece dibujada en una tarjeta. */
export interface CantidadVisual {
  /** La cantidad que representa, y que debe decir el texto de la tarjeta. */
  total: number;
  /** Rótulo de la cantidad, como «Grupo A». Solo si la tarjeta lleva varias. */
  rotulo?: string;
}

export interface RelacionarCantidadesPair {
  /** Id canónico para unir izquierda ↔ derecha. */
  id: number;
  leftText: string;
  rightText: string;
  /** Cantidades de la tarjeta izquierda. Dos en el nivel de grupos. */
  izquierda: CantidadVisual[];
  /** Cantidad de la tarjeta derecha: la que anuncia su propio texto. */
  derecha: CantidadVisual;
  imageUrl: string;
  objectLabel: string;
}

export interface RelacionarCantidadesRound {
  pairs: RelacionarCantidadesPair[];
  leftColumn: RelacionarCantidadesPair[];
  rightColumn: RelacionarCantidadesPair[];
}

// ── LCG determinista ──────────────────────────────────────────────────────────

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (min === max ? 1 : max - min + 1));
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Generación ────────────────────────────────────────────────────────────────

/** Componentes de una pareja que no dependen del azar: texto y cantidades. */
interface Contenido {
  leftText: string;
  rightText: string;
  izquierda: CantidadVisual[];
  derecha: CantidadVisual;
}

/** Complementos hasta 10. */
function easy(rng: () => number): Contenido {
  const a = randInt(rng, 2, 7);
  const objetivo = Math.min(a + randInt(rng, 1, 4), 10);
  const faltan = objetivo - a;
  return {
    leftText: `Tengo ${a}. Quiero ${objetivo}.`,
    rightText: `Faltan ${faltan}`,
    izquierda: [{ total: a }],
    derecha: { total: faltan },
  };
}

/** Añadir y quitar hasta 30. */
function medium(rng: () => number): Contenido {
  if (rng() > 0.5) {
    // Se sortea primero lo que se añade y luego lo que se tiene, para que la
    // suma nunca se pase de 30. El original tiraba la cantidad inicial y luego
    // recortaba el final con un `Math.min`, con lo que llegaba a escribir
    // «Tengo 25. Añado 10. Ahora tengo 30»: una suma falsa. Aquí el enunciado
    // siempre es verdad.
    const anado = randInt(rng, 2, 10);
    const tengo = randInt(rng, 5, 30 - anado);
    const ahora = tengo + anado;
    return {
      leftText: `Tengo ${tengo}. Añado ${anado}.`,
      rightText: `Ahora tengo ${ahora}`,
      izquierda: [{ total: tengo }],
      // La derecha dice «Ahora tengo N»: dibuja N, no lo que se añadió. Con lo
      // que hacía el original, esta tarjeta pintaba `anado` objetos debajo de un
      // texto que hablaba de `ahora`.
      derecha: { total: ahora },
    };
  }
  const tengo = randInt(rng, 12, 27);
  const quito = randInt(rng, 2, 10);
  const quedan = tengo - quito;
  return {
    leftText: `Tengo ${tengo}. Quito ${quito}.`,
    rightText: `Ahora quedan ${quedan}`,
    izquierda: [{ total: tengo }],
    derecha: { total: quedan },
  };
}

/** Problemas inversos y diferencias hasta 50. */
function hard(rng: () => number): Contenido {
  if (rng() > 0.5) {
    const tenia = randInt(rng, 25, 45);
    const quedan = randInt(rng, 5, 18);
    const quitados = tenia - quedan;
    return {
      leftText: `Tenía ${tenia}. Quedan ${quedan}.`,
      rightText: `Se han quitado ${quitados}`,
      izquierda: [{ total: tenia }],
      derecha: { total: quitados },
    };
  }
  const grupoA = randInt(rng, 20, 45);
  const grupoB = randInt(rng, 5, 20);
  const diferencia = grupoA - grupoB;
  return {
    leftText: `Grupo A: ${grupoA} · Grupo B: ${grupoB}`,
    rightText: `Diferencia = ${diferencia}`,
    // Las dos cantidades de la izquierda, que el original no dibujaba.
    izquierda: [
      { total: grupoA, rotulo: "Grupo A" },
      { total: grupoB, rotulo: "Grupo B" },
    ],
    derecha: { total: diferencia },
  };
}

/** Descomposición posicional C-D-U. */
function expert(rng: () => number): Contenido {
  if (rng() > 0.4) {
    const c = randInt(rng, 1, 9);
    const d = randInt(rng, 0, 9);
    const u = randInt(rng, 0, 9);
    return {
      leftText: `Descomponer ${c * 100 + d * 10 + u}`,
      rightText: `${c} C + ${d} D + ${u} U`,
      izquierda: [{ total: c * 100 + d * 10 + u }],
      derecha: { total: u },
    };
  }
  const d = randInt(rng, 1, 9);
  const u = randInt(rng, 0, 9);
  return {
    leftText: `Descomponer ${d * 10 + u}`,
    rightText: `${d} D + ${u} U`,
    izquierda: [{ total: d * 10 + u }],
    derecha: { total: u },
  };
}

const GENERADORES: Record<ActivityDifficulty, (rng: () => number) => Contenido> = {
  easy,
  medium,
  hard,
  expert,
};

/**
 * Genera una pantalla de parejas.
 *
 * Todas las parejas de la pantalla comparten imagen, como en el original: es lo
 * que hace que la actividad se lea como «la misma cosa, contada de otra forma».
 */
export function generateRound(
  difficulty: ActivityDifficulty,
  rng: () => number,
): RelacionarCantidadesRound {
  const cat = pickCategory(rng);
  const imageUrl = pickImage(cat, rng);
  const generar = GENERADORES[difficulty];

  const pairs: RelacionarCantidadesPair[] = [];
  const targetLength = parejasPorPantalla(difficulty);
  const seenLeft = new Set<string>();
  const seenRight = new Set<string>();
  let attempts = 0;

  while (pairs.length < targetLength) {
    const pairData = generar(rng);
    const isUnique = !seenLeft.has(pairData.leftText) && !seenRight.has(pairData.rightText);

    // Si la pareja es única la aceptamos. Si llevamos muchos intentos fallidos,
    // es que nos hemos quedado sin combinaciones posibles: la aceptamos igual
    // para no colgar el juego en un bucle infinito.
    if (isUnique || attempts > 50) {
      seenLeft.add(pairData.leftText);
      seenRight.add(pairData.rightText);
      pairs.push({ id: pairs.length, ...pairData, imageUrl, objectLabel: cat.name });
      attempts = 0;
    } else {
      attempts++;
    }
  }

  // Barajadas por separado: si compartieran orden, unir sería mirar a la misma
  // altura y no habría nada que emparejar.
  return {
    pairs,
    leftColumn: shuffle(pairs, rng),
    rightColumn: shuffle(pairs, rng),
  };
}

/** Genera las pantallas de la sesión. */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
  totalRounds = 5,
): RelacionarCantidadesRound[] {
  const rng = lcg(seed);
  return Array.from({ length: totalRounds }, () => generateRound(difficulty, rng));
}

/** Si las dos tarjetas que se han tocado forman una unión correcta. */
export function isCorrectPair(
  left: RelacionarCantidadesPair,
  right: RelacionarCantidadesPair,
): boolean {
  return left.id === right.id;
}

/** Cuántas figuras tiene una cantidad, contando las de las cajas. */
export function figurasDe(representacion: Representacion): number {
  return representacion.centenas * 100 + representacion.decenas * 10 + representacion.unidades;
}
