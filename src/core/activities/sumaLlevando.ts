import type { ActivityDifficulty } from "../content/contracts";

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

export interface SumaLlevandoExercise {
  /** "2-addends" para easy/medium, "3-addends" para hard/expert */
  type: "2-addends" | "3-addends";
  /** Sumandos — 2 o 3 elementos */
  addends: number[];
  /** Resultado de la suma */
  answer: number;
}

export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

// ────────────────────────────────────────────────────────────────
// Generador
// Dificultades:
//   easy   — 2 sumandos (2 cifras + 1 cifra), con llevada, resultado ≤ 50
//   medium — 2 sumandos (2 cifras + 2 cifras), con llevada, resultado ≤ 99
//   hard   — 3 sumandos, llevada simple (suma de U > 9 y ≤ 19), resultado ≤ 99
//   expert — 3 sumandos, llevada doble (suma de U ≥ 20), resultado ≤ 99
// ────────────────────────────────────────────────────────────────

export function generateSession(
  difficulty: ActivityDifficulty,
  seed: number,
): SumaLlevandoExercise[] {
  let currentSeed = seed;
  const rnd = (min: number, max: number) => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return Math.floor((currentSeed / 233280) * (max - min + 1)) + min;
  };

  const count = 10;
  const exercises: SumaLlevandoExercise[] = [];

  for (let i = 0; i < count; i++) {
    let a = 0,
      b = 0,
      c = 0;
    let aU = 0,
      bU = 0,
      cU = 0;
    let type: "2-addends" | "3-addends" = "2-addends";

    if (difficulty === "easy") {
      // 2 sumandos (2 cifras + 1 cifra), con llevada, resultado ≤ 50
      b = rnd(2, 9);
      bU = b;
      aU = rnd(10 - b, 9);
      const aD = rnd(1, 3); // máx 39 + 9 = 48 ≤ 50
      a = aD * 10 + aU;
    } else if (difficulty === "medium") {
      // 2 sumandos (2 cifras + 2 cifras), con llevada, resultado ≤ 99
      aU = rnd(2, 9);
      bU = rnd(10 - aU, 9); // garantiza llevada
      const maxD = 8;
      const aD = rnd(1, maxD - 1);
      const bD = rnd(1, maxD - aD);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
    } else if (difficulty === "hard") {
      // 3 sumandos, llevada simple, resultado ≤ 99
      type = "3-addends";
      aU = rnd(2, 7);
      bU = rnd(2, 8 - aU);
      cU = rnd(10 - (aU + bU), 9); // llevada = 1
      const maxD = 8;
      const aD = rnd(1, maxD - 2);
      const bD = rnd(1, maxD - aD - 1);
      const cD = rnd(0, maxD - aD - bD);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      c = cD * 10 + cU;
    } else {
      // expert: 3 sumandos, llevada doble, resultado ≤ 99
      type = "3-addends";
      aU = rnd(6, 9);
      bU = rnd(7, 9);
      cU = rnd(20 - (aU + bU), 9); // llevada = 2
      const maxD = 7;
      const aD = rnd(1, maxD - 2);
      const bD = rnd(1, maxD - aD - 1);
      const cD = rnd(0, maxD - aD - bD);
      a = aD * 10 + aU;
      b = bD * 10 + bU;
      c = cD * 10 + cU;
    }

    const addends = type === "2-addends" ? [a, b] : [a, b, c];
    exercises.push({
      type,
      addends,
      answer: addends.reduce((acc, val) => acc + val, 0),
    });
  }

  return exercises;
}

export function validateAnswer(ex: SumaLlevandoExercise, answerStr: string): boolean {
  return parseInt(answerStr, 10) === ex.answer;
}
