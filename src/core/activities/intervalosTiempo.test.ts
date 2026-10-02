import { describe, expect, it } from "vitest";
import {
  generateSession,
  INTERVALOS,
  ONE_HOUR_SECONDS,
  SESSION_SIZE,
  validateAnswer,
} from "./intervalosTiempo";
import type { ActivityDifficulty } from "../content/contracts";

const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

/** Cuántos ejercicios de `classify-hour` hay en la sesión de una semilla. */
const clasifican = (dificultad: ActivityDifficulty, semilla: number) =>
  generateSession(dificultad, semilla).filter((ex) => ex.type === "classify-hour").length;

describe("intervalosTiempo — catálogo", () => {
  it("mantiene las 18 actividades de Electron con nombres únicos", () => {
    expect(INTERVALOS).toHaveLength(18);
    expect(new Set(INTERVALOS.map((a) => a.name)).size).toBe(18);
  });

  it("normaliza todas las duraciones a segundos, sin ceros ni negativos", () => {
    for (const act of INTERVALOS) {
      expect(act.seconds, act.name).toBeGreaterThan(0);
      expect(act.label, act.name).not.toBe("");
      expect(act.emoji, act.name).not.toBe("");
    }
  });

  it("sitúa el curso escolar y las vacaciones por encima de un día", () => {
    const porNombre = (nombre: string) => INTERVALOS.find((a) => a.name === nombre)!;
    expect(porNombre("un curso escolar").seconds).toBeGreaterThan(7 * 86400);
    expect(porNombre("las vacaciones de verano").seconds).toBeGreaterThan(30 * 86400);
    expect(porNombre("un parpadeo").seconds).toBeLessThan(1);
  });
});

describe("intervalosTiempo — generateSession", () => {
  it("completa la sesión de 10 ejercicios en todas las semillas", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        const sesion = generateSession(dificultad, semilla);
        expect(sesion, `${dificultad}/${semilla}`).toHaveLength(SESSION_SIZE);
      }
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("hard", 42)).toEqual(generateSession("hard", 42));
    expect(generateSession("medium", 42)).not.toEqual(generateSession("medium", 43));
  });

  it("no repite actividad en `classify-hour` ni pareja al comparar", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        const claves = generateSession(dificultad, semilla).map((ex) =>
          ex.type === "classify-hour"
            ? `cls-${ex.activities[0].name}`
            : ex.activities
                .map((a) => a.name)
                .sort()
                .join("|"),
        );
        expect(new Set(claves).size, `${dificultad}/${semilla}`).toBe(claves.length);
      }
    }
  });

  it("en fácil y medium compara siempre dos actividades distintas", () => {
    for (const dificultad of ["easy", "medium"] as ActivityDifficulty[]) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          expect(ex.type, `${dificultad}/${semilla}`).not.toBe("classify-hour");
          expect(ex.activities, ex.question).toHaveLength(2);
          expect(ex.activities[0].seconds === ex.activities[1].seconds, ex.question).toBe(false);
        }
      }
    }
  });

  it("en fácil la diferencia entre las dos actividades es de 3x o más", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("easy", semilla)) {
        const [a, b] = ex.activities;
        expect(
          Math.max(a.seconds, b.seconds) / Math.min(a.seconds, b.seconds),
          ex.question,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("en fácil y medium muestra siempre las barras", () => {
    for (const dificultad of ["easy", "medium"] as ActivityDifficulty[]) {
      for (const semilla of SEMILLAS) {
        expect(
          generateSession(dificultad, semilla).every((ex) => ex.showBars),
          `${dificultad}/${semilla}`,
        ).toBe(true);
      }
    }
  });

  it("en expert nunca muestra barras", () => {
    for (const semilla of SEMILLAS) {
      expect(generateSession("expert", semilla).every((ex) => ex.showBars === false)).toBe(true);
    }
  });

  it("clasifica por más o menos de 1 hora solo en hard y expert", () => {
    for (const semilla of SEMILLAS) {
      expect(clasifican("easy", semilla), `easy/${semilla}`).toBe(0);
      expect(clasifican("medium", semilla), `medium/${semilla}`).toBe(0);
      expect(clasifican("hard", semilla), `hard/${semilla}`).toBeGreaterThan(0);
      expect(clasifican("expert", semilla), `expert/${semilla}`).toBeGreaterThan(0);
    }
  });

  it("en hard no siempre salen barras: aparecen alternadas", () => {
    for (const semilla of SEMILLAS) {
      const barras = generateSession("hard", semilla).map((ex) => ex.showBars);
      expect(barras, `hard/${semilla}`).toContain(true);
      expect(barras, `hard/${semilla}`).toContain(false);
    }
  });
});

describe("intervalosTiempo — enunciados y opciones", () => {
  it("la respuesta correcta es siempre una de las dos actividades comparadas", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          if (ex.type === "classify-hour") continue;
          const opciones = ex.activities.map(
            (a) => a.name.charAt(0).toUpperCase() + a.name.slice(1),
          );
          expect(opciones, ex.question).toContain(ex.correctAnswer);
        }
      }
    }
  });

  it("el enunciado de comparar nombra la duración de las dos actividades", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          if (ex.type === "classify-hour") continue;
          for (const act of ex.activities) {
            expect(ex.question, ex.question).toContain(act.label);
            expect(ex.question, ex.question).toContain(act.emoji);
          }
        }
      }
    }
  });

  it("al comparar, las dos opciones son los nombres de las dos actividades", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("medium", semilla)) {
        expect(ex.options).toHaveLength(2);
        const nombres = ex.activities.map((a) => a.name).sort();
        expect([...ex.options].sort()).toEqual(
          nombres.map((n) => n.charAt(0).toUpperCase() + n.slice(1)).sort(),
        );
      }
    }
  });

  it("al clasificar ofrece las dos frases y la que acierta depende de los segundos", () => {
    for (const dificultad of ["hard", "expert"] as ActivityDifficulty[]) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          if (ex.type !== "classify-hour") continue;
          expect(ex.activities, ex.question).toHaveLength(1);
          expect(ex.options, ex.question).toEqual(["Más de 1 hora", "Menos de 1 hora"]);
          const act = ex.activities[0];
          expect(ex.correctAnswer, ex.question).toBe(
            act.seconds > ONE_HOUR_SECONDS ? "Más de 1 hora" : "Menos de 1 hora",
          );
        }
      }
    }
  });

  it("la pregunta de comparar dice si se busca lo más largo o lo más corto", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          if (ex.type === "which-longer") expect(ex.question, ex.question).toContain("dura más");
          if (ex.type === "which-shorter") expect(ex.question, ex.question).toContain("dura menos");
          if (ex.type === "classify-hour") expect(ex.question, ex.question).toContain("1 hora");
        }
      }
    }
  });
});

describe("intervalosTiempo — validateAnswer", () => {
  it("acepta la respuesta correcta ignorando mayúsculas y minúsculas", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const ex of generateSession(dificultad, 42)) {
        expect(validateAnswer(ex, ex.correctAnswer), ex.question).toBe(true);
        expect(validateAnswer(ex, ex.correctAnswer.toLowerCase()), ex.question).toBe(true);
        expect(validateAnswer(ex, ex.correctAnswer.toUpperCase()), ex.question).toBe(true);
      }
    }
  });

  it("rechaza cualquier otra opción del ejercicio", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const ex of generateSession(dificultad, 42)) {
        for (const otra of ex.options) {
          if (otra.toLowerCase() === ex.correctAnswer.toLowerCase()) continue;
          expect(validateAnswer(ex, otra), `${ex.question} / ${otra}`).toBe(false);
        }
      }
    }
  });

  it("rechaza la respuesta correcta con espacios alrededor", () => {
    for (const ex of generateSession("easy", 42)) {
      expect(validateAnswer(ex, `${ex.correctAnswer} `)).toBe(false);
      expect(validateAnswer(ex, ` ${ex.correctAnswer}`)).toBe(false);
    }
  });
});
