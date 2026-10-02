import type { ActivityDifficulty } from "../content/contracts";

/**
 * Motor "Intervalos de tiempo" (1.º de Primaria).
 *
 * Migración 1:1 de
 * `electron-reference/Colegio/src/renderer/src/core/engines/intervalosTiempo/engine.ts`.
 *
 * El niño compara duraciones de actividades cotidianas. Hay dos familias de
 * ejercicio:
 *
 * - `which-longer` / `which-shorter`: dos actividades y la pregunta de cuál dura
 *   más o cuál dura menos. Se responde pulsando la tarjeta de la actividad.
 * - `classify-hour`: una sola actividad y la pregunta de si dura más o menos de
 *   1 hora.
 *
 * No cambia ninguna regla de generación, dificultad ni validación: solo el tipo
 * de dificultad (`Difficulty` de Electron → `ActivityDifficulty` de la PWA), la
 * semilla como parámetro en lugar de `Date.now() % 999983` calculado en el
 * renderer, y el catálogo, que pasa a ser un dato exportado y testeable en lugar
 * de una constante privada del módulo.
 */

/** Qué hay que contestar en cada ejercicio. */
export type IntervalosTiempoType = "which-longer" | "which-shorter" | "classify-hour";

/** Una actividad cotidiana con su duración normalizada para poder compararlas. */
export interface IntervalosTiempoActivity {
  name: string;
  emoji: string;
  /** Segundos, la única magnitud con la que se comparan las duraciones. */
  seconds: number;
  /** Lo que se lee en la tarjeta: "30 minutos", "2 días", "2 meses"… */
  label: string;
}

/**
 * Catálogo de 18 actividades.
 *
 * `seconds` es la verdad con la que se comparan; `label` es solo texto. Los dos
 * últimos casos están expresados en meses (`60 * 86400` y `280 * 86400` días)
 * porque son los únicos que no caben en "horas o menos" de forma razonable: son
 * la referencia larga que hace que "un curso escolar" o "las vacaciones de
 * verano" sean mucho más largos que cualquier otra actividad del catálogo.
 */
export const INTERVALOS: readonly IntervalosTiempoActivity[] = [
  { name: "el recreo", emoji: "🏃", seconds: 30 * 60, label: "30 minutos" },
  { name: "una clase", emoji: "📚", seconds: 60 * 60, label: "1 hora" },
  { name: "dormir por la noche", emoji: "😴", seconds: 8 * 3600, label: "8 horas" },
  { name: "lavarse los dientes", emoji: "🪥", seconds: 2 * 60, label: "2 minutos" },
  { name: "desayunar", emoji: "🥣", seconds: 15 * 60, label: "15 minutos" },
  { name: "ver una película", emoji: "🎬", seconds: 2 * 3600, label: "2 horas" },
  { name: "la jornada escolar", emoji: "🏫", seconds: 5 * 3600, label: "5 horas" },
  { name: "un parpadeo", emoji: "👁️", seconds: 0.3, label: "menos de 1 segundo" },
  { name: "un partido de fútbol", emoji: "⚽", seconds: 90 * 60, label: "90 minutos" },
  { name: "leer un cuento", emoji: "📖", seconds: 20 * 60, label: "20 minutos" },
  { name: "una siesta", emoji: "💤", seconds: 45 * 60, label: "45 minutos" },
  { name: "el fin de semana", emoji: "📅", seconds: 2 * 86400, label: "2 días" },
  { name: "las vacaciones de verano", emoji: "☀️", seconds: 60 * 86400, label: "2 meses" },
  { name: "ponerse los zapatos", emoji: "👟", seconds: 60, label: "1 minuto" },
  { name: "un curso escolar", emoji: "🗓️", seconds: 280 * 86400, label: "10 meses" },
  { name: "estornudar", emoji: "🤧", seconds: 2, label: "2 segundos" },
  { name: "una carrera de 100 m", emoji: "🏅", seconds: 15, label: "15 segundos" },
  { name: "un cumpleaños", emoji: "🎂", seconds: 3 * 3600, label: "3 horas" },
];

export interface IntervalosTiempoExercise {
  type: IntervalosTiempoType;
  /** Dos actividades al comparar, una sola al clasificar. */
  activities: IntervalosTiempoActivity[];
  question: string;
  /**
   * Opciones de respuesta. En `classify-hour` son las dos que se muestran; al
   * comparar no se usa, porque el botón que se pulsa es la propia tarjeta de la
   * actividad. Se conserva para no apartarse del enunciado que generaba Electron.
   */
  options: string[];
  correctAnswer: string;
  /** Si se dibujan las barras de duración como pista visual. */
  showBars: boolean;
}

/** Ejercicios por sesión, el mismo número en las cuatro dificultades. */
export const SESSION_SIZE = 10;

/**
 * Cuántos ejercicios de cada tipo tienen que aparecer sí o sí en `hard` y
 * `expert`, los dos niveles que mezclan comparaciones y clasificaciones.
 *
 * Sin este mínimo, una semilla puede llenar los diez huecos enteros de
 * clasificaciones y dejar el nivel sin ninguna comparación, que es justo lo que
 * su descripción promete. Pasó con la semilla 4242 en `expert`: como el filtro
 * de cercanía deja solo 15 parejas válidas de 153 posibles, el azar puede agotar
 * los huecos antes de encontrar una.
 *
 * Va como cantidad y no como proporción porque es una garantía de que la sesión
 * ejercita los dos tipos, no una distribución que haya que ajustar.
 */
export const MINIMO_POR_TIPO = { comparaciones: 2, clasificaciones: 2 };

/** Una hora, el umbral con el que se clasifican las duraciones. */
export const ONE_HOUR_SECONDS = 3600;

/**
 * Qué cocientes admite cada dificultad al comparar dos duraciones, medido como
 * **la más larga dividida por la más corta**.
 *
 * Es un rango y no un mínimo porque los niveles se distinguen en direcciones
 * opuestas: `easy` descarta lo que se parece (para que la respuesta no dependa de
 * medir con precisión) y `expert` descarta lo que se aleja (para que exija
 * razonar en lugar de reconocer). Con un solo umbral solo se podría expresar uno
 * de los dos, y el otro nivel salía con el contenido del primero.
 *
 * Un niño de 1.º no puede razonar "8 horas contra 3 horas", pero sí "1 hora contra
 * 45 minutos", porque las dos se leen en la misma unidad. De ahí el ×2.
 *
 * Los extremos sin límite van en `Infinity` para que se lea "sin límite" en el
 * propio dato, en vez de tener que deducirlo de un `if` aparte.
 */
export const RANGO_CERCANIA: Record<ActivityDifficulty, { min: number; max: number }> = {
  /** Diferencia muy clara: tres veces o más, como en Electron. */
  easy: { min: 3, max: Infinity },
  medium: { min: 1, max: Infinity },
  hard: { min: 1, max: Infinity },
  /** Duraciones muy parecidas: la más larga es como mucho el doble. */
  expert: { min: 1, max: 2 },
};

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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Motor público ────────────────────────────────────────────────────────────

/**
 * Genera una sesión sin repetir ni actividad ni pareja de actividades.
 *
 * - easy:   comparaciones de diferencia muy clara, cociente 3 o más.
 * - medium: comparaciones sin filtro de cercanía. Barras siempre visibles.
 * - hard:   comparaciones sin filtro y, con probabilidad aproximada del 40 %,
 *           ejercicios de `classify-hour`. Las barras se alternan por intento.
 * - expert: duraciones muy parecidas, con la más larga como mucho el doble que
 *           la más corta, más `classify-hour`. Nunca con barras.
 *
 * La diferencia entre `medium` y `expert` es el único filtro de cercanía: hasta
 * el 2026-10-02 las dos lo eran idénticas y las dos descripciones prometían
 * duraciones próximas, que es lo que se corrigió. Ver `RANGO_CERCANIA`.
 *
 * **Sobre las barras en `hard`:** el contador alterna en cada intento del
 * generador, no en cada ejercicio emitido, así que un duplicado descartado
 * invierte la alternancia. Se mantiene igual que en Electron a propósito: cambiar
 * el ritmo de aparición de las pistas es una decisión didáctica, no una
 * limpieza de código.
 */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): IntervalosTiempoExercise[] {
  const rng = lcg(seed);
  const out: IntervalosTiempoExercise[] = [];
  const used = new Set<string>();
  let tries = 0;
  let hardBarCount = 0;
  const cuenta = { comparaciones: 0, clasificaciones: 0 };

  while (out.length < SESSION_SIZE && tries < 400) {
    tries++;

    const showBars =
      difficulty === "easy" || difficulty === "medium"
        ? true
        : difficulty === "hard"
          ? hardBarCount++ % 2 === 0
          : false;

    // Hasta que los dos tipos estén cubiertos, no se deja el azar decidir cuál
    // sale primero: si faltara uno por azar, la sesión podría no tener ninguna
    // comparación y su descripción estaría mintiendo otra vez.
    const faltaClasificacion = cuenta.clasificaciones < MINIMO_POR_TIPO.clasificaciones;
    const faltaComparacion = cuenta.comparaciones < MINIMO_POR_TIPO.comparaciones;
    const useClassify =
      (difficulty === "hard" || difficulty === "expert") &&
      (faltaClasificacion || (!faltaComparacion && rng() > 0.6));

    if (useClassify) {
      const act = INTERVALOS[randInt(rng, 0, INTERVALOS.length - 1)];
      const key = `cls-${act.name}`;
      if (used.has(key)) continue;
      used.add(key);
      cuenta.clasificaciones++;
      out.push({
        type: "classify-hour",
        activities: [act],
        question: `${act.emoji} ${cap(act.name)}… ¿dura más de 1 hora o menos de 1 hora?`,
        options: ["Más de 1 hora", "Menos de 1 hora"],
        correctAnswer: act.seconds > ONE_HOUR_SECONDS ? "Más de 1 hora" : "Menos de 1 hora",
        showBars,
      });
      continue;
    }

    const i1 = randInt(rng, 0, INTERVALOS.length - 1);
    const i2 = randInt(rng, 0, INTERVALOS.length - 1);
    if (i1 === i2) continue;
    const a = INTERVALOS[i1];
    const b = INTERVALOS[i2];
    if (a.seconds === b.seconds) continue;

    // Cada dificultad solo acepta las parejas que su enunciado promete. El rango
    // va en `RANGO_CERCANIA`, junto a lo que dice el texto del nivel, para que el
    // filtro y su descripción no puedan separarse.
    const rango = RANGO_CERCANIA[difficulty];
    const razon = Math.max(a.seconds, b.seconds) / Math.min(a.seconds, b.seconds);
    if (razon < rango.min || razon > rango.max) continue;

    const key = [a.name, b.name].sort().join("|");
    if (used.has(key)) continue;
    used.add(key);
    cuenta.comparaciones++;

    const isLonger = rng() > 0.5;
    const longer = a.seconds > b.seconds ? a : b;
    const shorter = a.seconds < b.seconds ? a : b;
    const correct = isLonger ? longer.name : shorter.name;

    out.push({
      type: isLonger ? "which-longer" : "which-shorter",
      activities: [a, b],
      question: isLonger
        ? `¿Qué dura más: ${a.emoji} ${a.name} (${a.label}) o ${b.emoji} ${b.name} (${b.label})?`
        : `¿Qué dura menos: ${a.emoji} ${a.name} (${a.label}) o ${b.emoji} ${b.name} (${b.label})?`,
      options: [cap(a.name), cap(b.name)].sort(() => rng() - 0.5),
      correctAnswer: cap(correct),
      showBars,
    });
  }
  return out;
}

/**
 * Comprueba la respuesta elegida. Solo es el rótulo de la actividad correcta o,
 * al clasificar, una de las dos frases de `options`.
 *
 * La comparación ignora mayúsculas porque tanto el enunciado como el botón
 * capitalizan el nombre de la actividad, y en `classify-hour` la respuesta se
 * elige de una lista con mayúsculas fijas.
 */
export function validateAnswer(ex: IntervalosTiempoExercise, input: string): boolean {
  return input.toLowerCase() === ex.correctAnswer.toLowerCase();
}
