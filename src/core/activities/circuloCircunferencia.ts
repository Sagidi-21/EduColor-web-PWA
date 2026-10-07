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
  { name: "una moneda", emoji: "🪙", type: "circulo" },
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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Genera una sesión de 10 ejercicios de círculo/circunferencia. */
export function generateCCSession(seed: number, difficulty: ActivityDifficulty): CCExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: CCExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < count && tries < 400) {
    tries++;

    const useReal =
      difficulty === "hard" || difficulty === "expert" || (difficulty === "medium" && rng() > 0.4);

    if (!useReal) {
      const shapeType: CCShape = rng() > 0.5 ? "circulo" : "circunferencia";
      const key = `shape-${shapeType}-${out.length}`;
      if (used.has(key)) {
        tries++;
        continue;
      }
      used.add(key);
      out.push({
        type: "classify-shape",
        shapeType,
        question: "¿Es un círculo o una circunferencia?",
        options: ["Círculo", "Circunferencia"],
        correctAnswer: shapeType === "circulo" ? "Círculo" : "Circunferencia",
      });
    } else {
      const obj = REAL_OBJECTS[randInt(rng, 0, REAL_OBJECTS.length - 1)];
      if (used.has(obj.name)) continue;
      used.add(obj.name);
      out.push({
        type: "real-object",
        shapeType: obj.type,
        objectName: obj.name,
        objectEmoji: obj.emoji,
        question: `${obj.emoji} ${cap(obj.name)}… ¿es un círculo o una circunferencia?`,
        options: ["Círculo", "Circunferencia"],
        correctAnswer: obj.type === "circulo" ? "Círculo" : "Circunferencia",
      });
    }
  }
  return out;
}

/** Comprueba si la respuesta elegida es correcta. */
export function validateCCAnswer(ex: CCExercise, input: string): boolean {
  return input.toLowerCase() === ex.correctAnswer.toLowerCase();
}
