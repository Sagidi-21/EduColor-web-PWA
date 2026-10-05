export type LecturaType = "cifra-to-palabra" | "palabra-to-cifra";

export interface LecturaExercise {
  number: number;
  type: LecturaType;
  word: string;
  correctAnswer: string;
  options: string[];
}

/** Generador congruencial lineal — misma implementación que el resto de motores. */
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

/**
 * Tabla de palabras para números del 0 al 90 (solo decenas exactas).
 * Sin cambios respecto al original de Electron.
 */
const WORDS: Record<number, string> = {
  0: "cero",
  1: "uno",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
  11: "once",
  12: "doce",
  13: "trece",
  14: "catorce",
  15: "quince",
  16: "dieciséis",
  17: "diecisiete",
  18: "dieciocho",
  19: "diecinueve",
  20: "veinte",
  21: "veintiuno",
  22: "veintidós",
  23: "veintitrés",
  24: "veinticuatro",
  25: "veinticinco",
  26: "veintiséis",
  27: "veintisiete",
  28: "veintiocho",
  29: "veintinueve",
  30: "treinta",
  40: "cuarenta",
  50: "cincuenta",
  60: "sesenta",
  70: "setenta",
  80: "ochenta",
  90: "noventa",
};

/**
 * Convierte un número a su palabra en español.
 * Cubre 0–99 con la regla «decena y unidad».
 * Sin cambios respecto al original de Electron.
 */
export function numberToWord(n: number): string {
  if (WORDS[n]) return WORDS[n];
  if (n > 30) {
    const tens = Math.floor(n / 10) * 10;
    const units = n % 10;
    return units === 0 ? WORDS[tens] : `${WORDS[tens]} y ${WORDS[units]}`;
  }
  return String(n);
}

/**
 * Genera una sesión de 10 ejercicios de lectura de números.
 *
 * Rango por dificultad (igual que Electron):
 *   easy   → 0–9   (solo cifra→palabra)
 *   medium → 0–19  (solo cifra→palabra)
 *   hard   → 0–59  (mix cifra↔palabra)
 *   expert → 0–99  (mix cifra↔palabra)
 *
 * La semilla es determinista para que «Repetir» dé exactamente la misma hoja.
 */
export function generateSession(difficulty: string, seed = 42): LecturaExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: LecturaExercise[] = [];
  const used = new Set<number>();
  let tries = 0;

  const maxN =
    difficulty === "easy" ? 9 : difficulty === "medium" ? 19 : difficulty === "hard" ? 59 : 99;

  while (out.length < count && tries < 300) {
    tries++;

    const n = randInt(rng, 0, maxN);
    if (used.has(n)) continue;
    used.add(n);

    // cifra→palabra para easy/medium; mix para hard/expert
    let type: LecturaType;
    if (difficulty === "easy" || difficulty === "medium") {
      type = "cifra-to-palabra";
    } else {
      type = rng() > 0.5 ? "cifra-to-palabra" : "palabra-to-cifra";
    }

    const word = numberToWord(n);
    const correctAnswer = type === "cifra-to-palabra" ? word : String(n);

    // Distractores cercanos al número correcto
    const distractorNums = new Set<number>();
    let w = 0;
    while (distractorNums.size < 3 && w < 60) {
      w++;
      const delta = randInt(rng, -5, 5);
      const cand = n + delta;
      if (cand >= 0 && cand <= maxN && cand !== n) distractorNums.add(cand);
    }

    let options: string[];
    if (type === "cifra-to-palabra") {
      options = [word, ...Array.from(distractorNums).map(numberToWord)].sort(() => rng() - 0.5);
    } else {
      options = [String(n), ...Array.from(distractorNums).map(String)].sort(() => rng() - 0.5);
    }

    out.push({ number: n, type, word, correctAnswer, options });
  }

  return out;
}

export function validateAnswer(ex: LecturaExercise, answer: string): boolean {
  return answer === ex.correctAnswer;
}
