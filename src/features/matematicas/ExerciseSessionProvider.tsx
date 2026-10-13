import { useState, type ReactNode } from "react";
import type {
  ActivityManifest,
  ActivityDifficulty,
  CurriculumLevelId,
  GradeId,
} from "../../core/content/contracts";
import { ExerciseSessionContext } from "./ExerciseSessionContext";
import { getCurrentLevelIndex, resolveLevelFromIndex, type LevelIndex } from "./levelSelect";

export interface ExerciseSession {
  activity: ActivityManifest;
  difficulty: ActivityDifficulty;
  seed: number;
  levelId?: CurriculumLevelId;
  gradeId?: GradeId;
  gradeTitle: string;
  className: string;
  mascotUrl?: string;
  difficultyStars: string;
}

export interface ExerciseSessionContextValue {
  session: ExerciseSession | null;
  launchSession: (data: Omit<ExerciseSession, "seed">) => void;
  setLevelIndex: (index: LevelIndex) => void;
  currentLevelIndex: LevelIndex | null;
}

export function ExerciseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ExerciseSession | null>(null);

  const launchSession = (data: Omit<ExerciseSession, "seed">) => {
    setSession({ ...data, seed: Date.now() });
  };

  const setLevelIndex = (index: LevelIndex) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (getCurrentLevelIndex(prev.difficulty, prev.levelId) === index) return prev;
      const next = resolveLevelFromIndex(prev.activity, index, prev.gradeId);
      return {
        ...prev,
        ...next,
        seed: Date.now(),
      };
    });
  };

  const currentLevelIndex = session
    ? getCurrentLevelIndex(session.difficulty, session.levelId)
    : null;

  return (
    <ExerciseSessionContext.Provider
      value={{ session, launchSession, setLevelIndex, currentLevelIndex }}
    >
      {children}
    </ExerciseSessionContext.Provider>
  );
}
