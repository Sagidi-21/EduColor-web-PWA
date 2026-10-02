import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `rutaCuadricula` — construye la ruta para llegar a la meta
 * esquivando obstáculos.
 *
 * Motor puro y determinista, extraído de
 * `electron-reference/Colegio/src/renderer/src/core/engines/rutaCuadricula/engine.ts`.
 *
 * ## Cómo se juega
 *
 * El tablero es una rejilla de casillas. El avatar empieza en la esquina
 * inferior izquierda y debe llegar a la esquina superior derecha. Entre
 * medias hay obstáculos (árboles) que hay que rodear. El niño construye la
 * ruta pulsando flechas (arriba, abajo, izquierda, derecha), que se
 * muestran en una fila como bloques, y luego reproduce el recorrido con
 * una animación de avatar. Si la ruta choca contra un obstáculo o se
 * sale del tablero, se marca como error. Si llega a la meta, es correcto.
 *
 * El generador garantiza, con BFS, que siempre haya al menos un camino
 * start→end libre de obstáculos, de modo que ningún ejercicio es
 * imposible por construcción.
 *
 * Divergencias respecto a Electron, todas deliberadas:
 *
 * 1. **`generateSession` tiene semilla por defecto** (`42`), como el resto
 *    de los motores. El original la pedía obligatoria y su renderer le
 *    pasaba `Date.now() % 999983`, con lo que "Repetir" nunca daba la misma
 *    hoja.
 * 2. **La semilla de la hoja es estable.** Se fija una vez al montar y
 *    "Repetir" la reutiliza, con lo que repetir es volver a hacer la misma
 *    hoja y no una tirada nueva.
 * 3. **Validación en el núcleo.** El original validaba dentro del renderer,
 *    durante la animación; aquí `validateAnswer` vive en el núcleo para que
 *    los tests puedan comprobarlo sin montar nada.
 */

/** Coordenada de una casilla del tablero. */
export interface Point {
  x: number;
  y: number;
}

/** Un ejercicio: rejilla, inicio, meta y obstáculos. */
export interface RutaCuadriculaExercise {
  gridSize: { cols: number; rows: number };
  start: Point;
  end: Point;
  obstacles: Point[];
}

/** Resultado de una sesión completada. */
export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

/** Las direcciones que puede poner el niño en su secuencia. */
export type Direction = "up" | "down" | "left" | "right";

// ── LCG determinista ────────────────────────────────────────────────────────
// Mismas constantes que el original de Electron: una semilla da la misma
// sesión en los dos proyectos.
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Entero entre `min` y `max`, inclusive. */
function ri(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ── Configuración de dificultad ─────────────────────────────────────────────
interface DiffConfig {
  cols: number;
  rows: number;
  obstacles: number;
}

const CONFIGS: Record<ActivityDifficulty, DiffConfig> = {
  easy: { cols: 3, rows: 3, obstacles: 0 },
  medium: { cols: 4, rows: 4, obstacles: 2 },
  hard: { cols: 5, rows: 5, obstacles: 4 },
  expert: { cols: 6, rows: 5, obstacles: 6 },
};

/**
 * ¿Existe camino start→end esquivando obstáculos? (BFS, movimientos
 * ortogonales). Se usa para descartar colocaciones de obstáculos que dejaran
 * el tablero sin solución.
 */
function hasPath(
  cols: number,
  rows: number,
  start: Point,
  end: Point,
  obstacles: Point[],
): boolean {
  const blocked = new Set(obstacles.map((o) => `${o.x},${o.y}`));
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const queue: Point[] = [start];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (queue.length > 0) {
    const p = queue.shift()!;
    if (p.x === end.x && p.y === end.y) return true;
    for (const [dx, dy] of dirs) {
      const nx = p.x + dx,
        ny = p.y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if (blocked.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}

/** 10 ejercicios por hoja. */
export const SESSION_SIZE = 10;

/**
 * Genera una sesión de 10 ejercicios para la dificultad dada.
 *
 * Cada ejercicio coloca el avatar en la esquina inferior izquierda
 * (`start`), la meta en la esquina superior derecha (`end`) y reparte los
 * obstáculos garantizando siempre al menos un camino libre, comprobado con
 * `hasPath`.
 */
export function generateSession(
  difficulty: ActivityDifficulty,
  seed = 42,
): RutaCuadriculaExercise[] {
  const rng = lcg(seed);
  const { cols, rows, obstacles: obsCount } = CONFIGS[difficulty];
  const exercises: RutaCuadriculaExercise[] = [];

  for (let i = 0; i < SESSION_SIZE; i++) {
    const start: Point = { x: 0, y: rows - 1 }; // esquina inferior izquierda
    const end: Point = { x: cols - 1, y: 0 }; // esquina superior derecha

    // Coloca obstáculos garantizando que quede un camino start→end resoluble.
    // Si un obstáculo bloquea toda ruta, se descarta y se prueba otra posición.
    const obstacles: Point[] = [];
    let attempts = 0;
    while (obstacles.length < obsCount && attempts < 200) {
      attempts++;
      const px = ri(rng, 0, cols - 1);
      const py = ri(rng, 0, rows - 1);
      if ((px === start.x && py === start.y) || (px === end.x && py === end.y)) continue;
      if (obstacles.some((o) => o.x === px && o.y === py)) continue;
      const candidate = [...obstacles, { x: px, y: py }];
      if (!hasPath(cols, rows, start, end, candidate)) continue;
      obstacles.push({ x: px, y: py });
    }

    exercises.push({
      gridSize: { cols, rows },
      start,
      end,
      obstacles,
    });
  }

  return exercises;
}

/**
 * Recorre `sequence` desde `start` y comprueba que llega a `end` sin
 * chocar contra un obstáculo ni salirse del tablero. Cada dirección mueve
 * una casilla: `up` resta en `y`, `down` suma, `left` resta en `x`,
 * `right` suma.
 */
export function validateAnswer(exercise: RutaCuadriculaExercise, sequence: Direction[]): boolean {
  let curX = exercise.start.x;
  let curY = exercise.start.y;

  for (const dir of sequence) {
    if (dir === "up") curY -= 1;
    if (dir === "down") curY += 1;
    if (dir === "left") curX -= 1;
    if (dir === "right") curX += 1;

    if (curX < 0 || curX >= exercise.gridSize.cols || curY < 0 || curY >= exercise.gridSize.rows) {
      return false;
    }
    if (exercise.obstacles.some((o) => o.x === curX && o.y === curY)) {
      return false;
    }
  }

  return curX === exercise.end.x && curY === exercise.end.y;
}
