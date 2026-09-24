import { createContext } from "react";
import type { ExerciseSessionContextValue } from "./ExerciseSessionProvider";
import { ExerciseSessionProvider, useExerciseSession } from "./ExerciseSessionProvider";

export const ExerciseSessionContext = createContext<ExerciseSessionContextValue | null>(null);

export { ExerciseSessionProvider, useExerciseSession };