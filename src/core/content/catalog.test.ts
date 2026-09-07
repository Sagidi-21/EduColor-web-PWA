import { describe, expect, it } from "vitest";
import { getActivities, getCurriculumBlocks, getGrades, getSubjects } from "./catalog";
import { canLaunchActivity } from "./engine-registry";

describe("catálogo de contenido", () => {
  it("expone Matemáticas y sus dos cursos desde los manifiestos", () => {
    expect(getSubjects().map((subject) => subject.id)).toEqual(["mathematics"]);
    expect(getGrades("mathematics").map((grade) => grade.id)).toEqual(["grade-1", "grade-2"]);
  });

  it("filtra actividades por curso y bloque conservando el orden Electron", () => {
    const blocks = getCurriculumBlocks("mathematics", "grade-1");
    const activities = getActivities({
      subjectId: "mathematics",
      gradeId: "grade-1",
      curriculumBlockId: blocks[0].id,
    });
    expect(blocks[0].title).toBe("Nos divertimos con los números");
    expect(activities[0].id).toBe("ordenar");
  });

  it("no deja lanzar un manifiesto sin motor PWA registrado", () => {
    const [activity] = getActivities({ subjectId: "mathematics", gradeId: "grade-1" });
    expect(canLaunchActivity(activity)).toBe(false);
  });
});
