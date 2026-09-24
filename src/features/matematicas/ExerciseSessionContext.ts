import { createContext } from "react";
import type { ExerciseSessionContextValue } from "./ExerciseSessionProvider";
import { ExerciseSessionProvider } from "./ExerciseSessionProvider";
import { useExerciseSession } from "./useExerciseSession";

export const ExerciseSessionContext = createContext<ExerciseSessionContextValue | null>(null);

export { ExerciseSessionProvider, useExerciseSession };
