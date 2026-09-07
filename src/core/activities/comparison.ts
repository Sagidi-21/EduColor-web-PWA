import type { ActivityDifficulty } from "../content/contracts";

export type ComparisonDifficulty = ActivityDifficulty;
export type ComparisonChoice = "left" | "right" | "equal";
export type ComparisonQuestion = "more" | "less";

export const comparisonObjectSets = [
  "coches",
  "flores",
  "globos",
  "manzanas",
  "minions",
  "monstruos",
  "pajaros",
] as const;

export type ComparisonObjectSet = (typeof comparisonObjectSets)[number];

export interface ComparisonExercise {
  id: string;
  leftCount: number;
  rightCount: number;
  objectSet: ComparisonObjectSet;
  objectIndex: number;
  allowEqual: boolean;
  question: ComparisonQuestion;
  answer: ComparisonChoice;
}

const difficultyLimits: Record<ComparisonDifficulty, { maximum: number; allowEqual: boolean }> = {
  easy: { maximum: 5, allowEqual: false },
  medium: { maximum: 10, allowEqual: false },
  hard: { maximum: 19, allowEqual: true },
  expert: { maximum: 20, allowEqual: true },
};

function createRng(seed: number): () => number {
  let state = (Math.abs(seed) || 1) >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(rng: () => number, minimum: number, maximum: number): number {
  return minimum + Math.floor(rng() * (maximum - minimum + 1));
}

export function createComparisonExercise(
  seed: number,
  difficulty: ComparisonDifficulty,
): ComparisonExercise {
  const { maximum, allowEqual } = difficultyLimits[difficulty];
  const rng = createRng(seed);
  const leftCount = randomInt(rng, 1, maximum);
  let rightCount = randomInt(rng, 1, maximum);
  if (allowEqual && rng() < 0.35) {
    rightCount = leftCount;
  } else {
    while (!allowEqual && leftCount === rightCount) {
      rightCount = randomInt(rng, 1, maximum);
    }
  }
  const question: ComparisonQuestion =
    difficulty === "easy" ? "more" : rng() < 0.5 ? "more" : "less";
  const answer: ComparisonChoice =
    leftCount === rightCount
      ? "equal"
      : question === "more"
        ? leftCount > rightCount
          ? "left"
          : "right"
        : leftCount < rightCount
          ? "left"
          : "right";
  return {
    id: `comparison-${difficulty}-${seed}`,
    leftCount,
    rightCount,
    objectSet: comparisonObjectSets[randomInt(rng, 0, comparisonObjectSets.length - 1)],
    objectIndex: randomInt(rng, 0, 9),
    allowEqual,
    question,
    answer,
  };
}

export function isCorrectComparison(
  exercise: ComparisonExercise,
  choice: ComparisonChoice,
): boolean {
  return exercise.answer === choice;
}
