import { describe, expect, it } from "vitest";
import {
  handForBox,
  parseBagContext,
  printDragQuestion,
  shortestRouteArrows,
  shortestRouteDirections,
} from "./sceneHelpers";

describe("sceneHelpers", () => {
  it("shortestRouteDirections: ruta recta y ya en la meta", () => {
    const grid = { cols: 4, rows: 3 };
    expect(shortestRouteDirections(grid, { x: 0, y: 0 }, { x: 0, y: 0 }, [])).toEqual([]);
    expect(shortestRouteDirections(grid, { x: 0, y: 2 }, { x: 2, y: 2 }, [])).toEqual([
      "right",
      "right",
    ]);
  });

  it("shortestRouteDirections: 'up' resta y; rodea obstáculos", () => {
    const grid = { cols: 3, rows: 3 };
    const dirs = shortestRouteDirections(grid, { x: 0, y: 2 }, { x: 2, y: 2 }, [{ x: 1, y: 2 }]);
    expect(dirs[0]).toBe("up");
    expect(dirs).toHaveLength(4);
    expect(shortestRouteArrows(grid, { x: 0, y: 2 }, { x: 2, y: 2 }, [{ x: 1, y: 2 }])).toMatch(
      /^↑/,
    );
  });

  it("shortestRouteDirections: sin ruta devuelve vacío", () => {
    const grid = { cols: 3, rows: 1 };
    expect(shortestRouteDirections(grid, { x: 0, y: 0 }, { x: 2, y: 0 }, [{ x: 1, y: 0 }])).toEqual(
      [],
    );
  });

  it("handForBox invierte la mano cuando el personaje está de frente", () => {
    expect(handForBox("box-left", "espaldas")).toBe("izquierda");
    expect(handForBox("box-left", "frente")).toBe("derecha");
    expect(handForBox("box-right", "frente")).toBe("izquierda");
  });

  it("parseBagContext lee colores y cantidades", () => {
    expect(parseBagContext("Bolsa: 3 pelotas roja, 2 pelotas azul.")).toEqual([
      { count: 3, color: "roja" },
      { count: 2, color: "azul" },
    ]);
    expect(parseBagContext("sin bolsa")).toEqual([]);
  });

  it("printDragQuestion reescribe arrastrar a 'une con flecha'", () => {
    expect(printDragQuestion("Arrastra la pelota a la mano derecha de Luna")).toBe(
      "Une con una flecha la pelota con la mano derecha de Luna",
    );
    expect(
      printDragQuestion("Pon la pelota en la mano izquierda y el libro en la mano derecha de Luna"),
    ).toMatch(/^Une con flechas:/);
    expect(printDragQuestion("Otra frase")).toBe("Otra frase");
  });
});
