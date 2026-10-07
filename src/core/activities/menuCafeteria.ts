import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `menuCafeteria`: menú, generación de ejercicios y validación.
 *
 * No importa React ni nada del navegador. El renderer solo dibuja lo que esto
 * devuelve, y una hoja de ejercicios podrá hacerlo mismo más adelante.
 */

export interface MenuItem {
  emoji: string;
  name: string;
  price: number; // in euros
  category: "primer" | "segundo" | "bebida" | "postre";
}

export interface MenuCafeteriaExercise {
  menuItems: MenuItem[]; // the full menu card
  tray: MenuItem[]; // selected items for this exercise
  question: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
}

export const MENU: MenuItem[] = [
  { emoji: "🍝", name: "Pasta", price: 6, category: "primer" },
  { emoji: "🥗", name: "Ensalada", price: 4, category: "primer" },
  { emoji: "🍲", name: "Sopa", price: 3, category: "primer" },
  { emoji: "🍗", name: "Pollo", price: 8, category: "segundo" },
  { emoji: "🐟", name: "Pescado", price: 9, category: "segundo" },
  { emoji: "🥩", name: "Carne", price: 10, category: "segundo" },
  { emoji: "🥤", name: "Refresco", price: 2, category: "bebida" },
  { emoji: "💧", name: "Agua", price: 1, category: "bebida" },
  { emoji: "🍊", name: "Zumo", price: 3, category: "bebida" },
  { emoji: "🍮", name: "Flan", price: 3, category: "postre" },
  { emoji: "🍦", name: "Helado", price: 4, category: "postre" },
  { emoji: "🍓", name: "Fruta", price: 2, category: "postre" },
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

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Genera una sesión de 10 ejercicios de menú de cafetería. */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed: number,
): MenuCafeteriaExercise[] {
  const rng = lcg(seed);
  const out: MenuCafeteriaExercise[] = [];
  const count = 10;

  // Subset of menu shown (so it's not overwhelming)
  const menuSubset = shuffle(rng, [...MENU]).slice(0, 8);

  for (let i = 0; i < count; i++) {
    const numItems = difficulty === "easy" || difficulty === "medium" ? 2 : 3;

    // Pick random tray items
    const tray: MenuItem[] = [];
    const usedIdx = new Set<number>();
    while (tray.length < numItems) {
      const idx = Math.floor(rng() * menuSubset.length);
      if (!usedIdx.has(idx)) {
        usedIdx.add(idx);
        tray.push(menuSubset[idx]);
      }
    }

    const total = tray.reduce((s, m) => s + m.price, 0);

    if (difficulty === "easy" || difficulty === "medium") {
      // Sum the prices of the tray
      const question = `Pido ${tray.map((m) => `${m.emoji} ${m.name} (${m.price}€)`).join(" y ")}. ¿Cuánto pago en total?`;
      const correctAnswer = `${total}€`;
      const wrongs = new Set<string>();
      while (wrongs.size < 3) {
        const w = total + randInt(rng, -4, 4);
        if (w > 0 && `${w}€` !== correctAnswer) wrongs.add(`${w}€`);
      }
      const options = shuffle(rng, [correctAnswer, ...Array.from(wrongs)]).map((v) => ({
        label: v,
        value: v,
      }));
      out.push({ menuItems: menuSubset, tray, question, options, correctAnswer });
    } else if (difficulty === "hard") {
      // What can I buy with a budget?
      const budget = total + randInt(rng, -2, 5);
      const canBuy = budget >= total;
      const question = `Tengo ${budget}€. ¿Puedo pedir ${tray.map((m) => `${m.emoji} ${m.name} (${m.price}€)`).join(" + ")} = ${total}€ en total?`;
      const correctAnswer = canBuy ? "yes" : "no";
      const options = shuffle(rng, [
        { label: "Sí, me llega", value: "yes" },
        { label: "No, no tengo suficiente", value: "no" },
      ]);
      out.push({ menuItems: menuSubset, tray, question, options, correctAnswer });
    } else {
      // expert: Change calculation
      const payment = total + randInt(rng, 1, 10);
      const change = payment - total;
      const question = `El menú cuesta ${total}€. Pago con ${payment}€. ¿Cuánto me devuelven?`;
      const correctAnswer = `${change}€`;
      const wrongs = new Set<string>();
      while (wrongs.size < 3) {
        const w = change + randInt(rng, -3, 3);
        if (w >= 0 && `${w}€` !== correctAnswer) wrongs.add(`${w}€`);
      }
      const options = shuffle(rng, [correctAnswer, ...Array.from(wrongs)]).map((v) => ({
        label: v,
        value: v,
      }));
      out.push({ menuItems: menuSubset, tray, question, options, correctAnswer });
    }
  }

  return out;
}

/** Comprueba si la respuesta elegida es correcta. */
export function validateAnswer(ex: MenuCafeteriaExercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
