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

/** Una hora, el umbral con el que se clasifican las duraciones. */
export const ONE_HOUR_SECONDS = 3600;

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
 * - easy:   solo comparaciones, y siempre entre actividades cuya duración se
 *           diferencia en un factor de 3 o más, para que la respuesta no dependa
 *           de medir con precisión. Barras siempre visibles.
 * - medium: comparaciones sin filtro de diferencia. Barras siempre visibles.
 * - hard:   comparaciones y, con probabilidad aproximada del 40 %, ejercicios de
 *           `classify-hour`. Las barras se alternan por intento.
 * - expert: como `hard`, pero nunca con barras: la única pista es el rótulo de
 *           cada actividad.
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

  while (out.length < SESSION_SIZE && tries < 400) {
    tries++;

    const showBars =
      difficulty === "easy" || difficulty === "medium"
        ? true
        : difficulty === "hard"
          ? hardBarCount++ % 2 === 0
          : false;

    const useClassify = (difficulty === "hard" || difficulty === "expert") && rng() > 0.6;

    if (useClassify) {
      const act = INTERVALOS[randInt(rng, 0, INTERVALOS.length - 1)];
      const key = `cls-${act.name}`;
      if (used.has(key)) continue;
      used.add(key);
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

    // En fácil solo se aceptan parejas claramente distintas.
    if (
      difficulty === "easy" &&
      Math.max(a.seconds, b.seconds) / Math.min(a.seconds, b.seconds) < 3
    )
      continue;

    const key = [a.name, b.name].sort().join("|");
    if (used.has(key)) continue;
    used.add(key);

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
