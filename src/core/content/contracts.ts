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
export type ActivityDifficulty = "easy" | "medium" | "hard" | "expert";

export type CurriculumLevelId = "1-L1" | "1-L2" | "1-L3" | "1-L4" | "2-L1" | "2-L2" | "2-L3" | "2-L4";

export type VisualArrangement =
  | "scattered-large"        // Desordenada, elementos grandes
  | "ten-frames"             // Marcos de 10
  | "semi-dispersed-tens"    // Semidispersa + Cajas de 10
  | "bundles-tens-units"     // Atados de 10 y unidades libres
  | "packages"               // Paquetes de 5, 10 y 50
  | "matrix-grid"            // Rejillas de filas y columnas
  | "mass-vs-blocks"         // Masa fluida vs Bloques C-D-U
  | "containers-gaps";       // Contenedores con vacíos e incógnitas

export type InteractiveMechanic =
  | "touch-audio"            // Toque individual con audio e iluminación
  | "pair-ordinal"           // Selección por pares y posición ordinal
  | "drag-tens-containers"   // Arrastre a contenedores decenales
  | "drag-positional"        // Arrastre a tabla posicional D-U
  | "line-trace"             // Trazo de líneas continuas entre paquetes
  | "cut-separate"           // Herramienta de corte y separación
  | "slider-multibase"       // Control deslizante + Bloques multibase
  | "conditional-scale";     // Arrastre condicional y balanza digital

export interface CurriculumLevel {
  id: CurriculumLevelId;
  course: 1 | 2;
  level: 1 | 2 | 3 | 4;
  name: string;
  rangeMin: number;
  rangeMax: number;
  visualArrangement: VisualArrangement;
  interactiveMechanic: InteractiveMechanic;
  pdi: string;
  cognitiveSkill: number;
}

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
  order: number;
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
    difficultyDescriptions: Record<ActivityDifficulty, string>;
    levelDescriptions?: Record<CurriculumLevelId, string>;
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
