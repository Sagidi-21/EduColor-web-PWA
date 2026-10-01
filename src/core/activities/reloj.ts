import type { ActivityDifficulty } from "../content/contracts";

/**
 * Motor "El reloj" (1.º y 2.º de Primaria).
 *
 * Migración 1:1 de `electron-reference/Colegio/src/renderer/src/core/engines/reloj/engine.ts`.
 * No cambia ninguna regla de generación, dificultad, solución ni validación: solo
 * el tipo de dificultad (`Difficulty` de Electron → `ActivityDifficulty` de la PWA)
 * y el hecho de que la semilla la recibe como parámetro en lugar de calcularla el
 * renderer con `Date.now() % 999983`.
 */

export type RelojExerciseType =
  "analog_to_digital" | "digital_to_analog" | "match_scene" | "digital_read";

export type RelojMinutes = 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55;

export interface RelojExercise {
  type: RelojExerciseType;
  /** 1-12 */
  hours: number;
  minutes: RelojMinutes;
  question: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
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

/** Los doce minutos que maneja el nivel experto. */
const EXPERT_MINS: RelojMinutes[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/**
 * Situaciones cotidianas y la hora a la que ocurren. Son 6, y no más a propósito.
 *
 * Todas tienen una sola lectura posible en un reloj de 12 horas, que es el que
 * usa la actividad: el enunciado dice "Son las 7 en punto" sin poder distinguir
 * la mañana de la tarde. Se han quitado por eso las que sí tenían dos lecturas
 * posibles y dejaban al alumno adivinando: las 6 (jugar por la mañana o por la
 * tarde), las 2 (comer o merendar), las 3 y media (siesta o vuelta de la tarde)
 * y las 9 de dormir, que además chocaba con "Comienzan las clases" a las 9:30.
 *
 * Va exportado para que los tests puedan afirmar sobre la escena sin reescribir
 * los emojis, que es donde lo ve el alumno.
 */
export const SCENES = [
  { hour: 7, min: 0, scene: "☀️ Hora de despertarse" },
  { hour: 8, min: 0, scene: "🎒 Hora de ir al colegio" },
  { hour: 9, min: 30, scene: "📚 Comienzan las clases" },
  { hour: 10, min: 30, scene: "☕ El recreo" },
  { hour: 5, min: 0, scene: "🚌 Vuelta a casa" },
  { hour: 4, min: 30, scene: "✏️ Hora de los deberes" },
];

/** `7:05`: el formato con el que se escribe la hora en el reloj digital. */
function formatTime(h: number, m: number): string {
  return m < 10 ? `${h}:0${m}` : `${h}:${m}`;
}

import { timeLabel } from "./shared/timeLabel";

/**
 * La hora en palabras la dice `shared/timeLabel.ts`, porque la usan dos motores.
 * Se re-exporta para que los tests y los imports existentes sigan apuntando
 * aquí; el día que nadie la importe de este fichero, se quita el re-export.
 */
export { timeLabel };

/**
 * El pool de minutos con el que se construyen también las opciones distractoras,
 * para no ofrecerle al alumno horas que la dificultad no permite.
 */
function minutePoolFor(difficulty: ActivityDifficulty): RelojMinutes[] {
  if (difficulty === "easy") return [0];
  if (difficulty === "medium") return [0, 30];
  if (difficulty === "hard") return [0, 15, 30, 45];
  return EXPERT_MINS;
}

// ── Motor público ────────────────────────────────────────────────────────────

/**
 * Genera una sesión de 10 ejercicios sin repetir la combinación hora:minuto, con
 * el reparto de tipos y el rango de horas que manda cada dificultad.
 *
 * - easy:   horas del 1 al 6, siempre en punto, siempre `analog_to_digital`.
 * - medium: horas del 1 al 12, en punto o y media, tres tipos mezclados.
 * - hard:   horas del 1 al 12, en punto / y cuarto / y media / menos cuarto,
 *           `match_scene` o `digital_read`.
 * - expert: los doce minutos y los cuatro tipos mezclados.
 */
export function generateSession(difficulty: ActivityDifficulty, seed = 42): RelojExercise[] {
  const rng = lcg(seed);
  const out: RelojExercise[] = [];
  const count = 10;
  const used = new Set<string>();

  let tries = 0;
  while (out.length < count && tries < 300) {
    tries++;

    const maxHour = difficulty === "easy" ? 6 : 12;
    const hours = randInt(rng, 1, maxHour);
    let minutes: RelojMinutes;
    if (difficulty === "easy") {
      minutes = 0;
    } else if (difficulty === "medium") {
      minutes = rng() > 0.5 ? 30 : 0;
    } else if (difficulty === "hard") {
      const opts: RelojMinutes[] = [0, 15, 30, 45];
      minutes = opts[Math.floor(rng() * 4)];
    } else {
      minutes = EXPERT_MINS[Math.floor(rng() * 12)];
    }

    const key = `${hours}-${minutes}`;
    if (used.has(key)) continue;
    used.add(key);

    let type: RelojExerciseType;
    if (difficulty === "easy") type = "analog_to_digital";
    else if (difficulty === "medium") {
      const r = rng();
      type = r < 0.34 ? "analog_to_digital" : r < 0.67 ? "digital_to_analog" : "digital_read";
    } else if (difficulty === "hard") {
      type = rng() > 0.5 ? "match_scene" : "digital_read";
    } else {
      const r = rng();
      type = r < 0.33 ? "match_scene" : r < 0.66 ? "digital_to_analog" : "digital_read";
    }

    // Las opciones distractoras salen del mismo pool de minutos que la
    // dificultad permite.
    const correctStr = formatTime(hours, minutes);
    const minutePool = minutePoolFor(difficulty);
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const wh = randInt(rng, 1, 12);
      const wm = minutePool[Math.floor(rng() * minutePool.length)];
      const ws = formatTime(wh, wm);
      if (ws !== correctStr) wrongs.add(ws);
    }

    const allOpts = [correctStr, ...Array.from(wrongs)]
      .sort(() => rng() - 0.5)
      .map((v) => ({ label: v, value: v }));

    let question;
    if (type === "analog_to_digital") {
      question = `¿Qué hora marca el reloj?`;
    } else if (type === "digital_to_analog") {
      question = `El reloj digital marca ${correctStr}. ¿Cuál es la hora?`;
    } else if (type === "digital_read") {
      question = "¿Cómo se lee esta hora?";
      const correctVerbal = timeLabel(hours, minutes);
      const wrongVerbal = new Set<string>();
      while (wrongVerbal.size < 3) {
        const wh = randInt(rng, 1, 12);
        const wm = minutePool[Math.floor(rng() * minutePool.length)];
        const wv = timeLabel(wh, wm);
        if (wv !== correctVerbal) wrongVerbal.add(wv);
      }
      const verbalOpts = [correctVerbal, ...Array.from(wrongVerbal)]
        .sort(() => rng() - 0.5)
        .map((v) => ({ label: v, value: v }));
      out.push({
        type,
        hours,
        minutes,
        question,
        options: verbalOpts,
        correctAnswer: correctVerbal,
      });
      continue;
    } else {
      const scene = SCENES.find((s) => s.hour === hours && s.min === minutes);
      question = scene
        ? `Son ${timeLabel(hours, minutes)}. ${scene.scene}. ¿Qué hora es?`
        : `La actividad es a ${timeLabel(hours, minutes)}. ¿Qué hora marca el reloj?`;
    }

    out.push({ type, hours, minutes, question, options: allOpts, correctAnswer: correctStr });
  }

  return out;
}

/**
 * Valida si la opción elegida por el alumno coincide con la respuesta correcta.
 *
 * La respuesta es siempre un `string`: "7:05" en los tipos con reloj, y
 * "las 7 y cinco" en `digital_read`.
 */
export function validateAnswer(ex: RelojExercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
