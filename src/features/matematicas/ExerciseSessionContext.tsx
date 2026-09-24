import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  ActivityManifest,
  ActivityDifficulty,
  CurriculumLevelId,
} from "../../core/content/contracts";

export interface ExerciseSession {
  activity: ActivityManifest;
  difficulty: ActivityDifficulty;
  seed: number;
  levelId?: CurriculumLevelId;
  gradeTitle: string;
  className: string;
  mascotUrl?: string;
  difficultyStars: string;
}

interface ExerciseSessionContextValue {
  session: ExerciseSession | null;
  launchSession: (data: Omit<ExerciseSession, "seed">) => void;
}

const ExerciseSessionContext = createContext<ExerciseSessionContextValue | null>(null);

export function ExerciseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ExerciseSession | null>(null);

  const launchSession = (data: Omit<ExerciseSession, "seed">) => {
    setSession({ ...data, seed: Date.now() });
  };

  return (
    <ExerciseSessionContext.Provider value={{ session, launchSession }}>
      {children}
    </ExerciseSessionContext.Provider>
  );
}

export function useExerciseSession(): ExerciseSessionContextValue {
  const ctx = useContext(ExerciseSessionContext);
  if (!ctx) {
    throw new Error("useExerciseSession must be used within ExerciseSessionProvider");
  }
  return ctx;
}
