export interface RepartoIgualExercise {
  total: number;
  groups: number;
  itemsPerGroup: number;
}

export function generateSession(
  difficulty: "easy" | "medium" | "hard" | "expert",
  seed: number = Date.now() % 999983,
): RepartoIgualExercise[] {
  let currentSeed = seed;
  const rnd = (min: number, max: number) => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return Math.floor((currentSeed / 233280) * (max - min + 1)) + min;
  };

  const count = 10;
  const exercises: RepartoIgualExercise[] = [];

  for (let i = 0; i < count; i++) {
    let groups: number;
    let itemsPerGroup: number;
    if (difficulty === "easy") {
      groups = rnd(2, 3);
      itemsPerGroup = rnd(2, 4);
    } else if (difficulty === "medium") {
      groups = rnd(2, 5);
      itemsPerGroup = rnd(2, 5);
    } else if (difficulty === "hard") {
      groups = rnd(2, 6);
      itemsPerGroup = rnd(3, 8);
    } else {
      // expert
      groups = rnd(3, 10);
      itemsPerGroup = rnd(4, 10);
    }

    exercises.push({
      total: groups * itemsPerGroup,
      groups,
      itemsPerGroup,
    });
  }

  return exercises;
}

export function validateAnswer(exercise: RepartoIgualExercise, answer: number): boolean {
  return answer === exercise.itemsPerGroup;
}
