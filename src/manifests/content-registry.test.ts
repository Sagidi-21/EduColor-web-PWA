import { describe, expect, it } from "vitest";
import type { ActivityManifest } from "../core/content/contracts";
import { activityManifestEntries, getActivityManifest } from "./content-registry";
import { validateActivityCatalog, validateActivityManifest } from "./validate-activity";

function validManifest(overrides: Partial<ActivityManifest> = {}): ActivityManifest {
  return {
    schemaVersion: 1,
    order: 1,
    id: "sampleActivity",
    engineId: "sampleEngine",
    subjectId: "mathematics",
    gradeIds: ["grade-1"],
    curriculumBlockIds: ["mathematics-grade-1-unit-1"],
    title: "Actividad de ejemplo",
    description: "Sirve para probar la validación del manifiesto",
    status: "available",
    parameters: [
      {
        id: "item-count",
        kind: "integer",
        title: "Cantidad",
        defaultValue: 5,
        minimum: 1,
        maximum: 20,
      },
    ],
    ...overrides,
  };
}

describe("manifiestos de actividad", () => {
  it("acepta un manifiesto válido y el catálogo importado", () => {
    expect(validateActivityManifest(validManifest())).toEqual([]);
    expect(validateActivityCatalog(activityManifestEntries)).toEqual([]);
    expect(getActivityManifest("counting")?.title).toBe("Contamos objetos");
  });

  it("rechaza IDs de actividad duplicados indicando archivo y campo", () => {
    const issues = validateActivityCatalog([
      { source: "a.json", manifest: validManifest({ id: "counting" }) },
      { source: "b.json", manifest: validManifest({ id: "counting", order: 2 }) },
    ]);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "a.json",
          field: "id",
          message: expect.stringContaining("ID duplicado"),
        }),
        expect.objectContaining({
          source: "b.json",
          field: "id",
          message: expect.stringContaining("ID duplicado"),
        }),
      ]),
    );
  });

  it("rechaza un parámetro inválido indicando el campo", () => {
    const issues = validateActivityManifest({
      ...validManifest(),
      parameters: [
        {
          id: "item-count",
          kind: "integer",
          title: "Cantidad",
          defaultValue: 5,
          minimum: 1,
        },
      ],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.field.includes("parameters"))).toBe(true);
  });
});
