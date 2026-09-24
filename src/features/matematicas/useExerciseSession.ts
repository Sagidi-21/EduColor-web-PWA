import { useContext } from "react";
import { ExerciseSessionContext } from "./ExerciseSessionContext";
import type { ExerciseSessionContextValue } from "./ExerciseSessionProvider";

export function useExerciseSession(): ExerciseSessionContextValue {
  const ctx = useContext(ExerciseSessionContext);
  if (!ctx) {
    throw new Error("useExerciseSession must be used within ExerciseSessionProvider");
  }
  return ctx;
}
