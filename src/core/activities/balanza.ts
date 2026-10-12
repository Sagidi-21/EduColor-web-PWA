import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `balanza`: catálogo de objetos y sus pesos, generación de
 * ejercicios y validación.
 *
 * No importa React ni nada del navegador. El renderer dibuja la balanza con lo
 * que esto devuelve, y una hoja de ejercicios podrá hacerlo mismo más adelante.
 *
 * La balanza **se dibuja ya inclinada**, con el lado que pesa más abajo, igual
 * que en Electron. Es decisión pedagógica y no un descuido: ver cómo cae el
 * plato es justamente lo que enseña qué es una balanza, y las preguntas van
 * sobre el peso de los objetos, no sobre deducir una inclinación oculta. Por eso
 * `tilt` es un dato de dibujo y no la respuesta que hay que adivinar.
 *
 * Divergencias respecto al motor de Electron
 * (`electron-reference/.../engines/balanza/engine.ts`), todas deliberadas:
 *
 * 1. `easy` re-elegía el segundo objeto con un `while` sin condición de salida
 *    distinta del azar: si ningún objeto distaba 1 kg o más del primero elegido,
 *    seguía muestreando hasta agotar los 300 intentos. Aquí los candidatos se
 *    enumeran, así que la sesión siempre se llena y nunca depende de la
 *    tirada.
 * 2. La clave de deduplicación de `easy` no incluía si se preguntaba "más" o
 *    "menos", de modo que las dos preguntas sobre la misma pareja eran la misma
 *    clave y una se perdía siempre. Aquí cada candidato distinto tiene su sitio.
 * 3. El enunciado de `medium` terminaba en "El grupo IZQUIERDO...", sin
 *    terminar la frase. Se escribe completo y nombra los dos grupos.
 * 4. `hard` usaba los mismos valores `more_than_1kg` / `less_than_1kg` /
 *    `exactly_1kg` cuando la referencia era ½ kg o ¼ kg, y el renderer rotulaba
 *    cada bloque de la derecha dividiendo el peso total entre el número de
 *    bloques, lo que imprimía "1 kg" repetido y tapaba que la comparación era
 *    contra el total. Aquí la referencia tiene etiqueta propia y se escribe
 *    una vez.
 * 5. `expert` de tipo peso pintaba `+N kg` a la izquierda *y* N bloques de peso
 *    a la derecha, cuando la pregunta es justamente cuántos kilos hay a la
 *    derecha. Aquí la izquierda dibuja sandía + N pesas 🧱 y la derecha queda
 *    vacía (sin revelar la respuesta).
 * 6. El catálogo no declaraba la unidad de peso: el elefante valía 5000 y la
 *    hoja 0.005 en la misma escala, sin decir si eran gramos o kilos. Aquí
 *    `weightGrams` deja la unidad explícita, con pesos que un niño puede ordenar
 *    de un vistazo.
 */

/** Qué se compara en el ejercicio y, por tanto, qué se responde. */
export type BalanzaExerciseType =
  /** Dos objetos sueltos: cuál pesa más o menos. */
  | "direct"
  /** El mismo objeto repetido en los dos platos. */
  | "scale"
  /** Un grupo frente a una pesa de referencia de ¼ kg a 3 kg. */
  | "kilo"
  /** Equivalencias y suma de pesos: se responde con un número. */
  | "balance_math";

/**
 * Inclinación real de la balanza, tal y como se dibuja desde el principio.
 *
 * Es un dato de dibujo, no la respuesta: el enunciado pregunta por el peso de
 * los objetos o por una cantidad, nunca por la inclinación.
 */
export type BalanzaTilt = "left" | "right" | "equal";

export interface WeightItem {
  id: string;
  emoji: string;
  /** Nombre en masculino, para poder decir "el" o "la" según `gender`. */
  name: string;
  gender: "m" | "f";
  /**
   * Plural en masculino.
   *
   * Va declarado en vez de calcularse con una `s` porque el español no lo
   * permite: "biciclettas" o "elefantes", no "bicicicletas" ni "elefantes".
   */
  plural: string;
  /** Peso en gramos. Siempre en múltiplos de 10 g para que las comparaciones salgan limpias. */
  weightGrams: number;
}

/** Un lado de la balanza. */
export interface BalanzaPlate {
  /** Objeto que se repite en el plato. Sin objetos cuando solo hay pesas. */
  emoji: string;
  /** Cuántas unidades de `emoji` hay. 0 cuando el plato está vacío. */
  count: number;
  /**
   * Etiqueta bajo el objeto principal (p. ej. «5 kg» de la sandía, o «1 kg»
   * de una pesa de referencia en hard).
   */
  weightLabel: string | null;
  /**
   * Bloques de 1 kg (🧱) dibujados junto al objeto.
   * Expert/peso: sandía (con su kg) + N pesas (con el total de pesas).
   */
  weightBlocks?: number;
  /** Etiqueta bajo las pesas 🧱 (p. ej. «2 kg»). */
  weightBlocksLabel?: string | null;
  /** Plato cuya cantidad hay que deducir: bandeja vacía (sin revelar la respuesta). */
  unknown: boolean;
}

export interface BalanzaOption {
  label: string;
  value: string;
}

export interface BalanzaExercise {
  type: BalanzaExerciseType;
  question: string;
  left: BalanzaPlate;
  right: BalanzaPlate;
  /** Peso total de cada lado, en gramos. Sin significado en las equivalencias. */
  leftTotalGrams: number;
  rightTotalGrams: number;
  tilt: BalanzaTilt;
  correctAnswer: string;
  options: BalanzaOption[];
  hint?: string;
}

export const WEIGHT_ITEMS: readonly WeightItem[] = [
  {
    id: "elefante",
    emoji: "🐘",
    name: "elefante",
    gender: "m",
    plural: "elefantes",
    weightGrams: 5000,
  },
  { id: "coche", emoji: "🚗", name: "coche", gender: "m", plural: "coches", weightGrams: 1200 },
  {
    id: "bicicleta",
    emoji: "🚲",
    name: "bicicleta",
    gender: "f",
    plural: "bicicletas",
    weightGrams: 150,
  },
  { id: "piedra", emoji: "🪨", name: "piedra", gender: "f", plural: "piedras", weightGrams: 300 },
  { id: "sandia", emoji: "🍉", name: "sandía", gender: "f", plural: "sandías", weightGrams: 250 },
  { id: "piña", emoji: "🍍", name: "piña", gender: "f", plural: "piñas", weightGrams: 150 },
  {
    id: "manzana",
    emoji: "🍎",
    name: "manzana",
    gender: "f",
    plural: "manzanas",
    weightGrams: 200,
  },
  {
    id: "platano",
    emoji: "🍌",
    name: "plátano",
    gender: "m",
    plural: "plátanos",
    weightGrams: 200,
  },
  { id: "libro", emoji: "📘", name: "libro", gender: "m", plural: "libros", weightGrams: 800 },
  {
    id: "perrito",
    emoji: "🐶",
    name: "perrito",
    gender: "m",
    plural: "perritos",
    weightGrams: 100,
  },
  { id: "raton", emoji: "🐭", name: "ratón", gender: "m", plural: "ratones", weightGrams: 10 },
  {
    id: "magdalena",
    emoji: "🧁",
    name: "magdalena",
    gender: "f",
    plural: "magdalenas",
    weightGrams: 80,
  },
];

/** Objetos de entre 100 g y 5 kg: los que se repiten en `medium`. */
const SCALE_ITEMS: readonly WeightItem[] = WEIGHT_ITEMS.filter(
  (item) => item.weightGrams >= 100 && item.weightGrams <= 5000,
);

/** Objetos de entre 50 g y 1 kg: los que se comparan con pesas en `hard`. */
const KILO_ITEMS: readonly WeightItem[] = WEIGHT_ITEMS.filter(
  (item) => item.weightGrams >= 50 && item.weightGrams <= 1000,
);

/** Pesas de referencia de `hard`, con su etiqueta ya escrita. */
const KILO_REFERENCES: readonly { grams: number; label: string }[] = [
  { grams: 250, label: "¼ kg" },
  { grams: 500, label: "½ kg" },
  { grams: 1000, label: "1 kg" },
  { grams: 2000, label: "2 kg" },
  { grams: 3000, label: "3 kg" },
];

const TILT_OPTIONS: readonly BalanzaOption[] = [
  { label: "Pesa MÁS el de la izquierda", value: "left" },
  { label: "Pesa MENOS el de la izquierda", value: "right" },
  { label: "Pesan IGUAL", value: "equal" },
];

/** Tope de ejercicios por sesión, el mismo que en el motor de Electron. */
export const SESSION_TARGET = 10;

/**
 * Tamaño real de sesión de cada dificultad.
 *
 * El original pedía 10 ejercicios en las cuatro y se quedaba corto cuando el
 * número de combinaciones distintas no llegaba, sin avisar: `expert` solo tiene
 * 6 candidatos. Aquí ese techo se declara, en vez de dejar que la semilla
 * decida cuánto dura la sesión.
 *
 * - `easy`: parejas de objetos que se diferencian en 1 kg o más, en ambos
 *   sentidos y preguntando por el más y por el menos.
 * - `medium`: un objeto repetido de 1 a 6 veces por lado, con un caso de
 *   "pesan igual" por objeto.
 * - `hard`: un grupo pequeño frente a una pesa de referencia.
 * - `expert`: 3 equivalencias de piña/plátano y 3 sumas de peso.
 */
export const SESSION_SIZE: Record<ActivityDifficulty, number> = {
  easy: 10,
  medium: 10,
  hard: 10,
  expert: 6,
};

// ── LCG determinista ────────────────────────────────────────────────────────
// Mismas constantes que el original de Electron: una semilla da la misma
// secuencia allí y aquí, que es lo que hace comparables los tests de grano.

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function articleOf(item: WeightItem): string {
  return item.gender === "m" ? `el ${item.name}` : `la ${item.name}`;
}

/** Artículo + nombre con mayúscula inicial (opciones MC de easy). */
function articleChoiceOf(item: WeightItem): string {
  const label = articleOf(item);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** `1 sandía` o `3 bicicletas`, en el género que corresponda al objeto. */
function nounOf(item: WeightItem, count: number): string {
  return count === 1 ? item.name : item.plural;
}

/** Plato con objetos y sin pesas de referencia. */
function plateOf(item: WeightItem, count: number): BalanzaPlate {
  return { emoji: item.emoji, count, weightLabel: null, unknown: false };
}

/**
 * `easy`: comparar dos objetos de pesos muy distintos.
 *
 * Se responde con el lado, no con el nombre del objeto: los dos están
 * dibujados en sus platos, así que al niño le basta con mirar cuál cae.
 */
function directExercise(left: WeightItem, right: WeightItem, asksMore: boolean): BalanzaExercise {
  const leftIsHeavier = left.weightGrams > right.weightGrams;
  const heavierSide = leftIsHeavier ? "left" : "right";
  return {
    type: "direct",
    question: asksMore
      ? `¿Qué pesa MÁS, ${articleOf(left)} o ${articleOf(right)}?`
      : `¿Qué pesa MENOS, ${articleOf(left)} o ${articleOf(right)}?`,
    left: plateOf(left, 1),
    right: plateOf(right, 1),
    leftTotalGrams: left.weightGrams,
    rightTotalGrams: right.weightGrams,
    tilt: heavierSide,
    // "Menos" es la cara contraria de "más": si lo más pesado está a la
    // izquierda, lo menos pesado está a la derecha.
    correctAnswer: asksMore ? heavierSide : heavierSide === "left" ? "right" : "left",
    options: [
      { label: articleChoiceOf(left), value: "left" },
      { label: articleChoiceOf(right), value: "right" },
    ],
    hint: "El plato que más baja es el que lleva el objeto más pesado.",
  };
}

/** `medium`: el mismo objeto repetido en los dos platos. */
function scaleExercise(item: WeightItem, countLeft: number, countRight: number): BalanzaExercise {
  const leftTotal = countLeft * item.weightGrams;
  const rightTotal = countRight * item.weightGrams;
  const tilt: BalanzaTilt =
    leftTotal > rightTotal ? "left" : leftTotal < rightTotal ? "right" : "equal";
  const mas = tilt === "left" ? countLeft : countRight;
  const menos = tilt === "left" ? countRight : countLeft;

  return {
    type: "scale",
    question: `Observa la balanza. ¿El grupo de la IZQUIERDA (${countLeft} ${nounOf(item, countLeft)} ${item.emoji}) pesa MÁS, MENOS o IGUAL que el de la DERECHA (${countRight} ${nounOf(item, countRight)} ${item.emoji})?`,
    left: plateOf(item, countLeft),
    right: plateOf(item, countRight),
    leftTotalGrams: leftTotal,
    rightTotalGrams: rightTotal,
    tilt,
    correctAnswer: tilt,
    options: [...TILT_OPTIONS],
    hint:
      tilt === "equal"
        ? `Hay el mismo número de ${item.plural} en los dos platos, así que pesan igual.`
        : `Pesa más el plato con ${mas} ${nounOf(item, mas)}, y pesa menos el que tiene ${menos}.`,
  };
}

/**
 * `hard`: comparar un grupo pequeño con una pesa de referencia.
 *
 * Las tres opciones se ofrecen siempre, y "igual" se decide comparando los
 * gramos en vez de suponer que la coincidencia es imposible: con 4 raciones de
 * 250 g y una pesa de 1 kg sí ocurre, y es justo el caso que enseña a usar la
 * balanza de verdad.
 */
function kiloExercise(
  item: WeightItem,
  count: number,
  reference: { grams: number; label: string },
): BalanzaExercise {
  const total = count * item.weightGrams;
  const tilt: BalanzaTilt =
    total > reference.grams ? "left" : total < reference.grams ? "right" : "equal";

  return {
    type: "kilo",
    question: `¿El grupo de la izquierda (${count} ${nounOf(item, count)} ${item.emoji}) pesa MÁS, MENOS o IGUAL que ${reference.label}?`,
    left: plateOf(item, count),
    right: { emoji: "🧱", count: 1, weightLabel: reference.label, unknown: false },
    leftTotalGrams: total,
    rightTotalGrams: reference.grams,
    tilt,
    correctAnswer: tilt === "left" ? "more" : tilt === "right" ? "less" : "equal",
    options: [
      { label: `Más que ${reference.label}`, value: "more" },
      { label: `Menos que ${reference.label}`, value: "less" },
      { label: `Igual que ${reference.label}`, value: "equal" },
    ],
    hint: `${count} ${nounOf(item, count)} ${item.emoji} pesan ${formatKg(total)}.`,
  };
}

/** `1250` g como `1,25 kg`, y `250` g como `¼ kg` cuando es una fracción de kilo. */
function formatKg(grams: number): string {
  const kilos = grams / 1000;
  if (kilos === 0.25) return "¼ kg";
  if (kilos === 0.5) return "½ kg";
  return `${Number.isInteger(kilos) ? kilos : kilos.toFixed(2).replace(".", ",")} kg`;
}

/**
 * Números alrededor del valor correcto, para las opciones de `expert`.
 *
 * Se construyen por distancia al correcto y nunca por muestreo: el original
 * podía entrar en un bucle sin salida si todos los números de su rango
 * coincidían con los ya elegidos.
 */
function numericOptions(correct: number, rng: () => number, suffix: string): BalanzaOption[] {
  const elegido = new Set<number>([correct]);
  for (let delta = 1; elegido.size < 4 && delta <= 8; delta++) {
    for (const candidato of [correct - delta, correct + delta]) {
      if (candidato >= 1) elegido.add(candidato);
      if (elegido.size >= 4) break;
    }
  }
  return shuffle([...elegido], rng)
    .sort((a, b) => a - b)
    .map((n) => ({ label: `${n} ${suffix}`, value: String(n) }));
}

/** `expert`/equivalencia: cuántas piezas hacen falta para equilibrar un grupo. */
function equivalenceExercise(piñas: number): BalanzaExercise {
  const plátanos = piñas * 3;
  return {
    type: "balance_math",
    question: `Si 1 piña 🍍 pesa igual que 3 plátanos 🍌, ¿cuántos plátanos necesitas para equilibrar ${piñas} ${piñas === 1 ? "piña" : "piñas"}?`,
    left: plateOf(PINA, piñas),
    right: { emoji: "🍌", count: 0, weightLabel: null, unknown: true },
    // Una equivalencia no se mide en gramos: `leftTotalGrams` y
    // `rightTotalGrams` guardan el recuento de piezas y `tilt` describe la
    // balanza que el enunciado ya declara equilibrada.
    leftTotalGrams: piñas,
    rightTotalGrams: plátanos,
    tilt: "equal",
    correctAnswer: String(plátanos),
    options: numericOptions(plátanos, makeRng(piñas), "plátanos"),
    hint: `1 piña son 3 plátanos, así que ${piñas} ${piñas === 1 ? "piña" : "piñas"} ${piñas === 1 ? "es" : "son"} ${plátanos} plátanos.`,
  };
}

/** `expert`/peso total: la sandía y las pesas de la izquierda suman la derecha. */
function weightMathExercise(extraKg: number): BalanzaExercise {
  const totalGrams = 5000 + extraKg * 1000;
  const totalKg = totalGrams / 1000;
  return {
    type: "balance_math",
    question: `La balanza está equilibrada. A la izquierda hay 1 sandía 🍉 (de 5 kg) y pesas de ${extraKg} kg. ¿Cuántos kg de peso hay a la derecha?`,
    // Sandía (5 kg) + N ladrillos con su total; derecha vacía (respuesta).
    left: {
      emoji: "🍉",
      count: 1,
      weightLabel: "5 kg",
      weightBlocks: extraKg,
      weightBlocksLabel: `${extraKg} kg`,
      unknown: false,
    },
    right: { emoji: "🧱", count: 0, weightLabel: null, unknown: true },
    leftTotalGrams: totalGrams,
    rightTotalGrams: totalGrams,
    tilt: "equal",
    correctAnswer: String(totalKg),
    options: numericOptions(totalKg, makeRng(extraKg), "kg"),
    hint: `La sandía pesa 5 kg y las pesas ${extraKg} kg: en total ${totalKg} kg.`,
  };
}

/** La piña y el plátano de las equivalencias, con los mismos pesos del catálogo. */
const PINA = WEIGHT_ITEMS.find((item) => item.id === "piña")!;

/** Un ejercicio candidato. Solo recibe el LCG si tiene algo que barajar. */
type Candidato = (rng: () => number) => BalanzaExercise;

/**
 * Candidatos de cada dificultad, en dos grupos.
 *
 * Se enumeran en lugar de muestrear con rechazo. El original repetía la tirada
 * hasta 300 veces esperando 10 claves distintas: si no llegaban, la sesión
 * salía corta sin decir nada, y en `easy` el `while` de re-elección del
 * segundo objeto no tenía otra condición de parada que el propio azar.
 *
 * `garantizados` entra siempre en la sesión, `libres` se baraja y se recorta.
 * El reparto existe porque "pesan igual" es el único caso que de verdad enseña
 * a usar una balanza, y dejándolo al azar sería opcional: en `hard` solo hay
 * tres combinaciones del catálogo que den exactamente 1 kg, así que en 10
 * ejercicios cabía, y en una muestra de 5 semillas y 50 ejercicios tampoco.
 * Un caso que puede no aparecer nunca no puede usarse como criterio.
 */
function candidatos(dificultad: ActivityDifficulty): {
  garantizados: Candidato[];
  libres: Candidato[];
} {
  switch (dificultad) {
    case "easy": {
      // En `easy` la diferencia de 1 kg o más impide que dos objetos pesen
      // igual, así que no hay caso de igualdad que garantizar.
      const out: Candidato[] = [];
      for (const a of WEIGHT_ITEMS) {
        for (const b of WEIGHT_ITEMS) {
          if (a.id === b.id) continue;
          // Por debajo de 1 kg de diferencia, comparar dos objetos de casi el
          // mismo peso no es un ejercicio de 1.º ni de 2.º.
          if (Math.abs(a.weightGrams - b.weightGrams) < 1000) continue;
          out.push(() => directExercise(a, b, true));
          out.push(() => directExercise(a, b, false));
        }
      }
      return { garantizados: [], libres: out };
    }
    case "medium": {
      const libres: Candidato[] = [];
      for (const item of SCALE_ITEMS) {
        for (let izquierda = 1; izquierda <= 6; izquierda++) {
          for (let derecha = 1; derecha <= 6; derecha++) {
            if (izquierda === derecha) continue;
            libres.push(() => scaleExercise(item, izquierda, derecha));
          }
        }
      }
      // Un único caso de igualdad garantizado: con 36 combinaciones por objeto
      // y 10 ejercicios, sin garantiza caería casi siempre alguno, pero "casi
      // siempre" no es una propiedad de la que se pueda depender.
      const garante = SCALE_ITEMS[0];
      return { garantizados: [() => scaleExercise(garante, 3, 3)], libres };
    }
    case "hard": {
      const libres: Candidato[] = [];
      for (const item of KILO_ITEMS) {
        for (let count = 1; count <= 4; count++) {
          for (const referencia of KILO_REFERENCES) {
            if (count * item.weightGrams === referencia.grams) continue;
            libres.push(() => kiloExercise(item, count, referencia));
          }
        }
      }
      // 4 raciones de 250 g contra la pesa de 1 kg: el único grupo del
      // catálogo que se equilibra justo con una pesa entera.
      const racion = WEIGHT_ITEMS.find((item) => item.id === "sandia")!;
      const kilo = KILO_REFERENCES.find((r) => r.grams === 1000)!;
      return { garantizados: [() => kiloExercise(racion, 4, kilo)], libres };
    }
    case "expert":
      return {
        garantizados: [
          () => equivalenceExercise(1),
          () => equivalenceExercise(2),
          () => equivalenceExercise(3),
          () => weightMathExercise(1),
          () => weightMathExercise(2),
          () => weightMathExercise(3),
        ],
        libres: [],
      };
  }
}

export function generateSession(difficulty: ActivityDifficulty, seed = 42): BalanzaExercise[] {
  const rng = makeRng(seed);
  const { garantizados, libres } = candidatos(difficulty);

  const huecos = Math.max(
    0,
    Math.min(SESSION_TARGET, garantizados.length + libres.length) - garantizados.length,
  );
  const orden = [...garantizados, ...shuffle(libres, rng).slice(0, huecos)];

  return orden.map((construye) => construye(rng));
}

export function validateAnswer(exercise: BalanzaExercise, answer: string): boolean {
  return String(exercise.correctAnswer) === answer;
}
