import { describe, expect, it } from "vitest";
import { activityManifests } from "../../../manifests/content-registry";
import type { OperationSheetExercise, SheetConfig } from "../types";
import { getGenerator } from "./registry";
import { sessionEngines } from "./session-engines";

const sumaConfig: SheetConfig = {
  activityId: "suma",
  difficulty: "easy",
  count: 10,
  withImages: true,
  seed: 42,
};

describe("getGenerator", () => {
  it("cubre las 62 actividades del catálogo", () => {
    const ids = activityManifests.map((manifest) => manifest.id);
    expect(ids).toHaveLength(62);
    const missing = ids.filter((id) => !(id in sessionEngines));
    expect(missing, `Faltan motores de ficha: ${missing.join(", ")}`).toEqual([]);
  });

  it("getGenerator('suma').generate devuelve OperationSheetExercise[]", () => {
    const exercises = getGenerator("suma").generate(sumaConfig);

    expect(exercises).toHaveLength(10);
    exercises.forEach((ex) => {
      expect(ex.kind).toBe("operation");
      const op = ex as OperationSheetExercise;
      expect(op.op).toBe("+");
      expect(op.answer).toBe(op.a + op.b);
    });
  });

  it("la misma semilla produce la misma ficha de suma", () => {
    const a = getGenerator("suma").generate(sumaConfig);
    const b = getGenerator("suma").generate(sumaConfig);
    expect(a).toEqual(b);
  });

  it("una semilla distinta cambia la ficha de suma", () => {
    const a = getGenerator("suma").generate(sumaConfig);
    const b = getGenerator("suma").generate({ ...sumaConfig, seed: 99 });
    expect(a).not.toEqual(b);
  });

  it("respeta count menor que la sesión del motor", () => {
    const exercises = getGenerator("suma").generate({ ...sumaConfig, count: 3 });
    expect(exercises).toHaveLength(3);
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

  it("genera ejercicios tipados para actividades representativas de cada familia", () => {
    const samples: Array<{ id: string; kind: string }> = [
      { id: "suma", kind: "operation" },
      { id: "counting", kind: "counting" },
      { id: "comparison", kind: "comparison" },
      { id: "tresSumandos", kind: "tresSumandos" },
      { id: "algoritmoVertical", kind: "algoritmoVertical" },
      { id: "problemas", kind: "problemas" },
      { id: "repartoIgual", kind: "repartoIgual" },
      { id: "weekDays", kind: "weekDay" },
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
