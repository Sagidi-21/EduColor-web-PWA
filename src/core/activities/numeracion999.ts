import type { ActivityDifficulty } from "../content/contracts";

export type N999Type = "cifra-to-cdu" | "cdu-to-cifra" | "valor-posicional" | "anterior-posterior";

export interface N999Exercise {
  type: N999Type;
  number: number;
  centenas: number;
  decenas: number;
  unidades: number;
  question: string;
  correctAnswer: string;
  options: string[];
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
function decompose(n: number) {
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  return { c, d, u };
}
function cduLabel(c: number, d: number, u: number) {
  return `${c}C ${d}D ${u}U`;
}
const RANGES: Record<ActivityDifficulty, [number, number]> = {
  easy: [100, 299],
  medium: [100, 499],
  hard: [100, 699],
  expert: [100, 999],
};
const TYPE_POOLS: Record<ActivityDifficulty, N999Type[]> = {
  easy: ["cifra-to-cdu", "cdu-to-cifra"],
  medium: ["cifra-to-cdu", "cdu-to-cifra", "valor-posicional"],
  hard: ["cifra-to-cdu", "cdu-to-cifra", "valor-posicional", "anterior-posterior"],
  expert: ["cifra-to-cdu", "cdu-to-cifra", "valor-posicional", "anterior-posterior"],
};

export function generateSession(difficulty: ActivityDifficulty, seed = 42): N999Exercise[] {
  const rng = lcg(seed);
  const [min, max] = RANGES[difficulty];
  const types = TYPE_POOLS[difficulty];
  const out: N999Exercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < 10 && tries < 300) {
    tries++;
    const number = randInt(rng, min, max);
    const type = types[Math.floor(rng() * types.length)];
    const key = `${number}-${type}`;
    if (used.has(key)) continue;
    used.add(key);

    const { c, d, u } = decompose(number);

    let question: string;
    let correctAnswer: string;
    let options: string[];

    if (type === "cifra-to-cdu") {
      question = `Descompón el número ${number} en centenas, decenas y unidades:`;
      correctAnswer = cduLabel(c, d, u);
      const wrongs = new Set<string>([correctAnswer]);
      while (wrongs.size < 4) {
        const wn = randInt(rng, min, max);
        const { c: wc, d: wd, u: wu } = decompose(wn);
        wrongs.add(cduLabel(wc, wd, wu));
      }
      options = Array.from(wrongs).sort(() => rng() - 0.5);
    } else if (type === "cdu-to-cifra") {
      question = `¿Qué número forman ${c} centenas, ${d} decenas y ${u} unidades?`;
      correctAnswer = String(number);
      const wrongs = new Set<string>([correctAnswer]);
      while (wrongs.size < 4) {
        wrongs.add(String(randInt(rng, min, max)));
      }
      options = Array.from(wrongs).sort(() => rng() - 0.5);
    } else if (type === "valor-posicional") {
      const pick = rng() < 0.33 ? "C" : rng() < 0.5 ? "D" : "U";
      const val = pick === "C" ? c * 100 : pick === "D" ? d * 10 : u;
      const name = pick === "C" ? "centenas" : pick === "D" ? "decenas" : "unidades";
      question = `En el número ${number}, ¿cuánto valen las ${name}?`;
      correctAnswer = String(val);
      const base = pick === "C" ? 100 : pick === "D" ? 10 : 1;
      const wrongs = new Set<string>([correctAnswer]);
      while (wrongs.size < 4) {
        const wc = randInt(rng, 0, 9);
        wrongs.add(String(wc * base));
      }
      options = Array.from(wrongs).sort((a, b) => Number(a) - Number(b));
    } else {
      // anterior-posterior
      const isAnterior = rng() > 0.5;
      const step = rng() > 0.5 ? 10 : 100;
      const target = isAnterior ? number - step : number + step;
      if (target < 100 || target > 999) continue;
      question = isAnterior
        ? `¿Qué número va ${step === 10 ? "10" : "100"} antes que el ${number}?`
        : `¿Qué número va ${step === 10 ? "10" : "100"} después que el ${number}?`;
      correctAnswer = String(target);
      const wrongs = new Set<string>([correctAnswer]);
      while (wrongs.size < 4) {
        const delta = randInt(rng, 1, 4) * step * (rng() > 0.5 ? 1 : -1);
        const wn = number + delta;
        if (wn >= 100 && wn <= 999) wrongs.add(String(wn));
      }
      options = Array.from(wrongs).sort((a, b) => Number(a) - Number(b));
    }

    if (options.length >= 4) {
      out.push({
        type,
        number,
        centenas: c,
        decenas: d,
        unidades: u,
        question,
        correctAnswer,
        options,
      });
    }
  }
  return out;
}

export function validateAnswer(ex: N999Exercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
