import { describe, expect, it } from "vitest";
import { mapSessionToSheet } from "./mapSessionToSheet";
import type { SheetConfig } from "../types";

const config: SheetConfig = {
  activityId: "suma",
  difficulty: "easy",
  count: 10,
  withImages: true,
  seed: 1,
};

describe("mapSessionToSheet", () => {
  it("mapea suma a operation", () => {
    const ex = mapSessionToSheet(
      "suma",
      { a: 2, b: 3, op: "suma", answer: 5, imageUrl: "x.png" },
      config,
    );
    expect(ex).toMatchObject({ kind: "operation", a: 2, b: 3, op: "+", answer: 5 });
  });

  it("mapea resta a operation con op -", () => {
    const ex = mapSessionToSheet("resta", { a: 5, b: 2, op: "resta", answer: 3 }, config);
    expect(ex).toMatchObject({ kind: "operation", op: "-", answer: 3 });
  });

  it("mapea counting", () => {
    const ex = mapSessionToSheet(
      "counting",
      {
        count: 4,
        objectLabel: "manzanas",
        imageUrl: "a.png",
        steps: [{ prompt: "¿Cuántos manzanas hay?", correctAnswer: 4 }],
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "counting",
      count: 4,
      imageUrl: "a.png",
      objectLabel: "manzanas",
      question: "¿Cuántos manzanas hay?",
      answer: 4,
    });
  });

  it("mapea comparison left/right a A/B", () => {
    const ex = mapSessionToSheet(
      "comparison",
      {
        leftCount: 3,
        rightCount: 5,
        objectSet: "coches",
        objectIndex: 0,
        question: "more",
        answer: "right",
        allowEqual: false,
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "comparison",
      countA: 3,
      countB: 5,
      questionType: "mas",
      allowEqual: false,
      answer: "B",
    });
    if (ex.kind === "comparison") {
      expect(ex.imageUrl.length).toBeGreaterThan(0);
    }
  });

  it("mapea comparison equal a iguales con allowEqual", () => {
    const ex = mapSessionToSheet(
      "comparison",
      {
        leftCount: 7,
        rightCount: 7,
        objectSet: "globos",
        objectIndex: 0,
        question: "more",
        answer: "equal",
        allowEqual: true,
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "comparison",
      countA: 7,
      countB: 7,
      allowEqual: true,
      answer: "iguales",
    });
  });

  it("mapea poligonos con figura SVG", () => {
    const ex = mapSessionToSheet(
      "poligonos",
      {
        question: "¿Cuántos lados?",
        answer: "3",
        showVertices: true,
        shape: {
          name: "Triángulo",
          path: "M 100 30 L 170 150 L 30 150 Z",
          drawType: "path",
          color: "#3b82f6",
          vertexPoints: [
            { x: 100, y: 30 },
            { x: 170, y: 150 },
            { x: 30, y: 150 },
          ],
        },
      },
      config,
    );
    expect(ex.kind).toBe("poligonos");
    if (ex.kind === "poligonos") {
      expect(ex.shape?.path).toContain("M 100 30");
      expect(ex.shape?.showVertices).toBe(true);
    }
  });

  it("mapea lineTypes con svg del line", () => {
    const ex = mapSessionToSheet(
      "lineTypes",
      {
        line: {
          kind: "horizontal",
          label: "Horizontal",
          svg: '<line x1="30" y1="100" x2="270" y2="100"/>',
        },
        options: ["Horizontal", "Vertical"],
        answer: "Horizontal",
      },
      config,
    );
    expect(ex.kind).toBe("lineTypes");
    if (ex.kind === "lineTypes") {
      expect(ex.svg).toContain("line");
    }
  });

  it("mapea tresSumandos", () => {
    const ex = mapSessionToSheet("tresSumandos", { a: 1, b: 2, c: 3, answer: 6 }, config);
    expect(ex).toMatchObject({ kind: "tresSumandos", a: 1, b: 2, c: 3, answer: 6 });
  });

  it("mapea algoritmoVertical y restaColumna", () => {
    const sum = mapSessionToSheet(
      "algoritmoVertical",
      { a: 23, b: 14, aD: 2, aU: 3, bD: 1, bU: 4, answer: 37 },
      config,
    );
    expect(sum).toMatchObject({ kind: "algoritmoVertical", op: "+", answer: 37 });

    const sub = mapSessionToSheet(
      "restaColumna",
      { a: 23, b: 14, aD: 2, aU: 3, bD: 1, bU: 4, answer: 9 },
      config,
    );
    expect(sub).toMatchObject({ kind: "algoritmoVertical", op: "-", answer: 9 });
  });

  it("mapea sumaLlevando con 3 sumandos", () => {
    const ex = mapSessionToSheet("sumaLlevando", { addends: [12, 15, 8], answer: 35 }, config);
    expect(ex).toMatchObject({ kind: "tresSumandos", a: 12, b: 15, c: 8, answer: 35 });
  });

  it("mapea problemas con story y answer", () => {
    const ex = mapSessionToSheet(
      "problemas",
      { story: "Había 3 perros.", question: "¿Cuántos hay ahora?", answer: 5 },
      config,
    );
    expect(ex.kind).toBe("problemas");
    if (ex.kind === "problemas") {
      expect(ex.question).toContain("Cuántos");
      expect(ex.answer).toBe(5);
    }
  });

  it("mapea repartoIgual", () => {
    const ex = mapSessionToSheet(
      "repartoIgual",
      { total: 12, groups: 3, itemsPerGroup: 4 },
      config,
    );
    expect(ex).toMatchObject({ kind: "repartoIgual", total: 12, groups: 3, answer: 4 });
  });

  it("mapea ordenar con números y dirección", () => {
    const ex = mapSessionToSheet(
      "ordenar",
      {
        numbers: [5, 2, 6],
        sortedNumbers: [2, 5, 6],
        direction: "ascending",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "ordenar",
      numbers: [5, 2, 6],
      direction: "ascending",
      answer: [2, 5, 6],
    });
  });

  it("mapea relacionar a columnas con letras y respuestas número→letra", () => {
    const ex = mapSessionToSheet(
      "relacionar",
      {
        pairs: [
          { id: 0, number: 3, imageUrl: "/a.png", objectLabel: "manzanas" },
          { id: 1, number: 1, imageUrl: "/b.png", objectLabel: "peras" },
        ],
        leftColumn: [
          { id: 1, number: 1, imageUrl: "/b.png", objectLabel: "peras" },
          { id: 0, number: 3, imageUrl: "/a.png", objectLabel: "manzanas" },
        ],
        rightColumn: [
          { id: 0, number: 3, imageUrl: "/a.png", objectLabel: "manzanas" },
          { id: 1, number: 1, imageUrl: "/b.png", objectLabel: "peras" },
        ],
      },
      { ...config, withImages: true },
    );
    expect(ex).toMatchObject({
      kind: "relacionar",
      left: [
        { id: 1, number: 1 },
        { id: 0, number: 3 },
      ],
      right: [
        { id: 0, letter: "A", count: 3, imageUrl: "/a.png" },
        { id: 1, letter: "B", count: 1, imageUrl: "/b.png" },
      ],
      answer: ["1 → B", "3 → A"],
    });
  });
});
