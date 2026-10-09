import type { SheetExercise } from "../types";

/**
 * Texto de respuesta para la hoja de soluciones (solo el resultado, sin enunciado).
 */
export function solutionAnswerOf(ex: SheetExercise): string {
  switch (ex.kind) {
    case "comparison":
      if (ex.answer === "iguales") return "Iguales";
      if (ex.answer === "A" || ex.answer === "B") return `Grupo ${ex.answer}`;
      return "?";
    case "counting":
      return String(ex.answer ?? ex.count);
    case "relacionar":
    case "relacionarCantidades":
      return (ex.answer ?? []).join(" · ") || "?";
    case "ordenar":
      return ex.answer?.join(", ") ?? "?";
    case "leftRight":
      if (ex.answer === "left") return "Izquierda";
      if (ex.answer === "right") return "Derecha";
      return "?";
    case "tablaNumerica":
      return (
        (ex.answer ?? ex.cells).filter((c): c is number => typeof c === "number").join(", ") || "?"
      );
    case "relacionSumaResta":
      return `${ex.partA}+${ex.partB}=${ex.total}; ${ex.total}−${ex.partA}=${ex.partB}`;
    case "laberintoMatematico":
      return String(ex.correctFin ?? "?");
    case "reloj":
      return String(ex.answer ?? "?");
    default: {
      if ("answer" in ex && ex.answer !== undefined && ex.answer !== null) {
        if (typeof ex.answer === "string" || typeof ex.answer === "number") {
          return String(ex.answer);
        }
        try {
          return JSON.stringify(ex.answer);
        } catch {
          return String(ex.answer);
        }
      }
      return "?";
    }
  }
}
