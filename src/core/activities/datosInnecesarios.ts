import type { ActivityDifficulty } from "../content/contracts";

/**
 * `datosInnecesarios` — leer un problema y tachar el dato que sobra.
 *
 * Motor puro y determinista, extraído de
 * `electron-reference/Colegio/src/renderer/src/core/engines/datosInnecesarios/engine.ts`.
 * Los cuarenta problemas —diez por dificultad— son los del original, y se
 * comprueban frase a frase en `datosInnecesarios.test.ts`: la frase marcada es
 * siempre la que no hace falta, y el resultado que declara el problema es el que
 * sale de las otras dos.
 *
 * ## Cómo se juega
 *
 * Cada problema son tres frases y una pregunta. La respuesta a la pregunta no se
 * escribe: la actividad es leer, calcular mentalmente y tachar la frase que no
 * hace falta para calcularla. Por eso la pregunta está en pantalla aunque no
 * haya dónde contestarla: es lo que da sentido a las tres frases, y sin ella no
 * se puede saber cuál sobra.
 *
 * Divergencias respecto a Electron, todas deliberadas:
 *
 * 1. **`solucion` viaja en el ejercicio.** No se pinta nunca; sirve para que un
 *    test pueda comprobar que los cuarenta problemas están bien escritos, que es
 *    la única forma de que un banco de textos escritos a mano no se desmonte sin
 *    que nadie se entere. Está en el mismo fichero que el enunciado para que una
 *    corrección de una frase venga acompañada de la de su resultado.
 * 2. **`generateSession` tiene semilla por defecto** (`42`), como el resto de los
 *    motores. El original la pedía obligatoria y su renderer le pasaba
 *    `Date.now() % 999983`, con lo que "Repetir" nunca daba la misma hoja.
 * 3. **La semilla de la hoja es estable.** Se fija una vez al montar y "Repetir"
 *    la reutiliza, con lo que repetir es volver a hacer la misma hoja y no una
 *    tirada nueva.
 *
 * Lo que se deja como estaba y queda anotado en el inventario como decisión
 * pendiente del profesor: la descripción de `easy` promises «un dato numérico
 * absurdo» y su banco tiene, en ocho de los diez problemas, una frase
 * descriptiva —«El techo es de color blanco»—, que es justo lo que el nivel
 * `medium` dice ofrecer. Como las descripciones de dificultad son lo que el
 * profesor ve para elegir nivel, un texto que miente en eso importa; pero
 * reescribir el banco de `easy` es cambiar contenido, no corregir un fallo, así
 * que no se ha hecho aquí.
 *
 * ## La frase sobrante no está siempre en el mismo sitio
 *
 * En `easy` del original, nueve de los diez problemas ponían la frase sobrante en
 * segunda posición. Eso convierte el nivel en «tacha siempre la segunda línea»
 * sin necesidad de leer, que es justo lo contrario de lo que la actividad
 * enseña. Aquí las tres posiciones se reparten de forma parecida en los cuatro
 * niveles. Es un cambio de orden, no de contenido: cada problema sigue teniendo
 * las mismas tres frases y contesta lo mismo, solo que la que sobra ya no está
 * siempre en el mismo sitio.
 */

/** Un problema de tres frases con una frase que sobra. */
export interface DatosInnecesariosExercise {
  /** Las tres frases, en orden. */
  historia: string[];
  /**
   * Índice de la frase que no hace falta para contestarla.
   *
   * Lo que se valida no es el resultado: es que el niño haya identificado bien
   * el dato sobrante, que es lo que la actividad enseña.
   */
  innecesario: number;
  /** La pregunta que da sentido a las frases. */
  pregunta: string;
  /**
   * Lo que contesta la pregunta. No se muestra nunca: está aquí para que los
   * tests puedan verificar el banco y para que la corrección de una frase
   * venga con la de su resultado.
   */
  solucion: string;
}

/** Problemas por hoja, uno por sesión: el banco entero, barajado. */
export const SESSION_SIZE = 10;

// ── El banco ──────────────────────────────────────────────────────────────────

/** `easy` — tres frases cortas y un dato que no interviene en la cuenta. */
const FACIL: DatosInnecesariosExercise[] = [
  {
    historia: [
      "El techo es de color blanco.",
      "En la clase hay 15 mesas.",
      "Traen 5 mesas nuevas.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas mesas hay ahora en total?",
    solucion: "20",
  },
  {
    historia: [
      "Tengo 8 cromos de animales.",
      "Mi hermano tiene 6 años.",
      "Me regalan 4 cromos más.",
    ],
    innecesario: 1,
    pregunta: "¿Cuántos cromos tengo ahora?",
    solucion: "12",
  },
  {
    historia: ["Luis compró 3 manzanas.", "Ayer llovió mucho.", "Luego compró 2 peras."],
    innecesario: 1,
    pregunta: "¿Cuántas frutas compró Luis en total?",
    solucion: "5",
  },
  {
    historia: ["En el árbol hay 6 pájaros.", "Llegan 4 pájaros más.", "El árbol es muy alto."],
    innecesario: 2,
    pregunta: "¿Cuántos pájaros hay en el árbol ahora?",
    solucion: "10",
  },
  {
    historia: [
      "Hay 5 lápices rojos en la caja.",
      "Mi mochila es de color azul.",
      "Hay 7 lápices azules también.",
    ],
    innecesario: 1,
    pregunta: "¿Cuántos lápices hay en total?",
    solucion: "12",
  },
  {
    historia: [
      "Tengo 9 canicas en el bolsillo.",
      "Pierdo 3 canicas jugando.",
      "El recreo es a las 11.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántas canicas me quedan?",
    solucion: "6",
  },
  {
    historia: [
      "El pastel es de fresa.",
      "Inflamos 8 globos para la fiesta.",
      "Inflamos 5 globos más.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántos globos hay en total?",
    solucion: "13",
  },
  {
    historia: ["En la pecera hay 7 peces.", "Metemos 3 peces más.", "El agua está muy limpia."],
    innecesario: 2,
    pregunta: "¿Cuántos peces hay ahora en la pecera?",
    solucion: "10",
  },
  {
    historia: [
      "El puzzle tiene 12 piezas.",
      "Ya he puesto 4 piezas.",
      "Es de colores muy bonitos.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántas piezas me faltan?",
    solucion: "8",
  },
  {
    historia: [
      "Me encantan los dinosaurios.",
      "Tengo 10 pegatinas de estrellas.",
      "Me dan 5 pegatinas más.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas pegatinas tengo ahora?",
    solucion: "15",
  },
];

/** `medium` — los mismos tres pasos, con cifras de dos dígitos y frases más largas. */
const MEDIO: DatosInnecesariosExercise[] = [
  {
    historia: [
      "En la primera parada bajan 5 personas.",
      "En el autobús viajan 20 personas.",
      "El conductor se llama Pedro.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántas personas quedan en el autobús?",
    solucion: "15",
  },
  {
    historia: [
      "María tiene 12 caramelos.",
      "Su amigo Pablo le da 4 más.",
      "A María le gusta mucho el chocolate.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántos caramelos tiene María al final?",
    solucion: "16",
  },
  {
    historia: [
      "El martes jugué al fútbol con mis amigos.",
      "El libro tiene 50 páginas.",
      "He leído 10 páginas el lunes.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas páginas me quedan por leer?",
    solucion: "40",
  },
  {
    historia: [
      "En el jardín hay 24 rosas rojas.",
      "El jardín tiene una fuente muy bonita.",
      "Se marchitan 8 rosas.",
    ],
    innecesario: 1,
    pregunta: "¿Cuántas rosas quedan en el jardín?",
    solucion: "16",
  },
  {
    historia: [
      "En el juego tengo 35 puntos.",
      "Gano 18 puntos más.",
      "El juego es de color verde.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántos puntos tengo ahora?",
    solucion: "53",
  },
  {
    historia: [
      "Las naranjas tienen mucha vitamina C.",
      "En la cesta hay 30 naranjas.",
      "Comemos 12 naranjas.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas naranjas quedan?",
    solucion: "18",
  },
  {
    historia: [
      "El horno tardó media hora.",
      "La abuela hizo 18 galletas.",
      "Dio 6 galletas a los vecinos.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas galletas le quedan a la abuela?",
    solucion: "12",
  },
  {
    historia: [
      "Se prestan 15 libros.",
      "En la estantería hay 45 libros.",
      "La estantería es de madera oscura.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántos libros quedan en la estantería?",
    solucion: "30",
  },
  {
    historia: ["Llegan 9 niños más.", "En el parque juegan 16 niños.", "Hace un día muy soleado."],
    innecesario: 2,
    pregunta: "¿Cuántos niños hay en el parque ahora?",
    solucion: "25",
  },
  {
    historia: [
      "Las pelotas son de goma y muy blandas.",
      "La tienda tiene 25 pelotas.",
      "Se venden 7 pelotas.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas pelotas quedan en la tienda?",
    solucion: "18",
  },
];

/**
 * `hard` — el dato sobrante tiene un número y se parece a uno que sí hace falta,
 * que es la trampa típica de este curso.
 */
const DIFICIL: DatosInnecesariosExercise[] = [
  {
    historia: [
      "Las ovejas dan mucha lana.",
      "En la granja hay 15 vacas.",
      "También hay 10 cerdos.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántos animales hay en la granja en total?",
    solucion: "25",
  },
  {
    historia: [
      "Ana compró 3 cuadernos a 2 euros cada uno.",
      "También compró un estuche rojo.",
      "Pagó con un billete de 10 euros.",
    ],
    innecesario: 1,
    pregunta: "¿Cuánto le costaron los cuadernos?",
    solucion: "6 €",
  },
  {
    historia: [
      "Para la fiesta compramos 20 globos.",
      "Se pincharon 3 globos verdes y 2 rojos.",
      "Ayer fue el cumpleaños de Marta.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántos globos quedan enteros?",
    solucion: "15",
  },
  {
    historia: [
      "Las galletas son redondas y con pepitas.",
      "Hay 3 platos con 6 galletas en cada uno.",
      "Se comen 4 galletas.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas galletas quedan en total?",
    solucion: "14",
  },
  {
    historia: [
      "Hay 35 libros de ciencia y 20 de arte.",
      "Los libros de arte son muy coloridos.",
      "Se prestan 15 libros.",
    ],
    innecesario: 1,
    pregunta: "¿Cuántos libros quedan en total?",
    solucion: "40",
  },
  {
    historia: [
      "Compramos 30 globos rojos y 20 azules.",
      "Se pincharon 12 globos.",
      "Las sillas de la fiesta son amarillas.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántos globos quedan?",
    solucion: "38",
  },
  {
    historia: [
      "El delantal de la abuela es de color azul.",
      "La abuela hizo 48 galletas de avena.",
      "Se comieron 13 el lunes y 11 el martes.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas galletas quedan?",
    solucion: "24",
  },
  {
    historia: [
      "La gallina pone 5 huevos cada día.",
      "La gallina es de color anaranjado.",
      "Han pasado 4 días.",
    ],
    innecesario: 1,
    pregunta: "¿Cuántos huevos puso la gallina?",
    solucion: "20",
  },
  {
    historia: [
      "Compro 3 manzanas a 2 euros cada una.",
      "Cada manzana cuesta 2 euros.",
      "El mercadillo está en la plaza mayor.",
    ],
    innecesario: 2,
    pregunta: "¿Cuánto cuestan las 3 manzanas?",
    solucion: "6 €",
  },
  {
    historia: [
      "Su hucha es de barro y tiene forma de cerdo.",
      "Lucía tenía 45 euros ahorrados.",
      "Gastó 18 euros en un juguete.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántos euros le quedan a Lucía?",
    solucion: "27 €",
  },
];

/**
 * `expert` — textos más largos y datos trampa con números que parecen importar:
 * un billete que no hace falta, una duración, una hora.
 */
const EXPERTO: DatosInnecesariosExercise[] = [
  {
    historia: [
      "El billete cuesta 15 euros.",
      "Un tren sale a las 10 de la mañana.",
      "Lleva 45 pasajeros en el primer vagón y 30 en el segundo.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántos pasajeros viajan en el tren?",
    solucion: "75",
  },
  {
    historia: [
      "Tengo una colección de 80 cartas.",
      "Mi hermano mayor tiene 12 años.",
      "Si pierdo 15 cartas jugando, ¿cuántas me quedan?",
    ],
    innecesario: 1,
    pregunta: "¿Cuántas cartas me quedan?",
    solucion: "65",
  },
  {
    historia: [
      "Una caja tiene 24 bombones.",
      "Nos hemos comido 12 bombones (la mitad).",
      "La caja pesa 200 gramos.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántos bombones quedan en la caja?",
    solucion: "12",
  },
  {
    historia: [
      "La obra empieza a las 7 de la tarde.",
      "En el teatro hay 120 butacas.",
      "Están ocupadas 78 butacas.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántas butacas están libres?",
    solucion: "42",
  },
  {
    historia: [
      "Hay 4 gallinas en el corral.",
      "Las gallinas son de color marrón.",
      "Cada una pone 6 huevos a la semana.",
    ],
    innecesario: 1,
    pregunta: "¿Cuántos huevos hay en una semana?",
    solucion: "24",
  },
  {
    historia: [
      "Van 48 alumnos de excursión.",
      "Cada autobús tiene 16 plazas.",
      "El viaje dura 2 horas.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántos autobuses necesitan?",
    solucion: "3",
  },
  {
    historia: [
      "La librería está en el centro.",
      "Marcos tenía 65 euros ahorrados.",
      "Compró un libro por 18 euros y otro por 9 euros.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántos euros le quedan a Marcos?",
    solucion: "38 €",
  },
  {
    historia: [
      "Hay 72 cromos para repartir entre 8 niños.",
      "Los cromos son de animales del mar.",
      "Los 72 cromos se reparten por igual.",
    ],
    innecesario: 1,
    pregunta: "¿Cuántos cromos le tocan a cada niño?",
    solucion: "9",
  },
  {
    historia: [
      "Hay 3 pizzas con 8 trozos cada una.",
      "Se comen 7 trozos en total.",
      "La pizza favorita es de cuatro quesos.",
    ],
    innecesario: 2,
    pregunta: "¿Cuántos trozos de pizza quedan?",
    solucion: "17",
  },
  {
    historia: [
      "Los coches son de colores muy vivos.",
      "En la salida hay 6 coches y 4 motos.",
      "Se retiran 3 vehículos antes de empezar.",
    ],
    innecesario: 0,
    pregunta: "¿Cuántos vehículos participan en la carrera?",
    solucion: "7",
  },
];

const BANCOS: Record<ActivityDifficulty, DatosInnecesariosExercise[]> = {
  easy: FACIL,
  medium: MEDIO,
  hard: DIFICIL,
  expert: EXPERTO,
};

/** Cuántos problemas hay escritos para cada dificultad. */
export function tamanoBanco(difficulty: ActivityDifficulty): number {
  return BANCOS[difficulty].length;
}

/** El banco completo, por si hay que revisarlo desde fuera. */
export function banco(difficulty: ActivityDifficulty): readonly DatosInnecesariosExercise[] {
  return BANCOS[difficulty];
}

// ── Generación ────────────────────────────────────────────────────────────────

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Fisher-Yates, como el resto de motores migrados. */
function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * La hoja es el banco entero, barajado.
 *
 * Cada dificultad tiene exactamente diez problemas escritos a mano, así que una
 * hoja es una vuelta a los mismos diez en otro orden: no hay problema nuevo al
 * repetir, y eso también conviene que lo sepa quien lo usa.
 */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): DatosInnecesariosExercise[] {
  const rng = lcg(seed);
  return shuffle(BANCOS[difficulty], rng).slice(0, SESSION_SIZE);
}

/** Si la frase que se ha marcado es la que sobraba. */
export function validar(exercise: DatosInnecesariosExercise, indice: number): boolean {
  return indice === exercise.innecesario;
}
