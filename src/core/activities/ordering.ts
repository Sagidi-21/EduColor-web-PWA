import type { ActivityDifficulty } from "../content/contracts";

export type OrderingDirection = "ascending" | "descending";

export interface OrderingExercise {
  id: string;
  numbers: readonly number[];
  sortedNumbers: readonly number[];
  direction: OrderingDirection;
}

interface OrderingConfiguration {
  exerciseCount: number;
  cardCount: number;
  minimum: number;
  maximum: number;
  direction: "ascending" | "both";
}

const configurations: Record<ActivityDifficulty, OrderingConfiguration> = {
  easy: { exerciseCount: 10, cardCount: 3, minimum: 1, maximum: 10, direction: "ascending" },
  medium: { exerciseCount: 10, cardCount: 4, minimum: 1, maximum: 20, direction: "both" },
  hard: { exerciseCount: 10, cardCount: 5, minimum: 1, maximum: 20, direction: "both" },
  expert: { exerciseCount: 10, cardCount: 5, minimum: 10, maximum: 99, direction: "both" },
};

function createRng(seed: number): () => number {
  let state = (Math.abs(seed) || 1) >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffled<T>(values: readonly T[], rng: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createOrderingSession(
  seed: number,
  difficulty: ActivityDifficulty,
): readonly OrderingExercise[] {
  const configuration = configurations[difficulty];
  const rng = createRng(seed);
  const pool = Array.from(
    { length: configuration.maximum - configuration.minimum + 1 },
    (_, index) => configuration.minimum + index,
  );

  return Array.from({ length: configuration.exerciseCount }, (_, index) => {
    const direction: OrderingDirection =
      configuration.direction === "both" && rng() < 0.5 ? "descending" : "ascending";
    const selectedNumbers = shuffled(pool, rng).slice(0, configuration.cardCount);
    const sortedNumbers = [...selectedNumbers].sort((left, right) =>
      direction === "ascending" ? left - right : right - left,
    );
    let numbers = shuffled(selectedNumbers, rng);
    while (numbers.every((number, position) => number === sortedNumbers[position])) {
      numbers = shuffled(selectedNumbers, rng);
    }
    return {
      id: `ordering-${difficulty}-${seed}-${index}`,
      numbers,
      sortedNumbers,
      direction,
    };
  });
}

export function isCorrectOrderingValue(
  exercise: OrderingExercise,
  position: number,
  value: number,
): boolean {
  return exercise.sortedNumbers[position] === value;
}
