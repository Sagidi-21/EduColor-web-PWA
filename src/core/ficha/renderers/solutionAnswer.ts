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
    case "multiplicacion":
      return (ex.answer ?? []).join(" · ") || "?";
    case "ordenar":
      return ex.answer?.join(", ") ?? "?";
    case "leftRight":
      if (ex.answer === "left") return "Izquierda";
      if (ex.answer === "right") return "Derecha";
      // Opción de texto (medium: nombre del objeto) o descripción de la escena (experto).
      return ex.answer ? ex.answer : "?";
    case "relacionSumaResta":
      return `${ex.total}−${ex.partA}=${ex.partB}; ${ex.total}−${ex.partB}=${ex.partA}; ${ex.partA}+${ex.partB}=${ex.total}`;
    case "laberintoMatematico": {
      if (ex.answer) return ex.answer;
      const finalValue = ex.answers?.[ex.correctFin];
      return typeof finalValue === "number" ? String(finalValue) : "?";
    }
    case "rutaCuadricula": {
      const raw = ex.answer?.trim();
      if (!raw) return "Ej.: ?";
      return raw.startsWith("Ej.") ? raw : `Ej.: ${raw}`;
    }
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
