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
    const grade1 = getActivities({
      subjectId: "mathematics",
      gradeId: "grade-1",
      curriculumBlockId: blocks[0].id,
    });
    const onlyGrade1 = getActivities({ subjectId: "mathematics", gradeId: "grade-1" });
    const onlyGrade2 = getActivities({ subjectId: "mathematics", gradeId: "grade-2" });
    expect(blocks[0].title).toBe("Nos divertimos con los números");
    expect(grade1[0].id).toBe("ordenar");
    expect(onlyGrade1.some((activity) => activity.id === "posicionesAula")).toBe(true);
    expect(onlyGrade1.some((activity) => activity.id === "abaco3cifras")).toBe(false);
    expect(onlyGrade2.some((activity) => activity.id === "abaco3cifras")).toBe(true);
    expect(onlyGrade2.some((activity) => activity.id === "posicionesAula")).toBe(false);
  });

  it("lanza comparison y bloquea un manifiesto sin motor PWA", () => {
    const grade1 = getActivities({ subjectId: "mathematics", gradeId: "grade-1" });
    const comparison = grade1.find((activity) => activity.id === "comparison");
    const tresSumandos = grade1.find((activity) => activity.id === "tresSumandos");
    expect(comparison && canLaunchActivity(comparison)).toBe(true);
    expect(tresSumandos && canLaunchActivity(tresSumandos)).toBe(true);
  });
});
