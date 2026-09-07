import { describe, expect, it } from "vitest";
import { findDuplicateActivityIds } from "./validate-catalog";

describe("validación del catálogo", () => {
  it("no emite avisos cuando los IDs son únicos", () => {
    expect(
      findDuplicateActivityIds([
        { source: "a.json", id: "counting" },
        { source: "b.json", id: "suma" },
      ]),
    ).toEqual([]);
  });

  it("señala cada archivo cuando el mismo ID aparece dos veces", () => {
    const issues = findDuplicateActivityIds([
      { source: "a.json", id: "counting" },
      { source: "b.json", id: "counting" },
    ]);
    expect(issues.map((issue) => issue.source).sort()).toEqual(["a.json", "b.json"]);
    expect(issues.every((issue) => issue.field === "id")).toBe(true);
  });
});
