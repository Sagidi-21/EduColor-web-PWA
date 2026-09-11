import type { ActivityDifficulty } from "../content/contracts";

export type NumExType = "identify" | "units" | "sequence";

export interface NumExercise {
  type: NumExType;
  number: number;
  question: string;
  options?: number[];
  answer: number;
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

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const COUNTS: Record<ActivityDifficulty, number> = { easy: 10, medium: 10, hard: 10, expert: 10 };

export function generateNumeracion1119Session(
  seed: number,
  difficulty: ActivityDifficulty
): NumExercise[] {
  const rng = lcg(seed);
  const count = COUNTS[difficulty];
  const used = new Set<string>();
  const out: NumExercise[] = [];
  let tries = 0;

  while (out.length < count && tries < count * 30) {
    tries++;
    const n = randInt(rng, 11, 19);

    const activeType: NumExType =
      difficulty === "expert"
        ? (["identify", "units", "sequence"] as NumExType[])[out.length % 3]
        : difficulty === "easy"
          ? "identify"
          : difficulty === "medium"
            ? "units"
            : "sequence";

    if (activeType === "identify") {
      const key = `id-${n}`;
      if (used.has(key)) continue;
      used.add(key);
      const distSet = new Set<number>([n]);
      const cands = [n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 11 && x <= 19);
      for (const c of shuffle(cands, rng)) {
        if (distSet.size >= 4) break;
        distSet.add(c);
      }
      while (distSet.size < 4) {
        const r = randInt(rng, 11, 19);
        distSet.add(r);
      }
      out.push({
        type: "identify",
        number: n,
        question: "¿Qué número hay?",
        options: shuffle([...distSet].slice(0, 4) as number[], rng),
        answer: n,
      });
    } else if (activeType === "units") {
      const key = `un-${n}`;
      if (used.has(key)) continue;
      used.add(key);
      out.push({
        type: "units",
        number: n,
        question: `${n} = 1 decena + ___ unidades`,
        answer: n % 10,
      });
    } else {
      const isAnterior = rng() > 0.5;
      const target = isAnterior ? n - 1 : n + 1;
      if (target < 10 || target > 20) continue;
      const key = `seq-${isAnterior ? "a" : "p"}-${n}`;
      if (used.has(key)) continue;
      used.add(key);
      const q = isAnterior
        ? `El número anterior a ${n} es ___`
        : `El número posterior a ${n} es ___`;
      out.push({ type: "sequence", number: n, question: q, answer: target });
    }
  }
  return out;
}

export function validateNumeracion1119Answer(ex: NumExercise, input: string): boolean {
  return input.trim() === String(ex.answer);
}
