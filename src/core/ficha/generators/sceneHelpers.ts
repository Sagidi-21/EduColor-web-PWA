/**
 * Utilidades puras para fichas con escena dibujada (ruta, personaje, bolsa…).
 * Sin React ni DOM: las usan `mapSessionToSheet` y los tests.
 */

export interface GridPoint {
  x: number;
  y: number;
}

const ARROWS = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
} as const;

/**
 * Ruta más corta (BFS) de `start` a `end` esquivando obstáculos.
 * Misma convención que el motor: `up` resta en `y`, `down` suma, `left` resta en `x`.
 * Devuelve las direcciones en orden (vacío si no hay ruta o ya está en la meta).
 */
export function shortestRouteDirections(
  grid: { cols: number; rows: number },
  start: GridPoint,
  end: GridPoint,
  obstacles: GridPoint[],
): ("up" | "down" | "left" | "right")[] {
  if (start.x === end.x && start.y === end.y) return [];
  const blocked = new Set(obstacles.map((o) => `${o.x},${o.y}`));
  const key = (p: GridPoint) => `${p.x},${p.y}`;
  const dirs: { dir: "up" | "down" | "left" | "right"; dx: number; dy: number }[] = [
    { dir: "right", dx: 1, dy: 0 },
    { dir: "up", dx: 0, dy: -1 },
    { dir: "down", dx: 0, dy: 1 },
    { dir: "left", dx: -1, dy: 0 },
  ];
  const prev = new Map<string, { from: string; dir: "up" | "down" | "left" | "right" }>();
  const seen = new Set<string>([key(start)]);
  const queue: GridPoint[] = [start];
  let head = 0;
  while (head < queue.length) {
    const p = queue[head++]!;
    if (p.x === end.x && p.y === end.y) break;
    for (const { dir, dx, dy } of dirs) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (n.x < 0 || n.y < 0 || n.x >= grid.cols || n.y >= grid.rows) continue;
      const k = key(n);
      if (blocked.has(k) || seen.has(k)) continue;
      seen.add(k);
      prev.set(k, { from: key(p), dir });
      queue.push(n);
    }
  }
  const endKey = key(end);
  if (!prev.has(endKey)) return [];
  const out: ("up" | "down" | "left" | "right")[] = [];
  let cur = endKey;
  const startKey = key(start);
  while (cur !== startKey) {
    const step = prev.get(cur);
    if (!step) return [];
    out.push(step.dir);
    cur = step.from;
  }
  return out.reverse();
}

/** Ruta como texto con flechas, p. ej. «→ → ↑ ↑». */
export function shortestRouteArrows(
  grid: { cols: number; rows: number },
  start: GridPoint,
  end: GridPoint,
  obstacles: GridPoint[],
): string {
  return shortestRouteDirections(grid, start, end, obstacles)
    .map((d) => ARROWS[d])
    .join(" ");
}

/** Casillas visitadas (incluye start) al aplicar la secuencia de direcciones. */
export function cellsAlongRoute(
  start: GridPoint,
  dirs: readonly ("up" | "down" | "left" | "right")[],
): GridPoint[] {
  const cells: GridPoint[] = [{ x: start.x, y: start.y }];
  let x = start.x;
  let y = start.y;
  for (const dir of dirs) {
    if (dir === "up") y -= 1;
    if (dir === "down") y += 1;
    if (dir === "left") x -= 1;
    if (dir === "right") x += 1;
    cells.push({ x, y });
  }
  return cells;
}

/** Prefijo de solución de ejemplo (hay varios caminos válidos). */
export function exampleRouteLabel(arrows: string): string {
  const trimmed = arrows.trim();
  if (!trimmed) return "Ej.: ?";
  return trimmed.startsWith("Ej.") ? trimmed : `Ej.: ${trimmed}`;
}

/** Mano del personaje que corresponde a la caja izquierda/derecha del papel. */
export function handForBox(
  box: "box-left" | "box-right",
  perspective: "frente" | "espaldas",
): "izquierda" | "derecha" {
  if (perspective === "espaldas") return box === "box-left" ? "izquierda" : "derecha";
  return box === "box-left" ? "derecha" : "izquierda";
}

/** «Bolsa: 3 pelotas roja, 3 pelotas azul.» → bolas por color. */
export function parseBagContext(context: string): { color: string; count: number }[] {
  const match = context.match(/Bolsa:\s*(.+?)\.?$/);
  if (!match) return [];
  return match[1]!
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const m = part.match(/(\d+)\s+pelotas?\s+(\S+)/);
      return m ? { count: Number(m[1]), color: m[2]! } : null;
    })
    .filter((b): b is { color: string; count: number } => b !== null && b.count > 0);
}

export function capitalizeFirst(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Reescribe el enunciado de arrastrar a un enunciado de papel («Une con una flecha…»). */
export function printDragQuestion(question: string): string {
  const both = question.match(/^Pon (.+?) en (la mano \S+) y (.+?) en (la mano \S+ de .+)$/);
  if (both) {
    return `Une con flechas: ${both[1]} con ${both[2]} y ${both[3]} con ${both[4]}`;
  }
  const one = question.match(/^Arrastra (.+?) a (la mano .+)$/);
  if (one) return `Une con una flecha ${one[1]} con ${one[2]}`;
  return question;
}
