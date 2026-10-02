import { describe, expect, it } from "vitest";
import { banco, generateSession, SESSION_SIZE, tamanoBanco, validar } from "./datosInnecesarios";
import type { ActivityDifficulty } from "../content/contracts";

const DIFICULTADES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

/**
 * Las soluciones, escritas aquí aparte del motor.
 *
 * El núcleo también las declara, y a propósito: están al lado del enunciado para
 * que corregir una frase venga con la corrección de su cuenta. Este bloque es la
 * comprobación de que las dos cosas siguen de acuerdo, y está separado para que
 * editar un problema sin recalcular su resultado haga fallar la suite.
 */
const SOLUCIONES: Record<ActivityDifficulty, string[]> = {
  easy: ["20", "12", "5", "10", "12", "6", "13", "10", "8", "15"],
  medium: ["15", "16", "40", "16", "53", "18", "12", "30", "25", "18"],
  hard: ["25", "6 €", "15", "14", "40", "38", "24", "20", "6 €", "27 €"],
  expert: ["75", "65", "12", "42", "24", "3", "38 €", "9", "17", "7"],
};

const todas = DIFICULTADES.flatMap((dificultad) =>
  SEMILLAS.map((semilla) => ({ dificultad, exercises: generateSession(dificultad, semilla) })),
);

describe("datosInnecesarios — el banco de problemas", () => {
  it("hay diez problemas escritos para cada dificultad", () => {
    for (const dificultad of DIFICULTADES) {
      expect(tamanoBanco(dificultad), dificultad).toBe(SESSION_SIZE);
    }
  });

  it("cada problema son tres frases, con la sobrante dentro del rango", () => {
    for (const dificultad of DIFICULTADES) {
      for (const [i, ex] of banco(dificultad).entries()) {
        expect(ex.historia, `${dificultad}/${i}`).toHaveLength(3);
        expect(
          ex.historia.every((f) => f.trim().length > 0),
          `${dificultad}/${i}`,
        ).toBe(true);
        expect(ex.innecesario, `${dificultad}/${i}`).toBeGreaterThanOrEqual(0);
        expect(ex.innecesario, `${dificultad}/${i}`).toBeLessThan(3);
      }
    }
  });

  it("la solución que declara cada problema es la que sale de sus frases", () => {
    for (const dificultad of DIFICULTADES) {
      const Declarados = SOLUCIONES[dificultad];
      for (const [i, ex] of banco(dificultad).entries()) {
        expect(ex.solucion, `${dificultad}/${i}: ${ex.pregunta}`).toBe(Declarados[i]);
      }
    }
  });

  it("las dos frases que sirven traen los números que hacen la cuenta", () => {
    // Si una frase útil se queda sin cifras, el problema no se puede calcular y
    // el niño no tiene por dónde saber cuál sobra.
    for (const dificultad of DIFICULTADES) {
      for (const [i, ex] of banco(dificultad).entries()) {
        const utiles = ex.historia.filter((_, j) => j !== ex.innecesario);
        for (const frase of utiles) {
          expect(frase, `${dificultad}/${i}: «${frase}»`).toMatch(/\d/);
        }
      }
    }
  });

  it("la pregunta se pregunta de verdad: empieza por «¿» y acaba en «?»", () => {
    for (const dificultad of DIFICULTADES) {
      for (const [i, ex] of banco(dificultad).entries()) {
        expect(ex.pregunta, `${dificultad}/${i}`).toMatch(/^¿.+\?$/);
      }
    }
  });

  it("las frases terminan en punto o en interrogación, para que se lean como un problema", () => {
    // Dos problemas llevan la pregunta dentro del enunciado, que es la forma
    // natural de escribirlo y no un descuido.
    for (const dificultad of DIFICULTADES) {
      for (const [i, ex] of banco(dificultad).entries()) {
        for (const frase of ex.historia) {
          expect(frase, `${dificultad}/${i}: «${frase}»`).toMatch(/[.?]$/);
        }
      }
    }
  });

  it("no hay problemas repetidos dentro de una misma dificultad", () => {
    for (const dificultad of DIFICULTADES) {
      for (const [i, ex] of banco(dificultad).entries()) {
        for (const [j, otro] of banco(dificultad).entries()) {
          if (i === j) continue;
          expect(ex.historia.join("|"), `${dificultad}: ${i} y ${j} son el mismo`).not.toBe(
            otro.historia.join("|"),
          );
        }
      }
    }
  });

  it("la frase sobrante no es la misma en todos los problemas de un nivel", () => {
    // Si el sobrante fuera siempre la segunda, bastaría con tacharla sin leer.
    for (const dificultad of DIFICULTADES) {
      const posiciones = new Set(banco(dificultad).map((ex) => ex.innecesario));
      expect(
        posiciones.size,
        `${dificultad}: la frase sobrante siempre es la misma`,
      ).toBeGreaterThan(1);
    }
  });
});

describe("datosInnecesarios — generateSession", () => {
  it("entrega el banco entero barajado", () => {
    for (const { dificultad, exercises } of todas) {
      expect(exercises, dificultad).toHaveLength(SESSION_SIZE);
      // La hoja es una vuelta al banco, no un subconjunto.
      const enHoja = exercises.map((ex) => ex.historia.join("|")).sort();
      const enBanco = banco(dificultad)
        .map((ex) => ex.historia.join("|"))
        .sort();
      expect(enHoja, dificultad).toEqual(enBanco);
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("easy", 42)).not.toEqual(generateSession("easy", 43));
  });

  it("tiene semilla por defecto, como el resto de motores", () => {
    expect(() => generateSession("hard")).not.toThrow();
    expect(generateSession("hard")).toEqual(generateSession("hard", 42));
  });

  it("cada hoja trae el banco con su solución y su frase sobrante", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        const dificultad = DIFICULTADES.find((d) =>
          banco(d).some((p) => p.historia.join("|") === ex.historia.join("|")),
        );
        expect(dificultad, `problema fuera del banco: ${ex.pregunta}`).toBeDefined();
        expect(SOLUCIONES[dificultad!], ex.pregunta).toContain(ex.solucion);
      }
    }
  });
});

describe("datosInnecesarios — validar", () => {
  it("solo acepta la frase que sobraba", () => {
    for (const dificultad of DIFICULTADES) {
      for (const ex of banco(dificultad)) {
        expect(validar(ex, ex.innecesario), ex.pregunta).toBe(true);
        for (let i = 0; i < ex.historia.length; i++) {
          if (i === ex.innecesario) continue;
          expect(validar(ex, i), `${dificultad}: «${ex.historia[i]}»`).toBe(false);
        }
        expect(validar(ex, -1)).toBe(false);
        expect(validar(ex, 99)).toBe(false);
      }
    }
  });

  it("valida un problema suelto, sin sesión", () => {
    const ex = banco("easy")[2]!;
    expect(validar(ex, ex.innecesario)).toBe(true);
    expect(validar(ex, 0)).toBe(false);
  });
});
