import { describe, expect, it } from "vitest";
import { llamadas, generateSession, SESSION_SIZE, validateAnswer } from "./algoritmo3cifras";
import type { ActivityDifficulty } from "../content/contracts";

const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

/** Todas las sesiones de una dificultad, una por semilla. */
const sesiones = (dificultad: ActivityDifficulty) =>
  SEMILLAS.map((semilla) => generateSession(dificultad, semilla));

describe("algoritmo3cifras — llamadas", () => {
  it("detecta la llamada de unidades a decenas al sumar", () => {
    expect(llamadas("+", 128, 345).carryUD).toBe(true); // 8+5 = 13 -> sí
    expect(llamadas("+", 128, 341).carryUD).toBe(false); // 8+1 = 9 -> no
    expect(llamadas("+", 123, 124).carryUD).toBe(false); // 3+4 = 7 -> no
    expect(llamadas("+", 100, 100).carryUD).toBe(false); // 0+0 = 0 -> no
  });

  it("la llamada de decenas a centenas cuenta la decena que llega de las unidades", () => {
    // 7+6=13: hay que llevar 1, y 3+4+1=8 no llega a 10.
    expect(llamadas("+", 137, 246)).toEqual({ carryUD: true, carryDC: false });
    // 8+8=16: llega 1 a las decenas, y 5+5+1=11 sí lleva a las centenas.
    expect(llamadas("+", 158, 258)).toEqual({ carryUD: true, carryDC: true });
  });

  it("detecta los dos préstamos al restar", () => {
    expect(llamadas("-", 523, 178)).toEqual({ carryUD: true, carryDC: true });
    expect(llamadas("-", 500, 100)).toEqual({ carryUD: false, carryDC: false });
    // 3-7 pide prestado a las decenas, y las decenas quedan en 1: 1-2 no alcanza.
    expect(llamadas("-", 523, 127)).toEqual({ carryUD: true, carryDC: true });
  });
});

describe("algoritmo3cifras — generateSession", () => {
  it("completa la sesión de 10 ejercicios en todas las semillas", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const [i, sesion] of sesiones(dificultad).entries()) {
        expect(sesion, `${dificultad}/${SEMILLAS[i]}`).toHaveLength(SESSION_SIZE);
      }
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("medium", 42)).not.toEqual(generateSession("medium", 43));
  });

  it("no repite operación:número:número", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const [i, sesion] of sesiones(dificultad).entries()) {
        const claves = sesion.map((ex) => `${ex.op}-${ex.a}-${ex.b}`);
        expect(new Set(claves).size, `${dificultad}/${SEMILLAS[i]}`).toBe(claves.length);
      }
    }
  });

  it("el resultado es siempre la operación y cabe en tres cifras", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const [i, sesion] of sesiones(dificultad).entries()) {
        for (const ex of sesion) {
          const esperado = ex.op === "+" ? ex.a + ex.b : ex.a - ex.b;
          expect(ex.result, `${dificultad}/${SEMILLAS[i]} ${ex.question}`).toBe(esperado);
          expect(ex.result).toBeGreaterThanOrEqual(0);
          expect(ex.result).toBeLessThanOrEqual(999);
          expect(ex.a).toBeGreaterThanOrEqual(100);
          expect(ex.b).toBeGreaterThanOrEqual(100);
          expect(ex.a).toBeLessThanOrEqual(999);
          expect(ex.b).toBeLessThanOrEqual(999);
        }
      }
    }
  });

  it("las seis cifras del enunciado coinciden con los dos números", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const sesion of sesiones(dificultad)) {
        for (const ex of sesion) {
          expect(ex.aC * 100 + ex.aD * 10 + ex.aU, String(ex.a)).toBe(ex.a);
          expect(ex.bC * 100 + ex.bD * 10 + ex.bU, String(ex.b)).toBe(ex.b);
          expect(ex.aC).toBeLessThanOrEqual(9);
          expect(ex.aD).toBeLessThanOrEqual(9);
          expect(ex.aU).toBeLessThanOrEqual(9);
          expect(ex.bC).toBeLessThanOrEqual(9);
          expect(ex.bD).toBeLessThanOrEqual(9);
          expect(ex.bU).toBeLessThanOrEqual(9);
        }
      }
    }
  });

  it("las llamadas del ejercicio son las que dicen sus cifras", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const sesion of sesiones(dificultad)) {
        for (const ex of sesion) {
          expect(
            { carryUD: ex.carryUD, carryDC: ex.carryDC },
            `${ex.question} carryUD=${ex.carryUD} carryDC=${ex.carryDC}`,
          ).toEqual(llamadas(ex.op, ex.a, ex.b));
        }
      }
    }
  });

  it("el enunciado se escribe con la operación que toca", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const sesion of sesiones(dificultad)) {
        for (const ex of sesion) {
          if (ex.op === "+") expect(ex.question, ex.question).toBe(`Suma: ${ex.a} + ${ex.b} = ___`);
          else expect(ex.question, ex.question).toBe(`Resta: ${ex.a} − ${ex.b} = ___`);
        }
      }
    }
  });
});

describe("algoritmo3cifras — lo que cambia con la dificultad", () => {
  it("easy: solo sumas y ninguna llamada", () => {
    for (const sesion of sesiones("easy")) {
      for (const ex of sesion) {
        expect(ex.op, ex.question).toBe("+");
        expect(ex.carryUD, ex.question).toBe(false);
        expect(ex.carryDC, ex.question).toBe(false);
      }
    }
  });

  it("medium: llamada de unidades a decenas y solo esa", () => {
    for (const sesion of sesiones("medium")) {
      for (const ex of sesion) {
        expect(ex.op, ex.question).toBe("+");
        expect(ex.carryUD, ex.question).toBe(true);
        expect(ex.carryDC, ex.question).toBe(false);
      }
    }
  });

  it("hard: llamada de decenas a centenas y solo esa", () => {
    for (const sesion of sesiones("hard")) {
      for (const ex of sesion) {
        expect(ex.op, ex.question).toBe("+");
        expect(ex.carryUD, ex.question).toBe(false);
        expect(ex.carryDC, ex.question).toBe(true);
      }
    }
  });

  it("expert: las dos llamadas siempre, y mezcla sumas y restas", () => {
    const operaciones = new Set<"+" | "-">();
    for (const sesion of sesiones("expert")) {
      for (const ex of sesion) {
        expect(ex.carryUD, ex.question).toBe(true);
        expect(ex.carryDC, ex.question).toBe(true);
        operaciones.add(ex.op);
      }
    }
    expect([...operaciones].sort()).toEqual(["+", "-"]);
  });

  it("easy mantiene el resultado por debajo de 1000 y los dos sumandos de tres cifras", () => {
    for (const sesion of sesiones("easy")) {
      for (const ex of sesion) {
        expect(ex.result, ex.question).toBeLessThanOrEqual(999);
        expect(ex.a, ex.question).toBeGreaterThanOrEqual(100);
        expect(ex.b, ex.question).toBeGreaterThanOrEqual(100);
      }
    }
  });
});

describe("algoritmo3cifras — opciones y validateAnswer", () => {
  it("ofrece cuatro resultados distintos, el correcto entre ellos", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const sesion of sesiones(dificultad)) {
        for (const ex of sesion) {
          expect(ex.options, ex.question).toHaveLength(4);
          expect(new Set(ex.options).size, ex.question).toBe(4);
          expect(ex.options).toContain(ex.correctAnswer);
          expect(ex.options.map(Number).sort((x, y) => x - y)).toEqual(ex.options.map(Number));
        }
      }
    }
  });

  it("las opciones erróneas están cerca del resultado y caben en tres cifras", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const sesion of sesiones(dificultad)) {
        for (const ex of sesion) {
          for (const opcion of ex.options) {
            const n = Number(opcion);
            expect(n, opcion).toBeGreaterThan(0);
            expect(n, opcion).toBeLessThanOrEqual(999);
            expect(Math.abs(n - ex.result), `${ex.question} / ${opcion}`).toBeLessThanOrEqual(15);
          }
        }
      }
    }
  });

  it("acepta solo la respuesta correcta", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const sesion of sesiones(dificultad)) {
        for (const ex of sesion) {
          expect(validateAnswer(ex, ex.correctAnswer), ex.question).toBe(true);
          for (const otra of ex.options) {
            if (otra === ex.correctAnswer) continue;
            expect(validateAnswer(ex, otra), `${ex.question} / ${otra}`).toBe(false);
          }
          expect(validateAnswer(ex, ""), ex.question).toBe(false);
          expect(validateAnswer(ex, `${ex.correctAnswer} `), ex.question).toBe(false);
        }
      }
    }
  });
});
