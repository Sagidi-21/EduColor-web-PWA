import type { ActivityDifficulty } from "../content/contracts";

export type Num6099Type = "identify" | "units" | "sequence" | "word" | "jump";

export interface Num6099Exercise {
  type: Num6099Type;
  number: number;
  question: string;
  options?: string[];
  answer: string;
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

const WORDS_DECENAS: Record<number, string> = {
  6: "sesenta",
  7: "setenta",
  8: "ochenta",
  9: "noventa",
};
const WORDS_UNIDADES: Record<number, string> = {
  0: "",
  1: "uno",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
};

function numberToWord(n: number): string {
  const dec = Math.floor(n / 10);
  const uni = n % 10;
  if (uni === 0) return WORDS_DECENAS[dec];
  return `${WORDS_DECENAS[dec]} y ${WORDS_UNIDADES[uni]}`;
}

const COUNTS: Record<ActivityDifficulty, number> = { easy: 10, medium: 10, hard: 10, expert: 10 };

const TYPES: Record<ActivityDifficulty, Num6099Type[]> = {
  easy: ["identify"],
  medium: ["units", "word"],
  hard: ["sequence"],
  expert: ["identify", "units", "sequence", "word", "jump"],
};

export function generateSession(difficulty: ActivityDifficulty, seed = 42): Num6099Exercise[] {
  const rng = lcg(seed);
  const count = COUNTS[difficulty];
  const types = TYPES[difficulty];
  const used = new Set<string>();
  const out: Num6099Exercise[] = [];
  let tries = 0;

  while (out.length < count && tries < count * 30) {
    tries++;

    let n: number;
    if (difficulty === "easy") {
      n = randInt(rng, 60, 79);
    } else if (difficulty === "medium") {
      n = randInt(rng, 80, 99);
    } else {
      n = randInt(rng, 60, 99);
    }

    const activeType = types[out.length % types.length];

    if (activeType === "identify") {
      const key = `id-${n}`;
      if (used.has(key)) continue;
      used.add(key);

      const distSet = new Set<number>([n]);
      const cands = [n - 2, n - 1, n + 1, n + 2, n - 10, n + 10].filter((x) => x >= 60 && x <= 99);
      for (const c of shuffle(cands, rng)) {
        if (distSet.size >= 4) break;
        distSet.add(c);
      }
      while (distSet.size < 4) {
        distSet.add(randInt(rng, 60, 99));
      }

      out.push({
        type: "identify",
        number: n,
        question: "¿Qué número representan estos bloques?",
        options: shuffle([...distSet].map(String), rng),
        answer: String(n),
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
        answer: String(n % 10),
      });
    } else if (activeType === "word") {
      const key = `wd-${n}`;
      if (used.has(key)) continue;
      used.add(key);

      const correctWord = numberToWord(n);

      // We will make this a multiple choice question since typing words can be hard for kids
      const distSet = new Set<string>([correctWord]);
      const cands = [n - 1, n + 1, n - 10, n + 10].filter((x) => x >= 60 && x <= 99);
      for (const c of shuffle(cands, rng)) {
        if (distSet.size >= 3) break;
        distSet.add(numberToWord(c));
      }
      while (distSet.size < 3) {
        distSet.add(numberToWord(randInt(rng, 60, 99)));
      }

      out.push({
        type: "word",
        number: n,
        question: `¿Cómo se escribe el número ${n} en letras?`,
        options: shuffle([...distSet], rng),
        answer: correctWord,
      });
    } else if (activeType === "sequence") {
      const isAnterior = rng() > 0.5;
      const target = isAnterior ? n - 1 : n + 1;
      if (target < 60 || target > 99) continue;
      const key = `seq-${isAnterior ? "a" : "p"}-${n}`;
      if (used.has(key)) continue;
      used.add(key);
      const q = isAnterior
        ? `El número anterior a ${n} es ___`
        : `El número posterior a ${n} es ___`;
      out.push({ type: "sequence", number: n, question: q, answer: String(target) });
    } else {
      // jump: ±10
      const jumpUp = rng() > 0.5;
      const target = jumpUp ? n + 10 : n - 10;
      if (target < 60 || target > 99) continue;
      const key = `jump-${jumpUp ? "+" : "-"}-${n}`;
      if (used.has(key)) continue;
      used.add(key);
      const q = jumpUp ? `10 más que ${n} es ___` : `10 menos que ${n} es ___`;
      out.push({ type: "jump", number: n, question: q, answer: String(target) });
    }
  }
  return out;
}

export function validateAnswer(ex: Num6099Exercise, input: string): boolean {
  return input.trim().toLowerCase() === ex.answer.toLowerCase();
}
