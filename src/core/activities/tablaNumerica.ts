import type { ActivityDifficulty } from "../content/contracts";

const SYMBOLS = ["★", "♥", "☾", "⚡", "◆", "●", "▲", "■", "✚", "◇"];

export type TablaNumericaType = "missing" | "symbol" | "colorear";

export type TablaNumericaCellState = "visible" | "blank" | "target" | "symbol";

export interface TablaNumericaExercise {
  type: TablaNumericaType;
  question: string;
  gridState: TablaNumericaCellState[];
  symbolMap?: Record<number, string>;
  /** Símbolo(s) a buscar; en medium puede ser varios unidos con espacio. */
  targetSymbol?: string;
  /** Símbolos concretos a localizar (medium: 2–4). */
  targetSymbols?: string[];
  targetIndex: number;
  answer: string;
  /** Casillas correctas a pulsar (medium símbolos / hard-expert colorear). */
  validSet?: number[];
  ruleLabel?: string;
}

// ── LCG determinista ────────────────────────────────────────────────────────

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

const GRID_SIZE = 100;
const EXERCISE_COUNT = 10;
/** En easy, la tabla llega hasta la respuesta + este margen (no hasta 99). */
const EASY_EXTRA = 10;

/**
 * Genera 10 ejercicios sobre la tabla del 0 al 99.
 *
 * - easy:   casilla amarilla oculta (`missing`); tabla solo hasta respuesta + 10.
 * - medium: 4–10 símbolos en la tabla; hay que localizar 2–4 de ellos.
 * - hard:   colorear todos los números con una misma unidad.
 * - expert: alterna coloreado por unidades y por decenas.
 */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): TablaNumericaExercise[] {
  const rng = lcg(seed);
  const out: TablaNumericaExercise[] = [];

  if (difficulty === "easy") {
    const used = new Set<number>();

    while (out.length < EXERCISE_COUNT) {
      const target = randInt(rng, 1, 98);
      if (used.has(target)) continue;
      used.add(target);

      // p. ej. respuesta 10 → casillas 0…20 (no hasta 99)
      const gridLen = Math.min(GRID_SIZE, target + EASY_EXTRA + 1);
      const gridState: TablaNumericaCellState[] = new Array(gridLen).fill("visible");
      gridState[target] = "target";
      for (let i = 0; i < gridLen; i++) {
        if (i !== target && rng() < 0.12) gridState[i] = "blank";
      }

      out.push({
        type: "missing",
        question: "¿Qué número falta en la casilla amarilla?",
        gridState,
        targetIndex: target,
        answer: String(target),
      });
    }

    return out;
  }

  if (difficulty === "medium") {
    const usedAsk = new Set<number>();

    while (out.length < EXERCISE_COUNT) {
      const gridCount = randInt(rng, 4, 10);
      const askCount = randInt(rng, 2, Math.min(4, gridCount));

      const positions: number[] = [];
      const posSet = new Set<number>();
      let tries = 0;
      while (positions.length < gridCount && tries++ < 400) {
        const pos = randInt(rng, 2, 97);
        if (!posSet.has(pos)) {
          posSet.add(pos);
          positions.push(pos);
        }
      }
      if (positions.length < gridCount) continue;

      const syms = shuffle([...SYMBOLS], rng).slice(0, gridCount);
      const symbolMap: Record<number, string> = {};
      positions.forEach((pos, i) => {
        symbolMap[pos] = syms[i];
      });

      const askPositions = shuffle([...positions], rng).slice(0, askCount);
      if (askPositions.some((p) => usedAsk.has(p))) continue;
      askPositions.forEach((p) => usedAsk.add(p));

      const targetSymbols = askPositions.map((p) => symbolMap[p]);
      const gridState: TablaNumericaCellState[] = new Array(GRID_SIZE).fill("visible");
      positions.forEach((pos) => {
        gridState[pos] = "symbol";
      });

      out.push({
        type: "symbol",
        question: `Busca estos símbolos: ${targetSymbols.join(" ")}`,
        gridState,
        symbolMap,
        targetSymbol: targetSymbols.join(" "),
        targetSymbols,
        targetIndex: askPositions[0],
        answer: askPositions.join(", "),
        validSet: askPositions,
      });
    }

    return out;
  }

  const usedRules = new Set<string>();

  while (out.length < EXERCISE_COUNT) {
    // `hard` alterna unidades y decenas de forma determinista; `expert` las
    // mezcla al azar. Sin esta alternancia, `hard` solo dispondría de 9 reglas
    // (u1..u9) para 10 ejercicios y el bucle no terminaría nunca.
    const isDecenas = difficulty === "expert" ? rng() > 0.5 : out.length % 2 === 1;
    const digit = randInt(rng, 1, 9);
    const key = `${isDecenas ? "d" : "u"}${digit}`;
    if (usedRules.has(key)) continue;
    usedRules.add(key);

    const validSet: number[] = [];
    for (let i = 0; i <= 99; i++) {
      const dec = Math.floor(i / 10);
      const uni = i % 10;
      if (isDecenas ? dec === digit : uni === digit) validSet.push(i);
    }

    const ruleLabel = isDecenas ? `${digit} decenas` : `${digit} unidades`;
    out.push({
      type: "colorear",
      question: `Haz clic en todos los números con ${ruleLabel}.`,
      gridState: new Array(GRID_SIZE).fill("visible"),
      targetIndex: validSet[0],
      answer: ruleLabel,
      validSet,
      ruleLabel,
    });
  }

  return out;
}

export function validateAnswer(exercise: TablaNumericaExercise, answer: string): boolean {
  return exercise.answer === answer;
}
