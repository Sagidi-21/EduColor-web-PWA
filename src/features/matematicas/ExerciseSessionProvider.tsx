import { useState, type ReactNode } from "react";
import type {
  ActivityManifest,
  ActivityDifficulty,
  CurriculumLevelId,
} from "../../core/content/contracts";
import { ExerciseSessionContext } from "./ExerciseSessionContext";

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

export interface ExerciseSessionContextValue {
  session: ExerciseSession | null;
  launchSession: (data: Omit<ExerciseSession, "seed">) => void;
}

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
