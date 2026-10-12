import { describe, expect, it } from "vitest";
import {
  generateSession,
  SESSION_SIZE,
  SESSION_TARGET,
  validateAnswer,
  OBJECTS,
  weightCombinations,
  formatWeightSolutions,
} from "./balanzaEquilibra";
import type { BalanzaEqExercise } from "./balanzaEquilibra";
import type { ActivityDifficulty } from "../content/contracts";

const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

function todasLasSesiones(): { difficulty: ActivityDifficulty; session: BalanzaEqExercise[] }[] {
  return DIFFICULTIES.flatMap((difficulty) =>
    SEMILLAS.map((seed) => ({ difficulty, session: generateSession(difficulty, seed) })),
  );
}

describe("balanzaEquilibra — generateSession", () => {
  it("respeta el tamaño de sesión de cada dificultad en todas las semillas", () => {
    for (const { difficulty, session } of todasLasSesiones()) {
      expect(session.length, difficulty).toBe(SESSION_SIZE[difficulty]);
      expect(session.length, difficulty).toBeLessThanOrEqual(SESSION_TARGET);
      expect(session.length, difficulty).toBeGreaterThan(0);
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("hard", 42)).not.toEqual(generateSession("hard", 43));
  });

  it("no repite target dentro de una sesión (deduplicación)", () => {
    for (const { difficulty, session } of todasLasSesiones()) {
      const targets = session.map((ex) => ex.target);
      expect(new Set(targets).size, difficulty).toBe(targets.length);
    }
  });

  it("los targets caen en el rango que dicta la dificultad", () => {
    const rangoDe: Record<ActivityDifficulty, [number, number]> = {
      easy: [2, 4],
      medium: [2, 6],
      hard: [5, 10],
      expert: [8, 16],
    };
    for (const { difficulty, session } of todasLasSesiones()) {
      const [min, max] = rangoDe[difficulty];
      for (const ex of session) {
        expect(ex.target, `${difficulty}`).toBeGreaterThanOrEqual(min);
        expect(ex.target, `${difficulty}`).toBeLessThanOrEqual(max);
      }
    }
  });

  it("leftKind: easy usa pesas, el resto usan objeto", () => {
    for (const { difficulty, session } of todasLasSesiones()) {
      for (const ex of session) {
        const esperado = difficulty === "easy" ? "weights" : "object";
        expect(ex.leftKind, `${difficulty}`).toBe(esperado);
      }
    }
  });

  it("allowed: expert ofrece [1,2], el resto solo [1]", () => {
    for (const { difficulty, session } of todasLasSesiones()) {
      for (const ex of session) {
        expect(ex.allowed, `${difficulty}`).toEqual(difficulty === "expert" ? [1, 2] : [1]);
      }
    }
  });

  it("leftEmoji: 🧱 para pesas, algún emoji de OBJECTS para objeto", () => {
    for (const { difficulty, session } of todasLasSesiones()) {
      for (const ex of session) {
        if (ex.leftKind === "weights") {
          expect(ex.leftEmoji, `${difficulty}`).toBe("🧱");
        } else {
          expect(OBJECTS).toContain(ex.leftEmoji);
        }
      }
    }
  });

  it("leftLabel siempre es `${target} kg`", () => {
    for (const { session } of todasLasSesiones()) {
      for (const ex of session) {
        expect(ex.leftLabel).toBe(`${ex.target} kg`);
      }
    }
  });

  it("expert siempre incluye target 8 (el mínimo del rango) en la sesión", () => {
    // El rango de expert es 8-16; con 9 targets distintos y 9 ejercicios,
    // todos los targets aparecen exactamente una vez.
    for (const semilla of SEMILLAS) {
      const session = generateSession("expert", semilla);
      expect(session.map((ex) => ex.target).sort((a, b) => a - b)).toEqual([
        8, 9, 10, 11, 12, 13, 14, 15, 16,
      ]);
    }
  });

  it("easy incluye todos los targets (2, 3, 4) en cada sesión", () => {
    for (const semilla of SEMILLAS) {
      const session = generateSession("easy", semilla);
      expect(session.map((ex) => ex.target).sort((a, b) => a - b)).toEqual([2, 3, 4]);
    }
  });

  it("medium incluye todos los targets (2-6) en cada sesión", () => {
    for (const semilla of SEMILLAS) {
      const session = generateSession("medium", semilla);
      expect(session.map((ex) => ex.target).sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6]);
    }
  });

  it("hard incluye todos los targets (5-10) en cada sesión", () => {
    for (const semilla of SEMILLAS) {
      const session = generateSession("hard", semilla);
      expect(session.map((ex) => ex.target).sort((a, b) => a - b)).toEqual([5, 6, 7, 8, 9, 10]);
    }
  });
});

describe("balanzaEquilibra — validateAnswer", () => {
  it("acepta la suma exacta del target", () => {
    const ex = generateSession("expert", 42)[0];
    expect(validateAnswer(Array(ex.target).fill(1), ex)).toBe(true);
  });

  it("rechaza sumas distintas del target", () => {
    const ex = generateSession("expert", 42)[0];
    expect(validateAnswer(Array(ex.target + 1).fill(1), ex)).toBe(false);
    expect(validateAnswer(Array(ex.target - 1).fill(1), ex)).toBe(false);
  });

  it("la lista vactia solo es correcta si el target es 0 (nunca)", () => {
    for (const { session } of todasLasSesiones()) {
      for (const ex of session) {
        expect(validateAnswer([], ex)).toBe(ex.target === 0);
      }
    }
  });

  it("una combinación de 1 kg y 2 kg puede equilibrar en expert", () => {
    const ex = generateSession("expert", 42)[0];
    if (ex.allowed.includes(2)) {
      const weights = Array(ex.target - 2)
        .fill(1)
        .concat([2]);
      expect(validateAnswer(weights, ex)).toBe(true);
    }
  });

  it("no confunde 2 kg con 1 kg", () => {
    // Una pesa de 2 kg no pesa lo mismo que una de 1 kg.
    expect(
      validateAnswer([2], {
        target: 1,
        leftKind: "object",
        leftEmoji: "📦",
        leftLabel: "1 kg",
        allowed: [1, 2],
      }),
    ).toBe(false);
    expect(
      validateAnswer([1], {
        target: 2,
        leftKind: "object",
        leftEmoji: "📦",
        leftLabel: "2 kg",
        allowed: [1, 2],
      }),
    ).toBe(false);
  });

  it("valida correctamente contra cada ejercicio de todas las sesiones", () => {
    for (const { session } of todasLasSesiones()) {
      for (const ex of session) {
        expect(validateAnswer(Array(ex.target).fill(1), ex), `target ${ex.target}`).toBe(true);
      }
    }
  });
});

describe("balanzaEquilibra — weightCombinations", () => {
  it("con solo 1 kg lista N×1 kg", () => {
    expect(weightCombinations(4, [1])).toEqual(["4×1 kg"]);
  });

  it("con 1 kg y 2 kg solo lista combinaciones que usan ambos tipos", () => {
    expect(weightCombinations(5, [1, 2])).toEqual(["3×1 kg + 1×2 kg", "1×1 kg + 2×2 kg"]);
    expect(weightCombinations(4, [1, 2])).toEqual(["2×1 kg + 1×2 kg"]);
    // Target impar mínimo con ambos: 3 = 1×1 + 1×2
    expect(weightCombinations(3, [1, 2])).toEqual(["1×1 kg + 1×2 kg"]);
  });

  it("formatWeightSolutions separa con | las posibles respuestas", () => {
    expect(formatWeightSolutions(5, [1, 2])).toBe("3×1 kg + 1×2 kg | 1×1 kg + 2×2 kg");
  });

  it("los objetos del catálogo no incluyen un balón (peso absurdo)", () => {
    expect(OBJECTS).not.toContain("⚽");
  });
});
