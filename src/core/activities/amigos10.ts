export type Amigos10Type = "complement" | "missing-addend" | "decompose";

/** Generador congruencial lineal — misma implementación que el resto de motores. */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export interface Amigos10Exercise {
  given: number; // the known addend
  complement: number; // the answer (given + complement = 10)
  type: Amigos10Type;
  question: string;
  correctAnswer: string;
  options: string[];
}

export const SESSION_SIZE = 10;

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateSession(difficulty: string, seed = 42): Amigos10Exercise[] {
  const rng = lcg(seed);
  const out: Amigos10Exercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < SESSION_SIZE && tries < 300) {
    tries++;

    // For easy: given is 1-5 (so complement >= 5, visually obvious)
    // For harder: given is 1-9 freely
    const maxGiven = difficulty === "easy" ? 5 : 9;
    const given = randInt(rng, 1, maxGiven);
    const complement = 10 - given;

    let type: Amigos10Type;
    if (difficulty === "easy") type = "complement";
    else if (difficulty === "medium") type = rng() > 0.5 ? "complement" : "missing-addend";
    else type = rng() < 0.33 ? "complement" : rng() < 0.5 ? "missing-addend" : "decompose";

    const key = `${given}-${type}`;
    if (used.has(key)) continue;
    used.add(key);

    let question: string;
    if (type === "complement") {
      question = `¿Cuánto le falta al ${given} para llegar a 10?`;
    } else if (type === "missing-addend") {
      question = `${given} + ___ = 10`;
    } else {
      question = `10 − ${given} = ___`;
    }

    const correctAnswer = String(complement);
    const wrongs = new Set<string>();
    let w = 0;
    while (wrongs.size < 3 && w < 40) {
      w++;
      const cand = complement + randInt(rng, -3, 3);
      if (cand >= 0 && cand <= 10 && String(cand) !== correctAnswer) wrongs.add(String(cand));
    }
    const options = [correctAnswer, ...Array.from(wrongs)].sort(() => rng() - 0.5);

    out.push({ given, complement, type, question, correctAnswer, options });
  }

  return out;
}

export function validateAnswer(ex: Amigos10Exercise, answer: string): boolean {
  return answer === ex.correctAnswer;
}
