import type { ActivityDifficulty } from "../content/contracts";

/**
 * Motor "Coloca el número en la recta" — se da un número y el niño lo ARRASTRA
 * hasta su posición en la recta numérica; al soltar se ajusta a la marca entera
 * más cercana y se valida. Trabaja el sentido numérico / posición en la recta.
 */
export interface RectaExercise {
  target: number; // número a colocar
  max: number; // extremo derecho de la recta (0..max)
  labelEvery: number; // cada cuántas marcas se pone etiqueta
}

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

export function generateSession(difficulty: ActivityDifficulty, seed = 42): RectaExercise[] {
  const rng = lcg(seed);
  const out: RectaExercise[] = [];
  const used = new Set<number>();

  const cfg =
    difficulty === "easy"
      ? { max: 10, labelEvery: 5 }
      : difficulty === "medium"
        ? { max: 20, labelEvery: 5 }
        : difficulty === "hard"
          ? { max: 50, labelEvery: 10 }
          : { max: 100, labelEvery: 10 };

  let tries = 0;
  while (out.length < 10 && tries < 400) {
    tries++;
    const target = randInt(rng, 1, cfg.max - 1); // sin los extremos (0 y max ya van etiquetados)
    if (used.has(target)) continue;
    used.add(target);
    out.push({ target, max: cfg.max, labelEvery: cfg.labelEvery });
  }
  return out;
}
