import type { ActivityDifficulty } from "../content/contracts";

export function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function randInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

export type RedondeoType = "round-to-ten" | "which-closer";

export interface RedondeoExercise {
  type: RedondeoType;
  number: number;
  lowerDecade: number;
  upperDecade: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export function generateSession(difficulty: ActivityDifficulty, seed = 42): RedondeoExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: RedondeoExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < count && tries < 400) {
    tries++;

    let n: number;
    if (difficulty === "easy" || difficulty === "medium") {
      n = randInt(rng, 11, 98);
    } else {
      n = randInt(rng, 101, 998);
    }
    // Se descartan los múltiplos de 10 (ya redondeados) y los acabados en 5:
    // el 5 justo es ambiguo (¿arriba o abajo?), así la respuesta es siempre clara.
    if (n % 10 === 0 || n % 10 === 5) continue;

    const type: RedondeoType =
      difficulty === "easy" ? "round-to-ten" : rng() > 0.5 ? "round-to-ten" : "which-closer";

    const key = `${type}-${n}`;
    if (used.has(key)) continue;
    used.add(key);

    const lower = Math.floor(n / 10) * 10;
    const upper = lower + 10;
    const correct = n % 10 < 5 ? lower : upper;

    if (type === "round-to-ten") {
      const wrongSet = new Set<string>([String(correct)]);
      for (const c of [lower - 10, lower, upper, upper + 10, lower - 20, upper + 20]) {
        if (wrongSet.size >= 4) break;
        if (c >= 0 && String(c) !== String(correct)) wrongSet.add(String(c));
      }
      const options = [...wrongSet].slice(0, 4).sort(() => rng() - 0.5);
      out.push({
        type,
        number: n,
        lowerDecade: lower,
        upperDecade: upper,
        question: `Redondea ${n} a la decena más próxima`,
        options,
        correctAnswer: String(correct),
      });
    } else {
      out.push({
        type,
        number: n,
        lowerDecade: lower,
        upperDecade: upper,
        question: `¿${n} está más cerca de ${lower} o de ${upper}?`,
        options: [String(lower), String(upper)],
        correctAnswer: String(correct),
      });
    }
  }
  return out;
}

export function validateAnswer(ex: RedondeoExercise, input: string): boolean {
  return input.trim() === ex.correctAnswer;
}
