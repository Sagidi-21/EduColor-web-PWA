import type { ActivityDifficulty } from "../content/contracts";

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

/** Un ejercicio: dado `total`, el alumno escribe partB (total−partA),
 *  partA (total−partB) y la suma partA+partB = total. */
export interface RelacionSumaRestaExercise {
  /** Suma total (T) */
  total: number;
  /** Primer sumando */
  partA: number;
  /** Segundo sumando  (= total − partA) */
  partB: number;
}

export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

// ────────────────────────────────────────────────────────────────
// PRNG determinista (LCG)
// ────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────
// Generador de sesión
// Dificultades:
//   easy   — total 5-10 (partA ≥ 1, partB ≥ 1)
//   medium — total 11-20
//   hard   — total 21-50
//   expert — total 51-99
// ────────────────────────────────────────────────────────────────

export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): RelacionSumaRestaExercise[] {
  const rng = lcg(seed);
  const used = new Set<string>();
  const out: RelacionSumaRestaExercise[] = [];
  const count = 10;
  let tries = 0;

  while (out.length < count && tries < 500) {
    tries++;
    let total: number, partA: number;

    if (difficulty === "easy") {
      total = randInt(rng, 5, 10);
      partA = randInt(rng, 1, total - 1);
    } else if (difficulty === "medium") {
      total = randInt(rng, 11, 20);
      partA = randInt(rng, 2, total - 2);
    } else if (difficulty === "hard") {
      total = randInt(rng, 21, 50);
      partA = randInt(rng, 5, total - 5);
    } else {
      // expert
      total = randInt(rng, 51, 99);
      partA = randInt(rng, 10, total - 10);
    }

    const partB = total - partA;
    const key = `${total}-${Math.min(partA, partB)}`;
    if (used.has(key)) continue;
    used.add(key);

    out.push({ total, partA, partB });
  }

  return out;
}

// ────────────────────────────────────────────────────────────────
// Validación
// Respuestas esperadas (en orden de los 3 inputs del renderer):
//   input[0] → total − partA = partB
//   input[1] → total − partB = partA
//   input[2] → partA + partB = total
// ────────────────────────────────────────────────────────────────

export function validateAnswers(
  ex: RelacionSumaRestaExercise,
  inputs: [string, string, string],
): [boolean, boolean, boolean] {
  return [
    inputs[0].trim() === String(ex.partB),
    inputs[1].trim() === String(ex.partA),
    inputs[2].trim() === String(ex.total),
  ];
}

export function allCorrect(results: [boolean, boolean, boolean]): boolean {
  return results[0] && results[1] && results[2];
}
