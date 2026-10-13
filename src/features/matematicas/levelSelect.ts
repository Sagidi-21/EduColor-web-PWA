import type {
  ActivityDifficulty,
  ActivityManifest,
  CurriculumLevelId,
  GradeId,
} from "../../core/content/contracts";

export type LevelIndex = 0 | 1 | 2 | 3;

export const STANDARD_DIFFICULTIES: readonly ActivityDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
] as const;

const GRADE1_LEVELS: readonly CurriculumLevelId[] = ["1-L1", "1-L2", "1-L3", "1-L4"];
const GRADE2_LEVELS: readonly CurriculumLevelId[] = ["2-L1", "2-L2", "2-L3", "2-L4"];

const CURRICULUM_ENGINES = new Set(["counting", "tresSumandos"]);

export function isCurriculumEngine(engineId: string): boolean {
  return CURRICULUM_ENGINES.has(engineId);
}

export function getDifficultyStars(difficulty: ActivityDifficulty): string {
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

export function getStarsForLevel(levelId: CurriculumLevelId): string {
  const match = levelId.match(/L(\d)/);
  const stars = match ? parseInt(match[1], 10) : 1;
  return "⭐".repeat(stars);
}

export function starsForIndex(index: LevelIndex): string {
  return "⭐".repeat(index + 1);
}

/** Niveles curriculares disponibles para el curso (o fallback por manifiesto). */
export function getCurriculumLevelsForGrade(
  activity: ActivityManifest,
  gradeId?: GradeId,
): CurriculumLevelId[] {
  if (gradeId === "grade-1") return [...GRADE1_LEVELS];
  if (gradeId === "grade-2") return [...GRADE2_LEVELS];

  const isGrade1 = activity.gradeIds.includes("grade-1");
  const isGrade2 = activity.gradeIds.includes("grade-2");
  if (isGrade1 && !isGrade2) return [...GRADE1_LEVELS];
  if (isGrade2 && !isGrade1) return [...GRADE2_LEVELS];
  return [...GRADE1_LEVELS, ...GRADE2_LEVELS];
}

export function getCurrentLevelIndex(
  difficulty: ActivityDifficulty,
  levelId?: CurriculumLevelId,
): LevelIndex {
  if (levelId) {
    const match = levelId.match(/L(\d)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= 4) return (n - 1) as LevelIndex;
    }
  }
  const idx = STANDARD_DIFFICULTIES.indexOf(difficulty);
  return (idx >= 0 ? idx : 0) as LevelIndex;
}

export interface ResolvedLevel {
  difficulty: ActivityDifficulty;
  levelId?: CurriculumLevelId;
  difficultyStars: string;
}

export function resolveLevelFromIndex(
  activity: ActivityManifest,
  index: LevelIndex,
  gradeId?: GradeId,
): ResolvedLevel {
  const difficulty = STANDARD_DIFFICULTIES[index]!;

  if (isCurriculumEngine(activity.engineId)) {
    const levels = getCurriculumLevelsForGrade(activity, gradeId);
    // Con gradeId siempre hay exactamente 4; sin él puede haber 8 — nos quedamos en el bloque del índice.
    const levelId =
      levels.length === 4
        ? levels[index]
        : gradeId === "grade-2"
          ? GRADE2_LEVELS[index]
          : GRADE1_LEVELS[index];
    return {
      difficulty,
      levelId,
      difficultyStars: getStarsForLevel(levelId!),
    };
  }

  return {
    difficulty,
    levelId: undefined,
    difficultyStars: getDifficultyStars(difficulty),
  };
}
