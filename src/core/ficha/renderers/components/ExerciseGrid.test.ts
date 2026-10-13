import { describe, expect, it } from "vitest";
import { columnsPerRow, pairIntoRows, reorderAbaco3CifrasForFicha } from "../exerciseLayout";
import type { Abaco3CifrasSheetExercise, SheetExercise } from "../../types";
import { isFullWidthExercise } from "../pageLayout";

function abaco(
  variant: Abaco3CifrasSheetExercise["variant"],
  number = 135,
): Abaco3CifrasSheetExercise {
  return {
    kind: "abaco3Cifras",
    variant,
    question: "q",
    number,
    columns: { c: 1, d: 3, u: 5 },
    choiceLabels: variant === "find-abaco" ? undefined : ["1", "2", "3", "4"],
    abacoOptions:
      variant === "find-abaco"
        ? [
            { c: 1, d: 0, u: 0, letter: "A" },
            { c: 1, d: 3, u: 5, letter: "B" },
            { c: 2, d: 0, u: 0, letter: "C" },
            { c: 3, d: 0, u: 0, letter: "D" },
          ]
        : undefined,
    answer: variant === "find-abaco" ? "B" : "135",
  };
}

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

describe("reorderAbaco3CifrasForFicha", () => {
  it("empareja read/valor y find-abaco a 2 por fila (mismo tipo por fila)", () => {
    const mixed = [
      abaco("read-abaco", 111),
      abaco("find-abaco", 222),
      abaco("valor-posicional", 333),
      abaco("find-abaco", 444),
      abaco("read-abaco", 555),
    ];
    const ordered = reorderAbaco3CifrasForFicha(mixed);
    expect(ordered.map((ex) => (ex as Abaco3CifrasSheetExercise).variant)).toEqual([
      "read-abaco",
      "valor-posicional",
      "read-abaco",
      "find-abaco",
      "find-abaco",
    ]);

    const cells = ordered.map((ex, i) => ({
      ex,
      number: i + 1,
      full: isFullWidthExercise(ex),
      variant: "",
    }));
    const rows = pairIntoRows(cells);
    // Compacto impar no se mezcla con find: queda en fila sola.
    expect(rows.map((r) => r.map((c) => (c.ex as Abaco3CifrasSheetExercise).variant))).toEqual([
      ["read-abaco", "valor-posicional"],
      ["read-abaco"],
      ["find-abaco", "find-abaco"],
    ]);
  });
});
