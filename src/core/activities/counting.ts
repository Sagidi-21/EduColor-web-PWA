export interface CountingExercise {
  id: string;
  objects: number;
  choices: number[];
  answer: number;
}

/** Generador determinista, portado conceptualmente del motor de conteo de EduColor Electron. */
export function createCountingExercise(seed: number): CountingExercise {
  const objects = (Math.abs(seed) % 9) + 1;
  const choices = Array.from(
    new Set([objects, Math.max(1, objects - 1), Math.min(10, objects + 1)]),
  ).sort((a, b) => a - b);
  return { id: `counting-${seed}`, objects, choices, answer: objects };
}
export function isCorrectAnswer(exercise: CountingExercise, answer: number): boolean {
  return exercise.answer === answer;
}
