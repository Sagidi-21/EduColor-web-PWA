export interface PriceItem {
  emoji: string;
  name: string;
  price: number; // en euros
}

export interface InventarProblemaExercise {
  items: PriceItem[];
  budget?: number; // dinero disponible
  question: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
}

/**
 * Catálogo de artículos. Idéntico al original de Electron.
 * Solo se modifica si el profesor de Matemáticas lo pide.
 */
const ITEMS: PriceItem[] = [
  { emoji: "👟", name: "zapatillas", price: 30 },
  { emoji: "🎒", name: "mochila", price: 40 },
  { emoji: "📚", name: "libros", price: 15 },
  { emoji: "🧸", name: "peluche", price: 12 },
  { emoji: "🚲", name: "bicicleta", price: 80 },
  { emoji: "🎮", name: "videojuego", price: 25 },
  { emoji: "🪁", name: "cometa", price: 8 },
  { emoji: "⚽", name: "balón", price: 18 },
  { emoji: "🎨", name: "pinturas", price: 10 },
  { emoji: "🎂", name: "tarta", price: 20 },
];

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

/** Primera letra en mayúscula (etiquetas de opciones y nombres en pantalla). */
export function capitalizar(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Genera una sesión de 10 ejercicios de «inventar problema».
 *
 * Tipos por dificultad:
 *   easy   → ¿Qué artículo es MÁS BARATO? o MÁS CARO? (2 opciones, mezclado)
 *   medium → ¿Cuánto cuestan los dos artículos juntos? (4 opciones)
 *   hard   → ¿Puedo comprarlo con este presupuesto? (sí/no)
 *   expert → ¿Cuánto me devuelven de cambio? (4 opciones)
 */
export function generateSession(difficulty: string, seed = 42): InventarProblemaExercise[] {
  const rng = lcg(seed);
  const out: InventarProblemaExercise[] = [];
  const count = 10;
  const used = new Set<string>();

  let tries = 0;
  while (out.length < count && tries < 300) {
    tries++;

    const idxA = Math.floor(rng() * ITEMS.length);
    let idxB = Math.floor(rng() * ITEMS.length);
    while (idxB === idxA) idxB = Math.floor(rng() * ITEMS.length);

    const itemA = ITEMS[idxA];
    const itemB = ITEMS[idxB];
    const key = `${itemA.name}-${itemB.name}`;
    if (used.has(key)) continue;
    used.add(key);

    const totalPrice = itemA.price + itemB.price;
    const budget = totalPrice + randInt(rng, -15, 25);

    if (difficulty === "easy") {
      const askCheaper = rng() < 0.5;
      const cheaper = itemA.price < itemB.price ? itemA : itemB;
      const dearer = itemA.price > itemB.price ? itemA : itemB;
      const target = askCheaper ? cheaper : dearer;
      out.push({
        items: [itemA, itemB],
        question: askCheaper ? "¿Qué artículo es MÁS BARATO?" : "¿Qué artículo es MÁS CARO?",
        options: [
          {
            label: `${itemA.emoji} ${capitalizar(itemA.name)} (${itemA.price}€)`,
            value: itemA.name,
          },
          {
            label: `${itemB.emoji} ${capitalizar(itemB.name)} (${itemB.price}€)`,
            value: itemB.name,
          },
        ].sort(() => rng() - 0.5),
        correctAnswer: target.name,
      });
    } else if (difficulty === "medium") {
      out.push({
        items: [itemA, itemB],
        question: "¿Cuánto cuestan los dos artículos juntos?",
        options: [
          { label: `${totalPrice}€`, value: String(totalPrice) },
          { label: `${totalPrice + 5}€`, value: String(totalPrice + 5) },
          { label: `${totalPrice - 5}€`, value: String(totalPrice - 5) },
          { label: `${totalPrice + 10}€`, value: String(totalPrice + 10) },
        ].sort(() => rng() - 0.5),
        correctAnswer: String(totalPrice),
      });
    } else if (difficulty === "hard") {
      const canBuy = budget >= totalPrice;
      out.push({
        items: [itemA, itemB],
        budget,
        question: `Tengo ${budget}€. ¿Puedo comprar ${itemA.emoji} (${itemA.price}€) y ${itemB.emoji} (${itemB.price}€)?`,
        options: [
          { label: "Sí, me llega", value: "yes" },
          { label: "No, no tengo suficiente", value: "no" },
        ].sort(() => rng() - 0.5),
        correctAnswer: canBuy ? "yes" : "no",
      });
    } else {
      // expert: cambio
      const safeBudget = totalPrice + randInt(rng, 5, 20);
      const change = safeBudget - totalPrice;
      out.push({
        items: [itemA, itemB],
        budget: safeBudget,
        question: `Compro ${itemA.emoji} (${itemA.price}€) y ${itemB.emoji} (${itemB.price}€). Pago con ${safeBudget}€. ¿Cuánto me devuelven?`,
        options: [
          { label: `${change}€`, value: String(change) },
          { label: `${change + 5}€`, value: String(change + 5) },
          { label: `${Math.max(0, change - 5)}€`, value: String(Math.max(0, change - 5)) },
          { label: `${totalPrice}€`, value: String(totalPrice) },
        ].sort(() => rng() - 0.5),
        correctAnswer: String(change),
      });
    }
  }

  return out;
}

export function validateAnswer(ex: InventarProblemaExercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
