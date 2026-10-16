import type { ActivityDifficulty } from "../content/contracts";

export type CCType = "classify-shape" | "real-object";
export type CCShape = "circulo" | "circunferencia";

export interface CCExercise {
  type: CCType;
  shapeType: CCShape;
  objectName?: string;
  objectEmoji?: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

const REAL_OBJECTS: { name: string; emoji: string; type: CCShape }[] = [
  { name: "la tapa de una olla", emoji: "🍳", type: "circulo" },
  { name: "un aro de gimnasia", emoji: "⭕", type: "circunferencia" },
  { name: "la esfera de un reloj", emoji: "🕐", type: "circulo" },
  { name: "el borde de una rueda", emoji: "🚗", type: "circunferencia" },
  // 💰 (no 🪙): el coin U+1FA99 sale como □ en muchas pizarras Windows sin Segoe UI Emoji actualizado.
  { name: "una moneda", emoji: "💰", type: "circulo" },
  { name: "un salvavidas", emoji: "🔵", type: "circunferencia" },
  { name: "un botón", emoji: "🔘", type: "circulo" },
  { name: "una pulsera", emoji: "💍", type: "circunferencia" },
  { name: "una pizza entera", emoji: "🍕", type: "circulo" },
  { name: "el aro de baloncesto", emoji: "🏀", type: "circunferencia" },
  { name: "la cara de un CD", emoji: "💿", type: "circulo" },
  { name: "el borde de un vaso", emoji: "🥛", type: "circunferencia" },
  { name: "la yema de un huevo frito", emoji: "🍳", type: "circulo" },
  { name: "el aro de un cuaderno", emoji: "📓", type: "circunferencia" },
];

/** Enunciados distintos para no repetir la misma frase en toda la ficha. */
const SHAPE_QUESTIONS = [
  "¿Es un círculo o una circunferencia?",
  "¿Qué figura ves: círculo o circunferencia?",
  "Mira la figura. ¿Círculo o circunferencia?",
  "¿Cómo se llama esta figura?",
  "Señala si es círculo o circunferencia.",
  "¿Es relleno (círculo) o solo el borde (circunferencia)?",
  "Observa bien: ¿círculo o circunferencia?",
  "¿De qué figura se trata?",
  "Clasifica la figura: círculo o circunferencia.",
  "¿Es un círculo relleno o una circunferencia?",
];

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function makeShapeEx(shapeType: CCShape, question: string): CCExercise {
  return {
    type: "classify-shape",
    shapeType,
    question,
    options: ["Círculo", "Circunferencia"],
    correctAnswer: shapeType === "circulo" ? "Círculo" : "Circunferencia",
  };
}

function makeRealEx(obj: (typeof REAL_OBJECTS)[number]): CCExercise {
  return {
    type: "real-object",
    shapeType: obj.type,
    objectName: obj.name,
    objectEmoji: obj.emoji,
    question: `${obj.emoji} ${cap(obj.name)}… ¿es un círculo o una circunferencia?`,
    options: ["Círculo", "Circunferencia"],
    correctAnswer: obj.type === "circulo" ? "Círculo" : "Circunferencia",
  };
}

/**
 * Cuántos ejercicios SVG vs objeto real por dificultad.
 * easy: 4 figuras (solo 2 clases: círculo / circunferencia).
 * medium: mezcla con mayoría de objetos reales.
 * hard/expert: solo objetos reales.
 */
function planCounts(difficulty: ActivityDifficulty): { shapes: number; reals: number } {
  switch (difficulty) {
    case "easy":
      return { shapes: 4, reals: 0 };
    case "medium":
      return { shapes: 4, reals: 6 };
    case "hard":
    case "expert":
      return { shapes: 0, reals: 10 };
  }
}

/** Genera la sesión de círculo/circunferencia (4 en easy; 10 en el resto). */
export function generateCCSession(seed: number, difficulty: ActivityDifficulty): CCExercise[] {
  const rng = lcg(seed);
  const { shapes: nShapes, reals: nReals } = planCounts(difficulty);
  const out: CCExercise[] = [];

  if (nShapes > 0) {
    // Mitad círculo / mitad circunferencia (si impar, un extra al azar).
    const nCirc = Math.floor(nShapes / 2);
    const nCircunf = nShapes - nCirc;
    const shapeTypes = shuffle(rng, [
      ...Array<CCShape>(nCirc).fill("circulo"),
      ...Array<CCShape>(nCircunf).fill("circunferencia"),
    ]);
    const questions = shuffle(rng, SHAPE_QUESTIONS).slice(0, nShapes);
    for (let i = 0; i < nShapes; i++) {
      out.push(makeShapeEx(shapeTypes[i], questions[i]));
    }
  }

  if (nReals > 0) {
    const objects = shuffle(rng, REAL_OBJECTS).slice(0, nReals);
    for (const obj of objects) {
      out.push(makeRealEx(obj));
    }
  }

  return shuffle(rng, out);
}

/** Comprueba si la respuesta elegida es correcta. */
export function validateCCAnswer(ex: CCExercise, input: string): boolean {
  return input.toLowerCase() === ex.correctAnswer.toLowerCase();
}
