import { describe, expect, it } from "vitest";
import { generateSession, SESSION_SIZE, validateAnswer } from "./rutaCuadricula";
import type { ActivityDifficulty } from "../content/contracts";
import type { Direction, RutaCuadriculaExercise } from "./rutaCuadricula";

const DIFICULTADES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

/** Tamaño esperado de la rejilla por dificultad. */
const GRID_SIZES: Record<ActivityDifficulty, { cols: number; rows: number }> = {
  easy: { cols: 3, rows: 3 },
  medium: { cols: 4, rows: 4 },
  hard: { cols: 5, rows: 5 },
  expert: { cols: 6, rows: 5 },
};

/** Número esperado de obstáculos por dificultad. */
const OBSTACLE_COUNTS: Record<ActivityDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 4,
  expert: 6,
};

/** Todas las generaciones posibles, para iterar en tests. */
const todas = DIFICULTADES.flatMap((difficulty) =>
  SEMILLAS.map((seed) => ({ difficulty, exercises: generateSession(difficulty, seed) })),
);

describe("rutaCuadricula — generateSession", () => {
  it("genera 10 ejercicios para cada dificultad", () => {
    for (const { difficulty, exercises } of todas) {
      expect(exercises, difficulty).toHaveLength(SESSION_SIZE);
    }
  });

  it("usa el tamaño de rejilla y número de obstáculos correctos por dificultad", () => {
    for (const { difficulty, exercises } of todas) {
      const size = GRID_SIZES[difficulty];
      const obs = OBSTACLE_COUNTS[difficulty];
      for (const [i, ex] of exercises.entries()) {
        expect(ex.gridSize, `${difficulty}/${i}`).toEqual(size);
        expect(ex.obstacles.length, `${difficulty}/${i}`).toBe(obs);
      }
    }
  });

  it("siempre empieza en la esquina inferior izquierda y termina en la superior derecha", () => {
    for (const { difficulty, exercises } of todas) {
      const { cols, rows } = GRID_SIZES[difficulty];
      const esperadoStart = { x: 0, y: rows - 1 };
      const esperadoEnd = { x: cols - 1, y: 0 };
      for (const [i, ex] of exercises.entries()) {
        expect(ex.start, `${difficulty}/${i}`).toEqual(esperadoStart);
        expect(ex.end, `${difficulty}/${i}`).toEqual(esperadoEnd);
      }
    }
  });

  it("los obstáculos nunca están en start, end ni duplicados ni fuera de la rejilla", () => {
    for (const { difficulty, exercises } of todas) {
      for (const [i, ex] of exercises.entries()) {
        const {
          gridSize: { cols, rows },
          start,
          end,
        } = ex;
        const vistos = new Set<string>();
        for (const o of ex.obstacles) {
          expect(o.x, `${difficulty}/${i} obs x`).toBeGreaterThanOrEqual(0);
          expect(o.x, `${difficulty}/${i} obs x`).toBeLessThan(cols);
          expect(o.y, `${difficulty}/${i} obs y`).toBeGreaterThanOrEqual(0);
          expect(o.y, `${difficulty}/${i} obs y`).toBeLessThan(rows);
          const key = `${o.x},${o.y}`;
          expect(vistos, `${difficulty}/${i} obs dup ${key}`).not.toContain(key);
          vistos.add(key);
          expect(
            !(o.x === start.x && o.y === start.y),
            `${difficulty}/${i}: obstáculo en start`,
          ).toBe(true);
          expect(!(o.x === end.x && o.y === end.y), `${difficulty}/${i}: obstáculo en end`).toBe(
            true,
          );
        }
      }
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("hard", 42)).toEqual(generateSession("hard", 42));
    expect(generateSession("hard", 42)).not.toEqual(generateSession("hard", 43));
  });

  it("siempre hay al menos un camino start→end libre de obstáculos", () => {
    // Si el generador respetó `hasPath`, construir una ruta directa siempre
    // debe ser posible. Comprobamos con un BFS de referencia independiente.
    const dirs4 = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    function reachable(ex: RutaCuadriculaExercise): boolean {
      const blocked = new Set(ex.obstacles.map((o) => `${o.x},${o.y}`));
      const seen = new Set<string>([`${ex.start.x},${ex.start.y}`]);
      const queue: { x: number; y: number }[] = [{ ...ex.start }];
      while (queue.length > 0) {
        const p = queue.shift()!;
        if (p.x === ex.end.x && p.y === ex.end.y) return true;
        for (const [dx, dy] of dirs4) {
          const nx = p.x + dx,
            ny = p.y + dy;
          const key = `${nx},${ny}`;
          if (nx < 0 || ny < 0 || nx >= ex.gridSize.cols || ny >= ex.gridSize.rows) continue;
          if (blocked.has(key) || seen.has(key)) continue;
          seen.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
      return false;
    }
    for (const { difficulty, exercises } of todas) {
      for (const [i, ex] of exercises.entries()) {
        expect(reachable(ex), `${difficulty}/${i}: sin camino libre`).toBe(true);
      }
    }
  });

  it("tiene semilla por defecto, como el resto de motores", () => {
    expect(() => generateSession("medium")).not.toThrow();
    expect(generateSession("medium")).toEqual(generateSession("medium", 42));
  });
});

describe("rutaCuadricula — validateAnswer", () => {
  /** Exercise de referencia: 3x3 sin obstáculos, de (0,2) a (2,0). */
  const EASY3x3: RutaCuadriculaExercise = {
    gridSize: { cols: 3, rows: 3 },
    start: { x: 0, y: 2 },
    end: { x: 2, y: 0 },
    obstacles: [],
  };

  /** Camino directo: subir dos veces y derecha dos veces. */
  it("acepta una ruta directa que llega a la meta", () => {
    const seq: Direction[] = ["up", "up", "right", "right"];
    expect(validateAnswer(EASY3x3, seq)).toBe(true);
  });

  it("rechaza una ruta que se sale del tablero", () => {
    // (0,2) → up → (0,1) → up → (0,0) → up → fuera
    const seq: Direction[] = ["up", "up", "up", "right", "right"];
    expect(validateAnswer(EASY3x3, seq)).toBe(false);
  });

  it("rechaza una ruta que choca contra un obstáculo", () => {
    const ex: RutaCuadriculaExercise = {
      gridSize: { cols: 3, rows: 3 },
      start: { x: 0, y: 2 },
      end: { x: 2, y: 0 },
      obstacles: [{ x: 1, y: 0 }], // bloquea el camino directo
    };
    // right → right → up → up → up ... choca en (2,0) que es end, pero la
    // ruta (0,2)→(1,2)→(2,2)→(2,1)→(2,0) es válida. Probemos una que choque:
    const choca: Direction[] = ["right", "right", "up", "up"]; // cae en (2,0)=end, OK
    expect(validateAnswer(ex, choca)).toBe(true);

    // Esta ruta sí atraviesa el obstáculo en (1,0):
    const atraviesa: Direction[] = ["up", "right", "up", "right"]; // (0,1)→(1,1)→(1,0)x
    expect(validateAnswer(ex, atraviesa)).toBe(false);
  });

  it("rechaza una secuencia vacía cuando start no es end", () => {
    expect(validateAnswer(EASY3x3, [])).toBe(false);
  });

  it("acepta una secuencia vacía si start coincide con end", () => {
    const ex: RutaCuadriculaExercise = {
      gridSize: { cols: 1, rows: 1 },
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
      obstacles: [],
    };
    expect(validateAnswer(ex, [])).toBe(true);
  });

  it("valida directamente con ejercicios generados", () => {
    // Construye una ruta BFS para cada ejercicio y comprueba que valida.
    const dirs4: [Direction, number, number][] = [
      ["down", 0, 1],
      ["up", 0, -1],
      ["right", 1, 0],
      ["left", -1, 0],
    ];
    function bfsPath(ex: RutaCuadriculaExercise): Direction[] | null {
      const blocked = new Set(ex.obstacles.map((o) => `${o.x},${o.y}`));
      type N = { x: number; y: number; path: Direction[] };
      const seen = new Set<string>([`${ex.start.x},${ex.start.y}`]);
      const queue: N[] = [{ ...ex.start, path: [] }];
      while (queue.length > 0) {
        const p = queue.shift()!;
        if (p.x === ex.end.x && p.y === ex.end.y) return p.path;
        for (const [dir, dx, dy] of dirs4) {
          const nx = p.x + dx,
            ny = p.y + dy;
          const key = `${nx},${ny}`;
          if (nx < 0 || ny < 0 || nx >= ex.gridSize.cols || ny >= ex.gridSize.rows) continue;
          if (blocked.has(key) || seen.has(key)) continue;
          seen.add(key);
          queue.push({ x: nx, y: ny, path: [...p.path, dir] });
        }
      }
      return null;
    }
    for (const { difficulty, exercises } of todas) {
      for (const [i, ex] of exercises.entries()) {
        const path = bfsPath(ex);
        expect(path, `${difficulty}/${i}: BFS no encontró ruta`).not.toBeNull();
        expect(validateAnswer(ex, path!), `${difficulty}/${i}: ruta BFS rechazada`).toBe(true);
      }
    }
  });
});
