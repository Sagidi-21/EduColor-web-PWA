import type { ActivityManifest } from "../../core/content/contracts";
import {
  getCurrentLevelIndex,
  getCurriculumLevelsForGrade,
  resolveLevelFromIndex,
  starsForIndex,
} from "./levelSelect";

const baseActivity = {
  id: "lecturaNumeros",
  engineId: "lecturaNumeros",
  gradeIds: ["grade-1", "grade-2"],
} as ActivityManifest;

const countingActivity = {
  id: "counting",
  engineId: "counting",
  gradeIds: ["grade-1", "grade-2"],
} as ActivityManifest;

describe("levelSelect", () => {
  it("starsForIndex pinta 1–4 estrellas", () => {
    expect(starsForIndex(0)).toBe("⭐");
    expect(starsForIndex(3)).toBe("⭐⭐⭐⭐");
  });

  it("getCurrentLevelIndex usa difficulty estándar", () => {
    expect(getCurrentLevelIndex("easy")).toBe(0);
    expect(getCurrentLevelIndex("medium")).toBe(1);
    expect(getCurrentLevelIndex("hard")).toBe(2);
    expect(getCurrentLevelIndex("expert")).toBe(3);
  });

  it("getCurrentLevelIndex prioriza levelId curricular", () => {
    expect(getCurrentLevelIndex("easy", "1-L3")).toBe(2);
    expect(getCurrentLevelIndex("expert", "2-L1")).toBe(0);
  });

  it("getCurriculumLevelsForGrade acota por curso", () => {
    expect(getCurriculumLevelsForGrade(countingActivity, "grade-1")).toEqual([
      "1-L1",
      "1-L2",
      "1-L3",
      "1-L4",
    ]);
    expect(getCurriculumLevelsForGrade(countingActivity, "grade-2")).toEqual([
      "2-L1",
      "2-L2",
      "2-L3",
      "2-L4",
    ]);
  });

  it("resolveLevelFromIndex estándar no lleva levelId", () => {
    expect(resolveLevelFromIndex(baseActivity, 2, "grade-1")).toEqual({
      difficulty: "hard",
      levelId: undefined,
      difficultyStars: "⭐⭐⭐",
    });
  });

  it("resolveLevelFromIndex curricular mapea L1–L4 del curso", () => {
    expect(resolveLevelFromIndex(countingActivity, 0, "grade-1")).toEqual({
      difficulty: "easy",
      levelId: "1-L1",
      difficultyStars: "⭐",
    });
    expect(resolveLevelFromIndex(countingActivity, 3, "grade-2")).toEqual({
      difficulty: "expert",
      levelId: "2-L4",
      difficultyStars: "⭐⭐⭐⭐",
    });
  });
});
