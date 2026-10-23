import { describe, expect, it } from "vitest";
import { activityManifests } from "../../../manifests/content-registry";
import { isEdgeContentActivity } from "../edgeContentActivities";
import { getGenerator } from "./registry";
import { sessionEngines } from "./session-engines";

describe("getGenerator", () => {
  it("cubre el catálogo excepto actividades Edge (suma D2)", () => {
    const ids = activityManifests.map((manifest) => manifest.id);
    expect(ids).toHaveLength(62);
    const missing = ids.filter((id) => !(id in sessionEngines) && !isEdgeContentActivity(id));
    expect(missing, `Faltan motores de ficha: ${missing.join(", ")}`).toEqual([]);
    expect(sessionEngines.suma).toBeUndefined();
    expect(isEdgeContentActivity("suma")).toBe(true);
  });

  it("getGenerator('suma') falla: sin motor local (D2)", () => {
    expect(() => getGenerator("suma")).toThrow(/suma/i);
  });

  it("amigos10 soporta apoyo visual (ten-frame)", () => {
    expect(sessionEngines.amigos10?.supportsImages).toBe(true);
    expect(getGenerator("amigos10").supportsImages).toBe(true);
    const exercises = getGenerator("amigos10").generate({
      activityId: "amigos10",
      difficulty: "easy",
      count: 3,
      withImages: true,
      seed: 7,
    });
    expect(exercises).toHaveLength(3);
    exercises.forEach((ex) => {
      expect(ex.kind).toBe("amigos10");
      if (ex.kind === "amigos10") {
        expect(ex.given).toBeGreaterThan(0);
        expect(ex.showVisual).toBe(true);
        expect(ex.answer).toBe(10 - ex.given);
      }
    });
  });

  it("mapea counting a CountingSheetExercise", () => {
    const exercises = getGenerator("counting").generate({
      activityId: "counting",
      difficulty: "easy",
      count: 4,
      withImages: true,
      seed: 7,
    });
    expect(exercises).toHaveLength(4);
    exercises.forEach((ex) => {
      expect(ex.kind).toBe("counting");
      if (ex.kind === "counting") {
        expect(ex.answer).toBe(ex.count);
        expect(ex.objectLabel.length).toBeGreaterThan(0);
      }
    });
  });

  it("lanza si la actividad no existe", () => {
    expect(() => getGenerator("no-existe")).toThrow(/no-existe/);
  });

  it("genera ejercicios tipados para actividades representativas (sin suma Edge)", () => {
    const samples: Array<{ id: string; kind: string }> = [
      { id: "resta", kind: "operation" },
      { id: "counting", kind: "counting" },
      { id: "comparison", kind: "comparison" },
      { id: "tresSumandos", kind: "tresSumandos" },
      { id: "algoritmoVertical", kind: "algoritmoVertical" },
      { id: "problemas", kind: "problemas" },
      { id: "repartoIgual", kind: "repartoIgual" },
      { id: "weekDays", kind: "weekDay" },
      { id: "ordenar", kind: "ordenar" },
      { id: "relacionar", kind: "relacionar" },
    ];

    for (const sample of samples) {
      const exercises = getGenerator(sample.id).generate({
        activityId: sample.id,
        difficulty: "easy",
        count: 3,
        withImages: false,
        seed: 11,
      });
      expect(exercises.length, sample.id).toBeGreaterThan(0);
      expect(exercises[0]?.kind, sample.id).toBe(sample.kind);
    }
  });
});
