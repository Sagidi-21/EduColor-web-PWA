/**
 * Contratos de contenido independientes de React, navegador y persistencia.
 * Los IDs se mantienen en inglés para que sean estables; los textos visibles se
 * guardan en español dentro de cada entidad o manifiesto.
 */

export type SubjectId = string;
export type GradeId = string;
export type CurriculumBlockId = string;
export type ActivityId = string;
export type EngineId = string;

export interface Subject {
  id: SubjectId;
  title: string;
  description: string;
}

export interface Grade {
  id: GradeId;
  stageId: string;
  order: number;
  title: string;
}

export interface CurriculumBlock {
  id: CurriculumBlockId;
  subjectId: SubjectId;
  gradeIds: readonly GradeId[];
  order: number;
  title: string;
  description: string;
}

export type ActivityParameter =
  | { id: string; kind: "boolean"; title: string; defaultValue: boolean }
  | {
      id: string;
      kind: "integer";
      title: string;
      defaultValue: number;
      minimum: number;
      maximum: number;
    }
  | {
      id: string;
      kind: "select";
      title: string;
      defaultValue: string;
      options: readonly { value: string; title: string }[];
    };

export interface ActivityManifest {
  $schema?: string;
  schemaVersion: 1;
  id: ActivityId;
  engineId: EngineId;
  subjectId: SubjectId;
  gradeIds: readonly GradeId[];
  curriculumBlockIds: readonly CurriculumBlockId[];
  title: string;
  description: string;
  status: "draft" | "available" | "retired";
  parameters: readonly ActivityParameter[];
  boardCard?: {
    icon: string;
    unit: number;
    unitLabel: string;
    difficultyDescriptions: Record<"easy" | "medium" | "hard" | "expert", string>;
  };
}

/** Resultado de una corrección; V1 no contiene identidad de alumnado. */
export interface ActivityResult {
  activityId: ActivityId;
  exerciseId: string;
  attemptNumber: number;
  answer: unknown;
  isCorrect: boolean;
  evaluatedAt: string;
}
