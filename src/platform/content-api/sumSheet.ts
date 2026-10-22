import type { SumaExercise } from "./sumaEngine";

export type FichaMode = "alumno" | "soluciones";

export interface OperationSheetExercise {
  kind: "operation";
  a: number;
  b: number;
  op: "+";
  imageUrl: string;
  answer?: number;
}

export function sumaExercisesToSheet(
  exercises: SumaExercise[],
  modes: FichaMode[],
  withImages: boolean,
): OperationSheetExercise[] {
  const includeAnswers = modes.includes("soluciones");
  return exercises.map((ex) => {
    const row: OperationSheetExercise = {
      kind: "operation",
      a: ex.a,
      b: ex.b,
      op: "+",
      imageUrl: withImages ? ex.imageUrl : "",
    };
    if (includeAnswers) row.answer = ex.answer;
    return row;
  });
}
