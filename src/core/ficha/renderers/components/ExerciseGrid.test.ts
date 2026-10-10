import { describe, expect, it } from "vitest";
import { pairIntoRows } from "../exerciseLayout";

function cell(number: number, full = false) {
  return {
    ex: {
      kind: "operation" as const,
      a: 1,
      b: 1,
      op: "+" as const,
      imageUrl: "",
      answer: 2,
    },
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
});
