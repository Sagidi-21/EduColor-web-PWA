import type { ActivityDifficulty } from "../content/contracts";

/**
 * `monedasBilletes` — reconocer el dinero y pagar.
 *
 * Motor puro y determinista, extraído de
 * `electron-reference/Colegio/src/renderer/src/core/engines/monedasBilletes/engine.ts`
 * y de su `shared/utils/moneyImages`. Los cuatro tipos de ejercicio, las ocho
 * monedas, los cuatro billetes y los diez productos son los del original.
 *
 * Las imágenes no se resuelven aquí: el motor declara el fichero y el feature
 * las busca con `import.meta.glob`, igual que `elKilo` con `kiloImages`.
 *
 * Divergencias respecto a Electron, todas deliberadas:
 *
 * 1. **La barra sin datos es el caso de `change`: nunca se paga el precio
 *    exacto.** El original redondeaba el pago hacia arriba y, si ya caía en un
 *    múltiplo, a veces no le sumaba nada más: `Math.ceil(5 / 50) * 50` da 50, y
 *    con el precio del caramelo el pago salía 50 = precio, con lo que la
 *    respuesta era 0 céntimos y los distractores solo podían ser positivos.
 *    Aquí el pago siempre es mayor que el precio, así que el cambio es siempre
 *    un número por el que vale la pena calcular.
 * 2. **El ejercicio de la vuelta dice con qué dinero se paga.** El original
 *    escribía «Pagas: 1,50€” en texto y no enseñaba ninguna moneda, con lo que
 *    la pregunta «¿cuánto cambio recibes?» no tenía el dato a la vista. Ahora el
 *    ejercicio lleva las piezas de ese pago, descompuestas con `descomponer()`,
 *    que es justo lo que se ve al pagar en un mostrador.
 * 3. **El tipo del nivel difícil se alterna, no se sortea.** Con el
 *    `rng() < 0.5` del original una sesión podía salir de diez ejercicios de
 *    equivalencia, sin uno solo de cambio, o al revés. Mismo criterio que
 *    `multiplicacion`, `dobleYMitad` y `graficoBarras`.
 * 4. **El nivel fácil no repite la misma moneda seguida.** El original no
 *    deduplicaba nada en `easy` ni en `medium`, así que la misma moneda podía
 *    salir dos veces en una fila. Ahora se reparte desde una baraja que se
 *    agota antes de volver a mezclar, con lo que un nivel fácil trae las ocho
 *    monedas distintas y solo repite alguna si la hoja de diez no cabe.
 * 5. **Los ejercicios que no llegan a cuatro opciones se descartan.** Los bucles
 *    `while` del original tenían tope de intentos y, si no bastaba, emparejaban
 *    el ejercicio con dos opciones sin avisar.
 * 6. **Barajado de Fisher-Yates** en lugar de `sort(() => rng() - 0.5)`, que no
 *    baraja.
 *
 * La etiqueta con el valor debajo de cada moneda del ejercicio de equivalencia
 * no la quita este módulo sino la pantalla: con ella debajo, sumar era leer.
 */

/** Ejercicios por sesión, el mismo número en las cuatro dificultades. */
export const SESSION_SIZE = 10;

/** Intentos antes de darse por vencido, para no colgarse con los bucles. */
const MAX_TRIES = 300;

/** Cuántas opciones se ofrecen siempre. */
const OPCIONES = 4;

/** Tope de piezas al descomponer, por si alguien pidiera un importe absurdo. */
const MAX_PIEZAS = 20;

// ── Dinero ────────────────────────────────────────────────────────────────────

/** Una moneda o un billete. */
export interface MoneyItem {
  /** Valor en céntimos: 1 céntimo es 1 y 1 euro es 100. */
  valor: number;
  /** Nombre largo, para el texto alternativo de la imagen. */
  etiqueta: string;
  /** Como se escribe en las opciones: «50c», «2€». */
  corta: string;
  tipo: TipoDinero;
  /** Fichero del asset, sin carpeta. La carpeta la deduce el feature. */
  fichero: string;
}

export type TipoDinero = "moneda" | "billete";

/**
 * Formatea céntimos como los escribe el original.
 *
 * 5 → «5c» · 100 → «1€» · 150 → «1,50€» · 5000 → «50€».
 */
export function formatearCentes(centimos: number): string {
  if (centimos < 100) return `${centimos}c`;
  if (centimos % 100 === 0) return `${centimos / 100}€`;
  const euros = Math.floor(centimos / 100);
  return `${euros},${String(centimos % 100).padStart(2, "0")}€`;
}

/** Las ocho monedas de euro, de menor a mayor. */
export const MONEDAS: readonly MoneyItem[] = [
  { valor: 1, etiqueta: "1 céntimo", corta: "1c", tipo: "moneda", fichero: "1cent.png" },
  { valor: 2, etiqueta: "2 céntimos", corta: "2c", tipo: "moneda", fichero: "2cent.png" },
  { valor: 5, etiqueta: "5 céntimos", corta: "5c", tipo: "moneda", fichero: "5cent.png" },
  { valor: 10, etiqueta: "10 céntimos", corta: "10c", tipo: "moneda", fichero: "10cent.png" },
  { valor: 20, etiqueta: "20 céntimos", corta: "20c", tipo: "moneda", fichero: "20cent.png" },
  { valor: 50, etiqueta: "50 céntimos", corta: "50c", tipo: "moneda", fichero: "50cent.png" },
  { valor: 100, etiqueta: "1 euro", corta: "1€", tipo: "moneda", fichero: "1euro.png" },
  { valor: 200, etiqueta: "2 euros", corta: "2€", tipo: "moneda", fichero: "2euro.png" },
];

/**
 * Los cuatro billetes de 5 a 50 euros.
 *
 * En `src/assets/dinero/billetes/` hay también los de 100 € y 200 €, y no se
 * usan: son demasiado para el curso y el original ya los excluía.
 */
export const BILLETES: readonly MoneyItem[] = [
  { valor: 500, etiqueta: "5 euros", corta: "5€", tipo: "billete", fichero: "5euros.png" },
  { valor: 1000, etiqueta: "10 euros", corta: "10€", tipo: "billete", fichero: "10euros.png" },
  { valor: 2000, etiqueta: "20 euros", corta: "20€", tipo: "billete", fichero: "20euros.png" },
  { valor: 5000, etiqueta: "50 euros", corta: "50€", tipo: "billete", fichero: "50euros.png" },
];

/** Todo el dinero del curso, de menor a mayor. */
export const TODO_EL_DINERO: readonly MoneyItem[] = [...MONEDAS, ...BILLETES].sort(
  (a, b) => a.valor - b.valor,
);

/**
 * Descompone un importe en las piezas más grandes posibles.
 *
 * Es el cambio de un cajero: se agarra lo más grande que haya, y como la moneda
 * de 1 céntimo está siempre, el resultado es exacto. Devuelve las piezas, sin
 * el importe: la suma de sus valores es el importe.
 */
export function descomponer(centimos: number): MoneyItem[] {
  const piezas: MoneyItem[] = [];
  let resto = centimos;
  for (const pieza of [...TODO_EL_DINERO].reverse()) {
    while (resto >= pieza.valor && piezas.length < MAX_PIEZAS) {
      piezas.push(pieza);
      resto -= pieza.valor;
    }
  }
  return piezas;
}

// ── Productos ─────────────────────────────────────────────────────────────────

export interface Producto {
  emoji: string;
  nombre: string;
  /** Precio en céntimos. */
  precio: number;
}

export const PRODUCTOS: readonly Producto[] = [
  { emoji: "🍬", nombre: "Caramelo", precio: 5 },
  { emoji: "✏️", nombre: "Lápiz", precio: 20 },
  { emoji: "🎈", nombre: "Globo", precio: 30 },
  { emoji: "🍌", nombre: "Plátano", precio: 25 },
  { emoji: "🍎", nombre: "Manzana", precio: 40 },
  { emoji: "🥤", nombre: "Zumo", precio: 75 },
  { emoji: "🍫", nombre: "Chocolate", precio: 100 },
  { emoji: "🎨", nombre: "Pinturas", precio: 150 },
  { emoji: "📚", nombre: "Libro", precio: 200 },
  { emoji: "🎮", nombre: "Juguete", precio: 500 },
];

// ── Ejercicios ───────────────────────────────────────────────────────────────

export type MonedasType = "identify" | "equivalence" | "change" | "shopping";

/** Niveles fáciles y medios: cuánto vale esta moneda o este billete. */
export interface IdentifyExercise {
  type: "identify";
  item: MoneyItem;
  question: string;
  options: string[];
  answer: string;
}

/** Nivel difícil, mitad de la hoja: sumar dos a cuatro monedas. */
export interface EquivalenceExercise {
  type: "equivalence";
  /** Las monedas que hay que sumar. Sin su valor escrito debajo. */
  items: MoneyItem[];
  totalCents: number;
  question: string;
  options: string[];
  answer: string;
}

/** Nivel difícil, la otra mitad: el cambio de una compra. */
export interface ChangeExercise {
  type: "change";
  producto: Producto;
  precio: number;
  precioLabel: string;
  /** Las piezas que se entregan, que el niño ve en pantalla. */
  pagado: MoneyItem[];
  pagadoCents: number;
  pagadoLabel: string;
  cambioCents: number;
  question: string;
  options: string[];
  answer: string;
}

/** Nivel experto: pagar el precio exacto con el dinero disponible. */
export interface ShoppingExercise {
  type: "shopping";
  producto: Producto;
  precio: number;
  precioLabel: string;
  disponibles: MoneyItem[];
}

export type MonedasExercise =
  IdentifyExercise | EquivalenceExercise | ChangeExercise | ShoppingExercise;

/** Los tres tipos que se contestan eligiendo una opción. */
export type MonedasChoiceExercise = IdentifyExercise | EquivalenceExercise | ChangeExercise;

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
 * Baraja de la que se reparte sin repetir hasta agotarla.
 *
 * `easy` tiene ocho monedas para diez ejercicios: no se puede no repetir, pero
 * sí se puede no repetir dos seguidas, que es lo que se ve en pantalla.
 */
function crearBaraja<T>(items: readonly T[]) {
  let pila: T[] = [];
  return {
    sacar(rng: () => number, evitar?: T): T {
      if (pila.length === 0) pila = shuffle(items, rng);
      const primera = pila.shift()!;
      if (evitar !== undefined && primera === evitar && pila.length > 0) {
        pila.push(primera);
        return pila.shift()!;
      }
      return primera;
    },
  };
}

// ── Generación ────────────────────────────────────────────────────────────────

/** Cuatro etiquetas: la correcta y tres del mismo fondo, barajadas. */
function opcionesEtiqueta(rng: () => number, correcta: string, otras: readonly string[]): string[] {
  const distractores = shuffle(
    otras.filter((o) => o !== correcta),
    rng,
  ).slice(0, OPCIONES - 1);
  return shuffle([correcta, ...distractores], rng);
}

/**
 * Cuatro importes: el correcto y tres más o menos un salto del catálogo.
 *
 * Los saltos son los mismos del original: céntimos sueltos para la vuelta y
 * saltos mayores en la equivalencia.
 */
function opcionesImporte(
  rng: () => number,
  centimos: number,
  saltos: readonly number[],
): string[] | null {
  const correctas = new Set([formatearCentes(centimos)]);
  for (let intento = 0; correctas.size < OPCIONES && intento < MAX_TRIES; intento++) {
    const salto = saltos[randInt(rng, 0, saltos.length - 1)]! * (rng() > 0.5 ? 1 : -1);
    const otro = centimos + salto;
    if (otro > 0) correctas.add(formatearCentes(otro));
  }
  // Menos de cuatro: no se ofrece, que un ejercicio con dos opciones se contesta
  // probando y no pensando.
  if (correctas.size < OPCIONES) return null;
  return shuffle(Array.from(correctas), rng);
}

/** Niveles fáciles y medios. */
function generarIdentificar(pool: readonly MoneyItem[], rng: () => number): IdentifyExercise[] {
  const baraja = crearBaraja(pool);
  const out: IdentifyExercise[] = [];
  let anterior: MoneyItem | undefined;

  while (out.length < SESSION_SIZE) {
    const item = baraja.sacar(rng, anterior);
    anterior = item;
    out.push({
      type: "identify",
      item,
      question: item.tipo === "moneda" ? "¿Cuánto vale esta moneda?" : "¿Cuánto vale este billete?",
      options: opcionesEtiqueta(
        rng,
        item.corta,
        pool.map((p) => p.corta),
      ),
      answer: item.corta,
    });
  }

  return out;
}

/** Cuántas monedas se suman, del 2 al 4 como en el original. */
const SALTOS_EQUIVALENCIA = [1, 2, 5, 10, 20, 50] as const;
/** Céntimos de la vuelta: saltos más finos, que es lo que se devuelve. */
const SALTOS_CAMBIO = [5, 10, 20, 50] as const;

/** Nivel difícil: la hoja alterna equivalencia y cambio. */
function generarDificil(rng: () => number): MonedasChoiceExercise[] {
  const usadas = new Set<string>();
  const out: MonedasChoiceExercise[] = [];
  let intentos = 0;

  while (out.length < SESSION_SIZE && intentos < MAX_TRIES) {
    intentos++;
    // El tipo gira con el índice: así la hoja trae de los dos.
    const tipo = out.length % 2 === 0 ? "equivalence" : "change";

    if (tipo === "equivalence") {
      const items: MoneyItem[] = [];
      for (let i = 0; i < randInt(rng, 2, 4); i++) {
        items.push(MONEDAS[randInt(rng, 0, MONEDAS.length - 1)]!);
      }
      const totalCents = items.reduce((suma, m) => suma + m.valor, 0);
      const clave = `equivalence-${totalCents}-${items
        .map((i) => i.valor)
        .sort((a, b) => a - b)
        .join("_")}`;
      if (usadas.has(clave)) continue;

      const options = opcionesImporte(rng, totalCents, SALTOS_EQUIVALENCIA);
      if (!options) continue;
      usadas.add(clave);

      out.push({
        type: "equivalence",
        items,
        totalCents,
        question: "¿Cuánto dinero hay en total?",
        options,
        answer: formatearCentes(totalCents),
      });
      continue;
    }

    const producto = PRODUCTOS[randInt(rng, 0, PRODUCTOS.length - 1)]!;
    const clave = `change-${producto.nombre}`;
    if (usadas.has(clave)) continue;

    // Pago redondeado hacia arriba, como en el original: pagar 1,02€ con un
    // billete de 5€ es más fácil de leer que con 1€ y 2 céntimos.
    const paso =
      producto.precio <= 50
        ? 50
        : producto.precio <= 100
          ? 100
          : producto.precio <= 200
            ? 200
            : 500;
    let pagado = Math.ceil(producto.precio / paso) * paso + (rng() > 0.5 ? paso : 0);
    // El original se quedaba a veces con un pago igual al precio, y entonces la
    // respuesta era 0 céntimos. Aquí el pago siempre es mayor.
    if (pagado <= producto.precio) pagado += paso;

    const cambioCents = pagado - producto.precio;
    const options = opcionesImporte(rng, cambioCents, SALTOS_CAMBIO);
    if (!options) continue;
    usadas.add(clave);

    out.push({
      type: "change",
      producto,
      precio: producto.precio,
      precioLabel: formatearCentes(producto.precio),
      pagado: descomponer(pagado),
      pagadoCents: pagado,
      pagadoLabel: formatearCentes(pagado),
      cambioCents,
      question: `Pagas con ${formatearCentes(pagado)}. ¿Cuánto cambio recibes?`,
      options,
      answer: formatearCentes(cambioCents),
    });
  }

  return out;
}

/**
 * Nivel experto: una compra por producto, con el dinero que se puede usar.
 *
 * Los disponibles son los que caben en dos veces el precio, como en el original:
 * es lo que hace que la tarea sea pagar y no inventar un importe.
 */
function generarCompras(rng: () => number): ShoppingExercise[] {
  return shuffle(PRODUCTOS, rng).map((producto) => ({
    type: "shopping" as const,
    producto,
    precio: producto.precio,
    precioLabel: formatearCentes(producto.precio),
    disponibles: TODO_EL_DINERO.filter((m) => m.valor <= producto.precio * 2 && m.valor <= 2000),
  }));
}

export function generateSession(difficulty: ActivityDifficulty, seed = 42): MonedasExercise[] {
  const rng = lcg(seed);
  switch (difficulty) {
    case "easy":
      return generarIdentificar(MONEDAS, rng);
    case "medium":
      return generarIdentificar(TODO_EL_DINERO, rng);
    case "hard":
      return generarDificil(rng);
    default:
      return generarCompras(rng);
  }
}

export function validateAnswer(exercise: MonedasChoiceExercise, answer: string): boolean {
  return answer === exercise.answer;
}

/** Si lo que lleva puesto en la cesta paga el precio exacto. */
export function pagoExacto(exercise: ShoppingExercise, totalCents: number): boolean {
  return totalCents === exercise.precio;
}

/** Total de lo que hay en la cesta. */
export function totalCesta(piezas: readonly MoneyItem[]): number {
  return piezas.reduce((suma, m) => suma + m.valor, 0);
}
