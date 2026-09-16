import type { ActivityDifficulty, CurriculumLevelId, CurriculumLevel, VisualArrangement, InteractiveMechanic } from "../content/contracts";
import { IMAGE_CATEGORIES, pickImage } from "../../platform/objectImages";
import type { ImageCategory } from "../../platform/objectImages";

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
  pdi: string;
  cognitiveSkill: number;
}

export interface ObjectPosition {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zone?: "hundreds" | "tens" | "units";
  containerIndex?: number;
}

export interface CountingExercise {
  id: number;
  count: number;
  imageUrl: string;
  objectLabel: string;
  positions: ObjectPosition[];
  options: number[];
  correctAnswer: number;
  visualArrangement?: VisualArrangement;
  interactiveMechanic?: InteractiveMechanic;
}

export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

export const LEVELS: Record<CurriculumLevelId, CurriculumLevel> = {
  "1-L1": { id: "1-L1", course: 1, level: 1, name: "Conteo 1 a 1 y Subitización", rangeMin: 1, rangeMax: 10, visualArrangement: "scattered-large", interactiveMechanic: "touch-audio", pdi: "Correspondencia biunívoca", cognitiveSkill: 9 },
  "1-L2": { id: "1-L2", course: 1, level: 2, name: "Cuadrículas y Conteo por Pares", rangeMin: 1, rangeMax: 20, visualArrangement: "ten-frames", interactiveMechanic: "pair-ordinal", pdi: "Conteo estructurado y orden", cognitiveSkill: 10 },
  "1-L3": { id: "1-L3", course: 1, level: 3, name: "Agrupación en Decenas", rangeMin: 1, rangeMax: 50, visualArrangement: "semi-dispersed-tens", interactiveMechanic: "drag-tens-containers", pdi: "Seriación y formación de decenas", cognitiveSkill: 11 },
  "1-L4": { id: "1-L4", course: 1, level: 4, name: "Descomposición D + U", rangeMin: 1, rangeMax: 99, visualArrangement: "bundles-tens-units", interactiveMechanic: "drag-positional", pdi: "Abstracción de valor posicional", cognitiveSkill: 12 },
  "2-L1": { id: "2-L1", course: 2, level: 1, name: "Saltos Numéricos Extendidos", rangeMin: 100, rangeMax: 200, visualArrangement: "packages", interactiveMechanic: "line-trace", pdi: "Seriación en rangos superiores", cognitiveSkill: 14 },
  "2-L2": { id: "2-L2", course: 2, level: 2, name: "Arreglos Matriciales", rangeMin: 100, rangeMax: 500, visualArrangement: "matrix-grid", interactiveMechanic: "cut-separate", pdi: "Razonamiento pre-multiplicativo", cognitiveSkill: 15 },
  "2-L3": { id: "2-L3", course: 2, level: 3, name: "Estimación y Centenas", rangeMin: 100, rangeMax: 999, visualArrangement: "mass-vs-blocks", interactiveMechanic: "slider-multibase", pdi: "Estimación y estructura tridigital", cognitiveSkill: 16 },
  "2-L4": { id: "2-L4", course: 2, level: 4, name: "Conteo Condicional y Patrones", rangeMin: 1, rangeMax: 999, visualArrangement: "containers-gaps", interactiveMechanic: "conditional-scale", pdi: "Pensamiento deductivo e hipotético", cognitiveSkill: 5 },
};

export const CURRICULUM_LEVELS: Record<CurriculumLevelId, CurriculumCountingConfig> = {
  "1-L1": { curriculumLevelId: "1-L1", minCount: 1, maxCount: 10, randomLayout: false, quantity: 10, difficulty: "easy", visualArrangement: "scattered-large", interactiveMechanic: "touch-audio", pdi: "Correspondencia biunívoca", cognitiveSkill: 9 },
  "1-L2": { curriculumLevelId: "1-L2", minCount: 1, maxCount: 20, randomLayout: false, quantity: 10, difficulty: "medium", visualArrangement: "ten-frames", interactiveMechanic: "pair-ordinal", pdi: "Conteo estructurado y orden", cognitiveSkill: 10 },
  "1-L3": { curriculumLevelId: "1-L3", minCount: 1, maxCount: 50, randomLayout: true, quantity: 10, difficulty: "hard", visualArrangement: "semi-dispersed-tens", interactiveMechanic: "drag-tens-containers", pdi: "Seriación y formación de decenas", cognitiveSkill: 11 },
  "1-L4": { curriculumLevelId: "1-L4", minCount: 1, maxCount: 99, randomLayout: true, quantity: 10, difficulty: "expert", visualArrangement: "bundles-tens-units", interactiveMechanic: "drag-positional", pdi: "Abstracción de valor posicional", cognitiveSkill: 12 },
  "2-L1": { curriculumLevelId: "2-L1", minCount: 100, maxCount: 200, randomLayout: false, quantity: 10, difficulty: "hard", visualArrangement: "packages", interactiveMechanic: "line-trace", pdi: "Seriación en rangos superiores", cognitiveSkill: 14 },
  "2-L2": { curriculumLevelId: "2-L2", minCount: 100, maxCount: 500, randomLayout: false, quantity: 10, difficulty: "expert", visualArrangement: "matrix-grid", interactiveMechanic: "cut-separate", pdi: "Razonamiento pre-multiplicativo", cognitiveSkill: 15 },
  "2-L3": { curriculumLevelId: "2-L3", minCount: 100, maxCount: 999, randomLayout: false, quantity: 10, difficulty: "expert", visualArrangement: "mass-vs-blocks", interactiveMechanic: "slider-multibase", pdi: "Estimación y estructura tridigital", cognitiveSkill: 16 },
  "2-L4": { curriculumLevelId: "2-L4", minCount: 1, maxCount: 999, randomLayout: false, quantity: 10, difficulty: "expert", visualArrangement: "containers-gaps", interactiveMechanic: "conditional-scale", pdi: "Pensamiento deductivo e hipotético", cognitiveSkill: 5 },
};

export function generateLevelConfig(levelId: CurriculumLevelId): CurriculumCountingConfig {
  return CURRICULUM_LEVELS[levelId];
}

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

function generateDistractors(correct: number, max: number, rng: () => number): number[] {
  const candidates: number[] = [];
  for (let i = 1; i <= max; i++) {
    if (i !== correct) candidates.push(i);
  }
  candidates.sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct));
  return shuffle(candidates.slice(0, 4), rng).slice(0, 3);
}

function gridCells(count: number, rng: () => number, jitter: number): { x: number; y: number }[] {
  const cols = count <= 4 ? count : Math.ceil(Math.sqrt(count * 1.4));
  const rows = Math.ceil(count / cols);
  const paddingX = 12, paddingY = 10;
  const cellW = (100 - paddingX * 2) / cols;
  const cellH = (100 - paddingY * 2) / rows;
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push({ x: paddingX + (c + 0.5) * cellW, y: paddingY + (r + 0.5) * cellH });
  const chosen = shuffle(cells, rng).slice(0, count);
  return chosen.map((cell) => ({
    x: Math.max(8, Math.min(92, cell.x + (rng() - 0.5) * cellW * jitter * 2)),
    y: Math.max(8, Math.min(92, cell.y + (rng() - 0.5) * cellH * jitter * 2)),
  }));
}

function clusterPositions(count: number, rng: () => number, clusters: { cx: number; cy: number }[], perCluster: number, jitter: number): ObjectPosition[] {
  const all: ObjectPosition[] = [];
  for (const c of clusters) {
    for (let i = 0; i < perCluster && all.length < count; i++) {
      const angle = (i / perCluster) * Math.PI * 2;
      const radius = jitter * 12;
      all.push({
        x: Math.max(8, Math.min(92, c.cx + Math.cos(angle) * radius + (rng() - 0.5) * jitter * 10)),
        y: Math.max(8, Math.min(92, c.cy + Math.sin(angle) * radius + (rng() - 0.5) * jitter * 10)),
        rotation: 0,
        scale: 0.85 + rng() * 0.3,
      });
    }
  }
  return shuffle(all, rng).slice(0, count);
}

function generatePositionsByArrangement(count: number, arrangement: VisualArrangement, rng: () => number): ObjectPosition[] {
  switch (arrangement) {
    case "scattered-large": {
      const positions = gridCells(count, rng, 0.2);
      return positions.map((p) => ({ ...p, rotation: 0, scale: 0.9 + rng() * 0.2 }));
    }
    case "ten-frames": {
      const cols = 5;
      const rows = Math.ceil(count / cols);
      const positions: ObjectPosition[] = [];
      const cellW = (100 - 12 * 2) / cols;
      const cellH = (100 - 10 * 2) / rows;
      for (let r = 0; r < rows && positions.length < count; r++) {
        for (let c = 0; c < cols && positions.length < count; c++) {
          positions.push({
            x: Math.max(8, Math.min(92, 12 + (c + 0.5) * cellW)),
            y: Math.max(8, Math.min(92, 10 + (r + 0.5) * cellH)),
            rotation: 0,
            scale: 0.88 + rng() * 0.24,
          });
        }
      }
      return positions;
    }
    case "semi-dispersed-tens": {
      const centers = [
        { cx: 20, cy: 20 }, { cx: 60, cy: 20 }, { cx: 20, cy: 60 }, { cx: 60, cy: 60 }, { cx: 50, cy: 50 },
      ];
      return clusterPositions(count, rng, centers, 10, 0.3);
    }
    case "bundles-tens-units": {
      const bundleCenters = [
        { cx: 15, cy: 15 }, { cx: 15, cy: 35 }, { cx: 15, cy: 55 }, { cx: 15, cy: 75 }, { cx: 45, cy: 45 },
      ];
      const unitCenters = [
        { cx: 80, cy: 10 }, { cx: 80, cy: 30 }, { cx: 80, cy: 50 }, { cx: 80, cy: 70 }, { cx: 80, cy: 90 },
        { cx: 92, cy: 20 }, { cx: 92, cy: 40 }, { cx: 92, cy: 60 }, { cx: 92, cy: 80 }, { cx: 70, cy: 90 },
      ];
      const positions = clusterPositions(count, rng, bundleCenters, 10, 0.25);
      if (positions.length < count) {
        const units = clusterPositions(count - positions.length, rng, unitCenters, 1, 0.2);
        return [...positions, ...units].slice(0, count);
      }
      return positions;
    }
    case "packages": {
      const pkgCols = Math.ceil(Math.sqrt(count / 10));
      const pkgRows = Math.ceil(count / 10 / pkgCols);
      const cellW = 80 / pkgCols;
      const cellH = 80 / pkgRows;
      const centers: { cx: number; cy: number }[] = [];
      for (let r = 0; r < pkgRows; r++)
        for (let c = 0; c < pkgCols; c++)
          centers.push({ cx: 10 + (c + 0.5) * cellW, cy: 10 + (r + 0.5) * cellH });
      const positions = clusterPositions(count, rng, centers, 10, 0.2);
      return positions;
    }
    case "matrix-grid": {
      const cols = Math.max(2, Math.floor(Math.sqrt(count)));
      const rows = Math.ceil(count / cols);
      const cellW = 80 / cols;
      const cellH = 80 / rows;
      const positions: ObjectPosition[] = [];
      for (let r = 0; r < rows && positions.length < count; r++) {
        for (let c = 0; c < cols && positions.length < count; c++) {
          positions.push({
            x: Math.max(8, Math.min(92, 10 + (c + 0.5) * cellW)),
            y: Math.max(8, Math.min(92, 10 + (r + 0.5) * cellH)),
            rotation: 0,
            scale: 0.82 + rng() * 0.16,
          });
        }
      }
      return positions;
    }
    case "mass-vs-blocks": {
      const hundreds = Math.floor(count / 100);
      const tens = Math.floor((count % 100) / 10);
      const units = count % 10;
      const positions: ObjectPosition[] = [];
      for (let i = 0; i < hundreds; i++) {
        positions.push({ x: 18 + (i % 3) * 8, y: 20 + Math.floor(i / 3) * 30, rotation: 0, scale: 1.3, zone: "hundreds" });
      }
      for (let i = 0; i < tens; i++) {
        positions.push({ x: 50 + (i % 4) * 6, y: 20 + Math.floor(i / 4) * 28, rotation: 0, scale: 0.95, zone: "tens" });
      }
      for (let i = 0; i < units; i++) {
        positions.push({ x: 82 + (i % 3) * 4, y: 20 + Math.floor(i / 3) * 28, rotation: 0, scale: 0.6, zone: "units" });
      }
      return shuffle(positions, rng).slice(0, count);
    }
    case "containers-gaps": {
      const containerCount = 5;
      const basePerContainer = Math.floor(count / containerCount);
      const remainder = count % containerCount;
      const centers = [
        { cx: 20, cy: 50 }, { cx: 40, cy: 50 }, { cx: 60, cy: 50 }, { cx: 80, cy: 50 }, { cx: 50, cy: 80 },
      ];
      const all: ObjectPosition[] = [];
      for (let ci = 0; ci < containerCount; ci++) {
        const per = basePerContainer + (ci < remainder ? 1 : 0);
        for (let i = 0; i < per; i++) {
          all.push({
            x: Math.max(8, Math.min(92, centers[ci].cx + (rng() - 0.5) * 20)),
            y: Math.max(8, Math.min(92, centers[ci].cy + (rng() - 0.5) * 20)),
            rotation: 0,
            scale: 0.8 + rng() * 0.2,
            containerIndex: ci,
          });
        }
      }
      return shuffle(all, rng).slice(0, count);
    }
    default: {
      return gridCells(count, rng, 0.35);
    }
  }
}

export function generatePositions(
  count: number,
  randomLayout: boolean,
  rng: () => number,
  arrangement?: VisualArrangement,
): ObjectPosition[] {
  if (arrangement) return generatePositionsByArrangement(count, arrangement, rng);
  const jitter = randomLayout ? 0.35 : 0;
  return gridCells(count, rng, jitter).map((p) => ({ ...p, rotation: randomLayout ? (rng() - 0.5) * 24 : 0, scale: 0.85 + rng() * 0.3 }));
}

export function generateSession(config: CountingConfig, seed = 42): CountingExercise[] {
  const rng = makeRng(seed);
  const exercises: CountingExercise[] = [];
  const categories: ImageCategory[] = IMAGE_CATEGORIES.length > 0 ? shuffle([...IMAGE_CATEGORIES], rng) : [];
  const range: number[] = [];
  for (let n = config.minCount; n <= config.maxCount; n++) range.push(n);
  const shuffledRange = shuffle(range, rng);
  for (let i = 0; i < config.quantity; i++) {
    const count = shuffledRange[i % shuffledRange.length];
    const cat = categories.length > 0 ? categories[i % categories.length] : { name: "objetos", images: [] };
    const imageUrl = cat.images.length > 0 ? pickImage(cat, rng) : "";
    exercises.push({
      id: i,
      count,
      imageUrl,
      objectLabel: cat.name,
      positions: generatePositions(count, config.randomLayout, rng, config.visualArrangement),
      options: shuffle([count, ...generateDistractors(count, config.maxCount, rng)], rng),
      correctAnswer: count,
    });
  }
  return exercises;
}

function generateCountsForLevel(level: CurriculumLevel, rng: () => number): number[] {
  if (level.visualArrangement === "packages") {
    const multiples: number[] = [];
    for (let n = level.rangeMin; n <= level.rangeMax; n += 5) multiples.push(n);
    return shuffle(multiples, rng).slice(0, level.quantity);
  }
  if (level.visualArrangement === "matrix-grid") {
    const multiples: number[] = [];
    for (let n = level.rangeMin; n <= level.rangeMax; n += 10) multiples.push(n);
    return shuffle(multiples, rng).slice(0, level.quantity);
  }
  const range: number[] = [];
  for (let n = level.rangeMin; n <= level.rangeMax; n++) range.push(n);
  return shuffle(range, rng).slice(0, level.quantity);
}

export function generateSessionForLevel(levelId: CurriculumLevelId, seed = 42): CountingExercise[] {
  const level = LEVELS[levelId];
  const rng = makeRng(seed);
  const exercises: CountingExercise[] = [];
  const categories: ImageCategory[] = IMAGE_CATEGORIES.length > 0 ? shuffle([...IMAGE_CATEGORIES], rng) : [];
  const counts = generateCountsForLevel(level, rng);
  for (let i = 0; i < level.quantity; i++) {
    const count = counts[i % counts.length];
    const cat = categories.length > 0 ? categories[i % categories.length] : { name: "objetos", images: [] };
    const imageUrl = cat.images.length > 0 ? pickImage(cat, rng) : "";
    exercises.push({
      id: i,
      count,
      imageUrl,
      objectLabel: cat.name,
      positions: generatePositionsByArrangement(count, level.visualArrangement, rng),
      options: shuffle([count, ...generateDistractors(count, level.rangeMax, rng)], rng),
      correctAnswer: count,
      visualArrangement: level.visualArrangement,
      interactiveMechanic: level.interactiveMechanic,
    });
  }
  return exercises;
}

export function validateAnswer(exercise: CountingExercise, answer: number): boolean {
  return answer === exercise.correctAnswer;
}

export const PRESET_CONFIGS: Record<ActivityDifficulty, CountingConfig> = {
  easy: { minCount: 1, maxCount: 5, randomLayout: false, quantity: 10, difficulty: "easy" },
  medium: { minCount: 1, maxCount: 10, randomLayout: true, quantity: 10, difficulty: "medium" },
  hard: { minCount: 5, maxCount: 10, randomLayout: true, quantity: 10, difficulty: "hard" },
  expert: { minCount: 10, maxCount: 20, randomLayout: true, quantity: 10, difficulty: "expert" },
};
