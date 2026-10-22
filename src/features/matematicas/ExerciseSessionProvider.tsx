import { useState, type ReactNode } from "react";
import type {
  ActivityManifest,
  ActivityDifficulty,
  CurriculumLevelId,
  GradeId,
} from "../../core/content/contracts";
import { isDemoActivityAllowed, readDemoMode } from "../../core/demo/demoMode";
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
  /** Curso del catálogo pizarra; sobrevive al remount al salir del ejercicio. */
  catalogGradeId: GradeId | null;
  setCatalogGradeId: (gradeId: GradeId) => void;
}

export function ExerciseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [catalogGradeId, setCatalogGradeId] = useState<GradeId | null>(null);

  const launchSession = (data: Omit<ExerciseSession, "seed">) => {
    // Contención DEMO: no lanzar actividades fuera de la allowlist.
    // No protege el bundle; solo evita el bypass del catálogo vía consola/estado.
    if (readDemoMode() && !isDemoActivityAllowed(data.activity.id)) {
      return;
    }
    setSession({ ...data, seed: Date.now() });
    // Al lanzar desde 1.º/2.º, al salir el catálogo debe reabrir ese mismo curso.
    if (data.gradeId) setCatalogGradeId(data.gradeId);
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
      value={{
        session,
        launchSession,
        setLevelIndex,
        currentLevelIndex,
        catalogGradeId,
        setCatalogGradeId,
      }}
    >
      {children}
    </ExerciseSessionContext.Provider>
  );
}
