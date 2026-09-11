import type { ActivityDifficulty } from "../content/contracts";

export type VecinosQuestionType = "anterior" | "posterior" | "ambos";

export interface VecinosExercise {
  number: number;
  type: VecinosQuestionType;
  anterior: number;
  posterior: number;
  correctAnswer: string;
  options: string[];
}

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateVecinosSession(
  seed: number,
  difficulty: ActivityDifficulty,
): VecinosExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: VecinosExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < count && tries < 300) {
    tries++;

    const maxN =
      difficulty === "easy"
        ? 9
        : difficulty === "medium"
          ? 19
          : difficulty === "hard"
            ? 59
            : 99;
    const n = randInt(rng, 2, maxN - 1);

    let type: VecinosQuestionType;
    if (difficulty === "easy" || difficulty === "medium") {
      type = rng() > 0.5 ? "anterior" : "posterior";
    } else {
      type = "ambos";
    }

    const key = `${n}-${type}`;
    if (used.has(key)) continue;
    used.add(key);

    const ant = n - 1;
    const pos = n + 1;

    let correctAnswer: string;
    let options: string[];

    if (type !== "ambos") {
      const answer = type === "anterior" ? ant : pos;
      correctAnswer = String(answer);
      const wrongs = new Set<string>();
      let w = 0;
      while (wrongs.size < 3 && w < 60) {
        w++;
        const delta = randInt(rng, -3, 3);
        const cand = answer + delta;
        if (cand >= 0 && String(cand) !== correctAnswer) wrongs.add(String(cand));
      }
      options = [correctAnswer, ...Array.from(wrongs)].sort(() => rng() - 0.5);
    } else {
      correctAnswer = `${ant}·${pos}`;
      const wrongs = new Set<string>();
      let w = 0;
      while (wrongs.size < 3 && w < 80) {
        w++;
        const d1 = randInt(rng, -2, 2);
        const d2 = randInt(rng, -2, 2);
        const wa = ant + d1;
        const wp = pos + d2;
        const lbl = `${wa}·${wp}`;
        if (wa >= 0 && lbl !== correctAnswer) wrongs.add(lbl);
      }
      options = [correctAnswer, ...Array.from(wrongs)].sort(() => rng() - 0.5);
    }

    out.push({ number: n, type, anterior: ant, posterior: pos, correctAnswer, options });
  }

  return out;
}

export function validateVecinosAnswer(ex: VecinosExercise, answer: string): boolean {
  return answer === ex.correctAnswer;
}
