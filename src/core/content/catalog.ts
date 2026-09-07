import type {
  ActivityManifest,
  CurriculumBlock,
  Grade,
  GradeId,
  Subject,
  SubjectId,
} from "./contracts";
import { activityManifests } from "../../manifests/content-registry";

const subjectCatalog: readonly Subject[] = [
  {
    id: "mathematics",
    title: "Matemáticas",
    description: "Actividades interactivas para la pizarra digital.",
  },
];

const gradeCatalog: readonly Grade[] = [
  { id: "grade-1", stageId: "primary", order: 1, title: "1º Primaria" },
  { id: "grade-2", stageId: "primary", order: 2, title: "2º Primaria" },
];

export interface ActivityFilters {
  subjectId: SubjectId;
  gradeId: GradeId;
  curriculumBlockId?: string;
}

function ordered(manifests: readonly ActivityManifest[]): ActivityManifest[] {
  return [...manifests].sort((left, right) => left.order - right.order);
}

export function getSubjects(): readonly Subject[] {
  return subjectCatalog.filter((subject) =>
    activityManifests.some((activity) => activity.subjectId === subject.id),
  );
}

export function getGrades(subjectId: SubjectId): readonly Grade[] {
  const availableGradeIds = new Set(
    activityManifests
      .filter((activity) => activity.subjectId === subjectId)
      .flatMap((activity) => activity.gradeIds),
  );
  return gradeCatalog.filter((grade) => availableGradeIds.has(grade.id));
}

export function getCurriculumBlocks(
  subjectId: SubjectId,
  gradeId: GradeId,
): readonly CurriculumBlock[] {
  const blocks = new Map<string, CurriculumBlock>();
  for (const activity of ordered(activityManifests)) {
    if (activity.subjectId !== subjectId || !activity.gradeIds.includes(gradeId)) continue;
    const blockId = activity.curriculumBlockIds.find((id) => id.includes(`-${gradeId}-`));
    if (!blockId || blocks.has(blockId) || !activity.boardCard) continue;
    blocks.set(blockId, {
      id: blockId,
      subjectId,
      gradeIds: [gradeId],
      order: activity.boardCard.unit,
      title: activity.boardCard.unitLabel,
      description: `Unidad ${activity.boardCard.unit}`,
    });
  }
  return [...blocks.values()].sort((left, right) => left.order - right.order);
}

export function getActivities(filters: ActivityFilters): readonly ActivityManifest[] {
  return ordered(
    activityManifests.filter(
      (activity) =>
        activity.status !== "retired" &&
        activity.subjectId === filters.subjectId &&
        activity.gradeIds.includes(filters.gradeId) &&
        (!filters.curriculumBlockId || activity.curriculumBlockIds.includes(filters.curriculumBlockId)),
    ),
  );
}
