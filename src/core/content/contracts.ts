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

export type CurriculumLevelId =
  "1-L1" | "1-L2" | "1-L3" | "1-L4" | "2-L1" | "2-L2" | "2-L3" | "2-L4";

export type VisualArrangement =
  | "scattered-large" // Desordenada, elementos grandes
  | "double-row" // 2 filas × 10 columnas (rango 1-20)
  | "semi-dispersed-tens" // Grupos de 10 delimitados + resto parcial
  | "bundles-tens-units" // Zona decenas (izq) + zona unidades (der)
  | "packages" // Paquetes etiquetados de 5, 10 y 50
  | "matrix-grid" // Rejilla perfecta filas × columnas
  | "mass-vs-blocks" // Tres zonas C-D-U con bloques proporcionales
  | "containers-gaps"; // Contenedores con huecos e incógnitas

export type InteractiveMechanic =
  | "touch-audio" // Toque individual con audio e iluminación
  | "pair-ordinal" // Selección por pares y posición ordinal
  | "drag-tens-containers" // Arrastre de grupos a contenedores decenales
  | "drag-positional" // Arrastre a tabla posicional D-U
  | "package-select" // Reconocimiento de paquetes + selección
  | "matrix-select" // Reconocimiento de estructura matricial + selección
  | "slider-multibase" // Control deslizante + Bloques multibase C-D-U
  | "conditional-scale"; // Deducción condicional + selección explícita

export interface CurriculumLevel {
  id: CurriculumLevelId;
  course: 1 | 2;
  level: 1 | 2 | 3 | 4;
  name: string;
  rangeMin: number;
  rangeMax: number;
  quantity: number;
  visualArrangement: VisualArrangement;
  interactiveMechanic: InteractiveMechanic;
  pdi: string;
  cognitiveSkill: number;
}

// ---------------------------------------------------------------------------
// Tipos del sistema de ejercicios multi-paso (spec v2)
// ---------------------------------------------------------------------------

/**
 * Habilidad cognitiva que se evalúa en cada paso de un ejercicio.
 * Un mismo visual puede generar pasos con distintos AnswerType.
 */
export type AnswerType =
  | "COUNT_TOTAL" // ¿Cuántos objetos hay?
  | "COUNT_TENS" // ¿Cuántas decenas hay?
  | "COUNT_UNITS" // ¿Cuántas unidades hay?
  | "COUNT_HUNDREDS" // ¿Cuántas centenas hay?
  | "COMPOSE_NUMBER" // ¿Qué número forman D+U o C+D+U?
  | "DECOMPOSE_NUMBER" // ¿Cómo se descompone este número?
  | "MISSING_QUANTITY" // ¿Cuántos faltan?
  | "ESTIMATE"; // Estimación de cantidad

/**
 * Cómo interactúa físicamente el niño con el visual antes de responder.
 * La respuesta numérica siempre es una selección explícita (SELECT).
 */
export type InteractionType =
  | "TOUCH" // Toca objetos uno a uno (iluminación + sonido) antes de responder
  | "SELECT" // Solo selección de respuesta; sin manipulación previa
  | "GROUP" // Arrastra GroupFrames completos a TenContainers
  | "DRAG" // Arrastra grupos/unidades a tabla posicional D-U
  | "FILL_TABLE" // El niño rellena celdas D-U manualmente con numpad o escritura
  | "SLIDER"; // Ajusta slider multibase (apoyo visual) antes de responder

/**
 * Un paso dentro de un ejercicio multi-paso.
 * Cada paso tiene su propia pregunta, respuesta correcta y opciones.
 */
export interface ExerciseStep {
  /** Qué habilidad se evalúa en este paso */
  answerType: AnswerType;
  /** Texto de la pregunta (ya interpolado, ej: "¿Cuántas manzanas hay?") */
  prompt: string;
  /** Respuesta numérica correcta */
  correctAnswer: number;
  /** Exactamente 4 opciones (correcto + 3 distractores pedagógicos), mezcladas */
  options: [number, number, number, number];
  /**
   * Si true, el paso permanece visible en pantalla cuando se avanza al siguiente.
   * Permite construir la relación «D + U = total» acumulativamente.
   */
  persistent: boolean;
}

/**
 * Marco visual que delimita un grupo de objetos en pantalla.
 * Es puramente presentacional: no tiene lógica interactiva.
 * Se renderiza como <div> absolutamente posicionado sobre el área de objetos.
 */
export interface GroupFrame {
  /** Índices (en el array positions[]) de los objetos que pertenecen a este grupo */
  indices: number[];
  /** Número de objetos en el grupo */
  size: number;
  /**
   * true  → grupo completo (marco sólido, arrastrable en 1-L3)
   * false → grupo parcial (marco discontinuo, NO arrastrable)
   */
  isComplete: boolean;
  /** Zona semántica a la que pertenece (para bundles-tens-units y mass-vs-blocks) */
  zone?: "tens" | "units" | "hundreds";
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
