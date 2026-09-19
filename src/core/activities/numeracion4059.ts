import type { ActivityDifficulty } from "../content/contracts";

export type Num4059Type = "identify" | "units" | "sequence" | "jump";

export interface Num4059Exercise {
  type: Num4059Type;
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

// Tipos activos por nivel
const TYPES: Record<ActivityDifficulty, Num4059Type[]> = {
  easy: ["identify"],
  medium: ["units"],
  hard: ["sequence"],
  expert: ["identify", "units", "sequence", "jump"],
};

export function generateSession(difficulty: ActivityDifficulty, seed = 42): Num4059Exercise[] {
  const rng = lcg(seed);
  const count = COUNTS[difficulty];
  const types = TYPES[difficulty];
  const used = new Set<string>();
  const out: Num4059Exercise[] = [];
  let tries = 0;

  while (out.length < count && tries < count * 30) {
    tries++;
    const n = randInt(rng, 40, 59);
    const activeType = types[out.length % types.length];

    if (activeType === "identify") {
      const key = `id-${n}`;
      if (used.has(key)) continue;
      used.add(key);

      const distSet = new Set<number>([n]);
      const cands = [n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 40 && x <= 59);
      for (const c of shuffle(cands, rng)) {
        if (distSet.size >= 4) break;
        distSet.add(c);
      }
      while (distSet.size < 4) {
        distSet.add(randInt(rng, 40, 59));
      }

      out.push({
        type: "identify",
        number: n,
        question: "¿Qué número ves?",
        options: shuffle([...distSet].slice(0, 4) as number[], rng),
        answer: n,
      });
    } else if (activeType === "units") {
      const key = `un-${n}`;
      if (used.has(key)) continue;
      used.add(key);
      const dec = Math.floor(n / 10);
      out.push({
        type: "units",
        number: n,
        question: `${n} = ${dec} decenas + ___ unidades`,
        answer: n % 10,
      });
    } else if (activeType === "sequence") {
      const isAnterior = rng() > 0.5;
      const target = isAnterior ? n - 1 : n + 1;
      if (target < 40 || target > 59) continue;
      const key = `seq-${isAnterior ? "a" : "p"}-${n}`;
      if (used.has(key)) continue;
      used.add(key);
      const q = isAnterior
        ? `El número anterior a ${n} es ___`
        : `El número posterior a ${n} es ___`;
      out.push({ type: "sequence", number: n, question: q, answer: target });
    } else {
      // jump: ±10
      const jumpUp = rng() > 0.5;
      const target = jumpUp ? n + 10 : n - 10;
      if (target < 40 || target > 59) continue;
      const key = `jump-${jumpUp ? "+" : "-"}-${n}`;
      if (used.has(key)) continue;
      used.add(key);
      const q = jumpUp ? `10 más que ${n} es ___` : `10 menos que ${n} es ___`;
      out.push({ type: "jump", number: n, question: q, answer: target });
    }
  }
  return out;
}

export function validateAnswer(ex: Num4059Exercise, input: string): boolean {
  return input.trim() === String(ex.answer);
}