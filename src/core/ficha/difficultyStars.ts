import type { ActivityDifficulty } from "../content/contracts";

/** Solo estrellas, sin texto de dificultad. */
export function difficultyStars(difficulty: ActivityDifficulty): string {
  switch (difficulty) {
    case "easy":
      return "⭐";
    case "medium":
      return "⭐⭐";
    case "hard":
      return "⭐⭐⭐";
    case "expert":
      return "⭐⭐⭐⭐";
  }
}
