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
      { count: 4, objectLabel: "manzanas", imageUrl: "a.png" },
      config,
    );
    expect(ex).toMatchObject({ kind: "counting", count: 4, answer: 4 });
  });

  it("mapea comparison left/right a A/B", () => {
    const ex = mapSessionToSheet(
      "comparison",
      {
        leftCount: 3,
        rightCount: 5,
        objectSet: "coches",
        question: "more",
        answer: "right",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "comparison",
      countA: 3,
      countB: 5,
      questionType: "mas",
      answer: "B",
    });
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

  it("fallback ordenar produce problemas con pregunta", () => {
    const ex = mapSessionToSheet(
      "ordenar",
      { question: "Ordena de menor a mayor", answer: "1,2,3" },
      config,
    );
    expect(ex.kind).toBe("problemas");
  });
});
