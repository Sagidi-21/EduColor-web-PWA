import type {
  ActivityDifficulty,
  CurriculumLevel,
  CurriculumLevelId,
  VisualArrangement,
  InteractiveMechanic,
  InteractionType,
  AnswerType,
  ExerciseStep,
  GroupFrame,
} from "../content/contracts";
export type { CurriculumLevelId, ExerciseStep };
import {
  IMAGE_CATEGORIES,
  countHowManyPrompt,
  displayObjectLabel,
  pickImage,
  cuantosWord,
} from "../../platform/objectImages";
import type { ImageCategory } from "../../platform/objectImages";

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export interface CountingConfig {
  minCount: number;
  maxCount: number;
  randomLayout: boolean;
  quantity: number;
  difficulty: ActivityDifficulty;
  curriculumLevelId?: CurriculumLevelId;
  visualArrangement?: VisualArrangement;
  interactiveMechanic?: InteractiveMechanic;
  pdi?: string;
  cognitiveSkill?: number;
}

export interface CurriculumCountingConfig extends CountingConfig {
  curriculumLevelId: CurriculumLevelId;
  visualArrangement: VisualArrangement;
  interactiveMechanic: InteractiveMechanic;
  interactionType: InteractionType;
  pdi: string;
  cognitiveSkill: number;
}

// ---------------------------------------------------------------------------
// Geometry types
// ---------------------------------------------------------------------------

export interface ObjectPosition {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zone?: "hundreds" | "tens" | "units";
  containerIndex?: number;
  value?: number; // Para arreglos empaquetados o multibase
}

// ---------------------------------------------------------------------------
// Exercise types — multi-step (spec v2)
// ---------------------------------------------------------------------------

export interface CountingExercise {
  id: number;
  count: number;
  imageUrl: string;
  objectLabel: string;
  positions: ObjectPosition[];
  /** Visual group delimiters (purely presentational). Present for levels that
   *  need GroupFrame rendering: 1-L3, 1-L4, 2-L1, 2-L3, 2-L4. */
  groupFrames?: GroupFrame[];
  /** Ordered sequence of questions for this exercise visual. */
  steps: ExerciseStep[];
  visualArrangement: VisualArrangement;
  interactionType: InteractionType;
}

export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const LEVELS: Record<CurriculumLevelId, CurriculumLevel> = {
  "1-L1": {
    id: "1-L1",
    course: 1,
    level: 1,
    name: "Conteo 1 a 1 y Subitización",
    rangeMin: 1,
    rangeMax: 10,
    visualArrangement: "scattered-large",
    interactiveMechanic: "touch-audio",
    pdi: "Correspondencia biunívoca",
    cognitiveSkill: 9,
    quantity: 10,
  },
  "1-L2": {
    id: "1-L2",
    course: 1,
    level: 2,
    name: "Cuadrícula, Decenas y Unidades",
    rangeMin: 1,
    rangeMax: 20,
    visualArrangement: "double-row",
    interactiveMechanic: "touch-audio",
    pdi: "Conteo estructurado y valor posicional",
    cognitiveSkill: 10,
    quantity: 10,
  },
  "1-L3": {
    id: "1-L3",
    course: 1,
    level: 3,
    name: "Agrupación en Decenas",
    rangeMin: 10,
    rangeMax: 50,
    visualArrangement: "semi-dispersed-tens",
    interactiveMechanic: "drag-tens-containers",
    pdi: "Seriación y formación de decenas",
    cognitiveSkill: 11,
    quantity: 10,
  },
  "1-L4": {
    id: "1-L4",
    course: 1,
    level: 4,
    name: "Descomposición D + U",
    rangeMin: 10,
    rangeMax: 99,
    visualArrangement: "bundles-tens-units",
    interactiveMechanic: "drag-positional",
    pdi: "Abstracción de valor posicional",
    cognitiveSkill: 12,
    quantity: 10,
  },
  "2-L1": {
    id: "2-L1",
    course: 2,
    level: 1,
    name: "Saltos Numéricos Extendidos",
    rangeMin: 100,
    rangeMax: 200,
    visualArrangement: "packages",
    interactiveMechanic: "package-select",
    pdi: "Seriación en rangos superiores",
    cognitiveSkill: 14,
    quantity: 10,
  },
  "2-L2": {
    id: "2-L2",
    course: 2,
    level: 2,
    name: "Centenas, Decenas y Unidades",
    rangeMin: 100,
    rangeMax: 999,
    visualArrangement: "mass-vs-blocks",
    interactiveMechanic: "slider-multibase",
    pdi: "Estimación y estructura tridigital",
    cognitiveSkill: 16,
    quantity: 10,
  },
  "2-L3": {
    id: "2-L3",
    course: 2,
    level: 3,
    name: "Descomposición C, D y U libre",
    rangeMin: 1,
    rangeMax: 999,
    visualArrangement: "mass-vs-blocks",
    interactiveMechanic: "drag-positional",
    pdi: "Estructura tridigital avanzada",
    cognitiveSkill: 17,
    quantity: 10,
  },
  "2-L4": {
    id: "2-L4",
    course: 2,
    level: 4,
    name: "Arreglos Matriciales",
    rangeMin: 100,
    rangeMax: 500,
    visualArrangement: "matrix-grid",
    interactiveMechanic: "matrix-select",
    pdi: "Razonamiento pre-multiplicativo",
    cognitiveSkill: 15,
    quantity: 10,
  },
};

export const CURRICULUM_LEVELS: Record<CurriculumLevelId, CurriculumCountingConfig> = {
  "1-L1": {
    curriculumLevelId: "1-L1",
    minCount: 1,
    maxCount: 10,
    randomLayout: false,
    quantity: 10,
    difficulty: "easy",
    interactionType: "TOUCH",
    visualArrangement: "scattered-large",
    interactiveMechanic: "touch-audio",
    pdi: "Correspondencia biunívoca",
    cognitiveSkill: 9,
  },
  "1-L2": {
    curriculumLevelId: "1-L2",
    minCount: 1,
    maxCount: 20,
    randomLayout: false,
    quantity: 10,
    difficulty: "medium",
    interactionType: "TOUCH",
    visualArrangement: "double-row",
    interactiveMechanic: "touch-audio",
    pdi: "Conteo estructurado y valor posicional",
    cognitiveSkill: 10,
  },
  "1-L3": {
    curriculumLevelId: "1-L3",
    minCount: 10,
    maxCount: 50,
    randomLayout: false,
    quantity: 10,
    difficulty: "hard",
    interactionType: "GROUP",
    visualArrangement: "semi-dispersed-tens",
    interactiveMechanic: "drag-tens-containers",
    pdi: "Seriación y formación de decenas",
    cognitiveSkill: 11,
  },
  "1-L4": {
    curriculumLevelId: "1-L4",
    minCount: 10,
    maxCount: 99,
    randomLayout: false,
    quantity: 10,
    difficulty: "expert",
    interactionType: "FILL_TABLE",
    visualArrangement: "bundles-tens-units",
    interactiveMechanic: "drag-positional",
    pdi: "Abstracción de valor posicional",
    cognitiveSkill: 12,
  },
  "2-L1": {
    curriculumLevelId: "2-L1",
    minCount: 100,
    maxCount: 200,
    randomLayout: false,
    quantity: 10,
    difficulty: "hard",
    interactionType: "SELECT",
    visualArrangement: "packages",
    interactiveMechanic: "package-select",
    pdi: "Seriación en rangos superiores",
    cognitiveSkill: 14,
  },
  "2-L2": {
    curriculumLevelId: "2-L2",
    minCount: 100,
    maxCount: 999,
    randomLayout: false,
    quantity: 10,
    difficulty: "expert",
    interactionType: "FILL_TABLE",
    visualArrangement: "mass-vs-blocks",
    interactiveMechanic: "drag-positional",
    pdi: "Estimación y estructura tridigital",
    cognitiveSkill: 16,
  },
  "2-L3": {
    curriculumLevelId: "2-L3",
    minCount: 1,
    maxCount: 999,
    randomLayout: false,
    quantity: 10,
    difficulty: "expert",
    interactionType: "SELECT",
    visualArrangement: "mass-vs-blocks",
    interactiveMechanic: "drag-positional",
    pdi: "Estructura tridigital avanzada",
    cognitiveSkill: 17,
  },
  "2-L4": {
    curriculumLevelId: "2-L4",
    minCount: 100,
    maxCount: 500,
    randomLayout: false,
    quantity: 10,
    difficulty: "expert",
    interactionType: "SELECT",
    visualArrangement: "matrix-grid",
    interactiveMechanic: "matrix-select",
    pdi: "Razonamiento pre-multiplicativo",
    cognitiveSkill: 15,
  },
};

export function generateLevelConfig(levelId: CurriculumLevelId): CurriculumCountingConfig {
  return CURRICULUM_LEVELS[levelId];
}

// ---------------------------------------------------------------------------
// RNG utilities
// ---------------------------------------------------------------------------

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Pedagogical distractor generation
// ---------------------------------------------------------------------------

/**
 * Generates 3 pedagogically meaningful distractors for a given answer.
 * Distractors are chosen based on the answerType to represent common mistakes.
 */
function generatePedagogicalDistractors(
  correct: number,
  answerType: AnswerType,
  count: number,
  rng: () => number,
): [number, number, number] {
  const candidates = new Set<number>();

  const add = (n: number) => {
    if (n !== correct && n >= 0) candidates.add(n);
  };

  const tens = Math.floor(count / 10);
  const units = count % 10;
  const hundreds = Math.floor(count / 100);

  switch (answerType) {
    case "COUNT_TOTAL": {
      if (count < 10) {
        // Simple ±1 ±2 for single digits
        add(correct - 1);
        add(correct + 1);
        add(correct - 2);
        add(correct + 2);
      } else if (count < 100) {
        // Two-digit: inversion D/U, ignore units, ±10
        const inverted = units * 10 + tens;
        add(inverted !== correct ? inverted : correct + 1);
        add(tens * 10); // ignore units
        add(correct + 10);
        add(correct - 10);
        add(correct + 1);
        add(correct - 1);
      } else {
        // Three-digit: hundreds swap, ±100, ±10
        add(correct + 100);
        add(correct - 100);
        add(correct + 10);
        add(correct - 10);
        add(hundreds * 100); // ignore D+U
      }
      break;
    }
    case "COUNT_TENS": {
      // Common: confuse tens with units, ±1
      add(units); // confusion with units digit
      add(correct + 1);
      add(correct - 1);
      add(0);
      break;
    }
    case "COUNT_UNITS": {
      // Common: confuse units with tens, ±1
      add(tens); // confusion with tens digit
      add(correct + 1);
      add(correct - 1);
      add(0);
      break;
    }
    case "COUNT_HUNDREDS": {
      add(Math.floor(count / 10)); // confuse hundreds with tens
      add(correct + 1);
      add(correct - 1);
      add(0);
      break;
    }
    case "COMPOSE_NUMBER":
    case "DECOMPOSE_NUMBER": {
      const inverted = units * 10 + tens;
      add(inverted !== correct ? inverted : correct + 1);
      add(tens * 10);
      add(correct + 10);
      add(correct - 10);
      add(correct + 1);
      break;
    }
    case "MISSING_QUANTITY": {
      add(correct * 2);
      add(correct + 1);
      add(correct - 1);
      add(10);
      break;
    }
    case "ESTIMATE": {
      add(correct + 10);
      add(correct - 10);
      add(correct + 50);
      add(correct - 50);
      break;
    }
  }

  // Fill up to 3 with nearby numbers if not enough candidates
  for (let delta = 1; candidates.size < 3; delta++) {
    add(correct + delta);
    if (candidates.size < 3) add(correct - delta);
  }

  const result = shuffle([...candidates], rng).slice(0, 3) as [number, number, number];
  return result;
}

function makeOptions(
  correct: number,
  answerType: AnswerType,
  count: number,
  rng: () => number,
): [number, number, number, number] {
  const distractors = generatePedagogicalDistractors(correct, answerType, count, rng);
  return shuffle([correct, ...distractors], rng) as [number, number, number, number];
}

// ---------------------------------------------------------------------------
// Step builders per level
// ---------------------------------------------------------------------------

function buildSteps(
  levelId: CurriculumLevelId,
  count: number,
  objectLabel: string,
  rng: () => number,
): ExerciseStep[] {
  const obj = displayObjectLabel(objectLabel);
  const q = cuantosWord(objectLabel);

  const tens = Math.floor(count / 10);
  const units = count % 10;
  const hundreds = Math.floor(count / 100);
  const remainderTens = Math.floor((count % 100) / 10);
  const remainderUnits = count % 10;

  switch (levelId) {
    case "1-L1":
      return [
        {
          answerType: "COUNT_TOTAL",
          prompt: `¿${q} ${obj} hay?`,
          correctAnswer: count,
          options: makeOptions(count, "COUNT_TOTAL", count, rng),
          persistent: false,
        },
      ];

    case "1-L2":
      return [
        {
          answerType: "COUNT_TENS",
          prompt: "¿Cuántas decenas hay?",
          correctAnswer: tens,
          options: makeOptions(tens, "COUNT_TENS", count, rng),
          persistent: true,
        },
        {
          answerType: "COUNT_UNITS",
          prompt: "¿Cuántas unidades hay?",
          correctAnswer: units,
          options: makeOptions(units, "COUNT_UNITS", count, rng),
          persistent: true,
        },
        {
          answerType: "COUNT_TOTAL",
          prompt: `¿${q} ${obj} hay?`,
          correctAnswer: count,
          options: makeOptions(count, "COUNT_TOTAL", count, rng),
          persistent: false,
        },
      ];

    case "1-L3":
      return [
        {
          answerType: "COUNT_TENS",
          prompt: "¿Cuántas decenas completas hay?",
          correctAnswer: tens,
          options: makeOptions(tens, "COUNT_TENS", count, rng),
          persistent: true,
        },
        {
          answerType: "COUNT_UNITS",
          prompt: "¿Cuántas unidades quedan?",
          correctAnswer: units,
          options: makeOptions(units, "COUNT_UNITS", count, rng),
          persistent: true,
        },
        {
          answerType: "COUNT_TOTAL",
          prompt: `¿${q} ${obj} hay en total?`,
          correctAnswer: count,
          options: makeOptions(count, "COUNT_TOTAL", count, rng),
          persistent: false,
        },
      ];

    case "1-L4":
      return [
        {
          answerType: "COUNT_TENS",
          prompt: "¿Cuántas decenas hay?",
          correctAnswer: tens,
          options: makeOptions(tens, "COUNT_TENS", count, rng),
          persistent: true,
        },
        {
          answerType: "COUNT_UNITS",
          prompt: "¿Cuántas unidades hay?",
          correctAnswer: units,
          options: makeOptions(units, "COUNT_UNITS", count, rng),
          persistent: true,
        },
        {
          answerType: "COMPOSE_NUMBER",
          prompt: `¿${q} ${obj} hay en total?`,
          correctAnswer: count,
          options: makeOptions(count, "COMPOSE_NUMBER", count, rng),
          persistent: false,
        },
      ];

    case "2-L1":
      return [
        {
          answerType: "COUNT_TOTAL",
          prompt: `¿${q} ${obj} hay en total?`,
          correctAnswer: count,
          options: makeOptions(count, "COUNT_TOTAL", count, rng),
          persistent: false,
        },
      ];

    case "2-L3":
      return [
        {
          answerType: "COMPOSE_NUMBER",
          prompt: `¿Qué número representan?`,
          correctAnswer: count,
          options: makeOptions(count, "COMPOSE_NUMBER", count, rng),
          persistent: false,
        },
      ];

    case "2-L2":
      return [
        {
          answerType: "COUNT_HUNDREDS",
          prompt: "¿Cuántas centenas hay?",
          correctAnswer: hundreds,
          options: makeOptions(hundreds, "COUNT_HUNDREDS", count, rng),
          persistent: true,
        },
        {
          answerType: "COUNT_TENS",
          prompt: "¿Cuántas decenas hay?",
          correctAnswer: remainderTens,
          options: makeOptions(remainderTens, "COUNT_TENS", count, rng),
          persistent: true,
        },
        {
          answerType: "COUNT_UNITS",
          prompt: "¿Cuántas unidades hay?",
          correctAnswer: remainderUnits,
          options: makeOptions(remainderUnits, "COUNT_UNITS", count, rng),
          persistent: true,
        },
        {
          answerType: "COMPOSE_NUMBER",
          prompt: `¿Qué número representan?`,
          correctAnswer: count,
          options: makeOptions(count, "COMPOSE_NUMBER", count, rng),
          persistent: false,
        },
      ];

    case "2-L4": {
      return [
        {
          answerType: "COUNT_TOTAL",
          prompt: `¿${q} ${obj} hay en total?`,
          correctAnswer: count,
          options: makeOptions(count, "COUNT_TOTAL", count, rng),
          persistent: false,
        },
      ];
    }
  }
}

// ---------------------------------------------------------------------------
// Position generation (NO global shuffle for spatial arrangements)
// ---------------------------------------------------------------------------

function gridCells(count: number, rng: () => number, jitter: number): ObjectPosition[] {
  const cols = count <= 4 ? count : Math.ceil(Math.sqrt(count * 1.4));
  const rows = Math.ceil(count / cols);
  const paddingX = 12,
    paddingY = 10;
  const cellW = (100 - paddingX * 2) / cols;
  const cellH = (100 - paddingY * 2) / rows;
  const cells: ObjectPosition[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push({
        x: paddingX + (c + 0.5) * cellW,
        y: paddingY + (r + 0.5) * cellH,
        rotation: 0,
        scale: 1,
      });
  const chosen = shuffle(cells, rng).slice(0, count);
  return chosen.map((cell) => ({
    ...cell,
    x: Math.max(8, Math.min(92, cell.x + (rng() - 0.5) * cellW * jitter * 2)),
    y: Math.max(8, Math.min(92, cell.y + (rng() - 0.5) * cellH * jitter * 2)),
  }));
}

/** Place `count` items around a center point with local jitter. Does NOT shuffle globally. */
function placeAroundCenter(
  count: number,
  cx: number,
  cy: number,
  spread: number,
  rng: () => number,
): ObjectPosition[] {
  const positions: ObjectPosition[] = [];
  // Arrange in a small grid inside the group area
  const cols = Math.min(count, 5);
  const rows = Math.ceil(count / cols);
  const cellW = spread / cols;
  const cellH = spread / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols && positions.length < count; c++) {
      positions.push({
        x: Math.max(
          8,
          Math.min(92, cx - spread / 2 + (c + 0.5) * cellW + (rng() - 0.5) * cellW * 0.3),
        ),
        y: Math.max(
          8,
          Math.min(92, cy - spread / 2 + (r + 0.5) * cellH + (rng() - 0.5) * cellH * 0.3),
        ),
        rotation: 0,
        scale: 0.85 + rng() * 0.2,
      });
    }
  }
  return positions;
}

interface PositionResult {
  positions: ObjectPosition[];
  groupFrames?: GroupFrame[];
}

function generatePositionsByArrangement(
  count: number,
  arrangement: VisualArrangement,
  rng: () => number,
): PositionResult {
  switch (arrangement) {
    // -- 1-L1: scattered, large, shuffled (intentional disorder) ------------
    case "scattered-large": {
      const positions = gridCells(count, rng, 0.2).map((p) => ({
        ...p,
        rotation: 0,
        scale: 0.9 + rng() * 0.2,
      }));
      return { positions };
    }

    // -- 1-L2: double-row 2×10, NO shuffle ----------------------------------
    // Leave the rightmost ~18% free so the DECENAS/UNIDADES panel (bottom-right)
    // never overlaps the 10th object of either row.
    case "double-row": {
      const COLS = 10;
      const usableW = 82; // use only 0..82% of the width
      const paddingX = 10;
      const cellW = (usableW - paddingX * 2) / COLS;
      const cellH = (100 - 10 * 2) / 2;
      const positions: ObjectPosition[] = [];
      for (let i = 0; i < count; i++) {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        positions.push({
          x: Math.max(8, Math.min(92, paddingX + (c + 0.5) * cellW)),
          y: Math.max(8, Math.min(92, 10 + (r + 0.5) * cellH)),
          rotation: 0,
          scale: 0.88 + rng() * 0.12,
        });
      }
      return { positions };
    }

    // -- 1-L3: semi-dispersed-tens with GroupFrames -------------------------
    case "semi-dispersed-tens": {
      const fullTens = Math.floor(count / 10);
      const remainder = count % 10;
      const totalGroups = fullTens + (remainder > 0 ? 1 : 0);

      // Deja libre la franja inferior (~30%) para los contenedores de decenas.
      const usableTop = 8;
      const usableH = 55;
      const gcols = Math.min(totalGroups, 3);
      const grows = Math.ceil(totalGroups / gcols);
      const gw = 80 / gcols;
      const gh = usableH / grows;
      const yMax = usableTop + usableH;

      const positions: ObjectPosition[] = [];
      const groupFrames: GroupFrame[] = [];
      let posIdx = 0;

      for (let gi = 0; gi < totalGroups; gi++) {
        const isComplete = gi < fullTens;
        const groupSize = isComplete ? 10 : remainder;
        const gcol = gi % gcols;
        const grow = Math.floor(gi / gcols);
        const cx = 10 + (gcol + 0.5) * gw;
        const cy = usableTop + (grow + 0.5) * gh;
        const spread = Math.min(gw, gh) * 0.7;

        const groupPositions = placeAroundCenter(groupSize, cx, cy, spread, rng).map((p) => ({
          ...p,
          y: Math.min(p.y, yMax),
        }));
        const indices: number[] = [];
        for (let k = 0; k < groupPositions.length; k++) {
          positions.push(groupPositions[k]!);
          indices.push(posIdx++);
        }
        groupFrames.push({ indices, size: groupSize, isComplete });
      }

      return { positions, groupFrames };
    }

    // -- 1-L4: bundles-tens-units, two zones, NO global shuffle -------------
    case "bundles-tens-units": {
      const fullTens = Math.floor(count / 10);
      const remainder = count % 10;
      const positions: ObjectPosition[] = [];
      const groupFrames: GroupFrame[] = [];
      let posIdx = 0;

      // Left zone (x: 5%–45%): packages of 10 in a neat grid
      const tensAreaW = 35;
      const tensAreaX = 5;
      // Max 9 tens, so a 3x3 grid is enough
      const tensCols = Math.min(fullTens, 3);
      const tensRows = Math.ceil(fullTens / Math.max(tensCols, 1));

      const tenCellW = tensAreaW / Math.max(tensCols, 1);
      const tenCellH = 80 / Math.max(tensRows, 1);

      for (let ti = 0; ti < fullTens; ti++) {
        const col = ti % tensCols;
        const row = Math.floor(ti / tensCols);

        // Centro de la celda
        const cx = tensAreaX + col * tenCellW + tenCellW / 2;
        const cy = 10 + row * tenCellH + tenCellH / 2;

        positions.push({
          x: cx,
          y: cy,
          rotation: rng() * 10 - 5,
          scale: 1,
          zone: "tens",
          value: 10,
        });
        posIdx++;
      }

      // Right zone (x: 60%–95%): individual units
      const unitsAreaX = 60;
      const unitsAreaW = 35;
      const unitCols = Math.min(remainder, 3);
      const unitRows = Math.ceil(remainder / Math.max(unitCols, 1));
      const unitCellW = unitCols > 0 ? unitsAreaW / unitCols : unitsAreaW;
      const unitCellH = unitRows > 0 ? 80 / unitRows : 80;
      const unitIndices: number[] = [];
      for (let ui = 0; ui < remainder; ui++) {
        const uc = ui % unitCols;
        const ur = Math.floor(ui / unitCols);
        positions.push({
          x: Math.max(
            8,
            Math.min(92, unitsAreaX + (uc + 0.5) * unitCellW + (rng() - 0.5) * unitCellW * 0.2),
          ),
          y: Math.max(
            8,
            Math.min(92, 10 + (ur + 0.5) * unitCellH + (rng() - 0.5) * unitCellH * 0.2),
          ),
          rotation: 0,
          scale: 0.8 + rng() * 0.2,
          zone: "units",
        });
        unitIndices.push(posIdx++);
      }
      if (remainder > 0) {
        groupFrames.push({
          indices: unitIndices,
          size: remainder,
          isComplete: false,
          zone: "units",
        });
      }

      return { positions, groupFrames };
    }

    // -- 2-L1: packages with labels (50, 10, 5) -----------------------------
    case "packages": {
      let remaining = count;
      const values: number[] = [];
      while (remaining >= 50) {
        values.push(50);
        remaining -= 50;
      }
      while (remaining >= 10) {
        values.push(10);
        remaining -= 10;
      }
      while (remaining >= 5) {
        values.push(5);
        remaining -= 5;
      }
      while (remaining >= 1) {
        values.push(1);
        remaining -= 1;
      }

      const numPackages = values.length;
      const gcols = Math.min(numPackages, 5);
      const grows = Math.ceil(numPackages / gcols);
      const gw = 80 / gcols;
      const gh = 70 / grows;

      const positions: ObjectPosition[] = [];
      for (let gi = 0; gi < numPackages; gi++) {
        const val = values[gi];
        const gcol = gi % gcols;
        const grow = Math.floor(gi / gcols);
        const cx = 10 + (gcol + 0.5) * gw;
        const cy = 15 + (grow + 0.5) * gh;

        positions.push({
          x: cx + (rng() - 0.5) * 4,
          y: cy + (rng() - 0.5) * 4,
          rotation: (rng() - 0.5) * 8,
          scale: val === 50 ? 1.2 : val === 10 ? 1.0 : val === 5 ? 0.85 : 0.7,
          value: val,
        });
      }

      // No necesitamos groupFrames aquí porque el renderizado es directo por paquete
      return { positions, groupFrames: [] };
    }

    // -- 2-L4: matrix-grid, packages of 10 + loose units column ------------
    case "matrix-grid": {
      const numTens = Math.floor(count / 10);
      const unitRemainder = count % 10;

      // Matrix area for tens: x 5%–72%, y 10%–95%
      const cols = Math.max(2, Math.ceil(Math.sqrt(numTens * 1.2)));
      const rows = Math.ceil(numTens / cols);
      const matrixW = unitRemainder > 0 ? 64 : 80; // leave room for units column
      const cellW = matrixW / Math.max(cols, 1);
      const cellH = 75 / Math.max(rows, 1);
      const positions: ObjectPosition[] = [];
      for (let r = 0; r < rows && positions.length < numTens; r++) {
        for (let c = 0; c < cols && positions.length < numTens; c++) {
          positions.push({
            x: Math.max(6, Math.min(72, 6 + (c + 0.5) * cellW)),
            y: Math.max(10, Math.min(90, 12 + (r + 0.5) * cellH)),
            rotation: 0,
            scale: 0.9,
            value: 10,
          });
        }
      }

      // Right column for loose units: x 78%–95%
      if (unitRemainder > 0) {
        const unitCellH = 70 / unitRemainder;
        for (let u = 0; u < unitRemainder; u++) {
          positions.push({
            x: 90 + (rng() - 0.5) * 6,
            y: Math.max(20, Math.min(90, 20 + (u + 0.5) * unitCellH)),
            rotation: (rng() - 0.5) * 10,
            scale: 1.2,
            zone: "units",
          });
        }
      }

      return { positions, groupFrames: [] };
    }

    // -- 2-L3: mass-vs-blocks, three zones, NO global shuffle ---------------
    // The positional table (DECENAS/UNIDADES counter) sits at the bottom of the
    // stage. Keep every object above y=78% so images are never hidden behind it.
    case "mass-vs-blocks": {
      const hundreds = Math.floor(count / 100);
      const tens = Math.floor((count % 100) / 10);
      const units = count % 10;
      const positions: ObjectPosition[] = [];
      const groupFrames: GroupFrame[] = [];
      let posIdx = 0;

      const TOP = 8;
      const BOTTOM = 78; // bottom 22% reserved for the positional table

      // Zone C (x: 5%–30%) — centenas
      const hundredsIndices: number[] = [];
      const hRows = Math.max(1, Math.ceil(hundreds / 2));
      const hStep = (BOTTOM - TOP) / hRows;
      for (let i = 0; i < hundreds; i++) {
        const row = Math.floor(i / 2);
        positions.push({
          x: 10 + (i % 2) * 12,
          y: TOP + (row + 0.5) * hStep,
          rotation: 0,
          scale: 1.4,
          zone: "hundreds",
        });
        hundredsIndices.push(posIdx++);
      }
      if (hundreds > 0)
        groupFrames.push({
          indices: hundredsIndices,
          size: hundreds,
          isComplete: true,
          zone: "hundreds",
        });

      // Zone D (x: 38%–62%) — decenas
      const tensIndices: number[] = [];
      const tRows = Math.max(1, Math.ceil(tens / 2));
      const tStep = (BOTTOM - TOP) / tRows;
      for (let i = 0; i < tens; i++) {
        const row = Math.floor(i / 2);
        positions.push({
          x: 42 + (i % 2) * 8,
          y: TOP + (row + 0.5) * tStep,
          rotation: 0,
          scale: 1.0,
          zone: "tens",
        });
        tensIndices.push(posIdx++);
      }
      if (tens > 0)
        groupFrames.push({ indices: tensIndices, size: tens, isComplete: true, zone: "tens" });

      // Zone U (x: 70%–95%) — unidades
      const unitsIndices: number[] = [];
      const uRows = Math.max(1, Math.ceil(units / 3));
      const uStep = (BOTTOM - TOP) / uRows;
      for (let i = 0; i < units; i++) {
        const row = Math.floor(i / 3);
        positions.push({
          x: 75 + (i % 3) * 6,
          y: TOP + (row + 0.5) * uStep,
          rotation: 0,
          scale: 0.65,
          zone: "units",
        });
        unitsIndices.push(posIdx++);
      }
      if (units > 0)
        groupFrames.push({ indices: unitsIndices, size: units, isComplete: true, zone: "units" });

      return { positions, groupFrames };
    }

    // -- 2-L4: containers-gaps (some objects hidden) -------------------------
    case "containers-gaps": {
      const containerCount = 5;
      const basePerContainer = Math.floor(count / containerCount);
      const remainder = count % containerCount;
      const centers = [
        { cx: 15, cy: 50 },
        { cx: 35, cy: 50 },
        { cx: 55, cy: 50 },
        { cx: 75, cy: 50 },
        { cx: 45, cy: 80 },
      ];
      const positions: ObjectPosition[] = [];
      const groupFrames: GroupFrame[] = [];
      let posIdx = 0;

      for (let ci = 0; ci < containerCount; ci++) {
        const per = basePerContainer + (ci < remainder ? 1 : 0);
        const indices: number[] = [];
        const c = centers[ci];
        for (let i = 0; i < per; i++) {
          positions.push({
            x: Math.max(8, Math.min(92, c.cx + (rng() - 0.5) * 14)),
            y: Math.max(8, Math.min(92, c.cy + (rng() - 0.5) * 14)),
            rotation: 0,
            scale: 0.8 + rng() * 0.2,
            containerIndex: ci,
          });
          indices.push(posIdx++);
        }
        if (per > 0) {
          groupFrames.push({ indices, size: per, isComplete: false });
        }
      }

      return { positions, groupFrames };
    }

    default: {
      return { positions: gridCells(count, rng, 0.35) };
    }
  }
}

// ---------------------------------------------------------------------------
// Count generation per level
// ---------------------------------------------------------------------------

function generateCountsForLevel(level: CurriculumLevel, rng: () => number): number[] {
  if (level.visualArrangement === "packages") {
    // Only multiples of 5 in [100, 200]
    const multiples: number[] = [];
    for (let n = level.rangeMin; n <= level.rangeMax; n += 5) multiples.push(n);
    return shuffle(multiples, rng).slice(0, level.quantity);
  }
  if (level.visualArrangement === "matrix-grid") {
    // Multiples of 10 plus random units (0-9) so any number is possible
    const base: number[] = [];
    for (let n = level.rangeMin; n <= level.rangeMax; n += 10) base.push(n);
    const shuffled = shuffle(base, rng).slice(0, level.quantity);
    return shuffled.map((n) => n + Math.floor(rng() * 10)); // add 0-9 units
  }
  if (
    level.visualArrangement === "semi-dispersed-tens" ||
    level.visualArrangement === "bundles-tens-units"
  ) {
    // Ensure minCount is at least 10 and generate varied combinations
    const counts: number[] = [];
    for (let n = Math.max(10, level.rangeMin); n <= level.rangeMax; n++) counts.push(n);
    return shuffle(counts, rng).slice(0, level.quantity);
  }
  const range: number[] = [];
  for (let n = level.rangeMin; n <= level.rangeMax; n++) range.push(n);
  return shuffle(range, rng).slice(0, level.quantity);
}

// ---------------------------------------------------------------------------
// Public: generateSessionForLevel (uses multi-step steps[])
// ---------------------------------------------------------------------------

export function generateSessionForLevel(levelId: CurriculumLevelId, seed = 42): CountingExercise[] {
  const level = LEVELS[levelId];
  const cfg = CURRICULUM_LEVELS[levelId];
  const rng = makeRng(seed);
  const categories: ImageCategory[] =
    IMAGE_CATEGORIES.length > 0 ? shuffle([...IMAGE_CATEGORIES], rng) : [];
  const counts = generateCountsForLevel(level, rng);

  return Array.from({ length: level.quantity }, (_, i) => {
    const count = counts[i % counts.length];
    const cat =
      categories.length > 0 ? categories[i % categories.length] : { name: "objetos", images: [] };
    const imageUrl = cat.images.length > 0 ? pickImage(cat, rng) : "";
    const { positions, groupFrames } = generatePositionsByArrangement(
      count,
      level.visualArrangement,
      rng,
    );
    const steps = buildSteps(levelId, count, cat.name, rng);

    return {
      id: i,
      count,
      imageUrl,
      objectLabel: cat.name,
      positions,
      ...(groupFrames && groupFrames.length > 0 ? { groupFrames } : {}),
      steps,
      visualArrangement: level.visualArrangement,
      interactionType: cfg.interactionType,
    };
  });
}

// ---------------------------------------------------------------------------
// Public: generateSession (legacy — 4 generic levels, for other engines)
// ---------------------------------------------------------------------------

export function generatePositions(
  count: number,
  randomLayout: boolean,
  rng: () => number,
  arrangement?: VisualArrangement,
): ObjectPosition[] {
  if (arrangement) return generatePositionsByArrangement(count, arrangement, rng).positions;
  const jitter = randomLayout ? 0.35 : 0;
  return gridCells(count, rng, jitter).map((p) => ({
    ...p,
    rotation: randomLayout ? (rng() - 0.5) * 24 : 0,
    scale: 0.85 + rng() * 0.3,
  }));
}

export function generateSession(config: CountingConfig, seed = 42): CountingExercise[] {
  const rng = makeRng(seed);
  const categories: ImageCategory[] =
    IMAGE_CATEGORIES.length > 0 ? shuffle([...IMAGE_CATEGORIES], rng) : [];
  const range: number[] = [];
  for (let n = config.minCount; n <= config.maxCount; n++) range.push(n);
  const shuffledRange = shuffle(range, rng);

  return Array.from({ length: config.quantity }, (_, i) => {
    const count = shuffledRange[i % shuffledRange.length];
    const cat =
      categories.length > 0 ? categories[i % categories.length] : { name: "objetos", images: [] };
    const imageUrl = cat.images.length > 0 ? pickImage(cat, rng) : "";
    const positions = generatePositions(count, config.randomLayout, rng, config.visualArrangement);
    const arrangement: VisualArrangement = config.visualArrangement ?? "scattered-large";

    // Legacy: single-step exercise
    const correctAnswer = count;
    const distractors = generatePedagogicalDistractors(count, "COUNT_TOTAL", count, rng);
    const options = shuffle([correctAnswer, ...distractors], rng) as [
      number,
      number,
      number,
      number,
    ];

    return {
      id: i,
      count,
      imageUrl,
      objectLabel: cat.name,
      positions,
      steps: [
        {
          answerType: "COUNT_TOTAL" as AnswerType,
          prompt: countHowManyPrompt(cat.name),
          correctAnswer,
          options,
          persistent: false,
        },
      ],
      visualArrangement: arrangement,
      interactionType: "SELECT" as InteractionType,
    };
  });
}

export function validateAnswer(step: ExerciseStep, answer: number): boolean {
  return answer === step.correctAnswer;
}

// ---------------------------------------------------------------------------
// Legacy preset configs (kept for retrocompatibility with non-counting engines)
// ---------------------------------------------------------------------------

export const PRESET_CONFIGS: Record<ActivityDifficulty, CountingConfig> = {
  easy: { minCount: 1, maxCount: 5, randomLayout: false, quantity: 10, difficulty: "easy" },
  medium: { minCount: 1, maxCount: 10, randomLayout: true, quantity: 10, difficulty: "medium" },
  hard: { minCount: 5, maxCount: 10, randomLayout: true, quantity: 10, difficulty: "hard" },
  expert: { minCount: 10, maxCount: 20, randomLayout: true, quantity: 10, difficulty: "expert" },
};
