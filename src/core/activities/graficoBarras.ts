import type { ActivityDifficulty } from "../content/contracts";

/**
 * `graficoBarras` — leer e interpretar gráficos de barras.
 *
 * Motor puro y determinista, extraído de
 * `electron-reference/Colegio/src/renderer/src/core/engines/graficoBarras/engine.ts`.
 * Los cuatro temas, los cinco tipos de pregunta y los rangos de las cuatro
 * dificultades son los del original.
 *
 * Divergencias respecto a Electron, todas deliberadas:
 *
 * 1. **El plural del enunciado se declara, no se deduce del título.** El original
 *    armaba la pregunta con `title.toLowerCase().replace("s favoritos", "").replace(
 *    " favoritas", "")`, una sustitución pensada para «Animales favoritos» y que con
 *    «Frutas preferidas» no quitaba nada: la pregunta salía «¿Qué frutas preferidas
 *    tiene MÁS votos?». Ahora cada tema declara su sustantivo en singular y la
 *    pregunta se arma con él: «¿Qué fruta tiene MÁS votos?».
 * 2. **La escala es la del nivel, no la del ejercicio.** El original calculaba
 *    `maxVal = Math.max(...bars)` en el renderer y redibujaba el eje en cada
 *    ejercicio, así que una barra que llenaba el gráfico en una pantalla se
 *    quedaba a medias en la siguiente. Aquí la escala la declara la dificultad y
 *    viaja en el ejercicio (`escalaMax`), de modo que el niño puede aprender que en
 *    este nivel la barra más alta siempre es la misma.
 * 3. **La barra con los datos faltantes conserva su altura.** Es lo que hace
 *    falta para poder contestarla: si el hueco se dibujara vacío, la pregunta
 *    «¿cuántos votos tiene?» no tendría respuesta. Lo que se oculta es el número
 *    escrito encima, y se lee de la altura contra el eje, que es justamente la
 *    habilidad de la actividad. El enunciado lo dice para que no parezca un
 *    descuido.
 * 4. **«Cuántos votos más tiene A que B» se ordena con A mayor.** El original
 *    sortea los dos índices, calcula `Math.abs(a - b)` y lo formula como
 *    «más», con lo que si el primero tenía menos la frase era falsa. Ahora el
 *    enunciado se monta con la barra más alta primero, así que siempre es verdad.
 * 5. **El tipo de pregunta se alterna de forma determinista** en vez de
 *    sortearse, con el mismo criterio que `multiplicacion`, `dobleYMitad` y
 *    `parImpar`: con el sorteo una sesión podía salir sin un solo `fill_bar`, que
 *    es el tipo que da nombre a la actividad.
 * 6. **Barajado de Fisher-Yates.** El original usaba `sort(() => rng() - 0.5)`
 *    para elegir los elementos del gráfico y para ordenar las opciones, y eso no
 *    baraja: con cinco elementos el resultado conserva buena parte del orden
 *    original, con lo que el gráfico salía casi siempre en el orden del tema.
 * 7. **Todo lo que se sortea lleva tope de intentos.** Los bucles `while` sin
 *    límite del original se colgaban si la ventana de valores no daba tres
 *    distractores distintos.
 *
 * ## Sobre el número escrito encima de cada barra
 *
 * El original lo escribe siempre, y aquí se mantiene. Es un andamiaje para 1.º: en
 * `read_value` el niño contrasta la altura con el número, y en `find_max`,
 * `find_min` y `compare` el número hace de apoyo. Quitarlo sería un rediseño de
 * la actividad —entonces «leer el valor» sería de verdad leer la barra— y no una
 * corrección, así que queda anotado en el inventario como decisión del profesor
 * pendiente, no aplicado aquí.
 */

/** Qué se le pregunta al gráfico. */
export type GraficoType = "read_value" | "find_max" | "find_min" | "compare" | "fill_bar";

/** Una barra del gráfico. */
export interface Barra {
  etiqueta: string;
  emoji: string;
  valor: number;
}

export interface GraficoBarrasExercise {
  type: GraficoType;
  /** Título del gráfico, como «Frutas preferidas». */
  titulo: string;
  bars: Barra[];
  question: string;
  /**
   * Las opciones, en el orden en que se pintan.
   *
   * Son cadenas porque la respuesta no siempre es un número: en `find_max` y
   * `find_min` es la etiqueta de la barra, y en los demás tipos es el número
   * exacto tal y como se escribe. El renderer las pinta tal cual.
   */
  options: string[];
  correctAnswer: string;
  /** Índice de la barra sin datos. Solo en `fill_bar`. */
  blankBarIndex?: number;
  /** Tope de la escala del eje vertical: el del nivel, no el del ejercicio. */
  escalaMax: number;
  /** Marcas del eje vertical, de menor a mayor. */
  marcas: number[];
}

/** Ejercicios por sesión, el mismo número en las cuatro dificultades. */
export const SESSION_SIZE = 10;

/** Intentos antes de darse por vencido. */
const MAX_TRIES = 300;

/** Cuántas opciones se ofrecen en las preguntas de número. */
const OPCIONES = 4;

// ── Temas ─────────────────────────────────────────────────────────────────────

interface Tema {
  /** Título del gráfico. */
  titulo: string;
  /**
   * Sustantivo en singular, para las preguntas de máximo y mínimo.
   *
   * Se declara aquí y no se deduce del título porque los cuatro títulos del
   * original no siguen la misma fórmula: «Animales favoritos» y «Deportes
   * favoritos» salen bien con las sustituciones del original, «Asignaturas
   * favoritas» también, y «Frutas preferidas» no salía bien con ninguna.
   */
  singular: string;
  items: readonly { etiqueta: string; emoji: string }[];
}

const TEMAS: readonly Tema[] = [
  {
    titulo: "Animales favoritos",
    singular: "animal",
    items: [
      { etiqueta: "Perro", emoji: "🐶" },
      { etiqueta: "Gato", emoji: "🐱" },
      { etiqueta: "Conejo", emoji: "🐰" },
      { etiqueta: "Pez", emoji: "🐟" },
      { etiqueta: "Tortuga", emoji: "🐢" },
    ],
  },
  {
    titulo: "Frutas preferidas",
    singular: "fruta",
    items: [
      { etiqueta: "Manzana", emoji: "🍎" },
      { etiqueta: "Plátano", emoji: "🍌" },
      { etiqueta: "Naranja", emoji: "🍊" },
      { etiqueta: "Fresa", emoji: "🍓" },
      { etiqueta: "Uva", emoji: "🍇" },
    ],
  },
  {
    titulo: "Deportes favoritos",
    singular: "deporte",
    items: [
      { etiqueta: "Fútbol", emoji: "⚽" },
      { etiqueta: "Natación", emoji: "🏊" },
      { etiqueta: "Baloncesto", emoji: "🏀" },
      { etiqueta: "Tenis", emoji: "🎾" },
      { etiqueta: "Ciclismo", emoji: "🚲" },
    ],
  },
  {
    titulo: "Asignaturas favoritas",
    singular: "asignatura",
    items: [
      { etiqueta: "Mates", emoji: "🔢" },
      { etiqueta: "Lengua", emoji: "📝" },
      { etiqueta: "Ciencias", emoji: "🔬" },
      { etiqueta: "Plástica", emoji: "🎨" },
      { etiqueta: "Música", emoji: "🎵" },
    ],
  },
];

// ── Configuración por dificultad ───────────────────────────────────────────────

interface Config {
  /** Cuántas barras tiene el gráfico. */
  barras: number;
  /** Rango de los valores, y con él el tope de la escala. */
  rango: [number, number];
  /**
   * Tipos que se alternan, en orden.
   *
   * `expert` repite `compare` porque su descripción de nivel es la de las
   * comparaciones y las diferencias; con la lista del original `hard` y `expert`
   * eran exactamente el mismo nivel con dos nombres.
   */
  tipos: GraficoType[];
}

const CONFIG: Record<ActivityDifficulty, Config> = {
  easy: { barras: 3, rango: [1, 8], tipos: ["read_value", "find_max", "fill_bar"] },
  medium: { barras: 4, rango: [1, 12], tipos: ["read_value", "find_max", "find_min", "fill_bar"] },
  hard: {
    barras: 5,
    rango: [1, 15],
    tipos: ["read_value", "find_max", "find_min", "compare", "fill_bar"],
  },
  expert: {
    barras: 5,
    rango: [1, 15],
    tipos: ["compare", "read_value", "find_max", "find_min", "fill_bar", "compare"],
  },
};

/** Tope de la escala del eje vertical en cada dificultad. */
export const ESCALA_MAX: Record<ActivityDifficulty, number> = {
  easy: CONFIG.easy.rango[1],
  medium: CONFIG.medium.rango[1],
  hard: CONFIG.hard.rango[1],
  expert: CONFIG.expert.rango[1],
};

/**
 * Marcas del eje vertical para un tope dado, de menor a mayor.
 *
 * Se busca un divisor del tope para que las marcas sean números enteros y
 * régulièrement espaciadas: con 15 son 5, 10 y 15, y no 3,75, 7,5 y 11,25. Un
 * eje con marcas redondeadas no se puede leer, y esta actividad consiste
 * precisamente en leerlo.
 */
export function marcasEje(tope: number): number[] {
  const divisor = [4, 3, 5, 2].find((d) => tope % d === 0) ?? 4;
  const paso = tope / divisor;
  return Array.from({ length: divisor }, (_, i) => paso * (i + 1));
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

// ── Generación ────────────────────────────────────────────────────────────────

/** `n` valores distintos del rango, o menos si el rango no da para tantos. */
function valoresDistintos(rng: () => number, n: number, min: number, max: number): number[] {
  const vistos = new Set<number>();
  for (let intento = 0; vistos.size < n && intento < MAX_TRIES; intento++) {
    vistos.add(randInt(rng, min, max));
  }
  return shuffle([...vistos], rng);
}

/**
 * Cuatro opciones para una respuesta numérica: la correcta y tres distractores
 * del rango.
 *
 * Los distractores se sortean del rango completo, como en el original, con lo que
 * a veces coinciden con el valor de otra barra del gráfico: eso es bueno, porque
 * obligan a mirar la barra que se pregunta y no el número más grande que se ve.
 */
function opcionesNumericas(
  rng: () => number,
  correcta: number,
  min: number,
  max: number,
): string[] {
  const vistos = new Set<number>([correcta]);
  for (let intento = 0; vistos.size < OPCIONES && intento < MAX_TRIES; intento++) {
    vistos.add(randInt(rng, min, max));
  }
  return shuffle(Array.from(vistos), rng).map(String);
}

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): GraficoBarrasExercise[] {
  const rng = lcg(seed);
  const { barras: numBarras, rango, tipos } = CONFIG[difficulty];
  const escalaMax = rango[1];
  const marcas = marcasEje(escalaMax);

  const usadas = new Set<string>();
  const out: GraficoBarrasExercise[] = [];
  let intentos = 0;

  while (out.length < SESSION_SIZE && intentos < MAX_TRIES) {
    intentos++;

    // El tipo gira con el índice, como en `multiplicacion` y `dobleYMitad`.
    const type = tipos[out.length % tipos.length];

    const tema = TEMAS[Math.floor(rng() * TEMAS.length)]!;
    const elegidos = shuffle(tema.items, rng).slice(0, numBarras);
    const valores = valoresDistintos(rng, numBarras, rango[0], rango[1]);
    if (valores.length < numBarras) continue;

    const bars: Barra[] = elegidos.map((item, i) => ({
      etiqueta: item.etiqueta,
      emoji: item.emoji,
      valor: valores[i]!,
    }));

    let enunciado: string;
    let options: string[];
    let correctAnswer: string;
    let blankBarIndex: number | undefined;
    let clave: string;

    if (type === "read_value") {
      const objetivo = bars[Math.floor(rng() * bars.length)]!;
      enunciado = `¿Cuántos votos tiene «${objetivo.etiqueta}» ${objetivo.emoji}?`;
      correctAnswer = String(objetivo.valor);
      options = opcionesNumericas(rng, objetivo.valor, rango[0], rango[1]);
      clave = `${type}-${objetivo.etiqueta}`;
    } else if (type === "find_max" || type === "find_min") {
      const esMax = type === "find_max";
      const elegido = bars.reduce((a, b) => (b.valor > a.valor === esMax ? b : a));
      enunciado = `¿Qué ${tema.singular} tiene ${esMax ? "MÁS" : "MENOS"} votos?`;
      correctAnswer = elegido.etiqueta;
      // Los distractores son las otras barras del propio gráfico, que es lo que
      // hace la pregunta: se compara, no se busca un dato fuera del dibujo. En
      // `easy`, con solo tres barras, quedan dos y el ejercicio ofrece tres
      // opciones en vez de cuatro.
      const distractores = shuffle(
        bars.filter((b) => b !== elegido).map((b) => b.etiqueta),
        rng,
      ).slice(0, OPCIONES - 1);
      options = shuffle([correctAnswer, ...distractores], rng);
      clave = `${type}-${elegido.etiqueta}`;
    } else if (type === "compare") {
      const a = bars[Math.floor(rng() * bars.length)]!;
      const resto = bars.filter((b) => b !== a);
      const b = resto[Math.floor(rng() * resto.length)]!;
      // El enunciado se arma con la más alta primero: con `Math.abs` al revés la
      // frase «cuántos votos más tiene A que B» podía ser falsa.
      const [mayor, menor] = a.valor >= b.valor ? [a, b] : [b, a];
      enunciado = `¿Cuántos votos más tiene «${mayor.etiqueta}» ${mayor.emoji} que «${menor.etiqueta}» ${menor.emoji}?`;
      correctAnswer = String(mayor.valor - menor.valor);
      options = opcionesNumericas(rng, mayor.valor - menor.valor, rango[0], rango[1]);
      clave = `${type}-${mayor.etiqueta}-${menor.etiqueta}`;
    } else {
      blankBarIndex = Math.floor(rng() * bars.length);
      const objetivo = bars[blankBarIndex]!;
      enunciado = `Los datos de «${objetivo.etiqueta}» ${objetivo.emoji} faltan en el gráfico. ¿Cuántos votos tiene?`;
      correctAnswer = String(objetivo.valor);
      options = opcionesNumericas(rng, objetivo.valor, rango[0], rango[1]);
      clave = `${type}-${objetivo.etiqueta}`;
    }

    if (options.length < 2 || usadas.has(clave)) continue;
    usadas.add(clave);

    out.push({
      type,
      titulo: tema.titulo,
      bars,
      question: enunciado,
      options,
      correctAnswer,
      ...(blankBarIndex === undefined ? {} : { blankBarIndex }),
      escalaMax,
      marcas,
    });
  }

  return out;
}

export function validateAnswer(exercise: GraficoBarrasExercise, answer: string): boolean {
  return answer === exercise.correctAnswer;
}

/** Si el ejercicio es el que deja una barra sin datos. */
export function esBarraHueca(exercise: GraficoBarrasExercise, indice: number): boolean {
  return exercise.blankBarIndex === indice;
}
