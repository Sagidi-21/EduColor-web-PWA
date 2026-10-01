import type { ActivityDifficulty } from "../content/contracts";

/**
 * Motor "Pon la hora" (1.º y 2.º de Primaria).
 *
 * Migración 1:1 de `electron-reference/Colegio/src/renderer/src/core/engines/relojPonerHora/engine.ts`.
 * El niño arrastra las agujas de un reloj analógico grande para reproducir la
 * hora que se le pide, mostrada en digital. Comparte la progresión de niveles
 * con el motor `reloj`, pero la mecánica es de manipulación directa, no de
 * elegir entre opciones.
 *
 * No cambia ninguna regla de generación, dificultad ni validación: solo el tipo
 * de dificultad (`Difficulty` de Electron → `ActivityDifficulty` de la PWA), la
 * semilla como parámetro en lugar de `Date.now() % 999983` calculado en el
 * renderer, y la comprobación, que en Electron vivía dentro del renderer
 * (`h === current.hours && m === current.minutes`) y aquí es un validador
 * comprobable.
 *
 * A diferencia de `reloj`, este motor **no tiene escenas**: pide una hora
 * concreta y la comprueba tal cual, así que no hay nada que pueda quedar
 * ambiguo con un reloj de 12 horas.
 */

export interface RelojPonerHoraExercise {
  /** 1-12 */
  hours: number;
  /** 0-55, en el incremento que permita la dificultad */
  minutes: number;
  /** La hora pedida tal como se escribe en el reloj digital: "3:30" */
  target: string;
}

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

/** Los minutos que maneja cada dificultad. */
const CUARTOS: number[] = [0, 15, 30, 45];
const DE_CINCO_EN_CINCO: number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function minutesFor(difficulty: ActivityDifficulty, rng: () => number): number {
  if (difficulty === "easy") return 0; // en punto
  if (difficulty === "medium") return rng() > 0.5 ? 30 : 0; // en punto y media
  if (difficulty === "hard") return CUARTOS[Math.floor(rng() * 4)]; // cuartos
  return DE_CINCO_EN_CINCO[Math.floor(rng() * 12)]; // de 5 en 5
}

/** `7:05`, el formato con el que se escribe la hora en el reloj digital. */
function fmt(h: number, m: number): string {
  return m < 10 ? `${h}:0${m}` : `${h}:${m}`;
}

// ── Motor público ────────────────────────────────────────────────────────────

/**
 * Genera una sesión de 10 ejercicios sin repetir la combinación hora:minuto,
 * con el incremento de minutos que manda cada dificultad.
 *
 * - easy:   horas del 1 al 12, siempre en punto.
 * - medium: horas del 1 al 12, en punto o y media.
 * - hard:   horas del 1 al 12, en punto / y cuarto / y media / menos cuarto.
 * - expert: horas del 1 al 12, cualquier minuto de 5 en 5.
 *
 * **Divergencia respecto a Electron:** allí la dificultad fácil limitaba las
 * horas al rango 1-6, lo que dejaba solo 6 combinaciones posibles (1:00 a 6:00)
 * y por tanto una sesión de 6 ejercicios en lugar de los 10 que piden las demás.
 * El resto de dificultades usa las 12 horas, así que el fácil se quedaba corto
 * solo por ese recorte, sin una razón didáctica detrás: no se pide una hora más
 * sencilla que otra, se pide la misma en punto. Aquí las 12 difficulties del 1 al
 * 12, y el fácil vuelve a tener 10 ejercicios como todos los demás
 * (decisión del profesor del 2026-10-01).
 */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): RelojPonerHoraExercise[] {
  const rng = lcg(seed);
  const out: RelojPonerHoraExercise[] = [];
  const used = new Set<string>();
  // 12 horas en las cuatro dificultades: el fácil se diferencia por pedir la hora
  // en punto, no por tener menos horas que colocar.
  const maxHour = 12;
  let tries = 0;

  while (out.length < 10 && tries < 300) {
    tries++;
    const hours = randInt(rng, 1, maxHour);
    const minutes = minutesFor(difficulty, rng);
    const key = `${hours}-${minutes}`;
    if (used.has(key)) continue;
    used.add(key);
    out.push({ hours, minutes, target: fmt(hours, minutes) });
  }
  return out;
}

/**
 * Comprueba si las agujas que el niño ha puesto marcan la hora pedida.
 *
 * Es la misma comparación que hacía el renderer de Electron, pero como función
 * del núcleo: aquí `hours` y `minutes` son las posiciones de las agujas, no el
 * estado de un `useState` del componente.
 */
export function validateAnswer(
  ex: RelojPonerHoraExercise,
  hours: number,
  minutes: number,
): boolean {
  return hours === ex.hours && minutes === ex.minutes;
}
