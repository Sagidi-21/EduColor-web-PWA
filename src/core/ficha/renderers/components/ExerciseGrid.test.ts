import { describe, expect, it } from "vitest";
import { columnsPerRow, pairIntoRows } from "../exerciseLayout";
import type { SheetExercise } from "../../types";

function cell(number: number, full = false, kind: SheetExercise["kind"] = "operation") {
  const ex =
    kind === "algoritmoVertical"
      ? ({
          kind: "algoritmoVertical" as const,
          a: 12,
          b: 3,
          op: "+" as const,
          aD: 1,
          aU: 2,
          bD: 0,
          bU: 3,
          answer: 15,
        } satisfies SheetExercise)
      : ({
          kind: "operation" as const,
          a: 1,
          b: 1,
          op: "+" as const,
          imageUrl: "",
          answer: 2,
        } satisfies SheetExercise);
  return {
    ex,
    number,
    full,
    variant: "",
  };
}

describe("pairIntoRows", () => {
  it("empareja dos celdas normales en una fila", () => {
    expect(pairIntoRows([cell(1), cell(2), cell(3)])).toEqual([[cell(1), cell(2)], [cell(3)]]);
  });

  it("full-width ocupa fila sola", () => {
    expect(pairIntoRows([cell(1, true), cell(2), cell(3)])).toEqual([
      [cell(1, true)],
      [cell(2), cell(3)],
    ]);
  });

  it("algoritmoVertical agrupa de 3 en 3", () => {
    const rows = pairIntoRows([
      cell(1, false, "algoritmoVertical"),
      cell(2, false, "algoritmoVertical"),
      cell(3, false, "algoritmoVertical"),
      cell(4, false, "algoritmoVertical"),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
    expect(rows[1]).toHaveLength(1);
  });
});

describe("columnsPerRow", () => {
  it("algoritmoVertical y sumaLlevando → 3; resto → 2", () => {
    expect(columnsPerRow(cell(1, false, "algoritmoVertical").ex)).toBe(3);
    expect(columnsPerRow({ kind: "sumaLlevando", addends: [12, 15], answer: 27 } as never)).toBe(3);
    expect(columnsPerRow(cell(1).ex)).toBe(2);
  });
});
